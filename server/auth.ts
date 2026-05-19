// 🔐 인증 시스템 설정 (Authentication System Configuration)
// 🎯 Purpose: Passport.js 기반 로컬 인증 전략 및 세션 관리 구현 (Passport.js-based local authentication strategy and session management implementation)
// 🛡️ Security: Scrypt 해싱, 세션 보안, 타이밍 공격 방지 (Scrypt hashing, session security, timing attack prevention)

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// 🏷️ Express 사용자 타입 확장 (Extend Express User type)
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// 🔧 비동기 Scrypt 함수 변환 (Convert Scrypt to async function)
const scryptAsync = promisify(scrypt);

// 🔒 비밀번호 해싱 함수 (Password hashing function)
// 🛡️ Security: 솔트와 함께 Scrypt 알고리즘 사용 (Using Scrypt algorithm with salt)
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex"); // 🧂 랜덤 솔트 생성 (Generate random salt)
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// 🔍 비밀번호 비교 함수 (Password comparison function)
// 🛡️ Security: 타이밍 공격 방지를 위한 timingSafeEqual 사용 (Using timingSafeEqual to prevent timing attacks)
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
      return timingSafeEqual(hashedBuf, suppliedBuf); // ⏱️ 타이밍 공격 방지 (Prevent timing attacks)
    } else {
      // Handle legacy plain text passwords (for backward compatibility)
      return supplied === stored;
    }
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    },
    name: 'ouhve.session', // 커스텀 세션 이름으로 보안 강화
    rolling: true, // 세션 활동 시 자동 갱신
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      }
      // superadmin은 franchise 상태 체크 불필요
      if (user.role !== 'superadmin' && user.franchiseId) {
        const franchise = await storage.getFranchise(user.franchiseId);
        if (franchise && franchise.status === 'pending') {
          return done(null, false, { message: '프랜차이즈 승인 대기 중입니다. 관리자에게 문의하세요.' });
        }
        if (franchise && franchise.status === 'rejected') {
          return done(null, false, { message: '프랜차이즈 가입이 거절되었습니다.' });
        }
      }
      return done(null, user);
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`User with ID ${id} not found during deserialization`);
        return done(null, false);
      }
      // 세션 보안 강화: 사용자 상태 확인 (superadmin은 franchiseId 없어도 허용)
      if (!user.franchiseId && user.role !== 'superadmin') {
        console.warn(`User ${id} has no franchise ID, session invalid`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(null, false);
    }
  });

  // 🛡️ 보안: 레거시 /api/register 제거됨 - /api/auth/register 사용 권장
  // (Security: Legacy /api/register removed - use /api/auth/register instead)
  // 이 라우트는 입력 검증과 프랜차이즈 생성이 포함된 /api/auth/register로 대체됨
  app.post("/api/register", async (req, res) => {
    return res.status(410).json({ 
      error: "이 엔드포인트는 더 이상 사용되지 않습니다. /api/auth/register를 사용하세요.",
      redirect: "/api/auth/register"
    });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message?: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        const message = info?.message || "아이디 또는 비밀번호가 올바르지 않습니다.";
        return res.status(401).json({ error: message });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.status(200).json(req.user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
