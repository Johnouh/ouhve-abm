import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("member"), // superadmin, admin, staff, member
  name: text("name"),
  phone: text("phone"),
  franchiseId: integer("franchise_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const franchises = pgTable("franchises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "franchise" | "branch"
  description: text("description"),
  // 프랜차이즈 관리 필드
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  code: text("code").unique(), // 프랜차이즈 고유 코드 (승인 시 생성)
  parentId: integer("parent_id"), // 상위 프랜차이즈 ID (지점인 경우)
  ownerName: text("owner_name"), // 대표자명
  ownerPhone: text("owner_phone"), // 대표자 연락처
  businessName: text("business_name"), // 사업자명
  // PG 결제 설정 (PG payment configuration)
  pgProvider: text("pg_provider"), // "billgate" | null
  pgServiceId: text("pg_service_id"), // 빌게이트 SERVICE_ID (예: "M2103140")
  pgMode: text("pg_mode").default("test"), // "test" | "production"
  pgApiKey: text("pg_api_key"), // 암호화 키 (Base64)
  pgApiIv: text("pg_api_iv"), // 암호화 IV
  // OUHVE ABM — Business Profile (Module 1)
  // 센터 운영자 정체성 + AI 운영 제안의 베이스 데이터
  wellnessCategory: text("wellness_category"), // 헬스장 | PT샵 | 필라테스 | 요가 | 뷰티샵 | 복합
  region: text("region"), // 시/구 (예: "서울 강남구")
  operatingHours: jsonb("operating_hours"), // {mon: "09:00-22:00", tue: ..., ...} 요일별
  mainPrograms: text("main_programs").array(), // ["PT", "그룹수업", "필라테스"]
  primaryAudience: text("primary_audience"), // "30대 여성", "40-50대 직장인" 등 자유 텍스트
  philosophy: text("philosophy"), // 운영 철학 (한 문단)
  topConcern: text("top_concern"), // 현재 가장 큰 운영 문제 (AI 진단의 시드)
  profileCompletedAt: timestamp("profile_completed_at"), // 프로필 입력 완료 시점 (온보딩 진척 트래킹)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("활성 회원"), // 활성 회원, 휴회, 만료 등
  gender: text("gender"), // 남성, 여성
  birthDate: text("birth_date"), // YYYY-MM-DD 형식
  address: text("address"),
  email: text("email"),
  emergencyContact: text("emergency_contact"), // 비상 연락처
  occupation: text("occupation"), // 직업
  joinSource: text("join_source"), // 가입경로 (인터넷 검색, 지인 추천, 전단지, 지나가다가, 기타)
  notes: text("notes"), // 특이사항/메모
  joinDate: timestamp("join_date").defaultNow().notNull(),
  lastVisit: timestamp("last_visit"),
  productId: integer("product_id"), // 구매한 상품 ID (통계용)
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  position: text("position").notNull(), // 포지션 (트레이너, 매니저, 청소 등)
  department: text("department"), // 부서
  hireDate: timestamp("hire_date").notNull(),
  resignationDate: timestamp("resignation_date"), // 퇴사일 (Resignation date)
  birthDate: text("birth_date"), // YYYY-MM-DD 형식
  address: text("address"),
  emergencyContact: text("emergency_contact"), // 비상 연락처
  salary: integer("salary"), // 급여
  workType: text("work_type").notNull().default("정규직"), // 정규직, 계약직, 아르바이트
  workDays: text("work_days").array(), // 근무 요일 배열
  workHours: text("work_hours"), // 근무 시간 (예: 09:00-18:00)
  specialties: text("specialties").array(), // 전문 분야 (PT, 요가, 필라테스 등)
  certifications: text("certifications").array(), // 자격증
  status: text("status").notNull().default("재직"), // 재직, 휴직, 퇴사
  approvalStatus: text("approval_status").notNull().default("대기"), // 대기, 승인, 거부 (Pending, Approved, Rejected)
  notes: text("notes"), // 특이사항/메모
  profileImage: text("profile_image"), // 프로필 이미지 URL
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  type: text("type").notNull(), // 회원권 종류
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalSessions: integer("total_sessions"), // 총 횟수 (헬스장 이용 횟수)
  usedSessions: integer("used_sessions").default(0), // 사용한 횟수
  price: integer("price").notNull(), // 가격
  instructorId: integer("instructor_id").references(() => staff.id), // 담당 강사 (Assigned instructor)
  status: text("status").notNull().default("활성"), // 활성, 정지, 만료
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  membershipId: integer("membership_id").references(() => memberships.id),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // 카드, 현금, 계좌이체
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  status: text("status").notNull().default("완료"), // 완료, 취소, 환불
  description: text("description"), // 결제 내용 설명
  staffId: integer("staff_id").references(() => staff.id), // 담당 직원 (매출 귀속)
  productId: integer("product_id").references(() => products.id), // 상품 ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  franchiseId: integer("franchise_id").references(() => franchises.id), // 🔒 데이터 격리용 프랜차이즈 ID
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 상품명
  price: integer("price").notNull(), // 가격
  duration: integer("duration"), // 기간 (일 단위)
  durationType: text("duration_type").notNull().default("월"), // 월, 일, 회
  sessions: integer("sessions"), // 총 이용 가능 횟수
  category: text("category").notNull().default("회원권"), // 회원권, PT, 기타
  description: text("description"), // 상품 설명
  status: text("status").notNull().default("활성"), // 활성, 비활성
  appExposed: boolean("app_exposed").notNull().default(true), // APP 노출 여부
  franchiseId: integer("franchise_id").references(() => franchises.id),
  // 🆕 수업 상품 관련 필드 (Lesson product fields)
  instructorId: integer("instructor_id"), // 담당 강사 ID
  lessonType: text("lesson_type"), // 개인/그룹 (null if not lesson product)
  maxParticipants: integer("max_participants"), // 그룹 수업 최대 인원
  minParticipants: integer("min_participants"), // 그룹 수업 최소 인원
  // 🆕 그룹 수업 스케줄 필드 (Group lesson schedule fields)
  startTime: text("start_time"), // 수업 시작 시간 (HH:MM)
  endTime: text("end_time"), // 수업 종료 시간 (HH:MM)
  operatingDays: text("operating_days").array(), // 운영 요일 배열 (["월", "화", "수"] 등)
  // 🆕 락커 상품 전용 필드 (Locker product field)
  lockerSection: text("locker_section"), // 락커 구역 (락커 상품에만 적용)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lockers = pgTable("lockers", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(), // 락커 번호
  section: text("section").notNull().default("오전반"), // 오전반, 오후반, 종일반 등
  type: text("type").notNull().default("일반"), // 일반, 대형, VIP 등
  status: text("status").notNull().default("빈 락커"), // 빈 락커, 이용 중, 만료
  memberId: integer("member_id").references(() => members.id), // 사용 중인 회원
  startDate: timestamp("start_date"), // 사용 시작일
  endDate: timestamp("end_date"), // 사용 종료일
  monthlyFee: integer("monthly_fee").default(0), // 월 사용료
  notes: text("notes"), // 메모
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lockerRecoveries = pgTable("locker_recoveries", {
  id: serial("id").primaryKey(),
  lockerId: integer("locker_id").references(() => lockers.id).notNull(),
  lockerNumber: integer("locker_number").notNull(),
  lockerSection: text("locker_section"),
  memberId: integer("member_id").references(() => members.id),
  memberName: text("member_name"),
  recoveryDate: timestamp("recovery_date").defaultNow().notNull(),
  reason: text("reason"),
  notes: text("notes"),
  recoveredBy: text("recovered_by"),
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(), // 출석한 회원
  checkInTime: timestamp("check_in_time").notNull(), // 입장 시간
  checkOutTime: timestamp("check_out_time"), // 퇴장 시간
  date: timestamp("date").notNull(), // 출석 날짜 (날짜만, 시간 무시)
  notes: text("notes"), // 메모
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // 수업명 (요가 수업, 헬스 수업 등)
  description: text("description"), // 수업 설명
  instructorId: integer("instructor_id").references(() => staff.id), // 강사 (직원 테이블 참조)
  startTime: text("start_time").notNull(), // 시작 시간 (HH:MM 형식)
  endTime: text("end_time").notNull(), // 종료 시간 (HH:MM 형식)
  dayOfWeek: integer("day_of_week").notNull(), // 요일 (0=일요일, 1=월요일, ..., 6=토요일)
  color: text("color").notNull().default("#3B82F6"), // 스케줄 블록 색상
  maxParticipants: integer("max_participants"), // 최대 참가자 수
  currentParticipants: integer("current_participants").default(0), // 현재 참가자 수
  isActive: boolean("is_active").notNull().default(true), // 활성 여부
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const personalTraining = pgTable("personal_training", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(), // 회원
  instructorId: integer("instructor_id").references(() => staff.id), // 담당 강사
  productId: integer("product_id").references(() => products.id), // 구매한 PT 상품
  totalSessions: integer("total_sessions").notNull(), // 총 차수
  remainingSessions: integer("remaining_sessions").notNull(), // 잔여 차수
  usedSessions: integer("used_sessions").default(0), // 사용한 차수
  purchaseDate: timestamp("purchase_date").notNull(), // 구매일/결제일
  expiryDate: timestamp("expiry_date"), // 유효기간 마감일
  lastSessionDate: timestamp("last_session_date"), // 최근 실습일
  scheduledDays: text("scheduled_days").array(), // 수업 요일 배열 (예: ["월", "수", "금"])
  preferredStartTime: text("preferred_start_time"), // 선호 시작 시간 (예: "10:00")
  preferredEndTime: text("preferred_end_time"), // 선호 종료 시간 (예: "11:00")
  status: text("status").notNull().default("활성"), // 활성, 완료, 만료
  notes: text("notes"), // 메모
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ptSessions = pgTable("pt_sessions", {
  id: serial("id").primaryKey(),
  ptId: integer("pt_id").references(() => personalTraining.id).notNull(), // PT 패키지 참조
  instructorId: integer("instructor_id").references(() => staff.id).notNull(), // 수업 강사
  scheduledDate: timestamp("scheduled_date").notNull(), // 예약 일정
  actualDate: timestamp("actual_date"), // 실제 수업 일시
  duration: integer("duration").default(60), // 수업 시간 (분)
  status: text("status").notNull().default("예약"), // 예약, 완료, 취소, 노쇼
  sessionNotes: text("session_notes"), // 수업 메모
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otApplications = pgTable("ot_applications", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(), // 신청 회원
  preferredInstructorId: integer("preferred_instructor_id").references(() => staff.id), // 희망 강사
  productId: integer("product_id").references(() => products.id), // 구매 상품
  purchaseDate: timestamp("purchase_date").notNull(), // 결제일
  expiryDate: timestamp("expiry_date"), // 유효기간 마감일
  totalOtSessions: integer("total_ot_sessions").notNull(), // 총 가능 OT 건수
  preferredSchedule: text("preferred_schedule"), // 희망 일정
  status: text("status").notNull().default("대기"), // 대기, 승인, 거절, 완료
  applicationDate: timestamp("application_date").defaultNow().notNull(), // 신청일
  notes: text("notes"), // 메모
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 그룹 수업 관리 시스템 (Group Lessons Management System)
export const groupLessons = pgTable("group_lessons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 수업명
  instructorId: integer("instructor_id").references(() => staff.id), // 담당 강사
  instructor: text("instructor"), // 담당 강사 이름 (denormalized for performance)
  time: text("time"), // 수업 시간 (예: "09:00") - 레거시 필드, startTime 사용 권장
  startTime: text("start_time"), // 수업 시작 시간 (예: "09:00")
  endTime: text("end_time"), // 수업 종료 시간 (예: "10:00")
  duration: text("duration"), // 수업 기간 (예: "60분")
  dayOfWeek: integer("day_of_week").notNull().default(1), // 요일 (1=월요일, 7=일요일) - 레거시 필드
  operatingDays: text("operating_days").array().default([]), // 운영 요일 배열 (예: ["월", "수", "금"])
  color: text("color").notNull().default("#10B981"), // 수업 색상
  maxParticipants: integer("max_participants").notNull().default(10), // 최대 참가자 수
  minParticipants: integer("min_participants").default(1), // 최소 참가자 수
  participants: integer("participants").notNull().default(0), // 현재 참가자 수
  capacity: text("capacity"), // 수용 인원 정보
  waitList: text("wait_list"), // 대기자 명단 정보
  status: text("status").notNull().default("활성"), // 활성, 중단, 완료
  notes: text("notes"), // 수업 관련 메모
  price: integer("price").default(0), // 수업 가격 (Lesson price)
  productId: integer("product_id").references(() => products.id), // 연결된 상품 ID (Linked product ID)
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 그룹 수업 등록 테이블 (Group Lesson Enrollments - 회원이 등록한 그룹 수업)
export const groupLessonEnrollments = pgTable("group_lesson_enrollments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  groupLessonId: integer("group_lesson_id").references(() => groupLessons.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  paymentId: integer("payment_id").references(() => payments.id),
  price: integer("price").default(0),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  status: text("status").notNull().default("활성"), // 활성, 취소
  notes: text("notes"),
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 트레이너 회원 기록 시스템 (Trainer Member Records System)
export const trainerRecords = pgTable("trainer_records", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  trainerId: integer("trainer_id").references(() => staff.id).notNull(),
  recordType: text("record_type").notNull(), // 운동기록, 상담기록, 건강기록, 특이사항 등
  title: text("title").notNull(), // 기록 제목
  content: text("content").notNull(), // 기록 내용
  recordDate: timestamp("record_date").defaultNow().notNull(),
  attachments: text("attachments").array(), // 첨부파일 URL 배열
  tags: text("tags").array(), // 태그 배열 (운동부위, 운동종류 등)
  isPrivate: boolean("is_private").default(false), // 비공개 여부
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 회원 목표 및 측정 기록 (Member Goals and Measurements)
export const memberMeasurements = pgTable("member_measurements", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  measurementDate: timestamp("measurement_date").defaultNow().notNull(),
  weight: integer("weight"), // 체중 (kg * 10, 소수점 한자리)
  bodyFatPercentage: integer("body_fat_percentage"), // 체지방률 (% * 10)
  muscleMass: integer("muscle_mass"), // 근육량 (kg * 10)
  height: integer("height"), // 신장 (cm)
  bmi: integer("bmi"), // BMI (지수 * 10)
  measurements: text("measurements"), // JSON 형태의 상세 측정값 (가슴둘레, 허리둘레 등)
  notes: text("notes"), // 측정 관련 메모
  measuredBy: integer("measured_by").references(() => staff.id), // 측정자
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 상담 관리 테이블 (Consultation Management)
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(), // 고객명
  phone: text("phone").notNull(), // 연락처
  gender: text("gender"), // 성별 (남성, 여성, 알 수 없음)
  birthDate: text("birth_date"), // 생년월일
  consultationType: text("consultation_type").notNull(), // 상담 유형 (전화상담, 방문상담, 체험상담 등)
  customConsultationType: text("custom_consultation_type"), // 사용자 정의 상담 유형 (직접 입력)
  consultationDate: timestamp("consultation_date").notNull(), // 상담 일시
  purpose: text("purpose"), // 상담 목적
  result: text("result"), // 상담 결과
  counselorId: integer("counselor_id").references(() => staff.id), // 상담사
  method: text("method"), // 상담 방법
  service: text("service"), // 서비스 종류
  notes: text("notes"), // 상담 내용 및 메모
  status: text("status").notNull().default("진행 중"), // 상태 (진행 중, 완료, 취소)
  followUpDate: timestamp("follow_up_date"), // 추적 관리 일정
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 게시글 테이블 (Posts)
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull().default("관리자"),
  isImportant: boolean("is_important").default(false),
  status: text("status").notNull().default("게시"),
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 계약서 테이블 (Contracts)
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fontSize: text("font_size").default("12"),
  fontFamily: text("font_family").default("돋움"),
  textColor: text("text_color").default("#000000"),
  backgroundColor: text("background_color").default("#ffffff"),
  zoom: integer("zoom").default(100),
  isActive: boolean("is_active").default(true),
  isTemplate: boolean("is_template").default(false), // 템플릿 여부
  templateCategory: text("template_category"), // 템플릿 카테고리 (회원권, PT, 락커 등)
  lastEditDate: timestamp("last_edit_date").defaultNow().notNull(),
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 환불 처리 시스템 (Refund Processing System)
// DB 구조에 맞게 수정됨 (Updated to match actual DB structure)
export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  memberName: text("member_name"), // 회원명 (denormalized)
  refundDate: timestamp("refund_date").defaultNow().notNull(), // 환불일
  originalAmount: integer("original_amount"), // 원래 금액
  refundAmount: integer("refund_amount").notNull(), // 환불 금액
  refundReason: text("refund_reason").notNull(), // 환불 사유
  productName: text("product_name"), // 상품명
  productType: text("product_type"), // 상품 유형 (membership, pt, locker)
  productId: integer("product_id"), // 상품 ID (회원권/PT/락커 ID)
  status: text("status").notNull().default("요청"), // 요청, 처리중, 완료, 거절
  notes: text("notes"), // 비고
  processedBy: text("processed_by"), // 처리자
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 기타 매출 (Other Sales)
export const otherSales = pgTable("other_sales", {
  id: serial("id").primaryKey(),
  saleDate: timestamp("sale_date").notNull(), // 판매 일자
  productName: text("product_name").notNull(), // 상품명
  customerName: text("customer_name"), // 고객명
  paymentMethod: text("payment_method").notNull().default("현금"), // 결제 방법 (현금, 카드, 계좌이체)
  period: text("period"), // 회차/기간
  amount: integer("amount").notNull(), // 매출액
  staffId: integer("staff_id").references(() => staff.id), // 담당 직원
  notes: text("notes"), // 비고
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 회원 운동 용품 대여 기록 (Member Equipment Rental Records)
// DB 구조에 맞게 수정됨 (Updated to match actual DB structure)
export const memberEquipment = pgTable("member_equipment", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  equipmentName: text("equipment_name"), // 용품명
  equipmentType: text("equipment_type"), // 용품 유형
  rentalDate: timestamp("rental_date"), // 대여일
  returnDate: timestamp("return_date"), // 반납일
  status: text("status").notNull().default("대여중"), // 대여중, 반납완료
  notes: text("notes"),
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 회원 락커 이용 기록 (Member Locker Usage Records)
// DB 구조에 맞게 수정됨 (Updated to match actual DB structure)
// lockerId는 락커 페이지에서 배정하므로 nullable (lockerId is nullable - assigned from locker page)
export const memberLockers = pgTable("member_lockers", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  lockerId: integer("locker_id").references(() => lockers.id),
  lockerSection: text("locker_section"), // 선택한 락커 상품명 (Selected locker product name)
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  monthlyFee: integer("monthly_fee"),
  status: text("status").notNull().default("사용중"), // 사용중, 만료, 취소
  notes: text("notes"),
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 회원 정지 기록 시스템 (Member Suspension Records System)
// DB 구조에 맞게 수정됨 (Updated to match actual DB structure)
export const suspensions = pgTable("suspensions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  memberName: text("member_name"), // 회원명 (denormalized)
  membershipId: integer("membership_id").references(() => memberships.id),
  startDate: timestamp("start_date").notNull(), // 정지 시작일
  endDate: timestamp("end_date"), // 정지 종료일
  reason: text("reason").notNull(), // 정지 사유
  status: text("status").notNull().default("활성"), // 활성, 해제, 만료
  notes: text("notes"), // 비고
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 회원 정보 수정 기록 시스템 (Member Modification Records System)
export const memberModifications = pgTable("member_modifications", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  fieldName: text("field_name").notNull(), // 수정된 필드명
  oldValue: text("old_value"), // 기존 값
  newValue: text("new_value"), // 새 값
  modifiedBy: text("modified_by"), // 수정자
  modificationDate: timestamp("modification_date").defaultNow().notNull(),
  reason: text("reason"), // 수정 사유
  notes: text("notes"), // 비고
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 락커 설정 시스템 (Locker Settings System)
export const lockerSettings = pgTable("locker_settings", {
  id: serial("id").primaryKey(),
  totalLockers: integer("total_lockers").notNull().default(100), // 전체 락커 수
  sections: text("sections").array().notNull().default(['오전반', '오후반', '종일반']), // 구역 목록 (기존 호환성)
  sectionDetails: jsonb("section_details").$type<Array<{name: string; createdBy: string; createdAt: string; lockerCount?: number; startNumber?: number; rowCount?: number; columnCount?: number; monthlyFee?: number}>>().default([]), // 구역 상세정보 (섹션명, 추가자, 추가일, 락커배치, 월 이용료)
  defaultMonthlyFee: integer("default_monthly_fee").notNull().default(10000), // 기본 월 이용료
  warningDays: integer("warning_days").notNull().default(7), // 만료 알림 일수
  autoExpireEnabled: boolean("auto_expire_enabled").notNull().default(true), // 자동 만료 활성화
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 단체 연장 시스템 (Group Extension System)
// DB 구조에 맞게 수정됨 (Updated to match actual DB structure)
export const groupExtensions = pgTable("group_extensions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id), // 단일 회원 ID
  memberName: text("member_name"), // 회원명 (denormalized)
  extensionType: text("extension_type"), // 연장 유형
  originalEndDate: timestamp("original_end_date"), // 기존 종료일
  newEndDate: timestamp("new_end_date"), // 새 종료일
  extensionDays: integer("extension_days").notNull(), // 연장 일수
  reason: text("reason").notNull(), // 연장 사유
  notes: text("notes"), // 비고
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 키오스크 공지 테이블 (Kiosk notices table)
export const kioskNotices = pgTable("kiosk_notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // 공지 제목
  content: text("content").notNull(), // 공지 내용
  isActive: boolean("is_active").notNull().default(true), // 활성화 여부
  displayOrder: integer("display_order").notNull().default(0), // 표시 순서
  startDate: timestamp("start_date"), // 게시 시작일
  endDate: timestamp("end_date"), // 게시 종료일
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  phone: true,
  franchiseId: true,
});

export const insertFranchiseSchema = createInsertSchema(franchises).pick({
  name: true,
  type: true,
  description: true,
  status: true,
  code: true,
  parentId: true,
  ownerName: true,
  ownerPhone: true,
  businessName: true,
  wellnessCategory: true,
  region: true,
  operatingHours: true,
  mainPrograms: true,
  primaryAudience: true,
  philosophy: true,
  topConcern: true,
  profileCompletedAt: true,
}).extend({
  status: z.string().optional(),
  code: z.string().optional().nullable(),
  parentId: z.number().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerPhone: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  // OUHVE ABM Business Profile
  wellnessCategory: z.enum(["헬스장", "PT샵", "필라테스", "요가", "뷰티샵", "복합"]).optional().nullable(),
  region: z.string().optional().nullable(),
  operatingHours: z.record(z.string()).optional().nullable(),
  mainPrograms: z.array(z.string()).optional().nullable(),
  primaryAudience: z.string().optional().nullable(),
  philosophy: z.string().optional().nullable(),
  topConcern: z.string().optional().nullable(),
  profileCompletedAt: z.date().optional().nullable(),
});

// OUHVE ABM — Business Profile completion check
export const businessProfileSchema = z.object({
  wellnessCategory: z.enum(["헬스장", "PT샵", "필라테스", "요가", "뷰티샵", "복합"]),
  region: z.string().min(1),
  operatingHours: z.record(z.string()),
  mainPrograms: z.array(z.string()).min(1),
  primaryAudience: z.string().min(1),
  philosophy: z.string().min(10),
  topConcern: z.string().min(10),
});
export type BusinessProfile = z.infer<typeof businessProfileSchema>;

export const insertMemberSchema = createInsertSchema(members).pick({
  name: true,
  phone: true,
  status: true,
  gender: true,
  birthDate: true,
  address: true,
  email: true,
  emergencyContact: true,
  occupation: true,
  joinSource: true,
  notes: true,
  franchiseId: true,
}).extend({
  // Make optional fields truly optional for form handling
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  occupation: z.string().optional(),
  joinSource: z.string().optional(),
  notes: z.string().optional(),
});

export const insertMembershipSchema = createInsertSchema(memberships).pick({
  memberId: true,
  type: true,
  startDate: true,
  endDate: true,
  totalSessions: true,
  price: true,
  instructorId: true,
  status: true,
}).extend({
  instructorId: z.number().optional(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  memberId: true,
  membershipId: true,
  amount: true,
  paymentMethod: true,
  description: true,
  staffId: true,
  productId: true,
  status: true,
  franchiseId: true,
}).extend({
  membershipId: z.number().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  franchiseId: z.number().optional(),
});

export const insertStaffSchema = createInsertSchema(staff).pick({
  name: true,
  phone: true,
  email: true,
  position: true,
  department: true,
  hireDate: true,
  resignationDate: true,
  birthDate: true,
  address: true,
  emergencyContact: true,
  salary: true,
  workType: true,
  workDays: true,
  workHours: true,
  specialties: true,
  certifications: true,
  status: true,
  approvalStatus: true,
  notes: true,
  profileImage: true,
  franchiseId: true,
}).extend({
  approvalStatus: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  department: z.string().optional(),
  hireDate: z.string().transform(val => val ? new Date(val) : new Date()),
  resignationDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  salary: z.number().optional(),
  workDays: z.array(z.string()).optional(),
  workHours: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  notes: z.string().optional(),
  profileImage: z.string().optional(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  price: true,
  duration: true,
  durationType: true,
  sessions: true,
  category: true,
  description: true,
  status: true,
  appExposed: true,
  franchiseId: true,
}).extend({
  duration: z.number().optional(),
  sessions: z.number().optional(),
  description: z.string().optional(),
  appExposed: z.boolean().optional(),
  // 🆕 수업 상품 필드 - optional로 추가 (Lesson product fields - added as optional)
  instructorId: z.number().optional().nullable(),
  lessonType: z.string().optional().nullable(),
  // 숫자 변환 처리 (Handle number coercion for string inputs)
  maxParticipants: z.preprocess((val) => val === null || val === undefined ? val : Number(val), z.number().optional().nullable()),
  minParticipants: z.preprocess((val) => val === null || val === undefined ? val : Number(val), z.number().optional().nullable()),
  // 🆕 그룹 수업 스케줄 필드 (Group lesson schedule fields)
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  operatingDays: z.array(z.string()).optional().nullable(),
  // 🆕 락커 상품 필드 (Locker product field)
  lockerSection: z.string().optional().nullable(),
}).refine(
  // 🔒 그룹 수업일 때 필수 필드 검증 (Validate required fields for group lessons)
  (data) => {
    if (data.lessonType === "그룹 수업") {
      const hasSchedule = data.startTime && data.endTime && 
                          data.operatingDays && data.operatingDays.length > 0;
      const min = Number(data.minParticipants);
      const max = Number(data.maxParticipants);
      const hasValidMin = !isNaN(min) && min > 0;
      const hasValidMax = !isNaN(max) && max > 0;
      const hasValidCapacity = hasValidMin && hasValidMax && max >= min;
      return hasSchedule && hasValidCapacity;
    }
    return true;
  },
  {
    message: "그룹 수업은 수업 시간, 운영 요일, 정원(>=최소 인원), 최소 인원이 필수입니다",
    path: ["lessonType"],
  }
);

export const insertLockerSchema = createInsertSchema(lockers).pick({
  number: true,
  section: true,
  type: true,
  status: true,
  memberId: true,
  startDate: true,
  endDate: true,
  monthlyFee: true,
  notes: true,
  franchiseId: true,
}).extend({
  number: z.coerce.number(),
  memberId: z.preprocess((val) => val === "" || val === null || val === undefined ? null : Number(val), z.number().optional().nullable()),
  monthlyFee: z.preprocess((val) => val === "" || val === null || val === undefined ? 0 : Number(val), z.number().default(0)),
  startDate: z.preprocess((val) => val === "" ? null : val, z.string().optional().nullable()),
  endDate: z.preprocess((val) => val === "" ? null : val, z.string().optional().nullable()),
});

export const insertLockerRecoverySchema = createInsertSchema(lockerRecoveries).pick({
  lockerId: true,
  lockerNumber: true,
  lockerSection: true,
  memberId: true,
  memberName: true,
  reason: true,
  notes: true,
  recoveredBy: true,
  franchiseId: true,
}).extend({
  lockerId: z.number(),
  lockerNumber: z.number(),
  memberId: z.number().optional().nullable(),
  notes: z.string().optional(),
});

export const insertMemberEquipmentSchema = createInsertSchema(memberEquipment).pick({
  memberId: true,
  equipmentName: true,
  equipmentType: true,
  rentalDate: true,
  returnDate: true,
  status: true,
  notes: true,
  franchiseId: true,
}).extend({
  equipmentName: z.string().optional(),
  equipmentType: z.string().optional(),
  notes: z.string().optional(),
});

export const insertMemberLockersSchema = createInsertSchema(memberLockers).pick({
  memberId: true,
  lockerId: true,
  lockerSection: true,
  startDate: true,
  endDate: true,
  monthlyFee: true,
  status: true,
  notes: true,
  franchiseId: true,
}).extend({
  lockerId: z.number().optional().nullable(),
  lockerSection: z.string().optional(),
  monthlyFee: z.number().optional(),
  notes: z.string().optional(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  memberId: true,
  checkInTime: true,
  checkOutTime: true,
  date: true,
  notes: true,
  franchiseId: true,
}).extend({
  checkInTime: z.string(),
  checkOutTime: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  title: true,
  description: true,
  instructorId: true,
  startTime: true,
  endTime: true,
  dayOfWeek: true,
  color: true,
  maxParticipants: true,
  currentParticipants: true,
  isActive: true,
  franchiseId: true,
}).extend({
  description: z.string().optional(),
  instructorId: z.number().optional(),
  maxParticipants: z.number().optional(),
  currentParticipants: z.number().optional(),
});

export const insertPersonalTrainingSchema = createInsertSchema(personalTraining).pick({
  memberId: true,
  instructorId: true,
  productId: true,
  totalSessions: true,
  remainingSessions: true,
  purchaseDate: true,
  expiryDate: true,
  scheduledDays: true,
  preferredStartTime: true,
  preferredEndTime: true,
  status: true,
  notes: true,
  franchiseId: true,
}).extend({
  instructorId: z.number().optional(),
  productId: z.number().optional(),
  purchaseDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  expiryDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  scheduledDays: z.array(z.string()).optional(),
  preferredStartTime: z.string().optional().nullable(),
  preferredEndTime: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const insertPtSessionSchema = createInsertSchema(ptSessions).pick({
  ptId: true,
  instructorId: true,
  scheduledDate: true,
  actualDate: true,
  duration: true,
  status: true,
  sessionNotes: true,
  franchiseId: true,
}).extend({
  actualDate: z.string().optional(),
  duration: z.number().optional(),
  sessionNotes: z.string().optional(),
});



export const insertOtApplicationSchema = createInsertSchema(otApplications).pick({
  memberId: true,
  preferredInstructorId: true,
  productId: true,
  purchaseDate: true,
  expiryDate: true,
  totalOtSessions: true,
  preferredSchedule: true,
  status: true,
  notes: true,
  franchiseId: true,
}).extend({
  preferredInstructorId: z.number().optional(),
  productId: z.number().optional(),
  expiryDate: z.string().optional(),
  preferredSchedule: z.string().optional(),
  notes: z.string().optional(),
});

export const insertGroupLessonSchema = createInsertSchema(groupLessons).pick({
  name: true,
  instructorId: true,
  instructor: true,
  time: true,
  startTime: true,
  endTime: true,
  duration: true,
  dayOfWeek: true,
  operatingDays: true,
  maxParticipants: true,
  minParticipants: true,
  participants: true,
  capacity: true,
  waitList: true,
  status: true,
  notes: true,
  price: true,
  productId: true,
  franchiseId: true,
}).extend({
  instructorId: z.number().optional().nullable(),
  time: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  dayOfWeek: z.number().optional(),
  operatingDays: z.array(z.string()).optional(),
  minParticipants: z.number().optional(),
  capacity: z.string().optional(),
  waitList: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().optional(),
  productId: z.number().optional().nullable(),
});

export const insertGroupLessonEnrollmentSchema = createInsertSchema(groupLessonEnrollments).pick({
  memberId: true,
  groupLessonId: true,
  productId: true,
  paymentId: true,
  price: true,
  enrollmentDate: true,
  status: true,
  notes: true,
  franchiseId: true,
}).extend({
  productId: z.number().optional().nullable(),
  paymentId: z.number().optional().nullable(),
  price: z.number().optional(),
  enrollmentDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export const insertTrainerRecordSchema = createInsertSchema(trainerRecords).pick({
  memberId: true,
  trainerId: true,
  recordType: true,
  title: true,
  content: true,
  recordDate: true,
  attachments: true,
  tags: true,
  isPrivate: true,
  franchiseId: true,
}).extend({
  recordDate: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
});

export const insertMemberMeasurementSchema = createInsertSchema(memberMeasurements).pick({
  memberId: true,
  measurementDate: true,
  weight: true,
  bodyFatPercentage: true,
  muscleMass: true,
  height: true,
  bmi: true,
  measurements: true,
  notes: true,
  measuredBy: true,
  franchiseId: true,
}).extend({
  measurementDate: z.string().optional(),
  weight: z.number().optional(),
  bodyFatPercentage: z.number().optional(),
  muscleMass: z.number().optional(),
  height: z.number().optional(),
  bmi: z.number().optional(),
  measurements: z.string().optional(),
  notes: z.string().optional(),
  measuredBy: z.number().optional(),
});

export const insertConsultationSchema = createInsertSchema(consultations).pick({
  customerName: true,
  phone: true,
  gender: true,
  birthDate: true,
  consultationType: true,
  customConsultationType: true,
  consultationDate: true,
  purpose: true,
  result: true,
  counselorId: true,
  method: true,
  service: true,
  notes: true,
  status: true,
  followUpDate: true,
  franchiseId: true,
}).extend({
  customConsultationType: z.string().optional().nullable(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  consultationDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  purpose: z.string().optional(),
  result: z.string().optional(),
  counselorId: z.number().optional(),
  method: z.string().optional(),
  service: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertContractSchema = createInsertSchema(contracts).pick({
  title: true,
  content: true,
  fontSize: true,
  fontFamily: true,
  textColor: true,
  backgroundColor: true,
  zoom: true,
  isActive: true,
  isTemplate: true,
  templateCategory: true,
  lastEditDate: true,
  franchiseId: true,
}).extend({
  fontSize: z.string().optional(),
  fontFamily: z.string().optional(),
  textColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  zoom: z.number().optional(),
  isActive: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  templateCategory: z.string().optional(),
  lastEditDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  author: true,
  isImportant: true,
  status: true,
  franchiseId: true,
}).extend({
  author: z.string().optional(),
  isImportant: z.boolean().optional(),
  status: z.string().optional(),
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Insert schemas for new tables
export const insertRefundSchema = createInsertSchema(refunds).pick({
  memberId: true,
  memberName: true,
  refundDate: true,
  originalAmount: true,
  refundAmount: true,
  refundReason: true,
  productName: true,
  productType: true,
  productId: true,
  status: true,
  notes: true,
  processedBy: true,
  franchiseId: true,
}).extend({
  memberName: z.string().optional(),
  originalAmount: z.number().optional(),
  productName: z.string().optional(),
  productType: z.string().optional(),
  productId: z.number().optional(),
  processedBy: z.string().optional(),
  notes: z.string().optional(),
  refundDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return new Date();
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertSuspensionSchema = createInsertSchema(suspensions).pick({
  memberId: true,
  memberName: true,
  membershipId: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
  notes: true,
  franchiseId: true,
}).extend({
  memberName: z.string().optional(),
  membershipId: z.number().optional(),
  startDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  notes: z.string().optional(),
});

export const insertMemberModificationSchema = createInsertSchema(memberModifications).pick({
  memberId: true,
  fieldName: true,
  oldValue: true,
  newValue: true,
  modifiedBy: true,
  modificationDate: true,
  reason: true,
  notes: true,
  franchiseId: true,
}).extend({
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  modifiedBy: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const insertGroupExtensionSchema = createInsertSchema(groupExtensions).pick({
  memberId: true,
  memberName: true,
  extensionType: true,
  originalEndDate: true,
  newEndDate: true,
  extensionDays: true,
  reason: true,
  notes: true,
  franchiseId: true,
}).extend({
  memberId: z.number().optional(),
  memberName: z.string().optional(),
  extensionType: z.string().optional(),
  notes: z.string().optional(),
  originalEndDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  newEndDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type Refund = typeof refunds.$inferSelect;

export const insertOtherSaleSchema = createInsertSchema(otherSales).pick({
  saleDate: true,
  productName: true,
  customerName: true,
  paymentMethod: true,
  period: true,
  amount: true,
  staffId: true,
  notes: true,
  franchiseId: true,
}).extend({
  customerName: z.string().optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertOtherSale = z.infer<typeof insertOtherSaleSchema>;
export type OtherSale = typeof otherSales.$inferSelect;

export type InsertSuspension = z.infer<typeof insertSuspensionSchema>;
export type Suspension = typeof suspensions.$inferSelect;

export type InsertMemberModification = z.infer<typeof insertMemberModificationSchema>;
export type MemberModification = typeof memberModifications.$inferSelect;

export type InsertGroupExtension = z.infer<typeof insertGroupExtensionSchema>;
export type GroupExtension = typeof groupExtensions.$inferSelect;

// 키오스크 공지 스키마 (Kiosk Notice Schema)
export const insertKioskNoticeSchema = createInsertSchema(kioskNotices).pick({
  title: true,
  content: true,
  isActive: true,
  displayOrder: true,
  startDate: true,
  endDate: true,
  franchiseId: true,
});

export type InsertKioskNotice = z.infer<typeof insertKioskNoticeSchema>;
export type KioskNotice = typeof kioskNotices.$inferSelect;

// 락커 설정 스키마 (Locker Settings Schema)
export const insertLockerSettingsSchema = createInsertSchema(lockerSettings).pick({
  totalLockers: true,
  sections: true,
  sectionDetails: true,
  defaultMonthlyFee: true,
  warningDays: true,
  autoExpireEnabled: true,
  franchiseId: true,
});

export type InsertLockerSettings = z.infer<typeof insertLockerSettingsSchema>;
export type LockerSettings = typeof lockerSettings.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  franchises: many(franchises),
}));

export const franchisesRelations = relations(franchises, ({ one, many }) => ({
  owner: one(users, {
    fields: [franchises.id],
    references: [users.id],
  }),
  members: many(members),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  franchise: one(franchises, {
    fields: [members.franchiseId],
    references: [franchises.id],
  }),
  memberships: many(memberships),
  payments: many(payments),
}));

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  member: one(members, {
    fields: [memberships.memberId],
    references: [members.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  membership: one(memberships, {
    fields: [payments.membershipId],
    references: [memberships.id],
  }),
}));

export const staffRelations = relations(staff, ({ one }) => ({
  franchise: one(franchises, {
    fields: [staff.franchiseId],
    references: [franchises.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  franchise: one(franchises, {
    fields: [products.franchiseId],
    references: [franchises.id],
  }),
}));

export const lockersRelations = relations(lockers, ({ one }) => ({
  franchise: one(franchises, {
    fields: [lockers.franchiseId],
    references: [franchises.id],
  }),
  member: one(members, {
    fields: [lockers.memberId],
    references: [members.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  franchise: one(franchises, {
    fields: [attendance.franchiseId],
    references: [franchises.id],
  }),
  member: one(members, {
    fields: [attendance.memberId],
    references: [members.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  franchise: one(franchises, {
    fields: [schedules.franchiseId],
    references: [franchises.id],
  }),
  instructor: one(staff, {
    fields: [schedules.instructorId],
    references: [staff.id],
  }),
}));

export const personalTrainingRelations = relations(personalTraining, ({ one, many }) => ({
  member: one(members, {
    fields: [personalTraining.memberId],
    references: [members.id],
  }),
  instructor: one(staff, {
    fields: [personalTraining.instructorId],
    references: [staff.id],
  }),
  product: one(products, {
    fields: [personalTraining.productId],
    references: [products.id],
  }),
  franchise: one(franchises, {
    fields: [personalTraining.franchiseId],
    references: [franchises.id],
  }),
  sessions: many(ptSessions),
}));

export const ptSessionsRelations = relations(ptSessions, ({ one }) => ({
  pt: one(personalTraining, {
    fields: [ptSessions.ptId],
    references: [personalTraining.id],
  }),
  instructor: one(staff, {
    fields: [ptSessions.instructorId],
    references: [staff.id],
  }),
  franchise: one(franchises, {
    fields: [ptSessions.franchiseId],
    references: [franchises.id],
  }),
}));

export const otApplicationsRelations = relations(otApplications, ({ one }) => ({
  member: one(members, {
    fields: [otApplications.memberId],
    references: [members.id],
  }),
  preferredInstructor: one(staff, {
    fields: [otApplications.preferredInstructorId],
    references: [staff.id],
  }),
  product: one(products, {
    fields: [otApplications.productId],
    references: [products.id],
  }),
  franchise: one(franchises, {
    fields: [otApplications.franchiseId],
    references: [franchises.id],
  }),
}));

export const consultationsRelations = relations(consultations, ({ one }) => ({
  counselor: one(staff, {
    fields: [consultations.counselorId],
    references: [staff.id],
  }),
  franchise: one(franchises, {
    fields: [consultations.franchiseId],
    references: [franchises.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFranchise = z.infer<typeof insertFranchiseSchema>;
export type Franchise = typeof franchises.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertLocker = z.infer<typeof insertLockerSchema>;
export type Locker = typeof lockers.$inferSelect;
export type InsertLockerRecovery = z.infer<typeof insertLockerRecoverySchema>;
export type LockerRecovery = typeof lockerRecoveries.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertPersonalTraining = z.infer<typeof insertPersonalTrainingSchema>;
export type PersonalTraining = typeof personalTraining.$inferSelect;
export type InsertPtSession = z.infer<typeof insertPtSessionSchema>;
export type PtSession = typeof ptSessions.$inferSelect;
export type InsertOtApplication = z.infer<typeof insertOtApplicationSchema>;
export type OtApplication = typeof otApplications.$inferSelect;
export type InsertTrainerRecord = z.infer<typeof insertTrainerRecordSchema>;
export type TrainerRecord = typeof trainerRecords.$inferSelect;
export type InsertMemberMeasurement = z.infer<typeof insertMemberMeasurementSchema>;
export type MemberMeasurement = typeof memberMeasurements.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;
export type InsertGroupLesson = z.infer<typeof insertGroupLessonSchema>;
export type GroupLesson = typeof groupLessons.$inferSelect;

export type InsertGroupLessonEnrollment = z.infer<typeof insertGroupLessonEnrollmentSchema>;
export type GroupLessonEnrollment = typeof groupLessonEnrollments.$inferSelect;

// OT 프로그램 테이블 (OT Program Table)
export const otPrograms = pgTable("ot_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 프로그램명
  description: text("description"), // 프로그램 설명
  programType: text("program_type").notNull().default("개인"), // 개인/그룹
  price: integer("price").notNull().default(0), // 가격
  duration: integer("duration"), // 기간 (일 단위)
  sessions: integer("sessions"), // 총 세션 수
  maxParticipants: integer("max_participants"), // 그룹일 경우 최대 인원
  instructorId: integer("instructor_id"), // 담당 강사 ID
  isActive: boolean("is_active").notNull().default(true), // 활성 여부
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOtProgramSchema = createInsertSchema(otPrograms).pick({
  name: true,
  description: true,
  programType: true,
  price: true,
  duration: true,
  sessions: true,
  maxParticipants: true,
  instructorId: true,
  isActive: true,
  franchiseId: true,
});

export type InsertOtProgram = z.infer<typeof insertOtProgramSchema>;
export type OtProgram = typeof otPrograms.$inferSelect;

// 센터 프로그램 테이블 - 센터정보에 표시할 수업 선택 (Center Programs Table)
export const centerPrograms = pgTable("center_programs", {
  id: serial("id").primaryKey(),
  programType: text("program_type").notNull(), // 'group' | 'personal'
  programId: integer("program_id").notNull(), // 원본 수업 ID
  franchiseId: integer("franchise_id").references(() => franchises.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCenterProgramSchema = createInsertSchema(centerPrograms).pick({
  programType: true,
  programId: true,
  franchiseId: true,
});

export type InsertCenterProgram = z.infer<typeof insertCenterProgramSchema>;
export type CenterProgram = typeof centerPrograms.$inferSelect;

// PG 거래 테이블 (PG Transactions - 빌게이트 등 PG사 결제 기록)
export const pgTransactions = pgTable("pg_transactions", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").references(() => franchises.id).notNull(),
  memberId: integer("member_id").references(() => members.id), // nullable: 비회원 결제 가능
  paymentId: integer("payment_id").references(() => payments.id), // nullable: 기존 결제와 연동
  orderId: text("order_id").notNull(), // 가맹점 주문번호
  orderDate: text("order_date").notNull(), // YYYYMMDDHH24MISS
  transactionId: text("transaction_id"), // PG사 거래번호
  serviceCode: text("service_code").notNull().default("0900"), // 0900=카드, 1000=이체, 1100=휴대폰
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, cancelled, failed
  responseCode: text("response_code"),
  responseMessage: text("response_message"),
  authNumber: text("auth_number"), // 승인번호
  authDate: text("auth_date"), // 승인일자
  paymentMethod: text("payment_method"), // card, transfer, phone, virtual_account
  itemName: text("item_name"),
  itemCode: text("item_code"),
  userName: text("user_name"), // 구매자명
  userPhone: text("user_phone"), // 구매자 연락처
  userEmail: text("user_email"),
  cancelType: text("cancel_type"), // C=전체취소, P=부분취소
  cancelAmount: integer("cancel_amount"),
  cancelDate: text("cancel_date"),
  linkPaymentUrl: text("link_payment_url"), // 링크결제 URL
  pgProvider: text("pg_provider").notNull().default("billgate"),
  metadata: text("metadata"), // JSON 추가 데이터
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PG 상품 테이블 (PG Products - PG 결제용 상품 관리)
export const pgProducts = pgTable("pg_products", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").references(() => franchises.id).notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  itemCode: text("item_code").notNull(), // PG 상품코드
  description: text("description"),
  category: text("category").default("기타"), // 회원권, PT, 기타
  isActive: boolean("is_active").notNull().default(true),
  linkPaymentUrl: text("link_payment_url"), // 결제 링크 URL (Link payment URL)
  orderId: text("order_id"), // 링크결제용 주문번호 (Order ID for link payment)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PG 거래 Insert 스키마 (PG Transaction Insert Schema)
export const insertPgTransactionSchema = createInsertSchema(pgTransactions).pick({
  franchiseId: true,
  memberId: true,
  paymentId: true,
  orderId: true,
  orderDate: true,
  transactionId: true,
  serviceCode: true,
  amount: true,
  status: true,
  responseCode: true,
  responseMessage: true,
  authNumber: true,
  authDate: true,
  paymentMethod: true,
  itemName: true,
  itemCode: true,
  userName: true,
  userPhone: true,
  userEmail: true,
  cancelType: true,
  cancelAmount: true,
  cancelDate: true,
  linkPaymentUrl: true,
  pgProvider: true,
  metadata: true,
}).extend({
  memberId: z.number().optional().nullable(),
  paymentId: z.number().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  responseCode: z.string().optional().nullable(),
  responseMessage: z.string().optional().nullable(),
  authNumber: z.string().optional().nullable(),
  authDate: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  itemName: z.string().optional().nullable(),
  itemCode: z.string().optional().nullable(),
  userName: z.string().optional().nullable(),
  userPhone: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
  cancelType: z.string().optional().nullable(),
  cancelAmount: z.number().optional().nullable(),
  cancelDate: z.string().optional().nullable(),
  linkPaymentUrl: z.string().optional().nullable(),
  metadata: z.string().optional().nullable(),
});

export type InsertPgTransaction = z.infer<typeof insertPgTransactionSchema>;
export type PgTransaction = typeof pgTransactions.$inferSelect;

// PG 상품 Insert 스키마 (PG Product Insert Schema)
export const insertPgProductSchema = createInsertSchema(pgProducts).pick({
  franchiseId: true,
  name: true,
  price: true,
  itemCode: true,
  description: true,
  category: true,
  isActive: true,
  linkPaymentUrl: true,
  orderId: true,
}).extend({
  description: z.string().optional().nullable(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  linkPaymentUrl: z.string().optional().nullable(),
  orderId: z.string().optional().nullable(),
});

export type InsertPgProduct = z.infer<typeof insertPgProductSchema>;
export type PgProduct = typeof pgProducts.$inferSelect;

// 링크결제 SMS 발송 이력 (Link Payment SMS Logs)
export const linkPaymentSmsLogs = pgTable("link_payment_sms_logs", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").references(() => franchises.id).notNull(),
  pgProductId: integer("pg_product_id").references(() => pgProducts.id).notNull(),
  pgTransactionId: integer("pg_transaction_id").references(() => pgTransactions.id),
  sentByUserId: integer("sent_by_user_id").references(() => users.id).notNull(),
  sentByUsername: text("sent_by_username").notNull(), // 로그인 아이디 — 빠른 조회용 (Login ID for quick lookup)
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  linkUrl: text("link_url").notNull(),
  status: text("status").notNull().default("sent"), // sent | delivered | failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLinkPaymentSmsLogSchema = createInsertSchema(linkPaymentSmsLogs).pick({
  franchiseId: true,
  pgProductId: true,
  pgTransactionId: true,
  sentByUserId: true,
  sentByUsername: true,
  recipientPhone: true,
  recipientName: true,
  linkUrl: true,
  status: true,
  errorMessage: true,
}).extend({
  pgTransactionId: z.number().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  status: z.string().optional(),
  errorMessage: z.string().optional().nullable(),
});

export type InsertLinkPaymentSmsLog = z.infer<typeof insertLinkPaymentSmsLogSchema>;
export type LinkPaymentSmsLog = typeof linkPaymentSmsLogs.$inferSelect;

// 결제 단말기 테이블 (Payment Terminals — 카드 단말기 관리)
export const paymentTerminals = pgTable("payment_terminals", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").references(() => franchises.id).notNull(),
  name: text("name").notNull(), // 단말기 이름 (예: "카운터 1번 단말기")
  binNumber: text("bin_number").notNull(), // BIN 번호 (단말기 고유 식별번호)
  status: text("status").notNull().default("활성"), // 활성, 비활성
  description: text("description"), // 메모/설명
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentTerminalSchema = createInsertSchema(paymentTerminals).pick({
  franchiseId: true,
  name: true,
  binNumber: true,
  status: true,
  description: true,
}).extend({
  status: z.string().optional(),
  description: z.string().optional().nullable(),
});

export type InsertPaymentTerminal = z.infer<typeof insertPaymentTerminalSchema>;
export type PaymentTerminal = typeof paymentTerminals.$inferSelect;
