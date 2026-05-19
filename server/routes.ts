import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupHealthCheck } from "./health-check";
import { storage } from "./storage";
import { analyzeChurnRisk, analyzeRevenueInsights } from "./services/ai-service";
import { computeProfileCompletion } from "./services/business-profile-helper";
import { preparePayment, cancelPayment as billgateCancelPayment, verifyCallbackHash, generateLinkPaymentUrl, generateOrderId, generateOrderDate, generateHashKey, SERVICE_CODES, PAYMENT_METHOD_LABELS, type BillgatePgConfig } from "./services/billgate-service";
import { smsProvider, buildLinkPaymentSmsMessage } from "./services/sms-service";
import { insertPgTransactionSchema, insertPgProductSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import { errorHandler, notFoundHandler, catchAsync, AppErrorClass } from "./middleware/error-handler";
import { requireFranchiseAuth, optionalFranchiseAuth, checkOwnership, setFranchiseId, requireSuperAdmin } from "./middleware/data-isolation";
import { validateSchema, validateFranchiseId, validatePagination } from "./middleware/validation";
import { securityHeaders, apiRateLimit, loginRateLimit, sensitiveRateLimit, detectSuspiciousActivity } from "./middleware/security";
import { performanceMonitor, metricsEndpoint, reportEndpoint } from "./middleware/performance-monitor";
import { logger, requestLogger } from "./middleware/logging";
import { insertFranchiseSchema, insertMemberSchema, insertStaffSchema, insertProductSchema, insertLockerSchema, insertAttendanceSchema, insertScheduleSchema, insertPersonalTrainingSchema, insertPtSessionSchema, insertOtApplicationSchema, insertTrainerRecordSchema, insertMemberMeasurementSchema, insertConsultationSchema, insertPostSchema, insertGroupLessonSchema, insertContractSchema, insertRefundSchema, insertOtherSaleSchema, insertSuspensionSchema, insertMemberModificationSchema, insertGroupExtensionSchema, businessProfileSchema } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Check if the stored password is in the new format (hash.salt)
    if (stored && stored.includes(".")) {
      const [hashed, salt] = stored.split(".");
      if (!salt || !hashed) {
        console.error("Invalid stored password format:", stored);
        return false;
      }
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } else {
      // Handle legacy plain text passwords (for backward compatibility)
      return supplied === stored;
    }
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// 요일 번호를 한글 요일명으로 변환 (Convert day number to Korean day name)
function getDayName(dayOfWeek: number): string {
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  return dayNames[dayOfWeek] || "월";
}

// 한글 요일명을 요일 번호로 변환 (Convert Korean day name to day number)
function getDayNumberFromName(dayName: string): number {
  const dayMap: { [key: string]: number } = { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 };
  return dayMap[dayName] ?? 1;
}

// 시간 계산 유틸리티 함수 (Time calculation utility function)
function calculateEndTime(startTime: string, duration: string): string {
  try {
    // "14:30" 형식의 시간을 파싱
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // 기간을 분으로 변환 (예: "60분" → 60)
    const durationInMinutes = parseInt(duration.replace(/[^\d]/g, '')) || 60;
    
    // 종료 시간 계산
    const totalMinutes = hours * 60 + minutes + durationInMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    // 24시간 형식으로 변환
    const normalizedHours = endHours % 24;
    
    return `${normalizedHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating end time:', error);
    return startTime; // 오류 시 시작 시간 반환
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // 🛡️ 보안 미들웨어 적용 (Apply security middleware)
  app.use(securityHeaders);
  app.use(detectSuspiciousActivity);
  app.use('/api', apiRateLimit);
  
  // 📊 성능 모니터링 및 로깅 (Performance monitoring and logging)
  app.use(performanceMonitor.trackPerformance());
  app.use(requestLogger);
  
  // 🔍 모니터링 엔드포인트 (Monitoring endpoints)
  app.get('/api/metrics', metricsEndpoint);
  app.get('/api/performance-report', reportEndpoint);
  
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  setupHealthCheck(app);
  
  // 🚀 성능 모니터링 시작 (Start performance monitoring)
  performanceMonitor.startMemoryMonitoring();

  // 🔗 인증은 세션 기반 passport.js 사용 (Authentication uses session-based passport.js)
  // 🛡️ 보안 강화: 서명되지 않은 토큰 대신 세션 기반 인증 사용 (Security: Using session-based auth instead of unsigned tokens)

  // 📝 회원가입 입력 검증 스키마 (Registration input validation schema)
  // 🛡️ 보안: 전용 Zod 스키마로 필수 필드 강제 (Security: Dedicated Zod schema enforcing required fields)
  const registerSchema = z.object({
    username: z.string().min(3, "사용자명은 최소 3자 이상이어야 합니다").max(50, "사용자명은 최대 50자까지 가능합니다"),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").max(100, "비밀번호는 최대 100자까지 가능합니다"),
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
    role: z.enum(["superadmin", "admin", "staff", "member"]).optional(),
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // 🛡️ 입력 검증 (Input validation)
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "입력값이 올바르지 않습니다", 
          details: validationResult.error.flatten().fieldErrors 
        });
      }

      const { username, password, name, phone, role } = validationResult.data;

      // superadmin 역할로 회원가입 방지
      if (role === 'superadmin') {
        return res.status(403).json({ error: "superadmin 역할로 가입할 수 없습니다" });
      }

      // 사용자 존재 확인 (Check if user exists)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "이미 사용 중인 사용자명입니다" });
      }
      
      // 비밀번호 해싱 (Hash password)
      const hashedPassword = await hashPassword(password);
      
      // 🔒 데이터 격리: 신규 사용자마다 새로운 프랜차이즈 자동 생성
      // (Data isolation: Automatically create new franchise for each new user)
      const newFranchise = await storage.createFranchise({
        name: `${name || username}의 헬스장`,
        type: 'company',
        description: `${name || username}님의 헬스장 관리 시스템`,
      });
      
      // 새 사용자 생성 (Create new user)
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        role: role || 'admin',
        franchiseId: newFranchise.id
      });
      
      // 🛡️ 보안: 세션 기반 로그인 (Security: Session-based login via Passport.js)
      req.login(newUser, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return next(err);
        }
        
        // 비밀번호 제외하고 응답 (Respond without password)
        res.status(201).json({ 
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          franchiseId: newUser.franchiseId
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다" });
    }
  });

  // 프랜차이즈 가입 스키마
  const franchiseRegisterSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
    businessName: z.string().min(1, "사업자명을 입력하세요"),
    ownerName: z.string().min(1, "대표자명을 입력하세요"),
    ownerPhone: z.string().min(1, "연락처를 입력하세요"),
  });

  // 프랜차이즈 가입 (승인 대기, 자동 로그인 X)
  app.post("/api/auth/register/franchise", async (req, res) => {
    try {
      const validationResult = franchiseRegisterSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "입력값이 올바르지 않습니다",
          details: validationResult.error.flatten().fieldErrors
        });
      }

      const { username, password, businessName, ownerName, ownerPhone } = validationResult.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "이미 사용 중인 사용자명입니다" });
      }

      const hashedPassword = await hashPassword(password);

      const newFranchise = await storage.createFranchise({
        name: businessName,
        type: 'franchise',
        description: `${businessName} 프랜차이즈`,
        status: 'pending',
        ownerName,
        ownerPhone,
        businessName,
      });

      await storage.createUser({
        username,
        password: hashedPassword,
        role: 'admin',
        franchiseId: newFranchise.id,
      });

      res.status(201).json({
        message: "프랜차이즈 가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.",
        franchiseId: newFranchise.id,
      });
    } catch (error) {
      console.error("Franchise registration error:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다" });
    }
  });

  // 지점 가입 스키마
  const branchRegisterSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
    franchiseCode: z.string().min(1, "프랜차이즈 코드를 입력하세요"),
    branchName: z.string().min(1, "지점명을 입력하세요"),
    managerName: z.string().min(1, "담당자명을 입력하세요"),
    managerPhone: z.string().min(1, "연락처를 입력하세요"),
  });

  // 지점 가입 (코드 검증 후 approved, 자동 로그인 O)
  app.post("/api/auth/register/branch", async (req, res, next) => {
    try {
      const validationResult = branchRegisterSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "입력값이 올바르지 않습니다",
          details: validationResult.error.flatten().fieldErrors
        });
      }

      const { username, password, franchiseCode, branchName, managerName, managerPhone } = validationResult.data;

      // 프랜차이즈 코드 검증
      const parentFranchise = await storage.getFranchiseByCode(franchiseCode);
      if (!parentFranchise) {
        return res.status(400).json({ error: "유효하지 않은 프랜차이즈 코드입니다" });
      }
      if (parentFranchise.status !== 'approved') {
        return res.status(400).json({ error: "해당 프랜차이즈는 현재 이용할 수 없습니다" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "이미 사용 중인 사용자명입니다" });
      }

      const hashedPassword = await hashPassword(password);

      const newBranch = await storage.createFranchise({
        name: branchName,
        type: 'branch',
        description: `${parentFranchise.name} - ${branchName}`,
        status: 'approved',
        parentId: parentFranchise.id,
        ownerName: managerName,
        ownerPhone: managerPhone,
        businessName: branchName,
      });

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        role: 'admin',
        franchiseId: newBranch.id,
      });

      req.login(newUser, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          franchiseId: newUser.franchiseId,
        });
      });
    } catch (error) {
      console.error("Branch registration error:", error);
      res.status(500).json({ error: "서버 오류가 발생했습니다" });
    }
  });

  // 프랜차이즈 코드 검증 API (비인증)
  app.get("/api/franchise/verify-code/:code", async (req, res) => {
    try {
      const franchise = await storage.getFranchiseByCode(req.params.code);
      if (!franchise || franchise.status !== 'approved') {
        return res.status(404).json({ error: "유효하지 않은 프랜차이즈 코드입니다" });
      }
      res.json({
        id: franchise.id,
        name: franchise.name,
        businessName: franchise.businessName,
      });
    } catch (error) {
      res.status(500).json({ error: "서버 오류가 발생했습니다" });
    }
  });

  // 🛡️ 보안 강화: 세션 기반 현재 사용자 조회 (Security: Session-based current user endpoint)
  app.get("/api/auth/me", (req, res) => {
    // 세션 인증 확인 (Check session authentication)
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "인증이 필요합니다" });
    }
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "사용자 정보를 찾을 수 없습니다" });
    }
    
    // 비밀번호 제외하고 응답 (Respond without password)
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      franchiseId: user.franchiseId
    });
  });

  // Franchise routes
  app.get("/api/franchises", catchAsync(async (req: Request, res: Response) => {
    const franchises = await storage.getFranchises();
    res.json(franchises);
  }));

  // 🔒 프랜차이즈 생성은 인증된 사용자만 가능 (Only authenticated users can create franchises)
  app.post("/api/franchises", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const validatedData = insertFranchiseSchema.parse(req.body);
    const franchise = await storage.createFranchise(validatedData);
    res.status(201).json(franchise);
  }));

  // ================================================================
  // OUHVE ABM — Module 1: Business Profile
  // 운영자 정체성 + AI Operation Assistant(Module 7)의 컨텍스트 소스
  // ================================================================

  // GET /api/business-profile — 현재 사용자의 센터 프로필 + 완성도
  app.get("/api/business-profile", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = (req as any).franchiseId;
    const franchise = await storage.getFranchise(franchiseId);
    if (!franchise) {
      return res.status(404).json({ error: "Franchise not found" });
    }
    const completion = computeProfileCompletion(franchise);
    res.json({ franchise, completion });
  }));

  // PUT /api/business-profile — 프로필 갱신 (부분 업데이트 허용)
  app.put("/api/business-profile", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = (req as any).franchiseId;
    // 부분 업데이트 허용 (필드별 점진적 입력 지원)
    const allowedKeys = [
      "name", "description", "ownerName", "ownerPhone", "businessName",
      "wellnessCategory", "region", "operatingHours", "mainPrograms",
      "primaryAudience", "philosophy", "topConcern",
    ] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }
    // 모든 핵심 필드가 채워졌으면 completedAt 자동 설정
    const merged = { ...await storage.getFranchise(franchiseId), ...update };
    const isComplete = businessProfileSchema.safeParse(merged).success;
    if (isComplete && !(merged as any).profileCompletedAt) {
      update.profileCompletedAt = new Date();
    }
    const updated = await storage.updateBusinessProfile(franchiseId, update);
    res.json({ franchise: updated, completion: computeProfileCompletion(updated) });
  }));

  // GET /api/business-profile/completion — 완성도만 (대시보드 진척 표시용)
  app.get("/api/business-profile/completion", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = (req as any).franchiseId;
    const franchise = await storage.getFranchise(franchiseId);
    if (!franchise) {
      return res.status(404).json({ error: "Franchise not found" });
    }
    res.json(computeProfileCompletion(franchise));
  }));

  // Username availability check
  app.get("/api/check-username/:username", catchAsync(async (req: Request, res: Response) => {
    const { username } = req.params;
    const existingUser = await storage.getUserByUsername(username);
    res.json({ available: !existingUser });
  }));

  // User name availability check
  app.get("/api/check-name/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const existingUser = await storage.getUserByName(name);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking name:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Java API 호환 엔드포인트들
  app.get("/api/auth/check-username/:username", catchAsync(async (req: Request, res: Response) => {
    const { username } = req.params;
    const existingUser = await storage.getUserByUsername(username);
    res.json({ available: !existingUser });
  }));

  app.get("/api/auth/check-name/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const existingUser = await storage.getUserByName(name);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking name:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔒 완전한 데이터 격리 적용 - 회원 관리 (Complete data isolation - Member management)
  app.get("/api/members", requireFranchiseAuth, validatePagination, async (req, res) => {
    try {
      const members = await storage.getMembers(req.franchiseId!);
      res.json(members);
    } catch (error) {
      console.error("❌ ERROR getting members:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/members/:id", requireFranchiseAuth, checkOwnership(storage.getMember.bind(storage)), async (req, res) => {
    try {
      res.json(req.verifiedItem);
    } catch (error) {
      console.error("Error getting member:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/members", requireFranchiseAuth, setFranchiseId, validateSchema(insertMemberSchema), async (req, res) => {
    try {
      const member = await storage.createMember(req.body);
      res.status(201).json(member);
    } catch (error) {
      console.error("❌ ERROR creating member:", error);
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.put("/api/members/:id", requireFranchiseAuth, checkOwnership(storage.getMember.bind(storage)), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const oldMember = req.verifiedItem; // 기존 회원 정보
      const validatedData = insertMemberSchema.partial().parse(req.body);
      const updatedMember = await storage.updateMember(id, validatedData);
      
      // 📝 수정 기록 추가 (Add modification record)
      const user = req.user;
      if (user && user.franchiseId) {
        for (const [fieldName, newValue] of Object.entries(validatedData)) {
          const oldValue = oldMember[fieldName as keyof typeof oldMember];
          if (oldValue !== newValue) {
            await storage.addMemberModification(id, {
              modifiedBy: user.username,
              modificationDate: new Date(),
              fieldName,
              oldValue: String(oldValue || ''),
              newValue: String(newValue || ''),
              notes: `${fieldName} 필드 수정`,
              franchiseId: user.franchiseId
            });
          }
        }
      }
      
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.delete("/api/members/:id", requireFranchiseAuth, checkOwnership(storage.getMember.bind(storage)), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMember(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ error: "Failed to delete member" });
    }
  });

  // 📋 회원 수정 기록 조회 (Get member modification records)
  app.get("/api/members/:id/modifications", requireFranchiseAuth, checkOwnership(storage.getMember.bind(storage)), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      const franchiseId = user?.franchiseId ?? undefined;
      const modifications = await storage.getMemberModifications(franchiseId, id);
      res.json(modifications);
    } catch (error) {
      console.error("Error getting member modifications:", error);
      res.status(500).json({ error: "Failed to get member modifications" });
    }
  });

  // 📋 회원 삭제 기록 조회 (Get member deletion records)
  app.get("/api/member-deletions", requireFranchiseAuth, async (req, res) => {
    try {
      const deletions = await storage.getDeletions(req.franchiseId!);
      res.json(deletions);
    } catch (error) {
      console.error("Error getting member deletions:", error);
      res.status(500).json({ error: "Failed to get member deletions" });
    }
  });

  // Membership routes
  app.get("/api/memberships", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      
      // 🔒 데이터 격리: 회원 ID가 주어진 경우 해당 회원이 같은 프랜차이즈인지 확인 (Data isolation: If member ID is provided, verify it belongs to same franchise)
      if (memberId) {
        try {
          const member = await storage.getMember(memberId);
          if (!member || member.franchiseId !== req.franchiseId) {
            return res.status(404).json({ error: "Member not found" });
          }
        } catch (dbError) {
          console.error("Database error while checking member:", dbError);
          return res.json([]);
        }
      }
      
      const memberships = await storage.getMemberships(memberId);
      res.json(memberships);
    } catch (error) {
      console.error("Error getting memberships:", error);
      res.json([]);
    }
  });

  app.post("/api/memberships", requireFranchiseAuth, async (req, res) => {
    try {
      // 🔒 데이터 격리: 회원이 같은 프랜차이즈인지 확인 (Data isolation: Verify member belongs to same franchise)
      if (req.body.memberId) {
        const member = await storage.getMember(req.body.memberId);
        if (!member || member.franchiseId !== req.franchiseId) {
          return res.status(403).json({ error: "Access denied to member" });
        }
      }
      
      // 날짜 문자열을 Date 객체로 변환 (Convert date strings to Date objects)
      const membershipData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const membership = await storage.createMembership(membershipData);
      
      // 📝 결제 기록 자동 생성 (Auto-create payment record)
      if (membership.price && membership.price > 0) {
        await storage.createPayment({
          memberId: membership.memberId,
          membershipId: membership.id,
          amount: membership.price,
          paymentMethod: req.body.paymentMethod || '카드',
          status: '완료',
          description: `${membership.type} 회원권 등록`,
          franchiseId: req.franchiseId ?? undefined,
        });
      }
      
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error creating membership:", error);
      res.status(400).json({ error: "Invalid membership data" });
    }
  });

  // 💳 회원권 환불 (Membership refund)
  app.patch("/api/memberships/:id/refund", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const membership = await storage.getMembership(id);
      if (!membership) {
        return res.status(404).json({ error: "Membership not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      const member = await storage.getMember(membership.memberId);
      if (!member || member.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // 📝 환불 기록 생성 (Create refund record) - 요청 상태로 등록
      const refundAmount = req.body.refundAmount || membership.price || 0;
      const refundReason = req.body.refundReason || "회원권 환불";
      const refund = await storage.createRefund({
        memberId: membership.memberId,
        memberName: member.name,
        refundDate: new Date(),
        originalAmount: membership.price || 0,
        refundAmount: refundAmount,
        refundReason: refundReason,
        productName: membership.type || "회원권",
        productType: "membership",
        productId: id,
        status: "요청",
        franchiseId: req.franchiseId!,
      });
      
      // 상품 상태는 환불 승인 시에만 변경됨 (Product status changes only when refund is approved)
      res.json(refund);
    } catch (error) {
      console.error("Error refunding membership:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🗑️ 회원권 삭제 (Membership delete)
  app.delete("/api/memberships/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const membership = await storage.getMembership(id);
      if (!membership) {
        return res.status(404).json({ error: "Membership not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      const member = await storage.getMember(membership.memberId);
      if (!member || member.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteMembership(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting membership:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Staff routes
  app.get("/api/staff", requireFranchiseAuth, async (req, res) => {
    try {
      // 📊 데이터 조회: 프랜차이즈별 직원 목록 조회 (Data query: Fetch staff list by franchise)
      const staffMembers = await storage.getStaff(req.franchiseId!);
      res.json(staffMembers);
    } catch (error) {
      console.error("Error getting staff:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/staff/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // 🔒 데이터 격리: 삭제 전 접근 권한 확인 (Data isolation: Check access before deletion)
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember || staffMember.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      await storage.deleteStaff(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/staff/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffMember = await storage.getStaffMember(id);
      
      // 🔒 데이터 격리: 같은 프랜차이즈 데이터만 접근 허용 (Data isolation: Only allow access to same franchise data)
      if (!staffMember || staffMember.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      res.json(staffMember);
    } catch (error) {
      console.error("Error getting staff member:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/staff", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      // 📝 데이터 검증: 스키마 기반 입력 검증 (Data validation: Schema-based input validation)
      const validatedData = insertStaffSchema.parse(req.body);
      
      const staffMember = await storage.createStaff(validatedData);
      res.status(201).json(staffMember);
    } catch (error) {
      console.error("Error creating staff member:", error);
      res.status(400).json({ error: "Invalid staff data" });
    }
  });

  app.put("/api/staff/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 수정 전 접근 권한 확인 (Data isolation: Check access before modification)
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember || staffMember.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      // 📝 데이터 검증: 부분 스키마 기반 입력 검증 (Data validation: Partial schema-based input validation)
      const validatedData = insertStaffSchema.partial().parse(req.body);
      
      const updatedStaffMember = await storage.updateStaff(id, validatedData);
      res.json(updatedStaffMember);
    } catch (error) {
      console.error("Error updating staff member:", error);
      res.status(400).json({ error: "Invalid staff data" });
    }
  });

  // 🔐 직원 승인/거부 API (Staff approval/rejection API)
  app.patch("/api/staff/:id/approve", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 승인 전 접근 권한 확인 (Data isolation: Check access before approval)
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember || staffMember.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      // 승인 시 approvalStatus와 status 모두 업데이트 (Update both on approval)
      const updatedStaff = await storage.updateStaff(id, { 
        approvalStatus: "승인",
        status: "재직"  // 승인되면 재직 상태로 변경
      });
      res.json(updatedStaff);
    } catch (error) {
      console.error("Error approving staff member:", error);
      res.status(500).json({ error: "Failed to approve staff member" });
    }
  });

  app.patch("/api/staff/:id/reject", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      // 🔒 데이터 격리: 거부 전 접근 권한 확인 (Data isolation: Check access before rejection)
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember || staffMember.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      const updatedStaff = await storage.updateStaff(id, { 
        approvalStatus: "거부",
        notes: reason ? `거부 사유: ${reason}` : (staffMember.notes || undefined)
      });
      res.json(updatedStaff);
    } catch (error) {
      console.error("Error rejecting staff member:", error);
      res.status(500).json({ error: "Failed to reject staff member" });
    }
  });

  // 🔐 대기 중인 직원 목록 조회 (Get pending staff members)
  app.get("/api/staff/pending", requireFranchiseAuth, async (req, res) => {
    try {
      const allStaff = await storage.getStaff(req.franchiseId!);
      const pendingStaff = allStaff.filter(s => s.approvalStatus === "대기");
      res.json(pendingStaff);
    } catch (error) {
      console.error("Error getting pending staff:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔒 완전한 데이터 격리 적용 - 상품 관리 (Complete data isolation - Product management)
  app.get("/api/products", requireFranchiseAuth, async (req, res) => {
    try {
      const products = await storage.getProducts(req.franchiseId!);
      res.json(products);
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      // 🔒 보안: 인증 확인 (Security: Authentication check)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user;
      // 🔒 보안: 프랜차이즈 접근 권한 확인 (Security: Franchise access validation)
      if (!user?.franchiseId) {
        return res.status(403).json({ error: "No franchise access" });
      }
      
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      // 🔒 데이터 격리: 같은 프랜차이즈 데이터만 접근 허용 (Data isolation: Only allow access to same franchise data)
      if (!product || product.franchiseId !== user.franchiseId) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error getting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/products", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      
      // 🔗 그룹 수업 상품인 경우 group_lessons에도 자동 추가 (Auto-create group lesson when product is group lesson type)
      if (validatedData.lessonType === "그룹 수업" || validatedData.category === "그룹수업") {
        try {
          const dayOfWeek = validatedData.operatingDays && validatedData.operatingDays.length > 0 
            ? getDayNumberFromName(validatedData.operatingDays[0])
            : 1;
          
          const groupLessonData = {
            name: validatedData.name,
            instructorId: validatedData.instructorId ?? null,
            time: validatedData.startTime || "09:00",
            dayOfWeek: dayOfWeek,
            maxParticipants: validatedData.maxParticipants ?? 10,
            duration: validatedData.duration ? `${validatedData.duration}분` : "60분",
            participants: 0,
            status: "활성",
            franchiseId: req.franchiseId,
            price: validatedData.price ?? 0,
          };
          await storage.createGroupLesson(groupLessonData);
        } catch (groupLessonError) {
          console.error("Error creating group lesson for product:", groupLessonError);
        }
      }
      
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      // 🔒 보안: 인증 확인 (Security: Authentication check)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user;
      if (!user?.franchiseId) {
        return res.status(403).json({ error: "No franchise access" });
      }
      
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 수정 전 접근 권한 확인 (Data isolation: Check access before update)
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct || existingProduct.franchiseId !== user.franchiseId) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // 🔒 그룹 수업 필수 필드 검증 (Validate required fields for group lessons)
      const mergedData = { ...existingProduct, ...req.body };
      if (mergedData.lessonType === "그룹 수업") {
        const hasSchedule = mergedData.startTime && mergedData.endTime && 
                           mergedData.operatingDays && mergedData.operatingDays.length > 0;
        // 숫자 변환 후 검증 (Convert to number then validate)
        const minVal = Number(mergedData.minParticipants);
        const maxVal = Number(mergedData.maxParticipants);
        const hasValidMin = !isNaN(minVal) && minVal > 0;
        const hasValidMax = !isNaN(maxVal) && maxVal > 0;
        const hasValidCapacity = hasValidMin && hasValidMax && maxVal >= minVal;
        if (!hasSchedule || !hasValidCapacity) {
          return res.status(400).json({ 
            error: "그룹 수업은 수업 시간, 운영 요일, 정원(>=최소 인원), 최소 인원이 필수입니다" 
          });
        }
        // 숫자로 변환하여 저장 (Convert to numbers for storage)
        req.body.minParticipants = minVal;
        req.body.maxParticipants = maxVal;
      }
      
      const product = await storage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 수정 전 접근 권한 확인 (Data isolation: Check access before update)
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct || existingProduct.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // 🔒 그룹 수업 필수 필드 검증 (Validate required fields for group lessons)
      const mergedData = { ...existingProduct, ...req.body };
      if (mergedData.lessonType === "그룹 수업") {
        const hasSchedule = mergedData.startTime && mergedData.endTime && 
                           mergedData.operatingDays && mergedData.operatingDays.length > 0;
        // 숫자 변환 후 검증 (Convert to number then validate)
        const minVal = Number(mergedData.minParticipants);
        const maxVal = Number(mergedData.maxParticipants);
        const hasValidMin = !isNaN(minVal) && minVal > 0;
        const hasValidMax = !isNaN(maxVal) && maxVal > 0;
        const hasValidCapacity = hasValidMin && hasValidMax && maxVal >= minVal;
        if (!hasSchedule || !hasValidCapacity) {
          return res.status(400).json({ 
            error: "그룹 수업은 수업 시간, 운영 요일, 정원(>=최소 인원), 최소 인원이 필수입니다" 
          });
        }
        // 숫자로 변환하여 저장 (Convert to numbers for storage)
        req.body.minParticipants = minVal;
        req.body.maxParticipants = maxVal;
      }
      
      const updateData = req.body;
      const updatedProduct = await storage.updateProduct(id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      // 🔒 보안: 인증 확인 (Security: Authentication check)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user;
      if (!user?.franchiseId) {
        return res.status(403).json({ error: "No franchise access" });
      }
      
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 삭제 전 접근 권한 확인 (Data isolation: Check access before deletion)
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct || existingProduct.franchiseId !== user.franchiseId) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // 🔗 그룹 수업 상품인 경우 연결된 그룹 수업도 삭제 (Delete linked group lesson if product is group lesson type)
      if (existingProduct.lessonType === "그룹 수업" || existingProduct.category === "그룹수업") {
        try {
          const groupLessons = await storage.getGroupLessons(user.franchiseId);
          const linkedLesson = groupLessons.find(gl => gl.name === existingProduct.name);
          if (linkedLesson) {
            await storage.deleteGroupLesson(linkedLesson.id);
          }
        } catch (groupLessonError) {
          console.error("Error deleting linked group lesson:", groupLessonError);
        }
      }
      
      // 🔗 개인 레슨 상품인 경우 연결된 개인 레슨도 삭제 (Delete linked personal training if product is PT type)
      if (existingProduct.lessonType === "개인 레슨" || existingProduct.category === "개인레슨" || existingProduct.category === "PT") {
        try {
          const personalTrainings = await storage.getPersonalTraining(user.franchiseId);
          const linkedPTs = personalTrainings.filter(pt => pt.productId === existingProduct.id);
          for (const pt of linkedPTs) {
            await storage.deletePersonalTraining(pt.id);
          }
        } catch (ptError) {
          console.error("Error deleting linked personal training:", ptError);
        }
      }
      
      // 🔗 결제 내역의 상품 참조 해제 (Nullify payment product references before deletion)
      try {
        await storage.nullifyPaymentsByProductId(id);
      } catch (paymentError) {
        console.error("Error nullifying payment references:", paymentError);
      }
      
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔒 완전한 데이터 격리 적용 - 사물함 관리 (Complete data isolation - Locker management)
  app.get("/api/lockers", requireFranchiseAuth, async (req, res) => {
    try {
      const lockers = await storage.getLockers(req.franchiseId!);
      res.json(lockers);
    } catch (error) {
      console.error("Error getting lockers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/lockers/:id", async (req, res) => {
    try {
      // 🔒 보안: 인증 확인 (Security: Authentication check)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user;
      if (!user?.franchiseId) {
        return res.status(403).json({ error: "No franchise access" });
      }
      
      const id = parseInt(req.params.id);
      const locker = await storage.getLocker(id);
      
      // 🔒 데이터 격리: 같은 프랜차이즈 데이터만 접근 허용 (Data isolation: Only allow access to same franchise data)
      if (!locker || locker.franchiseId !== user.franchiseId) {
        return res.status(404).json({ error: "Locker not found" });
      }
      
      res.json(locker);
    } catch (error) {
      console.error("Error getting locker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/lockers", async (req, res) => {
    try {
      // 🔒 보안: 인증 및 권한 확인 (Security: Authentication and authorization check)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user;
      if (!user?.franchiseId) {
        return res.status(403).json({ error: "No franchise access" });
      }
      
      // 📝 데이터 검증: 스키마 기반 입력 검증 (Data validation: Schema-based input validation)
      const validatedData = insertLockerSchema.parse(req.body);
      
      // 🔒 데이터 격리: 현재 사용자의 프랜차이즈 ID 강제 설정 (Data isolation: Force current user's franchise ID)
      validatedData.franchiseId = user.franchiseId;
      
      const locker = await storage.createLocker(validatedData);
      res.status(201).json(locker);
    } catch (error) {
      console.error("Error creating locker:", error);
      res.status(400).json({ error: "Invalid locker data" });
    }
  });

  app.put("/api/lockers/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 수정 전 접근 권한 확인 (Data isolation: Check access before modification)
      const existingLocker = await storage.getLocker(id);
      
      // 📝 락커가 존재하지 않으면 생성 (Create locker if it doesn't exist)
      if (!existingLocker) {
        const validatedData = insertLockerSchema.partial().parse(req.body);
        const newLocker = await storage.createLocker({
          number: id,
          monthlyFee: validatedData.monthlyFee || 0,
          section: validatedData.section || "구역1",
          type: "표준",
          status: "빈 락커",
          franchiseId: req.franchiseId!,
          ...validatedData
        });
        return res.json(newLocker);
      }
      
      if (existingLocker.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Locker not found" });
      }
      
      const validatedData = insertLockerSchema.partial().parse(req.body);
      const locker = await storage.updateLocker(id, validatedData);
      res.json(locker);
    } catch (error: any) {
      console.error("Error updating locker:", error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid locker data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/lockers/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 삭제 전 접근 권한 확인 (Data isolation: Check access before deletion)
      const existingLocker = await storage.getLocker(id);
      if (!existingLocker || existingLocker.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Locker not found" });
      }
      
      await storage.deleteLocker(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting locker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔄 락커 회수 기록 관리 (Locker recovery records management)
  app.get("/api/locker-recoveries", requireFranchiseAuth, async (req, res) => {
    try {
      const recoveries = await storage.getLockerRecoveries(req.franchiseId!);
      res.json(recoveries);
    } catch (error) {
      console.error("Error getting locker recoveries:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/lockers/:id/recover", requireFranchiseAuth, async (req, res) => {
    try {
      const lockerId = parseInt(req.params.id);
      const { recoveredBy } = req.body;
      
      // 🔒 데이터 격리: 회수 전 접근 권한 확인 (Data isolation: Check access before recovery)
      const existingLocker = await storage.getLocker(lockerId);
      if (!existingLocker || existingLocker.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Locker not found" });
      }
      
      const recovery = await storage.recoverLocker(lockerId, req.franchiseId!, recoveredBy || "시스템");
      res.status(201).json(recovery);
    } catch (error: any) {
      console.error("Error recovering locker:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // 🔐 락커 설정 API (Locker Settings API)
  app.get("/api/locker-settings", requireFranchiseAuth, async (req, res) => {
    try {
      const settings = await storage.getLockerSettings(req.franchiseId!);
      if (settings) {
        res.json(settings);
      } else {
        // 기본 설정 반환
        res.json({
          totalLockers: 100,
          sections: ['오전반', '오후반', '종일반'],
          defaultMonthlyFee: 10000,
          warningDays: 7,
          autoExpireEnabled: true,
          franchiseId: req.franchiseId
        });
      }
    } catch (error) {
      console.error("Error getting locker settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔒 완전한 데이터 격리 적용 - 출석 관리 (Complete data isolation - Attendance management)
  app.get("/api/attendance", requireFranchiseAuth, async (req, res) => {
    try {
      const date = req.query.date as string;
      const attendance = await storage.getAttendance(req.franchiseId!, date);
      res.json(attendance);
    } catch (error) {
      console.error("Error getting attendance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/attendance", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(400).json({ error: "Invalid attendance data" });
    }
  });

  // 🔄 출석 업데이트 (체크아웃 등) (Update attendance - checkout, etc.)
  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.put("/api/attendance/:id", requireFranchiseAuth, checkOwnership(storage.getAttendanceById.bind(storage)), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(id, validatedData);
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(400).json({ error: "Invalid attendance data" });
    }
  });

  // 🗑️ 출석 삭제 (Delete attendance)
  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.delete("/api/attendance/:id", requireFranchiseAuth, checkOwnership(storage.getAttendanceById.bind(storage)), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAttendance(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔒 완전한 데이터 격리 적용 - 일정 관리 (Complete data isolation - Schedule management)
  app.get("/api/schedules", requireFranchiseAuth, async (req, res) => {
    try {
      const schedules = await storage.getSchedules(req.franchiseId!);
      res.json(schedules);
    } catch (error) {
      console.error("Error getting schedules:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/schedules/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getSchedule(id);
      if (!schedule || schedule.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      console.error("Error getting schedule:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/schedules", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(400).json({ error: "Invalid schedule data" });
    }
  });

  app.put("/api/schedules/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existingSchedule = await storage.getSchedule(id);
      if (!existingSchedule || existingSchedule.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      const validatedData = insertScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateSchedule(id, validatedData);
      res.json(schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(400).json({ error: "Invalid schedule data" });
    }
  });

  app.delete("/api/schedules/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existingSchedule = await storage.getSchedule(id);
      if (!existingSchedule || existingSchedule.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      await storage.deleteSchedule(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔒 완전한 데이터 격리 적용 - 개인 트레이닝 관리 (Complete data isolation - Personal training management)
  app.get("/api/personal-training", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const personalTrainings = await storage.getPersonalTraining(req.franchiseId!, memberId);
      res.json(personalTrainings);
    } catch (error) {
      console.error("Error getting personal training:", error);
      res.json([]);
    }
  });

  app.post("/api/personal-training", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertPersonalTrainingSchema.parse(req.body);
      const pt = await storage.createPersonalTraining(validatedData);
      
      // 🔗 상품 자동 생성: 개인 레슨 생성 시 상품에도 자동 추가 (Auto-create product when PT is created)
      // productId가 없을 때만 새 상품 생성
      let createdProductId: number | null = null;
      if (!req.body.productId && req.body.productName) {
        try {
          const member = await storage.getMember(validatedData.memberId);
          const instructor = validatedData.instructorId ? await storage.getStaffMember(validatedData.instructorId) : null;
          
          const productData = {
            name: req.body.productName || `개인 레슨 - ${member?.name || '회원'}`,
            price: req.body.price || 0,
            duration: 60,
            durationType: "회",
            sessions: validatedData.totalSessions || undefined,
            category: "개인레슨",
            status: "활성",
            appExposed: true,
            description: `${member?.name || '회원'} 개인 레슨 ${validatedData.totalSessions || 10}회`,
            instructorId: validatedData.instructorId ?? undefined,
            lessonType: "개인 레슨",
            maxParticipants: 1,
            minParticipants: 1,
            franchiseId: req.franchiseId,
          };
          const createdProduct = await storage.createProduct(productData);
          createdProductId = createdProduct.id;
        } catch (productError) {
          console.error("Error creating product for personal training:", productError);
        }
      }
      
      // 📝 결제 기록 자동 생성 (Auto-create payment record)
      // productId가 있으면 상품 가격 조회, 없으면 price 필드 사용
      let paymentAmount = req.body.price || 0;
      const productIdToUse = req.body.productId || createdProductId;
      if (productIdToUse) {
        const product = await storage.getProduct(productIdToUse);
        if (product) {
          paymentAmount = product.price;
        }
      }
      
      if (paymentAmount > 0) {
        await storage.createPayment({
          memberId: validatedData.memberId,
          amount: paymentAmount,
          paymentMethod: req.body.paymentMethod || '카드',
          status: '완료',
          description: `개인 레슨 ${validatedData.totalSessions}회 등록`,
          franchiseId: req.franchiseId ?? undefined,
          staffId: validatedData.instructorId ?? undefined,
          productId: productIdToUse ?? undefined,
        });
      }
      
      res.status(201).json(pt);
    } catch (error) {
      console.error("Error creating personal training:", error);
      res.status(400).json({ error: "Invalid personal training data" });
    }
  });

  // ✅ 개인 레슨 세션 완료 처리 (Personal training session complete - decrement remaining sessions)
  app.patch("/api/personal-training/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pt = await storage.getPersonalTrainingById(id);
      if (!pt) {
        return res.status(404).json({ error: "Personal training not found" });
      }
      if (pt.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updateData: Record<string, unknown> = {};
      if (req.body.remainingSessions !== undefined) updateData.remainingSessions = req.body.remainingSessions;
      if (req.body.usedSessions !== undefined) updateData.usedSessions = req.body.usedSessions;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.lastSessionDate !== undefined) updateData.lastSessionDate = new Date(req.body.lastSessionDate);
      const updated = await storage.updatePersonalTraining(id, updateData as any);
      res.json(updated);
    } catch (error) {
      console.error("Error updating personal training:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 💳 개인 레슨 환불 (Personal training refund)
  app.patch("/api/personal-training/:id/refund", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pt = await storage.getPersonalTrainingById(id);
      if (!pt) {
        return res.status(404).json({ error: "Personal training not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      if (pt.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // 📝 환불 기록 생성 (Create refund record) - 요청 상태로 등록
      const member = await storage.getMember(pt.memberId);
      const product = pt.productId ? await storage.getProduct(pt.productId) : null;
      const refundAmount = req.body.refundAmount || product?.price || 0;
      const refundReason = req.body.refundReason || "개인 레슨 환불";
      const refund = await storage.createRefund({
        memberId: pt.memberId,
        memberName: member?.name || "알 수 없음",
        refundDate: new Date(),
        originalAmount: product?.price || 0,
        refundAmount: refundAmount,
        refundReason: refundReason,
        productName: product?.name || "개인 레슨",
        productType: "personal_training",
        productId: id,
        status: "요청",
        franchiseId: req.franchiseId!,
      });
      
      // 상품 상태는 환불 승인 시에만 변경됨 (Product status changes only when refund is approved)
      res.json(refund);
    } catch (error) {
      console.error("Error refunding personal training:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/personal-training/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pt = await storage.getPersonalTrainingById(id);
      if (!pt) {
        return res.status(404).json({ error: "Personal training not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      if (pt.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deletePersonalTraining(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting personal training:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PT Sessions routes
  app.get("/api/pt-sessions", requireFranchiseAuth, async (req, res) => {
    try {
      const ptId = req.query.ptId ? parseInt(req.query.ptId as string) : undefined;
      const sessions = await storage.getPtSessions(req.franchiseId!, ptId);
      res.json(sessions);
    } catch (error) {
      console.error("Error getting PT sessions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/pt-sessions", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertPtSessionSchema.parse(req.body);
      const session = await storage.createPtSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating PT session:", error);
      res.status(400).json({ error: "Invalid PT session data" });
    }
  });

  // 🔄 PT 세션 업데이트 (Update PT session)
  app.put("/api/pt-sessions/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 수정 전 접근 권한 확인 (Data isolation: Check access before modification)
      const existingSession = await storage.getPtSession(id);
      if (!existingSession || existingSession.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "PT session not found" });
      }
      
      const validatedData = insertPtSessionSchema.partial().parse(req.body);
      // 🔒 franchiseId 변경 방지 (Prevent franchiseId modification)
      const { franchiseId, ...safeData } = validatedData;
      const session = await storage.updatePtSession(id, safeData);
      res.json(session);
    } catch (error) {
      console.error("Error updating PT session:", error);
      res.status(400).json({ error: "Invalid PT session data" });
    }
  });

  // 🗑️ PT 세션 삭제 (Delete PT session)
  app.delete("/api/pt-sessions/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 삭제 전 접근 권한 확인 (Data isolation: Check access before deletion)
      const existingSession = await storage.getPtSession(id);
      if (!existingSession || existingSession.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "PT session not found" });
      }
      
      await storage.deletePtSession(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting PT session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // OT Application routes
  app.get("/api/ot-applications", requireFranchiseAuth, async (req, res) => {
    try {
      const applications = await storage.getOtApplications(req.franchiseId!);
      res.json(applications);
    } catch (error) {
      console.error("Error getting OT applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/ot-applications", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertOtApplicationSchema.parse(req.body);
      const application = await storage.createOtApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating OT application:", error);
      res.status(400).json({ error: "Invalid OT application data" });
    }
  });

  // OT 신청 상태 변경 (승인/거부/완료) 및 트레이너 배정
  app.patch("/api/ot-applications/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getOtApplications(req.franchiseId!);
      const existing = application.find(a => a.id === id);
      if (!existing) {
        return res.status(404).json({ error: "OT 신청을 찾을 수 없습니다" });
      }
      const { status, preferredInstructorId, notes } = req.body;
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (preferredInstructorId !== undefined) updateData.preferredInstructorId = preferredInstructorId;
      if (notes !== undefined) updateData.notes = notes;
      const updated = await storage.updateOtApplication(id, updateData as any);
      res.json(updated);
    } catch (error) {
      console.error("Error updating OT application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 트레이너 기록 시스템 (Trainer Records System)
  app.get("/api/trainer-records", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const trainerId = req.query.trainerId ? parseInt(req.query.trainerId as string) : undefined;
      
      const records = await storage.getTrainerRecords(req.franchiseId!, memberId, trainerId);
      res.json(records);
    } catch (error) {
      console.error("Error getting trainer records:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/trainer-records", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertTrainerRecordSchema.parse(req.body);
      const record = await storage.createTrainerRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating trainer record:", error);
      res.status(400).json({ error: "Invalid trainer record data" });
    }
  });

  // 회원 측정 기록 시스템 (Member Measurements System)
  app.get("/api/member-measurements", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      
      const measurements = await storage.getMemberMeasurements(req.franchiseId!, memberId);
      res.json(measurements);
    } catch (error) {
      console.error("Error getting member measurements:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/member-measurements", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertMemberMeasurementSchema.parse(req.body);
      const measurement = await storage.createMemberMeasurement(validatedData);
      res.status(201).json(measurement);
    } catch (error) {
      console.error("Error creating member measurement:", error);
      res.status(400).json({ error: "Invalid measurement data" });
    }
  });

  // 💬 상담 관리 API 라우트 (Consultation Management API Routes)
  app.get("/api/consultations", requireFranchiseAuth, async (req, res) => {
    try {
      const consultations = await storage.getConsultations(req.franchiseId!);
      res.json(consultations);
    } catch (error) {
      console.error("Error getting consultations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 💬 상담 관리 직접 접근 API 라우트 (Direct Consultation Management API Routes)
  app.get("/api/consultations-direct", requireFranchiseAuth, async (req, res) => {
    try {
      const consultations = await storage.getConsultations(req.franchiseId ?? undefined);
      res.json(consultations);
    } catch (error) {
      console.error("Error getting consultations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/consultations", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertConsultationSchema.parse(req.body);
      const consultation = await storage.createConsultation(validatedData);
      res.status(201).json(consultation);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(400).json({ error: "Invalid consultation data" });
    }
  });

  app.post("/api/consultations-direct", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      // 📝 데이터 검증: 스키마 기반 입력 검증 (Data validation: Schema-based input validation)
      const validatedData = insertConsultationSchema.parse(req.body);
      
      const consultation = await storage.createConsultation(validatedData);
      res.status(201).json(consultation);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(400).json({ error: "Invalid consultation data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.put("/api/consultations/:id", requireFranchiseAuth, checkOwnership(storage.getConsultation.bind(storage)), async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      const validatedData = insertConsultationSchema.partial().parse(req.body);
      const consultation = await storage.updateConsultation(consultationId, validatedData);
      res.json(consultation);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(400).json({ error: "Invalid consultation data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.put("/api/consultations-direct/:id", requireFranchiseAuth, checkOwnership(storage.getConsultation.bind(storage)), setFranchiseId, async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      
      // 📝 데이터 검증: 스키마 기반 입력 검증 (Data validation: Schema-based input validation)
      const validatedData = insertConsultationSchema.partial().parse(req.body);
      
      const consultation = await storage.updateConsultation(consultationId, validatedData);
      res.json(consultation);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(400).json({ error: "Invalid consultation data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.delete("/api/consultations/:id", requireFranchiseAuth, checkOwnership(storage.getConsultation.bind(storage)), async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      await storage.deleteConsultation(consultationId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting consultation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.delete("/api/consultations-direct/:id", requireFranchiseAuth, checkOwnership(storage.getConsultation.bind(storage)), async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      
      await storage.deleteConsultation(consultationId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting consultation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 📚 그룹 수업 API 엔드포인트 (Group Lessons API endpoints)
  app.get("/api/group-lessons", requireFranchiseAuth, async (req, res) => {
    try {
      const groupLessons = await storage.getGroupLessons(req.franchiseId!);
      res.json(groupLessons);
    } catch (error) {
      console.error("Error getting group lessons:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/group-lessons/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const groupLesson = await storage.getGroupLesson(id);
      if (!groupLesson || groupLesson.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Group lesson not found" });
      }
      res.json(groupLesson);
    } catch (error) {
      console.error("Error getting group lesson:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/group-lessons", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      // 📝 데이터 검증: 스키마 기반 입력 검증 (Data validation: Schema-based input validation)
      const validatedData = insertGroupLessonSchema.parse(req.body);
      
      const groupLesson = await storage.createGroupLesson(validatedData);
      
      // 🔗 상품 자동 생성: 그룹 수업 생성 시 상품에도 자동 추가 (Auto-create product when group lesson is created)
      try {
        const durationMinutes = parseInt((validatedData.duration || "60분").replace(/[^\d]/g, '')) || 60;
        // 요청 body에서 추가 필드 추출 (Extract additional fields from request body)
        const { startTime: reqStartTime, endTime: reqEndTime, operatingDays: reqOperatingDays, minParticipants: reqMinParticipants } = req.body;
        
        const productData = {
          name: validatedData.name,
          price: validatedData.price ?? 0,
          duration: durationMinutes,
          durationType: "회",
          category: "수업 상품",
          status: "활성",
          appExposed: true,
          description: `${validatedData.name} 그룹 수업`,
          instructorId: validatedData.instructorId ?? undefined,
          lessonType: "그룹 수업",
          maxParticipants: validatedData.maxParticipants ?? 10,
          minParticipants: reqMinParticipants ?? validatedData.minParticipants ?? 1,
          startTime: reqStartTime || validatedData.startTime || validatedData.time || undefined,
          endTime: reqEndTime || validatedData.endTime || calculateEndTime(validatedData.time || "09:00", validatedData.duration || "60분"),
          operatingDays: reqOperatingDays && reqOperatingDays.length > 0 
            ? reqOperatingDays 
            : (validatedData.operatingDays && validatedData.operatingDays.length > 0 
              ? validatedData.operatingDays 
              : (req.body.dayOfWeek ? [getDayName(req.body.dayOfWeek)] : [])),
          franchiseId: req.franchiseId,
        };
        const createdProduct = await storage.createProduct(productData);
        
        // 생성된 상품의 ID를 그룹 수업에 연결 (Link created product ID to group lesson)
        await storage.updateGroupLesson(groupLesson.id, { productId: createdProduct.id });
      } catch (productError) {
        console.error("Error creating product for group lesson:", productError);
      }
      
      // 🔗 스케줄 자동 생성: 그룹 수업 생성 시 해당 스케줄도 자동 생성 (Auto-create schedule when group lesson is created)
      try {
        const scheduleData = {
          title: validatedData.name,
          description: `${validatedData.name} 그룹 수업`,
          instructorId: validatedData.instructorId ?? undefined,
          startTime: validatedData.time || "09:00",
          endTime: calculateEndTime(validatedData.time || "09:00", validatedData.duration || "60분"),
          dayOfWeek: 1,
          isActive: true,
          franchiseId: req.franchiseId!
        };
        
        await storage.createSchedule(scheduleData);
      } catch (scheduleError) {
        console.error("Error creating schedule for group lesson:", scheduleError);
      }
      
      res.status(201).json(groupLesson);
    } catch (error) {
      console.error("Error creating group lesson:", error);
      res.status(400).json({ error: "Invalid group lesson data" });
    }
  });

  // 🔄 기존 그룹 수업을 상품에 동기화하는 엔드포인트 (Sync existing group lessons to products)
  app.post("/api/group-lessons/sync-to-products", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const groupLessons = await storage.getGroupLessons(req.franchiseId!);
      const products = await storage.getProducts(req.franchiseId!);
      
      let syncedCount = 0;
      let skippedCount = 0;
      
      for (const gl of groupLessons) {
        // 이미 동일한 이름의 그룹수업 상품이 있는지 확인
        const existingProduct = products.find(p => 
          p.name === gl.name && 
          (p.category === "그룹수업" || p.category === "수업 상품" || p.lessonType === "그룹 수업")
        );
        
        if (existingProduct) {
          // 기존 "그룹수업" 카테고리를 "수업 상품"으로 마이그레이션
          if (existingProduct.category === "그룹수업") {
            await storage.updateProduct(existingProduct.id, { category: "수업 상품" });
          }
          skippedCount++;
          continue;
        }
        
        // 상품 생성 (가격 포함)
        const durationMinutes = parseInt((gl.duration || "60분").replace(/[^\d]/g, '')) || 60;
        const productData = {
          name: gl.name,
          price: gl.price ?? 0,
          duration: durationMinutes,
          durationType: "회",
          category: "수업 상품",
          status: "활성",
          appExposed: true,
          description: `${gl.name} 그룹 수업`,
          instructorId: gl.instructorId ?? undefined,
          lessonType: "그룹 수업",
          maxParticipants: gl.maxParticipants ?? 10,
          minParticipants: gl.minParticipants ?? 1,
          startTime: gl.startTime || gl.time || undefined,
          endTime: gl.endTime || calculateEndTime(gl.time || "09:00", gl.duration || "60분"),
          operatingDays: gl.operatingDays && gl.operatingDays.length > 0 
            ? gl.operatingDays 
            : (gl.dayOfWeek !== null && gl.dayOfWeek !== undefined ? [getDayName(gl.dayOfWeek)] : []),
          franchiseId: req.franchiseId,
        };
        
        await storage.createProduct(productData);
        syncedCount++;
      }
      
      res.json({ 
        success: true, 
        message: `${syncedCount}개의 그룹 수업이 상품에 동기화되었습니다. ${skippedCount}개는 이미 존재합니다.`,
        syncedCount,
        skippedCount 
      });
    } catch (error) {
      console.error("Error syncing group lessons to products:", error);
      res.status(500).json({ error: "동기화 중 오류가 발생했습니다." });
    }
  });

  // 👥 그룹 수업 회원 등록 엔드포인트 (Enroll member in group lesson)
  app.post("/api/group-lessons/:id/enroll", requireFranchiseAuth, async (req, res) => {
    try {
      const groupLessonId = parseInt(req.params.id);
      const { memberId, price, paymentMethod, productId } = req.body;
      
      if (!memberId) {
        return res.status(400).json({ error: "회원 ID가 필요합니다." });
      }
      
      // 🔒 데이터 격리: 그룹 수업 확인 (Data isolation: Verify group lesson)
      const groupLesson = await storage.getGroupLesson(groupLessonId);
      if (!groupLesson || groupLesson.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "그룹 수업을 찾을 수 없습니다." });
      }
      
      // 🔒 데이터 격리: 회원 확인 (Data isolation: Verify member)
      const member = await storage.getMember(memberId);
      if (!member || member.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "회원을 찾을 수 없습니다." });
      }
      
      // 📊 참가자 수 증가 (Increase participant count)
      const newParticipants = (groupLesson.participants || 0) + 1;
      if (newParticipants > (groupLesson.maxParticipants || 10)) {
        return res.status(400).json({ error: "정원이 초과되었습니다." });
      }
      
      await storage.updateGroupLesson(groupLessonId, { participants: newParticipants });
      
      // 💳 결제 기록 생성 (Create payment record)
      const paymentAmount = price ?? groupLesson.price ?? 0;
      let paymentId: number | undefined = undefined;
      if (paymentAmount > 0) {
        const payment = await storage.createPayment({
          memberId: memberId,
          amount: paymentAmount,
          paymentMethod: paymentMethod || '카드',
          status: '완료',
          description: `그룹 수업 등록: ${groupLesson.name}`,
          franchiseId: req.franchiseId!,
          productId: productId ?? groupLesson.productId ?? undefined,
        });
        paymentId = payment.id;
      }
      
      // 📝 그룹 수업 등록 기록 생성 (Create group lesson enrollment record)
      const enrollment = await storage.createGroupLessonEnrollment({
        memberId: memberId,
        groupLessonId: groupLessonId,
        productId: productId ?? groupLesson.productId ?? undefined,
        paymentId: paymentId,
        price: paymentAmount,
        status: '활성',
        franchiseId: req.franchiseId!,
      });
      
      res.status(201).json({ 
        success: true, 
        message: `${member.name}님이 ${groupLesson.name} 수업에 등록되었습니다.`,
        groupLesson: { ...groupLesson, participants: newParticipants },
        enrollment: enrollment
      });
    } catch (error) {
      console.error("Error enrolling member in group lesson:", error);
      res.status(500).json({ error: "그룹 수업 등록에 실패했습니다." });
    }
  });

  // 📋 그룹 수업 등록 조회 엔드포인트 (Get group lesson enrollments)
  app.get("/api/group-lesson-enrollments", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const enrollments = await storage.getGroupLessonEnrollments(req.franchiseId!, memberId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching group lesson enrollments:", error);
      res.status(500).json({ error: "그룹 수업 등록 목록을 가져오는 데 실패했습니다." });
    }
  });

  app.put("/api/group-lessons/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 수정 전 접근 권한 확인 (Data isolation: Check access before modification)
      const groupLesson = await storage.getGroupLesson(id);
      if (!groupLesson || groupLesson.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Group lesson not found" });
      }
      
      // 📝 데이터 검증: 부분 스키마 기반 입력 검증 (Data validation: Partial schema-based input validation)
      const validatedData = insertGroupLessonSchema.partial().parse(req.body);
      
      const updatedGroupLesson = await storage.updateGroupLesson(id, validatedData);
      
      // 🔗 연결된 상품도 업데이트 (Update linked product for bidirectional sync)
      try {
        // productId 기반 조회 우선, 없으면 이름 기반 폴백 (Prefer productId lookup, fallback to name-based)
        const products = await storage.getProducts(req.franchiseId!);
        let linkedProduct = null;
        
        if (groupLesson.productId) {
          linkedProduct = products.find(p => p.id === groupLesson.productId);
        }
        if (!linkedProduct) {
          linkedProduct = products.find(p => 
            p.name === groupLesson.name && 
            (p.category === "수업 상품" || p.category === "그룹수업" || p.lessonType === "그룹 수업")
          );
        }
        
        if (linkedProduct) {
          const getDayName = (dayOfWeek: number) => {
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            return days[dayOfWeek] || '월';
          };
          
          // 요청 body에서 추가 필드 추출 (startTime, endTime, minParticipants, operatingDays)
          const { startTime, endTime, minParticipants, operatingDays: reqOperatingDays } = req.body;
          
          await storage.updateProduct(linkedProduct.id, {
            name: validatedData.name || linkedProduct.name,
            price: validatedData.price !== undefined ? validatedData.price : linkedProduct.price,
            maxParticipants: validatedData.maxParticipants || linkedProduct.maxParticipants,
            minParticipants: minParticipants !== undefined ? minParticipants : linkedProduct.minParticipants,
            instructorId: validatedData.instructorId,
            startTime: startTime || validatedData.startTime || validatedData.time || linkedProduct.startTime,
            endTime: endTime || validatedData.endTime || linkedProduct.endTime,
            operatingDays: reqOperatingDays && reqOperatingDays.length > 0
              ? reqOperatingDays
              : validatedData.operatingDays && validatedData.operatingDays.length > 0
                ? validatedData.operatingDays
                : validatedData.dayOfWeek !== undefined 
                  ? [getDayName(validatedData.dayOfWeek)]
                  : linkedProduct.operatingDays,
          });
        }
      } catch (productError) {
        console.error("Error updating linked product:", productError);
      }
      
      res.json(updatedGroupLesson);
    } catch (error) {
      console.error("Error updating group lesson:", error);
      res.status(400).json({ error: "Invalid group lesson data" });
    }
  });

  app.delete("/api/group-lessons/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔒 데이터 격리: 삭제 전 접근 권한 확인 (Data isolation: Check access before deletion)
      const groupLesson = await storage.getGroupLesson(id);
      if (!groupLesson || groupLesson.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Group lesson not found" });
      }
      
      // 🔗 연결된 상품도 삭제 (Delete linked product)
      try {
        // productId 기반 삭제 우선, 없으면 이름 기반 폴백 (Prefer productId deletion, fallback to name-based)
        const products = await storage.getProducts(req.franchiseId!);
        let linkedProduct = null;
        
        if (groupLesson.productId) {
          linkedProduct = products.find(p => p.id === groupLesson.productId);
        }
        if (!linkedProduct) {
          linkedProduct = products.find(p => 
            p.name === groupLesson.name && 
            (p.category === "수업 상품" || p.category === "그룹수업" || p.lessonType === "그룹 수업")
          );
        }
        
        if (linkedProduct) {
          await storage.deleteProduct(linkedProduct.id);
        }
      } catch (productError) {
        console.error("Error deleting linked product:", productError);
      }
      
      await storage.deleteGroupLesson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting group lesson:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 📝 게시글 API 엔드포인트 (Posts API endpoints)
  app.get("/api/posts", requireFranchiseAuth, async (req, res) => {
    try {
      const posts = await storage.getPosts(req.franchiseId!);
      res.json(posts);
    } catch (error) {
      console.error("Error getting posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ error: "Invalid post data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.put("/api/posts/:id", requireFranchiseAuth, checkOwnership(storage.getPost.bind(storage)), setFranchiseId, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const validatedData = insertPostSchema.partial().parse(req.body);
      
      const post = await storage.updatePost(postId, validatedData);
      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(400).json({ error: "Invalid post data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.delete("/api/posts/:id", requireFranchiseAuth, checkOwnership(storage.getPost.bind(storage)), async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      await storage.deletePost(postId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 📝 계약서 API 엔드포인트 (Contracts API endpoints)
  app.get("/api/contracts", requireFranchiseAuth, async (req, res) => {
    try {
      const contracts = await storage.getContracts(req.franchiseId!);
      res.json(contracts);
    } catch (error) {
      console.error("Error getting contracts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/contracts/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract || contract.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json(contract);
    } catch (error) {
      console.error("Error getting contract:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/contracts", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(400).json({ error: "Invalid contract data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.put("/api/contracts/:id", requireFranchiseAuth, checkOwnership(storage.getContract.bind(storage)), setFranchiseId, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const validatedData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(contractId, validatedData);
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(400).json({ error: "Invalid contract data" });
    }
  });

  app.delete("/api/contracts/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      const existingContract = await storage.getContract(contractId);
      if (!existingContract || existingContract.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      await storage.deleteContract(contractId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 💰 환불 관리 API 엔드포인트 (Refund management API endpoints)
  app.get("/api/refunds", requireFranchiseAuth, async (req, res) => {
    try {
      const refunds = await storage.getRefunds(req.franchiseId!);
      res.json(refunds);
    } catch (error) {
      console.error("Error getting refunds:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/refunds", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertRefundSchema.parse(req.body);
      
      // 🔒 회원 소유권 검증: 해당 회원이 현재 프랜차이즈 소속인지 확인
      // (Member ownership validation: Verify member belongs to current franchise)
      if (validatedData.memberId) {
        const member = await storage.getMember(validatedData.memberId);
        if (!member || member.franchiseId !== req.franchiseId) {
          return res.status(403).json({ error: "해당 회원에 대한 접근 권한이 없습니다." });
        }
        
        // 🔒 상품 소유권 검증: 상품이 해당 회원의 구매 내역인지 확인
        // (Product ownership validation: Verify product belongs to member's purchases)
        if (validatedData.productType && validatedData.productId) {
          let isValidProduct = false;
          
          switch (validatedData.productType) {
            case 'membership':
              // 회원권은 memberships 테이블에서 개별 조회 후 memberId 검증
              // (Verify membership by direct lookup and check memberId)
              const membershipRecord = await storage.getMembership(validatedData.productId);
              isValidProduct = !!membershipRecord && 
                membershipRecord.memberId === validatedData.memberId;
              break;
              
            case 'pt':
              // PT는 개별 조회 후 memberId와 franchiseId 검증
              // (Verify PT by direct lookup and check memberId + franchiseId)
              const ptRecord = await storage.getPersonalTrainingById(validatedData.productId);
              isValidProduct = !!ptRecord && 
                ptRecord.memberId === validatedData.memberId &&
                ptRecord.franchiseId === req.franchiseId;
              break;
              
            case 'locker':
              // 락커는 개별 조회 후 memberId와 franchiseId 검증
              // (Verify locker by direct lookup and check memberId + franchiseId)
              const lockerRecord = await storage.getLocker(validatedData.productId);
              isValidProduct = !!lockerRecord && 
                lockerRecord.memberId === validatedData.memberId &&
                lockerRecord.franchiseId === req.franchiseId;
              break;
              
            default:
              // 알 수 없는 상품 유형은 허용 (기존 호환성)
              isValidProduct = true;
          }
          
          if (!isValidProduct) {
            return res.status(403).json({ error: "해당 상품은 이 회원의 구매 내역이 아닙니다." });
          }
        }
      }
      
      const refund = await storage.createRefund(validatedData);
      res.status(201).json(refund);
    } catch (error) {
      console.error("Error creating refund:", error);
      res.status(400).json({ error: "Invalid refund data" });
    }
  });

  app.put("/api/refunds/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const refundId = parseInt(req.params.id);
      
      // 🔒 환불 기록 소유권 검증 (Verify refund record belongs to franchise)
      const existingRefund = await storage.getRefund(refundId);
      if (!existingRefund || existingRefund.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "환불 기록을 찾을 수 없습니다." });
      }
      
      const validatedData = insertRefundSchema.partial().parse(req.body);
      
      // 🔒 회원 변경 시 소유권 검증 (Validate ownership if member is being changed)
      if (validatedData.memberId && validatedData.memberId !== existingRefund.memberId) {
        const member = await storage.getMember(validatedData.memberId);
        if (!member || member.franchiseId !== req.franchiseId) {
          return res.status(403).json({ error: "해당 회원에 대한 접근 권한이 없습니다." });
        }
      }
      
      // ✅ 환불 상태 변경 검증: "요청" → "완료" 전환인지 확인
      const isApproval = validatedData.status === "완료" && existingRefund.status === "요청";
      
      // 1️⃣ 먼저 환불 기록 업데이트 (Update refund record first)
      const refund = await storage.updateRefund(refundId, validatedData);
      
      // 2️⃣ 환불 승인 시에만 상품 상태를 '환불'로 변경 (Update product status only when approved)
      if (isApproval) {
        const productType = existingRefund.productType;
        const productId = existingRefund.productId;
        
        if (productId) {
          try {
            switch (productType) {
              case "membership":
                await storage.updateMembership(productId, { status: "환불" });
                break;
              case "personal_training":
              case "pt":
                await storage.updatePersonalTraining(productId, { status: "환불" });
                break;
              case "locker":
                await storage.updateMemberLocker(productId, { status: "환불" });
                break;
              case "equipment":
                await storage.updateMemberEquipment(productId, { status: "환불" });
                break;
            }
          } catch (productError) {
            console.error("Error updating product status:", productError);
            // 상품 상태 업데이트 실패 시 환불 상태를 롤백 (Rollback refund status if product update fails)
            await storage.updateRefund(refundId, { status: "요청" });
            return res.status(500).json({ error: "상품 상태 업데이트에 실패했습니다. 다시 시도해주세요." });
          }
        }
      }
      
      res.json(refund);
    } catch (error) {
      console.error("Error updating refund:", error);
      res.status(400).json({ error: "Invalid refund data" });
    }
  });

  // 💵 기타 매출 API 엔드포인트 (Other sales API endpoints)
  app.get("/api/other-sales", requireFranchiseAuth, async (req, res) => {
    try {
      const sales = await storage.getOtherSales(req.franchiseId!);
      res.json(sales);
    } catch (error) {
      console.error("Error getting other sales:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/other-sales", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertOtherSaleSchema.parse(req.body);
      const sale = await storage.createOtherSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating other sale:", error);
      res.status(400).json({ error: "Invalid sale data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.put("/api/other-sales/:id", requireFranchiseAuth, checkOwnership(storage.getOtherSale.bind(storage)), async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const validatedData = insertOtherSaleSchema.partial().parse(req.body);
      
      const sale = await storage.updateOtherSale(saleId, validatedData);
      res.json(sale);
    } catch (error) {
      console.error("Error updating other sale:", error);
      res.status(400).json({ error: "Invalid sale data" });
    }
  });

  // 🔒 소유권 검증 추가 (Added ownership verification)
  app.delete("/api/other-sales/:id", requireFranchiseAuth, checkOwnership(storage.getOtherSale.bind(storage)), async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      await storage.deleteOtherSale(saleId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting other sale:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🛑 정지 관리 API 엔드포인트 (Suspension management API endpoints)
  app.get("/api/suspensions", requireFranchiseAuth, async (req, res) => {
    try {
      const suspensions = await storage.getSuspensions(req.franchiseId!);
      res.json(suspensions);
    } catch (error) {
      console.error("Error getting suspensions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/suspensions", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertSuspensionSchema.parse(req.body);
      const suspension = await storage.createSuspension(validatedData);
      res.status(201).json(suspension);
    } catch (error) {
      console.error("Error creating suspension:", error);
      res.status(400).json({ error: "Invalid suspension data" });
    }
  });

  // 정지 해제 API (Release suspension API)
  app.patch("/api/suspensions/:id/release", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "잘못된 요청입니다." });
      }
      
      const suspension = await storage.releaseSuspension(id, req.franchiseId!);
      
      if (!suspension) {
        return res.status(404).json({ error: "정지 기록을 찾을 수 없습니다." });
      }
      
      res.json(suspension);
    } catch (error) {
      console.error("Error releasing suspension:", error);
      res.status(500).json({ error: "정지 해제에 실패했습니다." });
    }
  });

  // 📝 수정 기록 API 엔드포인트 (Member modification API endpoints)
  app.get("/api/member-modifications", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const modifications = await storage.getMemberModifications(req.franchiseId!, memberId);
      res.json(modifications);
    } catch (error) {
      console.error("Error getting member modifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/member-modifications", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const validatedData = insertMemberModificationSchema.parse(req.body);
      const modification = await storage.createMemberModification(validatedData);
      res.status(201).json(modification);
    } catch (error) {
      console.error("Error creating member modification:", error);
      res.status(400).json({ error: "Invalid modification data" });
    }
  });

  // 🗑️ 수정 기록 삭제 API 엔드포인트 (Delete member modification API endpoint)
  app.delete("/api/member-modifications/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "잘못된 요청입니다." });
      }
      
      // 🔒 데이터 격리: franchiseId로 스코프된 삭제 (Data isolation: Scoped deletion by franchiseId)
      const deleted = await storage.deleteMemberModification(id, req.franchiseId!);
      
      if (!deleted) {
        return res.status(404).json({ error: "수정 기록을 찾을 수 없습니다." });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member modification:", error);
      res.status(500).json({ error: "수정 기록 삭제에 실패했습니다." });
    }
  });

  // 👥 단체 연장 API 엔드포인트 (Group extension API endpoints)
  app.get("/api/group-extensions", requireFranchiseAuth, async (req, res) => {
    try {
      const extensions = await storage.getGroupExtensions(req.franchiseId!);
      res.json(extensions);
    } catch (error) {
      console.error("Error getting group extensions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/group-extensions", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const { memberIds, extensionDays, reason, originalEndDate, newEndDate, ...rest } = req.body;
      
      // 📝 memberIds 배열 지원: 각 회원에 대해 개별 레코드 생성
      // Support memberIds array: create individual records for each member
      if (memberIds && Array.isArray(memberIds)) {
        const extensions = [];
        for (const memberId of memberIds) {
          const extensionData = {
            memberId,
            extensionDays,
            reason,
            // 클라이언트에서 제공하면 사용, 없으면 기본값 생성
            originalEndDate: originalEndDate || new Date().toISOString(),
            newEndDate: newEndDate || new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000).toISOString(),
            franchiseId: rest.franchiseId,
          };
          const validatedData = insertGroupExtensionSchema.parse(extensionData);
          const extension = await storage.createGroupExtension(validatedData);
          extensions.push(extension);
        }
        return res.status(201).json(extensions);
      }
      
      // 📝 단일 memberId 처리 (기존 로직)
      // Single memberId processing (existing logic)
      const validatedData = insertGroupExtensionSchema.parse(req.body);
      const extension = await storage.createGroupExtension(validatedData);
      res.status(201).json(extension);
    } catch (error) {
      console.error("Error creating group extension:", error);
      res.status(400).json({ error: "Invalid extension data" });
    }
  });

  // 🏋️ 회원 운동 용품 API 엔드포인트 (Member equipment API endpoints)
  app.get("/api/member-equipment", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const equipment = await storage.getMemberEquipment(req.franchiseId!, memberId);
      res.json(equipment);
    } catch (error) {
      console.error("Error getting member equipment:", error);
      res.json([]);
    }
  });

  app.post("/api/member-equipment", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const equipment = await storage.createMemberEquipment(req.body);
      res.status(201).json(equipment);
    } catch (error) {
      console.error("Error creating member equipment:", error);
      res.status(400).json({ error: "Invalid equipment data" });
    }
  });

  // 💳 운동 용품 환불 (Member equipment refund)
  app.patch("/api/member-equipment/:id/refund", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equipment = await storage.getMemberEquipmentById(id);
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      if (equipment.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // 📝 환불 기록 생성 (Create refund record) - 요청 상태로 등록
      const member = await storage.getMember(equipment.memberId);
      const refundAmount = req.body.refundAmount || 0;
      const refundReason = req.body.refundReason || "운동 용품 환불";
      const refund = await storage.createRefund({
        memberId: equipment.memberId,
        memberName: member?.name || "알 수 없음",
        refundDate: new Date(),
        originalAmount: 0,
        refundAmount: refundAmount,
        refundReason: refundReason,
        productName: equipment.equipmentName || "운동 용품",
        productType: "equipment",
        productId: id,
        status: "요청",
        franchiseId: req.franchiseId!,
      });
      
      // 상품 상태는 환불 승인 시에만 변경됨 (Product status changes only when refund is approved)
      res.json(refund);
    } catch (error) {
      console.error("Error refunding member equipment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🗑️ 운동 용품 삭제 (Member equipment delete)
  app.delete("/api/member-equipment/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equipment = await storage.getMemberEquipmentById(id);
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      if (equipment.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteMemberEquipment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member equipment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🔐 회원 락커 API 엔드포인트 (Member locker API endpoints)
  app.get("/api/member-lockers", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const lockers = await storage.getMemberLockers(req.franchiseId!, memberId);
      res.json(lockers);
    } catch (error) {
      console.error("Error getting member lockers:", error);
      res.json([]);
    }
  });

  app.post("/api/member-lockers", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const locker = await storage.createMemberLocker(req.body);
      res.status(201).json(locker);
    } catch (error) {
      console.error("Error creating member locker:", error);
      res.status(400).json({ error: "Invalid locker data" });
    }
  });

  // 💳 락커 환불 (Member locker refund)
  app.patch("/api/member-lockers/:id/refund", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const locker = await storage.getMemberLockerById(id);
      if (!locker) {
        return res.status(404).json({ error: "Locker not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      if (locker.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // 📝 환불 기록 생성 (Create refund record) - 요청 상태로 등록
      const member = await storage.getMember(locker.memberId);
      const refundAmount = req.body.refundAmount || locker.monthlyFee || 0;
      const refundReason = req.body.refundReason || "락커 환불";
      const refund = await storage.createRefund({
        memberId: locker.memberId,
        memberName: member?.name || "알 수 없음",
        refundDate: new Date(),
        originalAmount: locker.monthlyFee || 0,
        refundAmount: refundAmount,
        refundReason: refundReason,
        productName: `락커 ${locker.lockerSection || locker.lockerId || ""}`,
        productType: "locker",
        productId: id,
        status: "요청",
        franchiseId: req.franchiseId!,
      });
      
      // 상품 상태는 환불 승인 시에만 변경됨 (Product status changes only when refund is approved)
      res.json(refund);
    } catch (error) {
      console.error("Error refunding member locker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 🗑️ 락커 삭제 (Member locker delete)
  app.delete("/api/member-lockers/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const locker = await storage.getMemberLockerById(id);
      if (!locker) {
        return res.status(404).json({ error: "Locker not found" });
      }
      // 🔒 데이터 격리: 프랜차이즈 소유권 확인 (Data isolation: Verify franchise ownership)
      if (locker.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteMemberLocker(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member locker:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 💳 결제 정보 API 엔드포인트 (Payment API endpoints)
  app.get("/api/payments", requireFranchiseAuth, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const staffId = req.query.staffId ? parseInt(req.query.staffId as string) : undefined;
      let payments = await storage.getPayments(req.franchiseId!, memberId);
      
      // staffId 필터링 (Filter by staffId for staff sales)
      if (staffId) {
        payments = payments.filter(p => p.staffId === staffId);
      }
      
      res.json(payments);
    } catch (error) {
      console.error("Error getting payments:", error);
      res.json([]);
    }
  });

  app.post("/api/payments", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // 🔧 락커 설정 API 엔드포인트 (Locker Settings API endpoints)
  app.post("/api/locker-settings", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const { lockerCount, startNumber, zoneName, currentManagement, sections, sectionDetails } = req.body;
      const franchiseId = req.franchiseId!;
      
      // 📝 락커 설정 저장 (Save locker settings to DB) - sections 및 sectionDetails 포함
      const settingsToSave: any = {
        franchiseId,
        totalLockers: lockerCount || 100,
        defaultMonthlyFee: 10000,
        warningDays: 7,
        autoExpireEnabled: true,
        sections: (sections && Array.isArray(sections) && sections.length > 0) 
          ? sections 
          : ['구역1'],
        sectionDetails: sectionDetails || [], // 구역 상세정보 저장 (Save section details)
      };
      
      // 기존 설정 조회 (현재 구역과 비교용)
      const existingSettings = await storage.getLockerSettings(franchiseId);
      const oldSections = existingSettings?.sections || [];
      const newSections = settingsToSave.sections;
      
      // 삭제된 구역 확인 (Find removed sections)
      const removedSections = oldSections.filter((s: string) => !newSections.includes(s));
      
      await storage.saveLockerSettings(settingsToSave);
      
      // 🔄 삭제된 구역을 사용하는 락커들의 구역을 첫 번째 구역으로 변경
      // (Update lockers using removed sections to use the first available section)
      if (removedSections.length > 0 && newSections.length > 0) {
        const allLockers = await storage.getLockers(franchiseId);
        const defaultSection = newSections[0];
        
        for (const locker of allLockers) {
          if (removedSections.includes(locker.section)) {
            await storage.updateLocker(locker.id, { section: defaultSection });
          }
        }
      }
      
      // 📝 락커 생성 로직 (lockerCount와 startNumber가 있을 때만)
      const parsedCount = parseInt(lockerCount);
      const parsedStart = parseInt(startNumber);
      let createdCount = 0;
      let skippedDuplicate = 0;
      
      if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount <= 500 && 
          !isNaN(parsedStart) && parsedStart >= 1) {
        
        // 기존 락커 목록 조회 (Get existing lockers - filtered by franchiseId)
        const existingLockers = await storage.getLockers(franchiseId);
        const existingNumbers = new Set(existingLockers.map(l => l.number));
        
        // 새로운 락커 생성 (Create new lockers)
        for (let i = 0; i < parsedCount; i++) {
          const lockerNumber = parsedStart + i;
          
          // 이미 존재하는 락커 번호는 건너뜀 (Skip existing locker numbers)
          if (existingNumbers.has(lockerNumber)) {
            skippedDuplicate++;
            continue;
          }
          
          try {
            await storage.createLocker({
              number: lockerNumber,
              monthlyFee: 0,
              section: zoneName || (sections && sections[0]) || "구역1",
              type: currentManagement || "일반",
              status: "빈 락커",
              franchiseId: franchiseId,
            });
            createdCount++;
            existingNumbers.add(lockerNumber);
          } catch (createError) {
            console.error(`Error creating locker ${lockerNumber}:`, createError);
          }
        }
        
      }
      
      let message = "락커 설정이 저장되었습니다.";
      if (createdCount > 0) {
        message += ` ${createdCount}개의 새 락커가 생성되었습니다.`;
      }
      if (skippedDuplicate > 0) {
        message += ` (${skippedDuplicate}개는 이미 존재하여 건너뜀)`;
      }
      
      res.status(200).json({ 
        success: true, 
        message,
        createdCount,
        skippedCount: skippedDuplicate,
        data: req.body 
      });
    } catch (error) {
      console.error("Error saving locker settings:", error);
      res.status(400).json({ error: "락커 설정 저장에 실패했습니다." });
    }
  });

  // 📢 키오스크 공지 API 엔드포인트 (Kiosk Notice API endpoints)
  app.get("/api/kiosk-notices", requireFranchiseAuth, async (req, res) => {
    try {
      const notices = await storage.getKioskNotices(req.franchiseId!);
      res.json(notices);
    } catch (error) {
      console.error("Error getting kiosk notices:", error);
      res.json([]);
    }
  });

  app.get("/api/kiosk-notices/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notice = await storage.getKioskNotice(id);
      
      if (!notice || notice.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "공지를 찾을 수 없습니다." });
      }
      
      res.json(notice);
    } catch (error) {
      console.error("Error getting kiosk notice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/kiosk-notices", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const notice = await storage.createKioskNotice(req.body);
      res.status(201).json(notice);
    } catch (error) {
      console.error("Error creating kiosk notice:", error);
      res.status(400).json({ error: "공지 등록에 실패했습니다." });
    }
  });

  app.put("/api/kiosk-notices/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingNotice = await storage.getKioskNotice(id);
      
      if (!existingNotice || existingNotice.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "공지를 찾을 수 없습니다." });
      }
      
      const notice = await storage.updateKioskNotice(id, req.body);
      res.json(notice);
    } catch (error) {
      console.error("Error updating kiosk notice:", error);
      res.status(400).json({ error: "공지 수정에 실패했습니다." });
    }
  });

  app.delete("/api/kiosk-notices/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingNotice = await storage.getKioskNotice(id);
      
      if (!existingNotice || existingNotice.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "공지를 찾을 수 없습니다." });
      }
      
      await storage.deleteKioskNotice(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting kiosk notice:", error);
      res.status(500).json({ error: "공지 삭제에 실패했습니다." });
    }
  });

  // 🏋️ OT 프로그램 API 엔드포인트 (OT Program API endpoints)
  app.get("/api/ot-programs", requireFranchiseAuth, async (req, res) => {
    try {
      const programs = await storage.getOtPrograms(req.franchiseId!);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching OT programs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/ot-programs/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const program = await storage.getOtProgram(id);
      
      if (!program || program.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "프로그램을 찾을 수 없습니다." });
      }
      
      res.json(program);
    } catch (error) {
      console.error("Error fetching OT program:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/ot-programs", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const program = await storage.createOtProgram(req.body);
      
      // 🔄 자동 동기화: 그룹수업/개인레슨/상품에 OT 프로그램 연결
      // (Automatic sync: Connect OT program to group lessons/personal training/products)
      const { name, price, sessions, category } = req.body;
      const franchiseId = req.franchiseId as number;
      
      // 상품 테이블에 OT 프로그램 상품 생성 (Create OT program product in products table)
      try {
        await storage.createProduct({
          name: `[OT] ${name}`,
          description: `OT 프로그램 - ${category || '기본'}`,
          price: price || 0,
          category: 'OT',
          status: '활성',
          franchiseId,
          sessions: sessions || 10,
        });
      } catch (syncError) {
        console.error("Error syncing OT program to products:", syncError);
      }
      
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating OT program:", error);
      res.status(400).json({ error: "프로그램 등록에 실패했습니다." });
    }
  });

  app.put("/api/ot-programs/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingProgram = await storage.getOtProgram(id);
      
      if (!existingProgram || existingProgram.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "프로그램을 찾을 수 없습니다." });
      }
      
      const program = await storage.updateOtProgram(id, req.body);
      res.json(program);
    } catch (error) {
      console.error("Error updating OT program:", error);
      res.status(400).json({ error: "프로그램 수정에 실패했습니다." });
    }
  });

  app.delete("/api/ot-programs/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingProgram = await storage.getOtProgram(id);
      
      if (!existingProgram || existingProgram.franchiseId !== req.franchiseId) {
        return res.status(404).json({ error: "프로그램을 찾을 수 없습니다." });
      }
      
      await storage.deleteOtProgram(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting OT program:", error);
      res.status(500).json({ error: "프로그램 삭제에 실패했습니다." });
    }
  });

  // 📋 센터 프로그램 API 엔드포인트 (Center Program API endpoints)
  app.get("/api/center-programs", requireFranchiseAuth, async (req, res) => {
    try {
      // 🔒 프랜차이즈 ID 필수 검증 (Franchise ID required)
      if (!req.franchiseId) {
        return res.status(403).json({ error: "프랜차이즈 인증이 필요합니다." });
      }
      const programs = await storage.getCenterPrograms(req.franchiseId);
      res.json(programs);
    } catch (error) {
      console.error("Error fetching center programs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/center-programs", requireFranchiseAuth, async (req, res) => {
    try {
      // 🔒 프랜차이즈 ID 필수 및 강제 적용 (Franchise ID required and enforced)
      if (!req.franchiseId) {
        return res.status(403).json({ error: "프랜차이즈 인증이 필요합니다." });
      }
      const { programType, programId } = req.body;
      if (!programType || !programId) {
        return res.status(400).json({ error: "programType과 programId가 필요합니다." });
      }
      const program = await storage.createCenterProgram({
        programType,
        programId,
        franchiseId: req.franchiseId, // 🔒 세션 franchiseId 강제 사용
      });
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating center program:", error);
      res.status(400).json({ error: "프로그램 등록에 실패했습니다." });
    }
  });

  app.post("/api/center-programs/bulk", requireFranchiseAuth, async (req, res) => {
    try {
      // 🔒 프랜차이즈 ID 필수 검증 (Franchise ID required)
      if (!req.franchiseId) {
        return res.status(403).json({ error: "프랜차이즈 인증이 필요합니다." });
      }
      const { programType, programIds } = req.body;
      
      // 입력 유효성 검증 (Input validation)
      if (!programType || !['group', 'personal'].includes(programType)) {
        return res.status(400).json({ error: "유효한 programType이 필요합니다 (group 또는 personal)." });
      }
      if (!Array.isArray(programIds)) {
        return res.status(400).json({ error: "programIds는 배열이어야 합니다." });
      }
      
      const franchiseId = req.franchiseId as number;
      
      // 기존 해당 타입 프로그램 삭제 후 새로 추가 (Delete existing programs of this type, then add new ones)
      await storage.deleteCenterProgramsByType(franchiseId, programType);
      
      // 선택된 프로그램들 추가 (Add selected programs)
      const createdPrograms = [];
      for (const programId of programIds) {
        if (typeof programId !== 'number') continue;
        const program = await storage.createCenterProgram({
          programType,
          programId,
          franchiseId, // 🔒 세션 franchiseId 강제 사용
        });
        createdPrograms.push(program);
      }
      
      res.status(201).json(createdPrograms);
    } catch (error) {
      console.error("Error bulk creating center programs:", error);
      res.status(400).json({ error: "프로그램 등록에 실패했습니다." });
    }
  });

  app.delete("/api/center-programs/:id", requireFranchiseAuth, async (req, res) => {
    try {
      // 🔒 프랜차이즈 ID 필수 검증 (Franchise ID required)
      if (!req.franchiseId) {
        return res.status(403).json({ error: "프랜차이즈 인증이 필요합니다." });
      }
      const id = parseInt(req.params.id);
      
      // 🔒 소유권 확인 (Ownership verification)
      const existingPrograms = await storage.getCenterPrograms(req.franchiseId);
      const program = existingPrograms.find(p => p.id === id);
      if (!program) {
        return res.status(404).json({ error: "프로그램을 찾을 수 없습니다." });
      }
      
      await storage.deleteCenterProgram(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting center program:", error);
      res.status(500).json({ error: "프로그램 삭제에 실패했습니다." });
    }
  });

  // ──────────────────────────────────────────────────
  // 🤖 AI 분석 API (AI Analytics API - Claude 기반)
  // ──────────────────────────────────────────────────

  // 회원 이탈 위험도 분석 (Member churn risk analysis)
  app.get("/api/ai/churn-analysis", requireFranchiseAuth, async (req, res) => {
    try {
      const franchiseId = req.franchiseId!;
      const [members, attendanceList, personalTrainings] = await Promise.all([
        storage.getMembers(franchiseId),
        storage.getAttendance(franchiseId),
        storage.getPersonalTraining(franchiseId),
      ]);

      // 🔒 franchise 회원의 멤버십만 조회 (Get memberships only for franchise members)
      const memberMemberships = await Promise.all(
        members.map((m: any) => storage.getMemberships(m.id))
      );
      const franchiseMemberships = memberMemberships.flat();

      const result = await analyzeChurnRisk(franchiseId, {
        members,
        attendanceList,
        memberships: franchiseMemberships,
        personalTrainings,
      });

      res.json(result);
    } catch (error) {
      console.error("Error in churn analysis:", error);
      res.status(500).json({ error: "이탈 분석에 실패했습니다." });
    }
  });

  // 매출 예측 & 인사이트 (Revenue prediction & insights)
  app.get("/api/ai/revenue-insights", requireFranchiseAuth, async (req, res) => {
    try {
      const franchiseId = req.franchiseId!;
      const [payments, members, products] = await Promise.all([
        storage.getPayments(franchiseId),
        storage.getMembers(franchiseId),
        storage.getProducts(franchiseId),
      ]);

      const result = await analyzeRevenueInsights(franchiseId, { payments, members, products });
      res.json(result);
    } catch (error) {
      console.error("Error in revenue insights:", error);
      res.status(500).json({ error: "매출 분석에 실패했습니다." });
    }
  });

  // ──────────────────────────────────────────────────
  // 📱 고객 앱 API (Customer App API - 준비 중)
  // ──────────────────────────────────────────────────

  // 고객 앱 연결 상태 확인 (Customer app connection status)
  app.get("/api/customer/status", requireFranchiseAuth, async (req, res) => {
    res.json({
      status: "준비 중",
      message: "고객 앱 연동 기능은 현재 준비 중입니다.",
      availableAt: "추후 공지",
    });
  });

  // ──────────────────────────────────────────────────
  // 🤖 AI 챗봇 (AI Chatbot)
  // ──────────────────────────────────────────────────

  app.post("/api/ai/chat", requireFranchiseAuth, async (req, res) => {
    try {
      const { messages } = req.body as { messages: { role: "user" | "assistant"; content: string }[] };
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "messages 필드가 필요합니다." });
      }

      const franchiseId = req.franchiseId!;
      const [members, payments] = await Promise.all([
        storage.getMembers(franchiseId),
        storage.getPayments(franchiseId),
      ]);
      const activeMembers = members.filter((m: any) => m.status === "활성 회원" || m.status === "active").length;
      const thisMonth = new Date();
      const monthlyRevenue = payments.filter((p: any) => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear() && p.status === "완료";
      }).reduce((s: number, p: any) => s + (p.amount || 0), 0);

      const systemPrompt = `당신은 헬스장 운영 AI 어시스턴트입니다. 운영자가 질문하면 친절하고 전문적으로 답변하세요.

현재 센터 현황:
- 활성 회원 수: ${activeMembers}명
- 이번 달 매출: ${monthlyRevenue.toLocaleString()}원
- 총 회원 수: ${members.length}명

답변은 간결하고 실용적으로 작성하세요. 한국어로 답변하세요.`;

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.slice(-10),
      });

      const reply = response.content[0].type === "text" ? response.content[0].text : "죄송합니다, 답변을 생성할 수 없습니다.";
      res.json({ reply });
    } catch (err: any) {
      res.status(500).json({ error: "AI 챗봇 오류: " + (err.message || "알 수 없는 오류") });
    }
  });

  // ========================================
  // 💳 PG 결제 터미널 API (PG Payment Terminal API)
  // ========================================

  // PG 설정 조회 (Get franchise PG config)
  app.get("/api/pg/config", requireFranchiseAuth, async (req, res) => {
    try {
      const franchise = await storage.getFranchise(req.franchiseId!);
      if (!franchise) return res.status(404).json({ error: "가맹점을 찾을 수 없습니다" });
      res.json({
        pgProvider: franchise.pgProvider,
        pgServiceId: franchise.pgServiceId,
        pgMode: franchise.pgMode,
        hasApiKey: !!franchise.pgApiKey,
        hasApiIv: !!franchise.pgApiIv,
      });
    } catch (error) {
      console.error("PG config get error:", error);
      res.status(500).json({ error: "PG 설정 조회 실패" });
    }
  });

  // PG 설정 업데이트 (superadmin만 가능)
  app.put("/api/pg/config", requireFranchiseAuth, async (req, res) => {
    try {
      // superadmin만 PG 설정 수정 가능
      if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: "PG 설정 변경 권한이 없습니다. 본사에 문의하세요." });
      }
      const { pgProvider, pgServiceId, pgMode, pgApiKey, pgApiIv } = req.body;
      const franchise = await storage.updateFranchisePgConfig(req.franchiseId!, {
        pgProvider, pgServiceId, pgMode, pgApiKey, pgApiIv,
      });
      res.json({
        pgProvider: franchise.pgProvider,
        pgServiceId: franchise.pgServiceId,
        pgMode: franchise.pgMode,
        hasApiKey: !!franchise.pgApiKey,
        hasApiIv: !!franchise.pgApiIv,
      });
    } catch (error) {
      console.error("PG config update error:", error);
      res.status(500).json({ error: "PG 설정 업데이트 실패" });
    }
  });

  // 결제 요약 (Today/Month summary)
  app.get("/api/pg/summary", requireFranchiseAuth, async (req, res) => {
    try {
      const transactions = await storage.getPgTransactions(req.franchiseId!);
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const monthStr = todayStr.slice(0, 6);

      let todayAmount = 0;
      let monthAmount = 0;
      let todayCount = 0;
      let monthCount = 0;

      for (const tx of transactions) {
        if (tx.status !== "approved") continue;
        const txDay = tx.orderDate.slice(0, 8);
        const txMonth = tx.orderDate.slice(0, 6);
        if (txDay === todayStr) {
          todayAmount += tx.amount;
          todayCount++;
        }
        if (txMonth === monthStr) {
          monthAmount += tx.amount;
          monthCount++;
        }
      }

      res.json({ todayAmount, todayCount, monthAmount, monthCount });
    } catch (error) {
      console.error("PG summary error:", error);
      res.status(500).json({ error: "결제 요약 조회 실패" });
    }
  });

  // 결제 준비 (Prepare payment — generate form data for Billgate popup)
  app.post("/api/pg/prepare", requireFranchiseAuth, async (req, res) => {
    try {
      const franchise = await storage.getFranchise(req.franchiseId!);
      if (!franchise?.pgServiceId) {
        return res.status(400).json({ error: "PG 설정이 완료되지 않았습니다. 먼저 PG 설정을 해주세요." });
      }

      const { amount, itemName, itemCode, userName, userEmail, userPhone, serviceCode, memberId } = req.body;
      if (!amount || !itemName) {
        return res.status(400).json({ error: "결제 금액과 상품명은 필수입니다" });
      }

      const config: BillgatePgConfig = {
        serviceId: franchise.pgServiceId,
        mode: (franchise.pgMode as "test" | "production") || "test",
        apiKey: franchise.pgApiKey || undefined,
        apiIv: franchise.pgApiIv || undefined,
      };

      const callbackBaseUrl = process.env.BILLGATE_CALLBACK_URL || `${req.protocol}://${req.get("host")}`;
      const returnUrl = `${callbackBaseUrl}/api/pg/callback`;

      const paymentData = preparePayment({
        config,
        amount: parseInt(amount),
        itemName,
        itemCode: itemCode || "FITCRM",
        userName,
        userEmail,
        serviceCode,
        returnUrl,
      });

      // DB에 pending 거래 생성 (Create pending transaction in DB)
      const pgTx = await storage.createPgTransaction({
        franchiseId: req.franchiseId!,
        memberId: memberId ? parseInt(memberId) : null,
        orderId: paymentData.orderId,
        orderDate: paymentData.orderDate,
        serviceCode: paymentData.serviceCode,
        amount: parseInt(amount),
        status: "pending",
        paymentMethod: PAYMENT_METHOD_LABELS[paymentData.serviceCode] || "카드",
        itemName,
        itemCode: itemCode || "FITCRM",
        userName,
        userPhone,
        userEmail,
        pgProvider: "billgate",
      });

      res.json({ ...paymentData, pgTransactionId: pgTx.id });
    } catch (error) {
      console.error("PG prepare error:", error);
      res.status(500).json({ error: "결제 준비 실패" });
    }
  });

  // 빌게이트 콜백 처리 (Billgate callback handler — called by Billgate after payment)
  app.post("/api/pg/callback", async (req, res) => {
    try {
      const {
        SERVICE_ID, SERVICE_CODE, ORDER_ID, ORDER_DATE, AMOUNT,
        TRANSACTION_ID, RESPONSE_CODE, RESPONSE_MESSAGE,
        DETAIL_RESPONSE_CODE, DETAIL_RESPONSE_MESSAGE,
        AUTH_NUMBER, AUTH_DATE, AUTH_AMOUNT, HASH_DATA,
      } = req.body;

      // 주문번호로 거래 조회 (Find transaction by order ID)
      const pgTx = await storage.getPgTransactionByOrderId(ORDER_ID);
      if (!pgTx) {
        console.error(`PG callback: transaction not found for ORDER_ID=${ORDER_ID}`);
        return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
      }

      const isSuccess = RESPONSE_CODE === "0000";

      // 거래 업데이트 (Update transaction with callback result)
      await storage.updatePgTransaction(pgTx.id, {
        transactionId: TRANSACTION_ID,
        responseCode: RESPONSE_CODE,
        responseMessage: RESPONSE_MESSAGE || DETAIL_RESPONSE_MESSAGE,
        authNumber: AUTH_NUMBER,
        authDate: AUTH_DATE,
        status: isSuccess ? "approved" : "failed",
      });

      // 성공 시 기존 payments 테이블에도 기록 연동 (Link to existing payments table on success)
      if (isSuccess && pgTx.memberId) {
        const payment = await storage.createPayment({
          memberId: pgTx.memberId,
          amount: pgTx.amount,
          paymentMethod: pgTx.paymentMethod || "카드",
          status: "완료",
          description: `PG결제: ${pgTx.itemName || ""}`,
          franchiseId: pgTx.franchiseId,
        });
        await storage.updatePgTransaction(pgTx.id, { paymentId: payment.id });
      }

      // 결제 결과 페이지로 리다이렉트 (Redirect to payment result page)
      const resultUrl = `/payment-result?orderId=${ORDER_ID}&status=${isSuccess ? "success" : "fail"}&message=${encodeURIComponent(RESPONSE_MESSAGE || "")}`;
      res.redirect(resultUrl);
    } catch (error) {
      console.error("PG callback error:", error);
      res.status(500).send("콜백 처리 오류");
    }
  });

  // GET 콜백 지원 (Support GET callback from Billgate redirect)
  app.get("/api/pg/callback", async (req, res) => {
    const { ORDER_ID, RESPONSE_CODE, RESPONSE_MESSAGE } = req.query;
    const isSuccess = RESPONSE_CODE === "0000";
    const resultUrl = `/payment-result?orderId=${ORDER_ID}&status=${isSuccess ? "success" : "fail"}&message=${encodeURIComponent(String(RESPONSE_MESSAGE || ""))}`;
    res.redirect(resultUrl);
  });

  // 결제 취소 (Cancel payment)
  app.post("/api/pg/cancel", requireFranchiseAuth, async (req, res) => {
    try {
      const { pgTransactionId, cancelType, cancelAmount } = req.body;
      const pgTx = await storage.getPgTransaction(pgTransactionId);
      if (!pgTx) return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
      if (pgTx.franchiseId !== req.franchiseId) return res.status(403).json({ error: "접근 권한 없음" });
      if (pgTx.status !== "approved") return res.status(400).json({ error: "승인된 거래만 취소할 수 있습니다" });

      const franchise = await storage.getFranchise(req.franchiseId!);
      if (!franchise?.pgServiceId) return res.status(400).json({ error: "PG 설정 없음" });

      const config: BillgatePgConfig = {
        serviceId: franchise.pgServiceId,
        mode: (franchise.pgMode as "test" | "production") || "test",
      };

      const result = await billgateCancelPayment({
        config,
        orderId: pgTx.orderId,
        orderDate: pgTx.orderDate,
        transactionId: pgTx.transactionId || "",
        cancelType: cancelType || "C",
        cancelAmount: cancelAmount || pgTx.amount,
        serviceCode: pgTx.serviceCode,
      });

      const isCancelSuccess = result.RESPONSE_CODE === "0000" || result.RESPONSE_CODE === "1111";

      if (isCancelSuccess) {
        await storage.updatePgTransaction(pgTx.id, {
          status: "cancelled",
          cancelType: cancelType || "C",
          cancelAmount: cancelAmount || pgTx.amount,
          cancelDate: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
        });
      }

      res.json({
        success: isCancelSuccess,
        responseCode: result.RESPONSE_CODE,
        responseMessage: result.RESPONSE_MESSAGE,
      });
    } catch (error) {
      console.error("PG cancel error:", error);
      res.status(500).json({ error: "결제 취소 실패" });
    }
  });

  // 거래 목록 조회 (Get PG transactions)
  app.get("/api/pg/transactions", requireFranchiseAuth, async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      const transactions = await storage.getPgTransactions(req.franchiseId!, {
        status: status as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      res.json(transactions);
    } catch (error) {
      console.error("PG transactions error:", error);
      res.json([]);
    }
  });

  // 거래 상세 조회 (Get PG transaction detail)
  app.get("/api/pg/transactions/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const tx = await storage.getPgTransaction(parseInt(req.params.id));
      if (!tx) return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
      if (tx.franchiseId !== req.franchiseId) return res.status(403).json({ error: "접근 권한 없음" });
      res.json(tx);
    } catch (error) {
      console.error("PG transaction detail error:", error);
      res.status(500).json({ error: "거래 상세 조회 실패" });
    }
  });

  // 링크결제 생성 (Create link payment)
  app.post("/api/pg/link", requireFranchiseAuth, async (req, res) => {
    try {
      const franchise = await storage.getFranchise(req.franchiseId!);
      if (!franchise?.pgServiceId) {
        return res.status(400).json({ error: "PG 설정이 완료되지 않았습니다" });
      }

      const { amount, itemName, itemCode, userName, userPhone } = req.body;
      if (!amount || !itemName) {
        return res.status(400).json({ error: "결제 금액과 상품명은 필수입니다" });
      }

      const config: BillgatePgConfig = {
        serviceId: franchise.pgServiceId,
        mode: (franchise.pgMode as "test" | "production") || "test",
      };

      const callbackBaseUrl = process.env.BILLGATE_CALLBACK_URL || `${req.protocol}://${req.get("host")}`;
      const returnUrl = `${callbackBaseUrl}/api/pg/callback`;

      const paymentData = preparePayment({
        config,
        amount: parseInt(amount),
        itemName,
        itemCode: itemCode || "FITCRM_LINK",
        userName,
        returnUrl,
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const linkUrl = generateLinkPaymentUrl(baseUrl, paymentData.orderId);

      // DB에 링크결제 거래 생성 (Create link payment transaction)
      const pgTx = await storage.createPgTransaction({
        franchiseId: req.franchiseId!,
        orderId: paymentData.orderId,
        orderDate: paymentData.orderDate,
        serviceCode: paymentData.serviceCode,
        amount: parseInt(amount),
        status: "pending",
        paymentMethod: "링크결제",
        itemName,
        itemCode: itemCode || "FITCRM_LINK",
        userName,
        userPhone,
        linkPaymentUrl: linkUrl,
        pgProvider: "billgate",
      });

      res.json({ linkUrl, orderId: paymentData.orderId, pgTransactionId: pgTx.id });
    } catch (error) {
      console.error("PG link create error:", error);
      res.status(500).json({ error: "링크결제 생성 실패" });
    }
  });

  // PG 상품 CRUD (PG Product management)
  app.get("/api/pg/products", requireFranchiseAuth, async (req, res) => {
    try {
      const products = await storage.getPgProducts(req.franchiseId!);
      res.json(products);
    } catch (error) {
      console.error("PG products error:", error);
      res.json([]);
    }
  });

  app.post("/api/pg/products", requireFranchiseAuth, setFranchiseId, async (req, res) => {
    try {
      const franchise = await storage.getFranchise(req.franchiseId!);

      // 결제 링크 자동 생성 (Auto-generate link payment URL)
      let linkPaymentUrl: string | null = null;
      let orderId: string | null = null;

      if (franchise?.pgServiceId) {
        orderId = generateOrderId("LK");
        const orderDate = generateOrderDate();
        const amount = req.body.price?.toString() || "0";
        const hashKey = generateHashKey(franchise.pgServiceId, orderId, amount, orderDate);
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        linkPaymentUrl = `${baseUrl}/pay/${orderId}`;

        // 링크결제 거래 레코드 생성 (Create link payment transaction record)
        await storage.createPgTransaction({
          franchiseId: req.franchiseId!,
          orderId,
          orderDate,
          serviceCode: SERVICE_CODES.CREDIT_CARD,
          amount: parseInt(amount),
          status: "pending",
          paymentMethod: "링크결제",
          itemName: req.body.name,
          itemCode: req.body.itemCode,
          linkPaymentUrl,
          pgProvider: "billgate",
        });
      }

      const product = await storage.createPgProduct({
        ...req.body,
        linkPaymentUrl,
        orderId,
      });
      res.status(201).json(product);
    } catch (error) {
      console.error("PG product create error:", error);
      res.status(400).json({ error: "PG 상품 등록 실패" });
    }
  });

  app.put("/api/pg/products/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const existing = await storage.getPgProduct(parseInt(req.params.id));
      if (!existing) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
      if (existing.franchiseId !== req.franchiseId) return res.status(403).json({ error: "접근 권한 없음" });
      const product = await storage.updatePgProduct(parseInt(req.params.id), req.body);
      res.json(product);
    } catch (error) {
      console.error("PG product update error:", error);
      res.status(500).json({ error: "PG 상품 수정 실패" });
    }
  });

  app.delete("/api/pg/products/:id", requireFranchiseAuth, async (req, res) => {
    try {
      const existing = await storage.getPgProduct(parseInt(req.params.id));
      if (!existing) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
      if (existing.franchiseId !== req.franchiseId) return res.status(403).json({ error: "접근 권한 없음" });
      await storage.deletePgProduct(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("PG product delete error:", error);
      res.status(500).json({ error: "PG 상품 삭제 실패" });
    }
  });

  // 📱 링크결제 SMS 발송 (Send link payment SMS)
  app.post("/api/pg/link/sms", requireFranchiseAuth, async (req, res) => {
    try {
      const { pgProductId, recipientPhone, recipientName } = req.body;
      if (!pgProductId || !recipientPhone) {
        return res.status(400).json({ error: "상품 ID와 수신자 전화번호는 필수입니다" });
      }

      const product = await storage.getPgProduct(pgProductId);
      if (!product) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
      if (product.franchiseId !== req.franchiseId) return res.status(403).json({ error: "접근 권한 없음" });
      if (!product.linkPaymentUrl) return res.status(400).json({ error: "결제 링크가 없는 상품입니다" });

      const franchise = await storage.getFranchise(req.franchiseId!);
      const storeName = franchise?.name || "OUHVE ABM";

      const message = buildLinkPaymentSmsMessage({
        storeName,
        productName: product.name,
        amount: product.price,
        linkUrl: product.linkPaymentUrl,
      });

      const smsResult = await smsProvider.sendSms(recipientPhone, message);

      // SMS 발송 이력 저장 (Save SMS send log)
      const smsLog = await storage.createSmsLog({
        franchiseId: req.franchiseId!,
        pgProductId,
        sentByUserId: req.user!.id,
        sentByUsername: req.user!.username,
        recipientPhone,
        recipientName: recipientName || null,
        linkUrl: product.linkPaymentUrl,
        status: smsResult.success ? "sent" : "failed",
        errorMessage: smsResult.errorMessage || null,
      });

      res.json({ success: smsResult.success, smsLog });
    } catch (error) {
      console.error("SMS send error:", error);
      res.status(500).json({ error: "SMS 발송 실패" });
    }
  });

  // 📱 상품별 SMS 발송 이력 조회 (Get SMS logs by product)
  app.get("/api/pg/products/:id/sms-logs", requireFranchiseAuth, async (req, res) => {
    try {
      const product = await storage.getPgProduct(parseInt(req.params.id));
      if (!product) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
      if (product.franchiseId !== req.franchiseId) return res.status(403).json({ error: "접근 권한 없음" });

      const logs = await storage.getSmsLogsByProduct(parseInt(req.params.id));
      res.json(logs);
    } catch (error) {
      console.error("SMS logs error:", error);
      res.json([]);
    }
  });

  // ============================================
  // SUPERADMIN 전용 API
  // ============================================

  // 대기중 프랜차이즈 목록
  app.get("/api/superadmin/franchises/pending", requireSuperAdmin, catchAsync(async (req: Request, res: Response) => {
    const pending = await storage.getFranchisesByStatus('pending');
    res.json(pending.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      businessName: f.businessName,
      ownerName: f.ownerName,
      ownerPhone: f.ownerPhone,
      status: f.status,
      createdAt: f.createdAt,
    })));
  }));

  // 프랜차이즈 승인 (코드 자동 생성: GL-XXXXXX)
  app.post("/api/superadmin/franchises/:id/approve", requireSuperAdmin, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = parseInt(req.params.id);
    const franchise = await storage.getFranchise(franchiseId);
    if (!franchise) return res.status(404).json({ error: "프랜차이즈를 찾을 수 없습니다" });
    if (franchise.status !== 'pending') return res.status(400).json({ error: "대기 중인 프랜차이즈만 승인할 수 있습니다" });

    const code = `GL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const updated = await storage.updateFranchiseStatus(franchiseId, 'approved', code);
    res.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      code: updated.code,
    });
  }));

  // 프랜차이즈 거절
  app.post("/api/superadmin/franchises/:id/reject", requireSuperAdmin, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = parseInt(req.params.id);
    const franchise = await storage.getFranchise(franchiseId);
    if (!franchise) return res.status(404).json({ error: "프랜차이즈를 찾을 수 없습니다" });
    if (franchise.status !== 'pending') return res.status(400).json({ error: "대기 중인 프랜차이즈만 거절할 수 있습니다" });

    const updated = await storage.updateFranchiseStatus(franchiseId, 'rejected');
    res.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
    });
  }));

  // 전체 franchise 목록 조회
  app.get("/api/superadmin/franchises", requireSuperAdmin, catchAsync(async (req: Request, res: Response) => {
    const allFranchises = await storage.getFranchises();
    const result = allFranchises.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      description: f.description,
      status: f.status,
      code: f.code,
      parentId: f.parentId,
      ownerName: f.ownerName,
      ownerPhone: f.ownerPhone,
      businessName: f.businessName,
      pgProvider: f.pgProvider,
      pgServiceId: f.pgServiceId,
      pgMode: f.pgMode,
      hasPgConfig: !!f.pgServiceId,
      hasApiKey: !!f.pgApiKey,
      hasApiIv: !!f.pgApiIv,
      createdAt: f.createdAt,
    }));
    res.json(result);
  }));

  // 특정 franchise PG 설정 조회
  app.get("/api/superadmin/franchises/:franchiseId/pg-config", requireSuperAdmin, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = parseInt(req.params.franchiseId);
    const franchise = await storage.getFranchise(franchiseId);
    if (!franchise) return res.status(404).json({ error: "가맹점을 찾을 수 없습니다" });
    res.json({
      id: franchise.id,
      name: franchise.name,
      pgProvider: franchise.pgProvider,
      pgServiceId: franchise.pgServiceId,
      pgMode: franchise.pgMode,
      hasApiKey: !!franchise.pgApiKey,
      hasApiIv: !!franchise.pgApiIv,
    });
  }));

  // 특정 franchise PG 설정 업데이트
  app.put("/api/superadmin/franchises/:franchiseId/pg-config", requireSuperAdmin, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = parseInt(req.params.franchiseId);
    const franchise = await storage.getFranchise(franchiseId);
    if (!franchise) return res.status(404).json({ error: "가맹점을 찾을 수 없습니다" });

    const { pgProvider, pgServiceId, pgMode, pgApiKey, pgApiIv } = req.body;
    const updated = await storage.updateFranchisePgConfig(franchiseId, {
      pgProvider, pgServiceId, pgMode, pgApiKey, pgApiIv,
    });
    res.json({
      id: updated.id,
      name: updated.name,
      pgProvider: updated.pgProvider,
      pgServiceId: updated.pgServiceId,
      pgMode: updated.pgMode,
      hasApiKey: !!updated.pgApiKey,
      hasApiIv: !!updated.pgApiIv,
    });
  }));

  // 🔗 결제 링크 페이지 API — 인증 불필요 (Pay page API — no auth required)
  app.get("/api/pg/pay/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const tx = await storage.getPgTransactionByOrderId(orderId);
      if (!tx) return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
      if (tx.status !== "pending") return res.json({ ...tx, expired: true });

      const franchise = await storage.getFranchise(tx.franchiseId);
      if (!franchise?.pgServiceId) return res.status(400).json({ error: "PG 설정 없음" });

      const config: BillgatePgConfig = {
        serviceId: franchise.pgServiceId,
        mode: (franchise.pgMode as "test" | "production") || "test",
      };

      const callbackBaseUrl = process.env.BILLGATE_CALLBACK_URL || `${req.protocol}://${req.get("host")}`;
      const returnUrl = `${callbackBaseUrl}/api/pg/callback`;
      const hashKey = generateHashKey(config.serviceId, tx.orderId, tx.amount.toString(), tx.orderDate);

      res.json({
        orderId: tx.orderId,
        orderDate: tx.orderDate,
        amount: tx.amount,
        itemName: tx.itemName,
        itemCode: tx.itemCode || "FITCRM_LINK",
        status: tx.status,
        serviceId: config.serviceId,
        serviceCode: tx.serviceCode || "0900",
        hashKey,
        returnUrl,
        protocolType: config.mode === "test" ? "https_tpay" : "https_pay",
        storeName: franchise.name,
      });
    } catch (error) {
      console.error("Pay page API error:", error);
      res.status(500).json({ error: "결제 정보 조회 실패" });
    }
  });

  // 📱 키오스크 SMS 발송 — 동적 링크 (Kiosk SMS send with dynamic link URL)
  app.post("/api/pg/sms/send", requireFranchiseAuth, async (req, res) => {
    try {
      const { linkUrl, recipientPhone, recipientName, amount, itemName } = req.body;
      if (!linkUrl || !recipientPhone) {
        return res.status(400).json({ error: "링크 URL과 전화번호는 필수입니다" });
      }

      const franchise = await storage.getFranchise(req.franchiseId!);
      const storeName = franchise?.name || "OUHVE ABM";

      const message = buildLinkPaymentSmsMessage({
        storeName,
        productName: itemName || "결제",
        amount: parseInt(amount) || 0,
        linkUrl,
      });

      const smsResult = await smsProvider.sendSms(recipientPhone, message);

      const smsLog = await storage.createSmsLog({
        franchiseId: req.franchiseId!,
        pgProductId: null as any,
        sentByUserId: req.user!.id,
        sentByUsername: req.user!.username,
        recipientPhone,
        recipientName: recipientName || null,
        linkUrl,
        status: smsResult.success ? "sent" : "failed",
        errorMessage: smsResult.errorMessage || null,
      });

      res.json({ success: smsResult.success, smsLog });
    } catch (error) {
      console.error("Kiosk SMS send error:", error);
      res.status(500).json({ error: "SMS 발송 실패" });
    }
  });

  // 🖥️ 결제 단말기 관리 API (Payment Terminal management API)
  app.get("/api/terminals", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = (req.user as any).franchiseId;
    const terminals = await storage.getTerminals(franchiseId);
    res.json(terminals);
  }));

  app.post("/api/terminals", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const franchiseId = (req.user as any).franchiseId;
    const terminal = await storage.createTerminal({ ...req.body, franchiseId });
    res.status(201).json(terminal);
  }));

  app.put("/api/terminals/:id", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const existing = await storage.getTerminal(id);
    if (!existing) return res.status(404).json({ message: "단말기를 찾을 수 없습니다" });
    const franchiseId = (req.user as any).franchiseId;
    if (existing.franchiseId !== franchiseId) return res.status(403).json({ message: "권한이 없습니다" });
    const terminal = await storage.updateTerminal(id, req.body);
    res.json(terminal);
  }));

  app.delete("/api/terminals/:id", requireFranchiseAuth, catchAsync(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const existing = await storage.getTerminal(id);
    if (!existing) return res.status(404).json({ message: "단말기를 찾을 수 없습니다" });
    const franchiseId = (req.user as any).franchiseId;
    if (existing.franchiseId !== franchiseId) return res.status(403).json({ message: "권한이 없습니다" });
    await storage.deleteTerminal(id);
    res.json({ message: "단말기가 삭제되었습니다" });
  }));

  const httpServer = createServer(app);

  // 🚫 404 에러 핸들러는 Vite 설정 후에 추가 (Add 404 error handler after Vite setup)
  // 🚨 전역 에러 핸들러는 Vite 설정 후에 추가 (Add global error handler after Vite setup)

  return httpServer;
}
