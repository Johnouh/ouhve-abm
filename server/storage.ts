// 🗄️ 데이터베이스 저장소 구현 (Database Storage Implementation)
// 🎯 Purpose: Drizzle ORM을 사용한 PostgreSQL 데이터 접근 계층 (PostgreSQL data access layer using Drizzle ORM)
// 🔒 Security: 프랜차이즈별 데이터 격리 및 세션 관리 (Franchise-based data isolation and session management)

import { users, franchises, members, memberships, staff, products, lockers, lockerRecoveries, lockerSettings, attendance, schedules, personalTraining, ptSessions, otApplications, trainerRecords, memberMeasurements, consultations, posts, groupLessons, groupLessonEnrollments, contracts, refunds, otherSales, suspensions, memberModifications, groupExtensions, memberEquipment, memberLockers, payments, kioskNotices, type User, type InsertUser, type Franchise, type InsertFranchise, type Member, type InsertMember, type Membership, type InsertMembership, type Staff, type InsertStaff, type Product, type InsertProduct, type Locker, type InsertLocker, type LockerRecovery, type InsertLockerRecovery, type LockerSettings, type InsertLockerSettings, type Attendance, type InsertAttendance, type Schedule, type InsertSchedule, type PersonalTraining, type InsertPersonalTraining, type PtSession, type InsertPtSession, type OtApplication, type InsertOtApplication, type TrainerRecord, type InsertTrainerRecord, type MemberMeasurement, type InsertMemberMeasurement, type Consultation, type InsertConsultation, type Post, type InsertPost, type GroupLesson, type InsertGroupLesson, type GroupLessonEnrollment, type InsertGroupLessonEnrollment, type Contract, type InsertContract, type Refund, type InsertRefund, type OtherSale, type InsertOtherSale, type Suspension, type InsertSuspension, type MemberModification, type InsertMemberModification, type GroupExtension, type InsertGroupExtension, type Payment, type InsertPayment, type KioskNotice, type InsertKioskNotice, otPrograms, type OtProgram, type InsertOtProgram, centerPrograms, type CenterProgram, type InsertCenterProgram, pgTransactions, pgProducts, linkPaymentSmsLogs, paymentTerminals, type PgTransaction, type InsertPgTransaction, type PgProduct, type InsertPgProduct, type LinkPaymentSmsLog, type InsertLinkPaymentSmsLog, type PaymentTerminal, type InsertPaymentTerminal } from "@shared/schema";
import { db } from "./db";
import { eq, gte, lt, desc, sql, and, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// 🗄️ PostgreSQL 세션 저장소 설정 (PostgreSQL session store configuration)
const PostgresSessionStore = connectPg(session);

// 🏗️ 저장소 인터페이스 정의 (Storage Interface Definition)
// 🎯 Purpose: 모든 데이터 액세스 메서드의 계약 정의 (Contract definition for all data access methods)
// 🔒 Security: 프랜차이즈 ID 기반 데이터 필터링 지원 (Support for franchise ID-based data filtering)
export interface IStorage {
  // 👤 사용자 관리 메서드 (User management methods)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // 🏢 프랜차이즈 관리 메서드 (Franchise management methods)
  getFranchises(): Promise<Franchise[]>;
  getFranchise(id: number): Promise<Franchise | undefined>;
  createFranchise(franchise: InsertFranchise): Promise<Franchise>;
  getFranchiseByCode(code: string): Promise<Franchise | undefined>;
  getFranchisesByStatus(status: string): Promise<Franchise[]>;
  updateFranchiseStatus(id: number, status: string, code?: string): Promise<Franchise>;
  
  // 👥 회원 관리 메서드 (Member management methods)
  getMembers(franchiseId?: number): Promise<Member[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;
  
  // 💳 멤버십 관리 메서드 (Membership management methods)
  getMemberships(memberId?: number): Promise<Membership[]>;
  getMembership(id: number): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership>;
  deleteMembership(id: number): Promise<void>;
  
  // 🧑‍💼 직원 관리 메서드 (Staff management methods)
  getStaff(franchiseId?: number): Promise<Staff[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getStaffMember(id: number): Promise<Staff | undefined>;
  createStaff(staffMember: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staffMember: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: number): Promise<void>;
  
  // 🛍️ 상품 관리 메서드 (Product management methods)
  getProducts(franchiseId?: number): Promise<Product[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // 🔐 사물함 관리 메서드 (Locker management methods)
  getLockers(franchiseId?: number): Promise<Locker[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getLocker(id: number): Promise<Locker | undefined>;
  createLocker(locker: InsertLocker): Promise<Locker>;
  updateLocker(id: number, locker: Partial<InsertLocker>): Promise<Locker>;
  deleteLocker(id: number): Promise<void>;
  
  // 🔄 락커 회수 기록 메서드 (Locker recovery methods)
  getLockerRecoveries(franchiseId?: number): Promise<any[]>;
  createLockerRecovery(recovery: any): Promise<any>;
  recoverLocker(lockerId: number, franchiseId: number, recoveredBy: string): Promise<any>;
  
  // 📅 출석 관리 메서드 (Attendance management methods)
  getAttendance(franchiseId?: number, date?: string): Promise<Attendance[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getAttendanceById(id: number): Promise<Attendance | undefined>; // 단건 조회 (소유권 검증용)
  getAttendanceByMember(memberId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance>;
  deleteAttendance(id: number): Promise<void>;
  
  // 📋 일정 관리 메서드 (Schedule management methods)
  getSchedules(franchiseId?: number): Promise<Schedule[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;
  
  // 💪 개인 트레이닝 관리 메서드 (Personal training management methods)
  getPersonalTraining(franchiseId?: number, memberId?: number): Promise<any[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getPersonalTrainingById(id: number): Promise<PersonalTraining | undefined>;
  createPersonalTraining(pt: InsertPersonalTraining): Promise<PersonalTraining>;
  updatePersonalTraining(id: number, pt: Partial<InsertPersonalTraining>): Promise<PersonalTraining>;
  deletePersonalTraining(id: number): Promise<void>;
  getPtSessions(franchiseId?: number, ptId?: number): Promise<PtSession[]>;
  getPtSession(id: number): Promise<PtSession | undefined>;
  createPtSession(session: InsertPtSession): Promise<PtSession>;
  updatePtSession(id: number, session: Partial<InsertPtSession>): Promise<PtSession>;
  deletePtSession(id: number): Promise<void>;
  getOtApplications(franchiseId?: number): Promise<OtApplication[]>;
  createOtApplication(application: InsertOtApplication): Promise<OtApplication>;
  updateOtApplication(id: number, data: Partial<InsertOtApplication>): Promise<OtApplication>;
  
  // 📝 트레이너 기록 관리 메서드 (Trainer records management methods)
  getTrainerRecords(franchiseId?: number, memberId?: number, trainerId?: number): Promise<TrainerRecord[]>;
  createTrainerRecord(record: InsertTrainerRecord): Promise<TrainerRecord>;
  
  // 📏 회원 측정 관리 메서드 (Member measurements management methods)
  getMemberMeasurements(franchiseId?: number, memberId?: number): Promise<MemberMeasurement[]>;
  createMemberMeasurement(measurement: InsertMemberMeasurement): Promise<MemberMeasurement>;
  
  // 💬 상담 관리 메서드 (Consultation management methods)
  getConsultations(franchiseId?: number): Promise<Consultation[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getConsultation(id: number): Promise<Consultation | undefined>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation>;
  deleteConsultation(id: number): Promise<void>;
  
  // 📚 그룹 수업 관리 메서드 (Group lessons management methods)
  getGroupLessons(franchiseId?: number): Promise<GroupLesson[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getGroupLesson(id: number): Promise<GroupLesson | undefined>;
  createGroupLesson(groupLesson: InsertGroupLesson): Promise<GroupLesson>;
  updateGroupLesson(id: number, groupLesson: Partial<InsertGroupLesson>): Promise<GroupLesson>;
  deleteGroupLesson(id: number): Promise<void>;
  incrementGroupLessonParticipants(id: number, delta: number): Promise<GroupLesson>; // 🆕 참가자 수 증감
  
  // 📚 그룹 수업 등록 관리 메서드 (Group lesson enrollments management methods)
  getGroupLessonEnrollments(franchiseId?: number, memberId?: number): Promise<GroupLessonEnrollment[]>;
  getGroupLessonEnrollment(id: number): Promise<GroupLessonEnrollment | undefined>;
  createGroupLessonEnrollment(enrollment: InsertGroupLessonEnrollment): Promise<GroupLessonEnrollment>;
  deleteGroupLessonEnrollment(id: number): Promise<void>;
  
  // 📝 게시글 관리 메서드 (Post management methods)
  getPosts(franchiseId?: number): Promise<Post[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  
  // 📄 계약서 관리 메서드 (Contract management methods)
  getContracts(franchiseId?: number): Promise<Contract[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: number): Promise<void>;
  
  // 💰 환불 관리 메서드 (Refund management methods)
  getRefunds(franchiseId?: number): Promise<Refund[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getRefund(id: number): Promise<Refund | undefined>;
  createRefund(refund: InsertRefund): Promise<Refund>;
  updateRefund(id: number, refund: Partial<InsertRefund>): Promise<Refund>;
  deleteRefund(id: number): Promise<void>;
  
  // 💵 기타 매출 관리 메서드 (Other sales management methods)
  getOtherSales(franchiseId?: number): Promise<OtherSale[]>;
  getOtherSale(id: number): Promise<OtherSale | undefined>;
  createOtherSale(sale: InsertOtherSale): Promise<OtherSale>;
  updateOtherSale(id: number, sale: Partial<InsertOtherSale>): Promise<OtherSale>;
  deleteOtherSale(id: number): Promise<void>;
  
  // 🛑 정지 관리 메서드 (Suspension management methods)
  getSuspensions(franchiseId?: number): Promise<Suspension[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getSuspension(id: number): Promise<Suspension | undefined>;
  createSuspension(suspension: InsertSuspension): Promise<Suspension>;
  updateSuspension(id: number, suspension: Partial<InsertSuspension>): Promise<Suspension>;
  releaseSuspension(id: number, franchiseId: number): Promise<Suspension | undefined>; // 정지 해제 (Release suspension)
  deleteSuspension(id: number): Promise<void>;
  
  // 📝 수정 기록 관리 메서드 (Member modification management methods)
  getMemberModifications(franchiseId?: number, memberId?: number): Promise<MemberModification[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getMemberModification(id: number): Promise<MemberModification | undefined>;
  createMemberModification(modification: InsertMemberModification): Promise<MemberModification>;
  deleteMemberModification(id: number, franchiseId: number): Promise<boolean>; // 🗑️ 수정 기록 삭제 (Delete modification record)
  
  // 👥 단체 연장 관리 메서드 (Group extension management methods)
  getGroupExtensions(franchiseId?: number): Promise<GroupExtension[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getGroupExtension(id: number): Promise<GroupExtension | undefined>;
  createGroupExtension(extension: InsertGroupExtension): Promise<GroupExtension>;
  updateGroupExtension(id: number, extension: Partial<InsertGroupExtension>): Promise<GroupExtension>;
  deleteGroupExtension(id: number): Promise<void>;
  
  // 🏋️ 회원 운동 용품 관리 메서드 (Member equipment management methods)
  getMemberEquipment(franchiseId?: number, memberId?: number): Promise<any[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getMemberEquipmentById(id: number): Promise<any | undefined>;
  createMemberEquipment(equipment: any): Promise<any>;
  updateMemberEquipment(id: number, equipment: Partial<any>): Promise<any>;
  deleteMemberEquipment(id: number): Promise<void>;
  
  // 🔐 회원 락커 관리 메서드 (Member locker management methods)
  getMemberLockers(franchiseId?: number, memberId?: number): Promise<any[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  getMemberLockerById(id: number): Promise<any | undefined>;
  createMemberLocker(locker: any): Promise<any>;
  updateMemberLocker(id: number, locker: Partial<any>): Promise<any>;
  deleteMemberLocker(id: number): Promise<void>;
  
  // 💳 결제 정보 관리 메서드 (Payment management methods)
  getPayments(franchiseId?: number, memberId?: number): Promise<Payment[]>; // 🔒 프랜차이즈별 필터링 (Franchise-based filtering)
  createPayment(payment: InsertPayment): Promise<Payment>;
  nullifyPaymentsByProductId(productId: number): Promise<void>; // 🔗 상품 삭제 전 참조 해제 (Nullify product reference before deletion)
  
  // 🔐 락커 설정 관리 메서드 (Locker settings management methods)
  getLockerSettings(franchiseId: number): Promise<any>;
  saveLockerSettings(settings: any): Promise<any>;
  
  // 📢 키오스크 공지 관리 메서드 (Kiosk notice management methods)
  getKioskNotices(franchiseId?: number): Promise<any[]>;
  getKioskNotice(id: number): Promise<any | undefined>;
  createKioskNotice(notice: any): Promise<any>;
  updateKioskNotice(id: number, notice: any): Promise<any>;
  deleteKioskNotice(id: number): Promise<void>;
  
  // 🏋️ OT 프로그램 관리 메서드 (OT Program management methods)
  getOtPrograms(franchiseId?: number): Promise<OtProgram[]>;
  getOtProgram(id: number): Promise<OtProgram | undefined>;
  createOtProgram(program: InsertOtProgram): Promise<OtProgram>;
  updateOtProgram(id: number, program: Partial<InsertOtProgram>): Promise<OtProgram>;
  deleteOtProgram(id: number): Promise<void>;
  
  // 📋 센터 프로그램 관리 메서드 (Center Program management methods)
  getCenterPrograms(franchiseId?: number): Promise<CenterProgram[]>;
  createCenterProgram(program: InsertCenterProgram): Promise<CenterProgram>;
  deleteCenterProgram(id: number): Promise<void>;
  deleteCenterProgramsByType(franchiseId: number, programType: string): Promise<void>;

  // 💳 PG 거래 관리 메서드 (PG Transaction management methods)
  getPgTransactions(franchiseId: number, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<PgTransaction[]>;
  getPgTransaction(id: number): Promise<PgTransaction | undefined>;
  getPgTransactionByOrderId(orderId: string): Promise<PgTransaction | undefined>;
  createPgTransaction(data: InsertPgTransaction): Promise<PgTransaction>;
  updatePgTransaction(id: number, data: Partial<InsertPgTransaction>): Promise<PgTransaction>;

  // 🛒 PG 상품 관리 메서드 (PG Product management methods)
  getPgProducts(franchiseId: number): Promise<PgProduct[]>;
  getPgProduct(id: number): Promise<PgProduct | undefined>;
  createPgProduct(data: InsertPgProduct): Promise<PgProduct>;
  updatePgProduct(id: number, data: Partial<InsertPgProduct>): Promise<PgProduct>;
  deletePgProduct(id: number): Promise<void>;

  // 📱 링크결제 SMS 로그 (Link Payment SMS Logs)
  createSmsLog(data: InsertLinkPaymentSmsLog): Promise<LinkPaymentSmsLog>;
  getSmsLogsByProduct(pgProductId: number): Promise<LinkPaymentSmsLog[]>;
  getSmsLogsByFranchise(franchiseId: number): Promise<LinkPaymentSmsLog[]>;

  // 🏢 프랜차이즈 PG 설정 (Franchise PG config)
  updateFranchisePgConfig(id: number, config: { pgProvider?: string; pgServiceId?: string; pgMode?: string; pgApiKey?: string; pgApiIv?: string }): Promise<Franchise>;
  // OUHVE ABM — Module 1: Business Profile
  updateBusinessProfile(id: number, profile: Partial<InsertFranchise>): Promise<Franchise>;

  // 🖥️ 결제 단말기 관리 (Payment Terminal management)
  getTerminals(franchiseId: number): Promise<PaymentTerminal[]>;
  getTerminal(id: number): Promise<PaymentTerminal | undefined>;
  createTerminal(data: InsertPaymentTerminal): Promise<PaymentTerminal>;
  updateTerminal(id: number, data: Partial<InsertPaymentTerminal>): Promise<PaymentTerminal>;
  deleteTerminal(id: number): Promise<void>;

  sessionStore: any;
}

// 🗄️ 데이터베이스 저장소 구현 클래스 (Database Storage Implementation Class)
// 🎯 Purpose: PostgreSQL과 Drizzle ORM을 사용한 실제 데이터 저장소 구현 (Actual data storage implementation using PostgreSQL and Drizzle ORM)
export class DatabaseStorage implements IStorage {
  sessionStore: any; // 세션 저장소 (Session store)

  constructor() {
    // 🔐 PostgreSQL 세션 저장소 초기화 (Initialize PostgreSQL session store)
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true // 📋 테이블 자동 생성 (Automatic table creation)
    });
  }

  // 👤 사용자 ID로 조회 (Get user by ID)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // 👤 사용자명으로 조회 (Get user by username)
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  // 👤 이름으로 조회 (Get user by name)
  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  // 👤 새 사용자 생성 (Create new user)
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getFranchises(): Promise<Franchise[]> {
    return await db.select().from(franchises);
  }

  async getFranchise(id: number): Promise<Franchise | undefined> {
    const [franchise] = await db.select().from(franchises).where(eq(franchises.id, id));
    return franchise || undefined;
  }

  async createFranchise(insertFranchise: InsertFranchise): Promise<Franchise> {
    const [franchise] = await db
      .insert(franchises)
      .values(insertFranchise)
      .returning();
    return franchise;
  }

  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access to all data without franchiseId)
  async getMembers(franchiseId?: number): Promise<Member[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getMembers called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(members).where(eq(members.franchiseId, franchiseId));
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db
      .insert(members)
      .values(insertMember)
      .returning();
    return member;
  }

  async updateMember(id: number, updateMember: Partial<InsertMember>): Promise<Member> {
    // 기존 회원 정보 조회
    const [oldMember] = await db.select().from(members).where(eq(members.id, id));
    
    // 회원 정보 업데이트
    const [member] = await db
      .update(members)
      .set(updateMember)
      .where(eq(members.id, id))
      .returning();
    
    // 수정된 필드에 대한 기록 추가
    if (oldMember) {
      const changes = Object.entries(updateMember).filter(([key, value]) => 
        oldMember[key as keyof Member] !== value
      );
      
      for (const [fieldName, newValue] of changes) {
        await db.insert(memberModifications).values({
          memberId: id,
          modifiedBy: 'system',
          modificationDate: new Date(),
          fieldName,
          oldValue: String(oldMember[fieldName as keyof Member] || ''),
          newValue: String(newValue || ''),
          reason: '회원 정보 수정',
          notes: `${fieldName} 필드 수정`,
          franchiseId: member.franchiseId
        });
      }
    }
    
    return member;
  }

  // 📝 회원 수정 기록 추가 (Add member modification record)
  async addMemberModification(memberId: number, modificationData: {
    modifiedBy: string;
    modificationDate: Date;
    fieldName: string;
    oldValue: string;
    newValue: string;
    notes?: string;
    franchiseId: number;
  }): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO member_modifications 
        (member_id, modified_by, modification_date, field_name, old_value, new_value, notes, franchise_id)
        VALUES (${memberId}, ${modificationData.modifiedBy}, ${modificationData.modificationDate}, 
                ${modificationData.fieldName}, ${modificationData.oldValue}, ${modificationData.newValue}, 
                ${modificationData.notes || ''}, ${modificationData.franchiseId})
      `);
    } catch (error) {
      console.error('Error adding member modification:', error);
      // 에러 시 조용히 실패 (Silently fail on error)
    }
  }

  async deleteMember(id: number): Promise<void> {
    // 회원 삭제 시 관련된 모든 데이터를 순차적으로 삭제 (실제 존재하는 테이블만)
    
    try {
      // 1. 회원 정보 조회 (삭제 기록용)
      const [member] = await db.select().from(members).where(eq(members.id, id));
      
      // 2. 회원 삭제 기록 추가 (별도 테이블에 기록)
      if (member) {
        await db.execute(sql`
          INSERT INTO member_deletion_log (member_id, member_name, deleted_by, deletion_date, reason, notes, franchise_id)
          VALUES (${id}, ${member.name}, 'system', NOW(), '회원 삭제', '회원 완전 삭제', ${member.franchiseId})
        `);
      }
      
      // 3. 회원 수정 기록 삭제 (외래 키 제약 조건 때문에 먼저 삭제)
      await db.execute(sql`DELETE FROM member_modifications WHERE member_id = ${id}`);
      
      // 4. 락커 데이터에서 회원 참조 해제 및 상태 완전 초기화 (SQL 직접 실행)
      await db.execute(sql`UPDATE lockers SET member_id = NULL, status = '빈 락커', notes = NULL, start_date = NULL, end_date = NULL, monthly_fee = NULL WHERE member_id = ${id}`);
      
      // 5. 출석 기록 삭제
      await db.execute(sql`DELETE FROM attendance WHERE member_id = ${id}`);
      
      // 6. 개인 PT 기록 삭제
      await db.execute(sql`DELETE FROM personal_training WHERE member_id = ${id}`);
      
      // 7. 상담 기록 삭제
      await db.execute(sql`DELETE FROM consultations WHERE member_id = ${id}`);
      
      // 8. 마지막으로 회원 삭제
      await db.execute(sql`DELETE FROM members WHERE id = ${id}`);
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  // 🔒 보안 강화: memberId 없이 전체 데이터 접근 차단 (Security: Block access without memberId)
  async getMemberships(memberId?: number): Promise<Membership[]> {
    try {
      if (memberId) {
        return await db.select().from(memberships).where(eq(memberships.memberId, memberId));
      }
      console.warn("⚠️ Security: getMemberships called without memberId - returning empty array");
      return [];
    } catch (error) {
      console.error('Error getting memberships:', error);
      return [];
    }
  }

  async createMembership(insertMembership: InsertMembership): Promise<Membership> {
    const [membership] = await db
      .insert(memberships)
      .values(insertMembership)
      .returning();
    return membership;
  }

  async getMembership(id: number): Promise<Membership | undefined> {
    const [membership] = await db.select().from(memberships).where(eq(memberships.id, id));
    return membership || undefined;
  }

  async updateMembership(id: number, updateData: Partial<InsertMembership>): Promise<Membership> {
    const [membership] = await db
      .update(memberships)
      .set(updateData)
      .where(eq(memberships.id, id))
      .returning();
    return membership;
  }

  async deleteMembership(id: number): Promise<void> {
    await db.delete(memberships).where(eq(memberships.id, id));
  }

  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getStaff(franchiseId?: number): Promise<Staff[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getStaff called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(staff).where(eq(staff.franchiseId, franchiseId));
  }

  async getStaffMember(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember || undefined;
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [staffMember] = await db
      .insert(staff)
      .values(insertStaff)
      .returning();
    return staffMember;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  async updateStaff(id: number, updateData: Partial<InsertStaff>): Promise<Staff> {
    const [staffMember] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, id))
      .returning();
    return staffMember;
  }

  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getProducts(franchiseId?: number): Promise<Product[]> {
    try {
      if (!franchiseId) {
        console.warn("⚠️ Security: getProducts called without franchiseId - returning empty array");
        return [];
      }
      return await db.select().from(products).where(eq(products.franchiseId, franchiseId));
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    // 🔄 Cascading cleanup: 상품 삭제 전 참조하는 데이터 정리 (Clean up references before deleting product)
    
    // 0. 상품 정보 조회
    const product = await this.getProduct(id);
    const productName = product?.name;
    
    // 1. members 테이블의 productId를 null로 설정
    await db.update(members).set({ productId: null }).where(eq(members.productId, id));
    
    // 2. 🆕 personalTraining 테이블의 해당 상품 기록 삭제 (Delete PT records with this product)
    await db.delete(personalTraining).where(eq(personalTraining.productId, id));
    
    // 3. otApplications 테이블의 productId를 null로 설정
    await db.update(otApplications).set({ productId: null }).where(eq(otApplications.productId, id));
    
    // 4. payments 먼저 삭제 (memberships를 참조하므로 먼저 삭제해야 함)
    if (productName) {
      // 4a. 해당 상품명으로 등록된 memberships의 ID 조회
      const membershipIds = await db.select({ id: memberships.id }).from(memberships).where(eq(memberships.type, productName));
      // 4b. 해당 memberships를 참조하는 payments 삭제
      for (const m of membershipIds) {
        await db.delete(payments).where(eq(payments.membershipId, m.id));
      }
      // 4c. 상품명 기반 결제 기록도 삭제
      await db.delete(payments).where(eq(payments.description, productName));
    }
    
    // 5. memberships 테이블의 해당 상품명(type) 회원권 삭제
    if (productName) {
      await db.delete(memberships).where(eq(memberships.type, productName));
    }
    
    // 6. 🆕 memberEquipment 테이블의 해당 상품명 운동 용품 삭제 (Delete equipment records with this product name)
    if (productName) {
      await db.delete(memberEquipment).where(eq(memberEquipment.equipmentName, productName));
    }
    
    // 7. 상품 삭제
    await db.delete(products).where(eq(products.id, id));
  }

  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getLockers(franchiseId?: number): Promise<Locker[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getLockers called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(lockers).where(eq(lockers.franchiseId, franchiseId));
  }

  async getLocker(id: number): Promise<Locker | undefined> {
    const [locker] = await db.select().from(lockers).where(eq(lockers.id, id));
    return locker || undefined;
  }

  async createLocker(insertLocker: InsertLocker): Promise<Locker> {
    const lockerData: any = {
      number: insertLocker.number,
      section: insertLocker.section,
      type: insertLocker.type,
      status: insertLocker.status,
      memberId: insertLocker.memberId,
      startDate: insertLocker.startDate ? new Date(insertLocker.startDate) : null,
      endDate: insertLocker.endDate ? new Date(insertLocker.endDate) : null,
      monthlyFee: insertLocker.monthlyFee,
      notes: insertLocker.notes,
      franchiseId: insertLocker.franchiseId,
    };
    const [locker] = await db
      .insert(lockers)
      .values(lockerData)
      .returning();
    return locker;
  }

  async updateLocker(id: number, updateData: Partial<InsertLocker>): Promise<Locker> {
    const lockerUpdateData: any = {
      updatedAt: new Date(),
    };
    
    if (updateData.number !== undefined) lockerUpdateData.number = updateData.number;
    if (updateData.section !== undefined) lockerUpdateData.section = updateData.section;
    if (updateData.type !== undefined) lockerUpdateData.type = updateData.type;
    if (updateData.status !== undefined) lockerUpdateData.status = updateData.status;
    if (updateData.memberId !== undefined) lockerUpdateData.memberId = updateData.memberId;
    if (updateData.startDate !== undefined) lockerUpdateData.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
    if (updateData.endDate !== undefined) lockerUpdateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.monthlyFee !== undefined) lockerUpdateData.monthlyFee = updateData.monthlyFee;
    if (updateData.notes !== undefined) lockerUpdateData.notes = updateData.notes;
    if (updateData.franchiseId !== undefined) lockerUpdateData.franchiseId = updateData.franchiseId;
    
    const [locker] = await db
      .update(lockers)
      .set(lockerUpdateData)
      .where(eq(lockers.id, id))
      .returning();
    return locker;
  }

  async deleteLocker(id: number): Promise<void> {
    await db.delete(lockers).where(eq(lockers.id, id));
  }

  async getLockerRecoveries(franchiseId?: number): Promise<LockerRecovery[]> {
    if (franchiseId) {
      return await db.select().from(lockerRecoveries).where(eq(lockerRecoveries.franchiseId, franchiseId)).orderBy(desc(lockerRecoveries.recoveryDate));
    }
    return await db.select().from(lockerRecoveries).orderBy(desc(lockerRecoveries.recoveryDate));
  }

  async createLockerRecovery(recovery: InsertLockerRecovery): Promise<LockerRecovery> {
    const [created] = await db.insert(lockerRecoveries).values(recovery).returning();
    return created;
  }

  async recoverLocker(lockerId: number, franchiseId: number, recoveredBy: string): Promise<LockerRecovery> {
    const locker = await this.getLocker(lockerId);
    if (!locker) throw new Error("락커를 찾을 수 없습니다");

    // 📌 memberId를 먼저 저장 (Save memberId before clearing)
    const originalMemberId = locker.memberId;
    const member = originalMemberId ? await this.getMember(originalMemberId) : null;
    
    // 1. memberLockers 테이블에서 해당 락커 배정 기록 취소 처리 (먼저 실행!)
    // Cancel assignment from memberLockers FIRST before clearing locker.memberId
    // 활성 상태만 업데이트: "사용중", "이용 중", "이용중" (Only update active states - handle all variants)
    if (originalMemberId) {
      await db.update(memberLockers)
        .set({ status: "취소" })
        .where(and(
          eq(memberLockers.lockerId, lockerId),
          eq(memberLockers.memberId, originalMemberId),
          or(
            eq(memberLockers.status, "사용중"),
            eq(memberLockers.status, "이용 중"),
            eq(memberLockers.status, "이용중")
          )
        ));
    }

    // 2. 회수 기록 생성 (Create recovery record)
    const recoveryRecord = await this.createLockerRecovery({
      lockerId: locker.id,
      lockerNumber: locker.number,
      lockerSection: locker.section,
      memberId: originalMemberId,
      memberName: member?.name || "알 수 없음",
      reason: "사물함 회수",
      notes: `${locker.section} ${locker.number}번 락커 회수`,
      recoveredBy,
      franchiseId,
    });

    // 3. 락커 상태 초기화 (Reset locker status - LAST)
    await this.updateLocker(lockerId, {
      memberId: null,
      status: "빈 락커",
      startDate: null,
      endDate: null,
      notes: null,
    } as any);

    return recoveryRecord;
  }

  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getAttendance(franchiseId?: number, date?: string): Promise<Attendance[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getAttendance called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(attendance).where(eq(attendance.franchiseId, franchiseId));
  }

  async getAttendanceById(id: number): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance).where(eq(attendance.id, id));
    return record || undefined;
  }

  async getAttendanceByMember(memberId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.memberId, memberId));
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const attendanceData: any = {
      memberId: insertAttendance.memberId,
      checkInTime: new Date(insertAttendance.checkInTime),
      checkOutTime: insertAttendance.checkOutTime ? new Date(insertAttendance.checkOutTime) : null,
      date: new Date(insertAttendance.date),
      notes: insertAttendance.notes,
      franchiseId: insertAttendance.franchiseId,
    };
    
    const [attendanceRecord] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return attendanceRecord;
  }

  async updateAttendance(id: number, updateData: Partial<InsertAttendance>): Promise<Attendance> {
    const attendanceUpdateData: any = {};
    
    if (updateData.memberId !== undefined) attendanceUpdateData.memberId = updateData.memberId;
    if (updateData.checkInTime !== undefined) attendanceUpdateData.checkInTime = new Date(updateData.checkInTime);
    if (updateData.checkOutTime !== undefined) attendanceUpdateData.checkOutTime = updateData.checkOutTime ? new Date(updateData.checkOutTime) : null;
    if (updateData.date !== undefined) attendanceUpdateData.date = new Date(updateData.date);
    if (updateData.notes !== undefined) attendanceUpdateData.notes = updateData.notes;
    if (updateData.franchiseId !== undefined) attendanceUpdateData.franchiseId = updateData.franchiseId;
    
    const [attendanceRecord] = await db
      .update(attendance)
      .set(attendanceUpdateData)
      .where(eq(attendance.id, id))
      .returning();
    return attendanceRecord;
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendance).where(eq(attendance.id, id));
  }

  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getSchedules(franchiseId?: number): Promise<Schedule[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getSchedules called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(schedules).where(eq(schedules.franchiseId, franchiseId));
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updateSchedule(id: number, updateData: Partial<InsertSchedule>): Promise<Schedule> {
    const [schedule] = await db
      .update(schedules)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getPersonalTraining(franchiseId?: number, memberId?: number): Promise<any[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getPersonalTraining called without franchiseId - returning empty array");
      return [];
    }
    // 📝 staff 테이블과 조인하여 instructorName 반환
    // Join with staff table to return instructorName
    let conditions = [eq(personalTraining.franchiseId, franchiseId)];
    if (memberId) {
      conditions.push(eq(personalTraining.memberId, memberId));
    }
    const ptList = await db.select().from(personalTraining).where(and(...conditions));
    
    // staff 테이블에서 강사 이름 조회
    const staffList = await db.select().from(staff).where(eq(staff.franchiseId, franchiseId));
    const staffMap = new Map(staffList.map(s => [s.id, s.name]));
    
    return ptList.map(pt => ({
      ...pt,
      instructorName: pt.instructorId ? staffMap.get(pt.instructorId) || '미지정' : '미지정',
    }));
  }

  async getPersonalTrainingById(id: number): Promise<PersonalTraining | undefined> {
    const [pt] = await db.select().from(personalTraining).where(eq(personalTraining.id, id));
    return pt || undefined;
  }

  async createPersonalTraining(insertPt: InsertPersonalTraining): Promise<PersonalTraining> {
    const ptData: any = {
      ...insertPt,
      purchaseDate: insertPt.purchaseDate ? new Date(insertPt.purchaseDate) : new Date(),
      expiryDate: insertPt.expiryDate ? new Date(insertPt.expiryDate) : null,
    };
    const [pt] = await db
      .insert(personalTraining)
      .values(ptData)
      .returning();
    return pt;
  }

  async updatePersonalTraining(id: number, updateData: Partial<InsertPersonalTraining>): Promise<PersonalTraining> {
    const ptUpdateData: any = { ...updateData, updatedAt: new Date() };
    if (updateData.expiryDate !== undefined) {
      ptUpdateData.expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : null;
    }
    const [pt] = await db
      .update(personalTraining)
      .set(ptUpdateData)
      .where(eq(personalTraining.id, id))
      .returning();
    return pt;
  }

  async deletePersonalTraining(id: number): Promise<void> {
    await db.delete(personalTraining).where(eq(personalTraining.id, id));
  }

  async getPtSessions(franchiseId?: number, ptId?: number): Promise<PtSession[]> {
    let conditions = [];
    
    if (franchiseId) {
      conditions.push(eq(ptSessions.franchiseId, franchiseId));
    }
    
    if (ptId) {
      conditions.push(eq(ptSessions.ptId, ptId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(ptSessions).where(and(...conditions));
    }
    
    return await db.select().from(ptSessions);
  }

  async getPtSession(id: number): Promise<PtSession | undefined> {
    const [session] = await db.select().from(ptSessions).where(eq(ptSessions.id, id));
    return session;
  }

  async createPtSession(insertSession: InsertPtSession): Promise<PtSession> {
    const sessionData: any = {
      ...insertSession,
      scheduledDate: insertSession.scheduledDate ? new Date(insertSession.scheduledDate) : new Date(),
      actualDate: insertSession.actualDate ? new Date(insertSession.actualDate) : null,
    };
    const [session] = await db
      .insert(ptSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updatePtSession(id: number, updateData: Partial<InsertPtSession>): Promise<PtSession> {
    const sessionUpdateData: any = { ...updateData };
    if (updateData.actualDate !== undefined) {
      sessionUpdateData.actualDate = updateData.actualDate ? new Date(updateData.actualDate) : null;
    }
    if (updateData.scheduledDate !== undefined) {
      sessionUpdateData.scheduledDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : new Date();
    }
    const [session] = await db
      .update(ptSessions)
      .set(sessionUpdateData)
      .where(eq(ptSessions.id, id))
      .returning();
    return session;
  }

  async deletePtSession(id: number): Promise<void> {
    await db.delete(ptSessions).where(eq(ptSessions.id, id));
  }

  async getOtApplications(franchiseId?: number): Promise<OtApplication[]> {
    if (franchiseId) {
      return await db.select().from(otApplications).where(eq(otApplications.franchiseId, franchiseId));
    }
    return await db.select().from(otApplications);
  }

  async createOtApplication(insertApplication: InsertOtApplication): Promise<OtApplication> {
    const applicationData: any = {
      ...insertApplication,
      purchaseDate: insertApplication.purchaseDate ? new Date(insertApplication.purchaseDate) : new Date(),
      expiryDate: insertApplication.expiryDate ? new Date(insertApplication.expiryDate) : null,
    };
    const [application] = await db
      .insert(otApplications)
      .values(applicationData)
      .returning();
    return application;
  }

  async updateOtApplication(id: number, data: Partial<InsertOtApplication>): Promise<OtApplication> {
    const [application] = await db
      .update(otApplications)
      .set(data as any)
      .where(eq(otApplications.id, id))
      .returning();
    return application;
  }

  // 📝 트레이너 기록 메서드들 (Trainer records methods)
  async getTrainerRecords(franchiseId?: number, memberId?: number, trainerId?: number): Promise<TrainerRecord[]> {
    // 빈 배열 반환 (하드코딩된 데이터 제거)
    return [];
  }

  async createTrainerRecord(record: InsertTrainerRecord): Promise<TrainerRecord> {
    // 임시 구현 - 데이터베이스 테이블이 생성되면 실제 구현할 예정
    return { id: 1, ...record, recordDate: new Date(), createdAt: new Date() } as TrainerRecord;
  }

  // 📏 회원 측정 메서드들 (Member measurements methods)
  async getMemberMeasurements(franchiseId?: number, memberId?: number): Promise<MemberMeasurement[]> {
    // 빈 배열 반환 (하드코딩된 데이터 제거)
    return [];
  }

  async createMemberMeasurement(measurement: InsertMemberMeasurement): Promise<MemberMeasurement> {
    // 임시 구현 - 데이터베이스 테이블이 생성되면 실제 구현할 예정
    return { id: 1, ...measurement, measurementDate: new Date(), createdAt: new Date() } as MemberMeasurement;
  }

  // 💬 상담 관리 메서드들 (Consultation management methods)
  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getConsultations(franchiseId?: number): Promise<Consultation[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getConsultations called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(consultations).where(eq(consultations.franchiseId, franchiseId));
  }

  async getConsultation(id: number): Promise<Consultation | undefined> {
    const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id));
    return consultation || undefined;
  }

  async createConsultation(insertConsultation: InsertConsultation): Promise<Consultation> {
    const [consultation] = await db
      .insert(consultations)
      .values(insertConsultation)
      .returning();
    return consultation;
  }

  async updateConsultation(id: number, updateConsultation: Partial<InsertConsultation>): Promise<Consultation> {
    const [consultation] = await db
      .update(consultations)
      .set(updateConsultation)
      .where(eq(consultations.id, id))
      .returning();
    return consultation;
  }

  async deleteConsultation(id: number): Promise<void> {
    await db.delete(consultations).where(eq(consultations.id, id));
  }

  // 📚 그룹 수업 관리 메서드들 (Group lessons management methods)
  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getGroupLessons(franchiseId?: number): Promise<GroupLesson[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getGroupLessons called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(groupLessons).where(eq(groupLessons.franchiseId, franchiseId));
  }

  async getGroupLesson(id: number): Promise<GroupLesson | undefined> {
    const [groupLesson] = await db.select().from(groupLessons).where(eq(groupLessons.id, id));
    return groupLesson || undefined;
  }

  async createGroupLesson(insertGroupLesson: InsertGroupLesson): Promise<GroupLesson> {
    const [groupLesson] = await db
      .insert(groupLessons)
      .values(insertGroupLesson)
      .returning();
    return groupLesson;
  }

  async updateGroupLesson(id: number, updateGroupLesson: Partial<InsertGroupLesson>): Promise<GroupLesson> {
    const [groupLesson] = await db
      .update(groupLessons)
      .set({ ...updateGroupLesson, updatedAt: new Date() })
      .where(eq(groupLessons.id, id))
      .returning();
    return groupLesson;
  }

  async deleteGroupLesson(id: number): Promise<void> {
    await db.delete(groupLessons).where(eq(groupLessons.id, id));
  }

  // 🆕 그룹 수업 참가자 수 증감 (Increment/decrement group lesson participants)
  async incrementGroupLessonParticipants(id: number, delta: number): Promise<GroupLesson> {
    const lesson = await this.getGroupLesson(id);
    if (!lesson) {
      throw new Error("그룹 수업을 찾을 수 없습니다.");
    }
    const newParticipants = Math.max(0, (lesson.participants || 0) + delta);
    const [updated] = await db
      .update(groupLessons)
      .set({ participants: newParticipants, updatedAt: new Date() })
      .where(eq(groupLessons.id, id))
      .returning();
    return updated;
  }

  // 📚 그룹 수업 등록 관리 메서드들 (Group lesson enrollment management methods)
  async getGroupLessonEnrollments(franchiseId?: number, memberId?: number): Promise<GroupLessonEnrollment[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getGroupLessonEnrollments called without franchiseId - returning empty array");
      return [];
    }
    if (memberId) {
      return await db.select().from(groupLessonEnrollments).where(
        and(eq(groupLessonEnrollments.franchiseId, franchiseId), eq(groupLessonEnrollments.memberId, memberId))
      );
    }
    return await db.select().from(groupLessonEnrollments).where(eq(groupLessonEnrollments.franchiseId, franchiseId));
  }

  async getGroupLessonEnrollment(id: number): Promise<GroupLessonEnrollment | undefined> {
    const [enrollment] = await db.select().from(groupLessonEnrollments).where(eq(groupLessonEnrollments.id, id));
    return enrollment || undefined;
  }

  async createGroupLessonEnrollment(enrollment: InsertGroupLessonEnrollment): Promise<GroupLessonEnrollment> {
    const [created] = await db.insert(groupLessonEnrollments).values(enrollment).returning();
    return created;
  }

  async deleteGroupLessonEnrollment(id: number): Promise<void> {
    await db.delete(groupLessonEnrollments).where(eq(groupLessonEnrollments.id, id));
  }

  // 📝 게시글 관리 메서드들 (Post management methods)
  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getPosts(franchiseId?: number): Promise<Post[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getPosts called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(posts).where(eq(posts.franchiseId, franchiseId));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updatePost(id: number, updatePost: Partial<InsertPost>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ ...updatePost, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  // 📄 계약서 관리 메서드들 (Contract management methods)
  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getContracts(franchiseId?: number): Promise<Contract[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getContracts called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(contracts).where(eq(contracts.franchiseId, franchiseId));
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db
      .insert(contracts)
      .values(insertContract)
      .returning();
    return contract;
  }

  async updateContract(id: number, updateContract: Partial<InsertContract>): Promise<Contract> {
    const [contract] = await db
      .update(contracts)
      .set({ ...updateContract, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  async deleteContract(id: number): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // 💰 환불 관리 메서드들 (Refund management methods)
  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getRefunds(franchiseId?: number): Promise<Refund[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getRefunds called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(refunds).where(eq(refunds.franchiseId, franchiseId));
  }

  async getRefund(id: number): Promise<Refund | undefined> {
    const [refund] = await db.select().from(refunds).where(eq(refunds.id, id));
    return refund || undefined;
  }

  async createRefund(insertRefund: InsertRefund): Promise<Refund> {
    const refundData: any = {
      ...insertRefund,
      refundDate: insertRefund.refundDate ? new Date(insertRefund.refundDate as any) : new Date(),
    };
    const [refund] = await db
      .insert(refunds)
      .values(refundData)
      .returning();
    return refund;
  }

  async updateRefund(id: number, updateRefund: Partial<InsertRefund>): Promise<Refund> {
    const refundUpdateData: any = { ...updateRefund };
    if (updateRefund.refundDate !== undefined) {
      refundUpdateData.refundDate = updateRefund.refundDate ? new Date(updateRefund.refundDate as any) : null;
    }
    const [refund] = await db
      .update(refunds)
      .set(refundUpdateData)
      .where(eq(refunds.id, id))
      .returning();
    return refund;
  }

  async deleteRefund(id: number): Promise<void> {
    await db.delete(refunds).where(eq(refunds.id, id));
  }

  // 💵 기타 매출 관리 메서드들 (Other sales management methods)
  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getOtherSales(franchiseId?: number): Promise<OtherSale[]> {
    if (!franchiseId) {
      console.warn("⚠️ Security: getOtherSales called without franchiseId - returning empty array");
      return [];
    }
    return await db.select().from(otherSales).where(eq(otherSales.franchiseId, franchiseId)).orderBy(desc(otherSales.saleDate));
  }

  async getOtherSale(id: number): Promise<OtherSale | undefined> {
    const [sale] = await db.select().from(otherSales).where(eq(otherSales.id, id));
    return sale || undefined;
  }

  async createOtherSale(insertSale: InsertOtherSale): Promise<OtherSale> {
    const [sale] = await db
      .insert(otherSales)
      .values(insertSale)
      .returning();
    return sale;
  }

  async updateOtherSale(id: number, insertSale: Partial<InsertOtherSale>): Promise<OtherSale> {
    const [sale] = await db
      .update(otherSales)
      .set(insertSale)
      .where(eq(otherSales.id, id))
      .returning();
    return sale;
  }

  async deleteOtherSale(id: number): Promise<void> {
    await db.delete(otherSales).where(eq(otherSales.id, id));
  }

  // 🛑 정지 관리 메서드들 (Suspension management methods)
  // 🔒 보안 강화: franchiseId 없이 전체 데이터 접근 차단 (Security: Block access without franchiseId)
  async getSuspensions(franchiseId?: number): Promise<Suspension[]> {
    if (franchiseId) {
      return await db.select().from(suspensions).where(eq(suspensions.franchiseId, franchiseId));
    }
    console.warn("⚠️ Security: getSuspensions called without franchiseId - returning empty array");
    return [];
  }

  async getSuspension(id: number): Promise<Suspension | undefined> {
    const [suspension] = await db.select().from(suspensions).where(eq(suspensions.id, id));
    return suspension || undefined;
  }

  async createSuspension(insertSuspension: InsertSuspension): Promise<Suspension> {
    const suspensionData: any = {
      ...insertSuspension,
      startDate: insertSuspension.startDate ? new Date(insertSuspension.startDate as any) : new Date(),
      endDate: insertSuspension.endDate ? new Date(insertSuspension.endDate) : null,
    };
    const [suspension] = await db
      .insert(suspensions)
      .values(suspensionData)
      .returning();
    return suspension;
  }

  async updateSuspension(id: number, updateSuspension: Partial<InsertSuspension>): Promise<Suspension> {
    const suspensionUpdateData: any = { ...updateSuspension };
    if (updateSuspension.endDate !== undefined) {
      suspensionUpdateData.endDate = updateSuspension.endDate ? new Date(updateSuspension.endDate) : null;
    }
    if (updateSuspension.startDate !== undefined) {
      suspensionUpdateData.startDate = updateSuspension.startDate ? new Date(updateSuspension.startDate as any) : new Date();
    }
    const [suspension] = await db
      .update(suspensions)
      .set(suspensionUpdateData)
      .where(eq(suspensions.id, id))
      .returning();
    return suspension;
  }

  async deleteSuspension(id: number): Promise<void> {
    await db.delete(suspensions).where(eq(suspensions.id, id));
  }

  // 정지 해제 (Release suspension) - status를 '해제'로 변경하고 endDate를 현재로 설정
  async releaseSuspension(id: number, franchiseId: number): Promise<Suspension | undefined> {
    const [suspension] = await db
      .update(suspensions)
      .set({
        status: "해제",
        endDate: new Date(),
      })
      .where(and(eq(suspensions.id, id), eq(suspensions.franchiseId, franchiseId)))
      .returning();
    return suspension || undefined;
  }

  // 📝 수정 기록 관리 메서드들 (Member modification management methods)
  async getMemberModifications(franchiseId?: number, memberId?: number): Promise<any[]> {
    try {
      // 일반 수정 기록 조회
      let modifications: any[] = [];
      
      if (franchiseId && memberId) {
        modifications = await db.select().from(memberModifications).where(and(eq(memberModifications.franchiseId, franchiseId), eq(memberModifications.memberId, memberId)));
      } else if (franchiseId) {
        modifications = await db.select().from(memberModifications).where(eq(memberModifications.franchiseId, franchiseId));
      } else if (memberId) {
        modifications = await db.select().from(memberModifications).where(eq(memberModifications.memberId, memberId));
      } else {
        modifications = await db.select().from(memberModifications);
      }
      
      // 삭제 기록도 함께 조회하여 포함
      let deletions: any[] = [];
      try {
        if (franchiseId && memberId) {
          deletions = await db.execute(sql`SELECT member_id as "memberId", deleted_by as "modifiedBy", deletion_date as "modificationDate", 'member_deletion' as "fieldName", member_name as "oldValue", '삭제됨' as "newValue", reason, notes, franchise_id as "franchiseId", created_at as "createdAt" FROM member_deletion_log WHERE franchise_id = ${franchiseId} AND member_id = ${memberId} ORDER BY deletion_date DESC`).then(r => r.rows);
        } else if (franchiseId) {
          deletions = await db.execute(sql`SELECT member_id as "memberId", deleted_by as "modifiedBy", deletion_date as "modificationDate", 'member_deletion' as "fieldName", member_name as "oldValue", '삭제됨' as "newValue", reason, notes, franchise_id as "franchiseId", created_at as "createdAt" FROM member_deletion_log WHERE franchise_id = ${franchiseId} ORDER BY deletion_date DESC`).then(r => r.rows);
        } else if (memberId) {
          deletions = await db.execute(sql`SELECT member_id as "memberId", deleted_by as "modifiedBy", deletion_date as "modificationDate", 'member_deletion' as "fieldName", member_name as "oldValue", '삭제됨' as "newValue", reason, notes, franchise_id as "franchiseId", created_at as "createdAt" FROM member_deletion_log WHERE member_id = ${memberId} ORDER BY deletion_date DESC`).then(r => r.rows);
        } else {
          deletions = await db.execute(sql`SELECT member_id as "memberId", deleted_by as "modifiedBy", deletion_date as "modificationDate", 'member_deletion' as "fieldName", member_name as "oldValue", '삭제됨' as "newValue", reason, notes, franchise_id as "franchiseId", created_at as "createdAt" FROM member_deletion_log ORDER BY deletion_date DESC`).then(r => r.rows);
        }
      } catch (deletionError) {
        // deletion log table might not exist
        deletions = [];
      }
      
      // 수정 기록과 삭제 기록을 합쳐서 반환
      const allRecords = [...modifications, ...deletions];
      return allRecords.sort((a: any, b: any) => new Date(b.modificationDate).getTime() - new Date(a.modificationDate).getTime());
    } catch (error) {
      console.error("Error getting member modifications:", error);
      return [];
    }
  }

  async getMemberModification(id: number): Promise<MemberModification | undefined> {
    const [modification] = await db.select().from(memberModifications).where(eq(memberModifications.id, id));
    return modification || undefined;
  }

  async createMemberModification(insertModification: InsertMemberModification): Promise<MemberModification> {
    const [modification] = await db
      .insert(memberModifications)
      .values(insertModification)
      .returning();
    return modification;
  }

  async deleteMemberModification(id: number, franchiseId: number): Promise<boolean> {
    const result = await db.delete(memberModifications)
      .where(and(eq(memberModifications.id, id), eq(memberModifications.franchiseId, franchiseId)));
    return (result.rowCount ?? 0) > 0;
  }

  // 👥 단체 연장 관리 메서드들 (Group extension management methods)
  async getGroupExtensions(franchiseId?: number): Promise<GroupExtension[]> {
    if (franchiseId) {
      return await db.select().from(groupExtensions).where(eq(groupExtensions.franchiseId, franchiseId));
    }
    return await db.select().from(groupExtensions);
  }

  async getGroupExtension(id: number): Promise<GroupExtension | undefined> {
    const [extension] = await db.select().from(groupExtensions).where(eq(groupExtensions.id, id));
    return extension || undefined;
  }

  async createGroupExtension(insertExtension: InsertGroupExtension): Promise<GroupExtension> {
    const [extension] = await db
      .insert(groupExtensions)
      .values(insertExtension)
      .returning();
    return extension;
  }

  async updateGroupExtension(id: number, updateExtension: Partial<InsertGroupExtension>): Promise<GroupExtension> {
    const [extension] = await db
      .update(groupExtensions)
      .set(updateExtension)
      .where(eq(groupExtensions.id, id))
      .returning();
    return extension;
  }

  async deleteGroupExtension(id: number): Promise<void> {
    await db.delete(groupExtensions).where(eq(groupExtensions.id, id));
  }

  // 🏋️ 회원 운동 용품 관리 메서드들 (Member equipment management methods)
  async getMemberEquipment(franchiseId?: number, memberId?: number): Promise<any[]> {
    if (franchiseId && memberId) {
      return await db.select().from(memberEquipment).where(and(eq(memberEquipment.franchiseId, franchiseId), eq(memberEquipment.memberId, memberId)));
    } else if (franchiseId) {
      return await db.select().from(memberEquipment).where(eq(memberEquipment.franchiseId, franchiseId));
    } else if (memberId) {
      return await db.select().from(memberEquipment).where(eq(memberEquipment.memberId, memberId));
    }
    return await db.select().from(memberEquipment);
  }

  async getMemberEquipmentById(id: number): Promise<any | undefined> {
    const [equipment] = await db.select().from(memberEquipment).where(eq(memberEquipment.id, id));
    return equipment || undefined;
  }

  async createMemberEquipment(equipment: any): Promise<any> {
    const equipmentData: any = {
      ...equipment,
      rentalDate: equipment.rentalDate ? new Date(equipment.rentalDate) : null,
      returnDate: equipment.returnDate ? new Date(equipment.returnDate) : null,
    };
    const [newEquipment] = await db
      .insert(memberEquipment)
      .values(equipmentData)
      .returning();
    return newEquipment;
  }

  async updateMemberEquipment(id: number, updateData: Partial<any>): Promise<any> {
    const [equipment] = await db
      .update(memberEquipment)
      .set(updateData)
      .where(eq(memberEquipment.id, id))
      .returning();
    return equipment;
  }

  async deleteMemberEquipment(id: number): Promise<void> {
    await db.delete(memberEquipment).where(eq(memberEquipment.id, id));
  }

  // 🔐 회원 락커 관리 메서드들 (Member locker management methods)
  async getMemberLockers(franchiseId?: number, memberId?: number): Promise<any[]> {
    if (franchiseId && memberId) {
      return await db.select().from(memberLockers).where(and(eq(memberLockers.franchiseId, franchiseId), eq(memberLockers.memberId, memberId)));
    } else if (franchiseId) {
      return await db.select().from(memberLockers).where(eq(memberLockers.franchiseId, franchiseId));
    } else if (memberId) {
      return await db.select().from(memberLockers).where(eq(memberLockers.memberId, memberId));
    }
    return await db.select().from(memberLockers);
  }

  async getMemberLockerById(id: number): Promise<any | undefined> {
    const [locker] = await db.select().from(memberLockers).where(eq(memberLockers.id, id));
    return locker || undefined;
  }

  async createMemberLocker(locker: any): Promise<any> {
    const lockerData: any = {
      ...locker,
      startDate: locker.startDate ? new Date(locker.startDate) : new Date(),
      endDate: locker.endDate ? new Date(locker.endDate) : null,
    };
    const [newLocker] = await db
      .insert(memberLockers)
      .values(lockerData)
      .returning();
    return newLocker;
  }

  async updateMemberLocker(id: number, updateData: Partial<any>): Promise<any> {
    const [locker] = await db
      .update(memberLockers)
      .set(updateData)
      .where(eq(memberLockers.id, id))
      .returning();
    return locker;
  }

  async deleteMemberLocker(id: number): Promise<void> {
    await db.delete(memberLockers).where(eq(memberLockers.id, id));
  }

  // 💳 결제 정보 관리 메서드들 (Payment management methods)
  async getPayments(franchiseId?: number, memberId?: number): Promise<Payment[]> {
    if (memberId) {
      return await db.select().from(payments).where(eq(payments.memberId, memberId));
    }
    return await db.select().from(payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  // 🔗 상품 삭제 전 결제 내역의 상품 참조 해제 (Nullify product reference before product deletion)
  async nullifyPaymentsByProductId(productId: number): Promise<void> {
    await db
      .update(payments)
      .set({ productId: null })
      .where(eq(payments.productId, productId));
  }

  // 📋 회원 삭제 기록 조회 (Get member deletion records)
  async getDeletions(franchiseId: number): Promise<any[]> {
    try {
      const deletions = await db.execute(sql`SELECT * FROM member_deletion_log WHERE franchise_id = ${franchiseId} ORDER BY deletion_date DESC`);
      return deletions.rows;
    } catch (error) {
      console.error("Error getting member deletions:", error);
      return [];
    }
  }

  // 🔐 락커 설정 조회 (Get locker settings)
  async getLockerSettings(franchiseId: number): Promise<LockerSettings | null> {
    const [settings] = await db.select().from(lockerSettings).where(eq(lockerSettings.franchiseId, franchiseId));
    return settings || null;
  }

  // 🔐 락커 설정 저장 (Save locker settings) - upsert 방식
  async saveLockerSettings(settings: InsertLockerSettings): Promise<LockerSettings> {
    // 기존 설정 조회
    const existing = await this.getLockerSettings(settings.franchiseId!);
    
    if (existing) {
      // 업데이트
      const [updated] = await db
        .update(lockerSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(lockerSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // 새로 생성
      const [created] = await db
        .insert(lockerSettings)
        .values(settings)
        .returning();
      return created;
    }
  }

  // 📢 키오스크 공지 관리 메서드들 (Kiosk notice management methods)
  async getKioskNotices(franchiseId?: number): Promise<any[]> {
    if (franchiseId) {
      return await db.select().from(kioskNotices).where(eq(kioskNotices.franchiseId, franchiseId)).orderBy(kioskNotices.displayOrder);
    }
    return await db.select().from(kioskNotices).orderBy(kioskNotices.displayOrder);
  }

  async getKioskNotice(id: number): Promise<any | undefined> {
    const [notice] = await db.select().from(kioskNotices).where(eq(kioskNotices.id, id));
    return notice || undefined;
  }

  async createKioskNotice(notice: any): Promise<any> {
    const [newNotice] = await db
      .insert(kioskNotices)
      .values(notice)
      .returning();
    return newNotice;
  }

  async updateKioskNotice(id: number, notice: any): Promise<any> {
    const [updated] = await db
      .update(kioskNotices)
      .set({ ...notice, updatedAt: new Date() })
      .where(eq(kioskNotices.id, id))
      .returning();
    return updated;
  }

  async deleteKioskNotice(id: number): Promise<void> {
    await db.delete(kioskNotices).where(eq(kioskNotices.id, id));
  }

  // 🏋️ OT 프로그램 관리 메서드들 (OT Program management methods)
  async getOtPrograms(franchiseId?: number): Promise<OtProgram[]> {
    if (franchiseId) {
      return await db.select().from(otPrograms).where(eq(otPrograms.franchiseId, franchiseId)).orderBy(desc(otPrograms.createdAt));
    }
    return await db.select().from(otPrograms).orderBy(desc(otPrograms.createdAt));
  }

  async getOtProgram(id: number): Promise<OtProgram | undefined> {
    const [program] = await db.select().from(otPrograms).where(eq(otPrograms.id, id));
    return program || undefined;
  }

  async createOtProgram(program: InsertOtProgram): Promise<OtProgram> {
    const [newProgram] = await db
      .insert(otPrograms)
      .values(program)
      .returning();
    return newProgram;
  }

  async updateOtProgram(id: number, program: Partial<InsertOtProgram>): Promise<OtProgram> {
    const [updated] = await db
      .update(otPrograms)
      .set({ ...program, updatedAt: new Date() })
      .where(eq(otPrograms.id, id))
      .returning();
    return updated;
  }

  async deleteOtProgram(id: number): Promise<void> {
    await db.delete(otPrograms).where(eq(otPrograms.id, id));
  }

  // 📋 센터 프로그램 관리 메서드들 (Center Program management methods)
  async getCenterPrograms(franchiseId?: number): Promise<CenterProgram[]> {
    if (franchiseId) {
      return await db.select().from(centerPrograms).where(eq(centerPrograms.franchiseId, franchiseId)).orderBy(desc(centerPrograms.createdAt));
    }
    return await db.select().from(centerPrograms).orderBy(desc(centerPrograms.createdAt));
  }

  async createCenterProgram(program: InsertCenterProgram): Promise<CenterProgram> {
    const [newProgram] = await db
      .insert(centerPrograms)
      .values(program)
      .returning();
    return newProgram;
  }

  async deleteCenterProgram(id: number): Promise<void> {
    await db.delete(centerPrograms).where(eq(centerPrograms.id, id));
  }

  async deleteCenterProgramsByType(franchiseId: number, programType: string): Promise<void> {
    await db.delete(centerPrograms).where(
      and(
        eq(centerPrograms.franchiseId, franchiseId),
        eq(centerPrograms.programType, programType)
      )
    );
  }

  // 💳 PG 거래 관리 (PG Transaction management)
  async getPgTransactions(franchiseId: number, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<PgTransaction[]> {
    const conditions = [eq(pgTransactions.franchiseId, franchiseId)];
    if (filters?.status) {
      conditions.push(eq(pgTransactions.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(pgTransactions.orderDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lt(pgTransactions.orderDate, filters.endDate));
    }
    return await db.select().from(pgTransactions)
      .where(and(...conditions))
      .orderBy(desc(pgTransactions.createdAt));
  }

  async getPgTransaction(id: number): Promise<PgTransaction | undefined> {
    const [tx] = await db.select().from(pgTransactions).where(eq(pgTransactions.id, id));
    return tx || undefined;
  }

  async getPgTransactionByOrderId(orderId: string): Promise<PgTransaction | undefined> {
    const [tx] = await db.select().from(pgTransactions).where(eq(pgTransactions.orderId, orderId));
    return tx || undefined;
  }

  async createPgTransaction(data: InsertPgTransaction): Promise<PgTransaction> {
    const [tx] = await db.insert(pgTransactions).values(data).returning();
    return tx;
  }

  async updatePgTransaction(id: number, data: Partial<InsertPgTransaction>): Promise<PgTransaction> {
    const [tx] = await db.update(pgTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pgTransactions.id, id))
      .returning();
    return tx;
  }

  // 🛒 PG 상품 관리 (PG Product management)
  async getPgProducts(franchiseId: number): Promise<PgProduct[]> {
    return await db.select().from(pgProducts)
      .where(eq(pgProducts.franchiseId, franchiseId))
      .orderBy(desc(pgProducts.createdAt));
  }

  async getPgProduct(id: number): Promise<PgProduct | undefined> {
    const [product] = await db.select().from(pgProducts).where(eq(pgProducts.id, id));
    return product || undefined;
  }

  async createPgProduct(data: InsertPgProduct): Promise<PgProduct> {
    const [product] = await db.insert(pgProducts).values(data).returning();
    return product;
  }

  async updatePgProduct(id: number, data: Partial<InsertPgProduct>): Promise<PgProduct> {
    const [product] = await db.update(pgProducts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pgProducts.id, id))
      .returning();
    return product;
  }

  async deletePgProduct(id: number): Promise<void> {
    await db.delete(pgProducts).where(eq(pgProducts.id, id));
  }

  // 🏢 프랜차이즈 PG 설정 업데이트 (Update franchise PG config)
  async updateFranchisePgConfig(id: number, config: { pgProvider?: string; pgServiceId?: string; pgMode?: string; pgApiKey?: string; pgApiIv?: string }): Promise<Franchise> {
    const [franchise] = await db.update(franchises)
      .set(config)
      .where(eq(franchises.id, id))
      .returning();
    return franchise;
  }

  // OUHVE ABM — Module 1: Business Profile
  // 운영자 정체성 데이터를 갱신. AI Operation Assistant(Module 7)가 이 데이터를
  // 기반으로 맥락 있는 제안을 생성한다.
  async updateBusinessProfile(id: number, profile: Partial<InsertFranchise>): Promise<Franchise> {
    const [franchise] = await db.update(franchises)
      .set(profile)
      .where(eq(franchises.id, id))
      .returning();
    return franchise;
  }

  // 📱 링크결제 SMS 로그 (Link Payment SMS Log methods)
  async createSmsLog(data: InsertLinkPaymentSmsLog): Promise<LinkPaymentSmsLog> {
    const [log] = await db.insert(linkPaymentSmsLogs).values(data).returning();
    return log;
  }

  async getSmsLogsByProduct(pgProductId: number): Promise<LinkPaymentSmsLog[]> {
    return await db.select().from(linkPaymentSmsLogs)
      .where(eq(linkPaymentSmsLogs.pgProductId, pgProductId))
      .orderBy(desc(linkPaymentSmsLogs.createdAt));
  }

  async getSmsLogsByFranchise(franchiseId: number): Promise<LinkPaymentSmsLog[]> {
    return await db.select().from(linkPaymentSmsLogs)
      .where(eq(linkPaymentSmsLogs.franchiseId, franchiseId))
      .orderBy(desc(linkPaymentSmsLogs.createdAt));
  }

  async getFranchiseByCode(code: string): Promise<Franchise | undefined> {
    const [franchise] = await db.select().from(franchises).where(eq(franchises.code, code));
    return franchise || undefined;
  }

  async getFranchisesByStatus(status: string): Promise<Franchise[]> {
    return await db.select().from(franchises).where(eq(franchises.status, status));
  }

  async updateFranchiseStatus(id: number, status: string, code?: string): Promise<Franchise> {
    const updateData: Record<string, any> = { status };
    if (code) updateData.code = code;
    const [franchise] = await db.update(franchises).set(updateData).where(eq(franchises.id, id)).returning();
    return franchise;
  }
  // 🖥️ 결제 단말기 관리 (Payment Terminal management methods)
  async getTerminals(franchiseId: number): Promise<PaymentTerminal[]> {
    return await db.select().from(paymentTerminals)
      .where(eq(paymentTerminals.franchiseId, franchiseId))
      .orderBy(desc(paymentTerminals.createdAt));
  }

  async getTerminal(id: number): Promise<PaymentTerminal | undefined> {
    const [terminal] = await db.select().from(paymentTerminals).where(eq(paymentTerminals.id, id));
    return terminal || undefined;
  }

  async createTerminal(data: InsertPaymentTerminal): Promise<PaymentTerminal> {
    const [terminal] = await db.insert(paymentTerminals).values(data).returning();
    return terminal;
  }

  async updateTerminal(id: number, data: Partial<InsertPaymentTerminal>): Promise<PaymentTerminal> {
    const [terminal] = await db.update(paymentTerminals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentTerminals.id, id))
      .returning();
    return terminal;
  }

  async deleteTerminal(id: number): Promise<void> {
    await db.delete(paymentTerminals).where(eq(paymentTerminals.id, id));
  }
}

export const storage = new DatabaseStorage();
