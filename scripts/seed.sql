-- ============================================================
-- FitCRM 테스트 데이터 시드 스크립트
-- franchise_id = 1 (슈퍼관리자의 헬스장)
-- ============================================================

-- 기존 데이터 초기화 (순서 중요: FK 역순)
TRUNCATE TABLE pt_sessions, ot_applications, consultations, attendance,
  payments, personal_training, memberships, members,
  staff, products RESTART IDENTITY CASCADE;

-- ============================================================
-- 1. 상품 (Products)
-- ============================================================
INSERT INTO products (name, price, duration, duration_type, sessions, category, description, status, app_exposed, franchise_id) VALUES
('1개월 회원권',   80000, 1, '월', NULL, '회원권', '헬스장 1개월 자유 이용', '활성', true, 1),
('3개월 회원권',  210000, 3, '월', NULL, '회원권', '헬스장 3개월 이용 (10% 할인)', '활성', true, 1),
('6개월 회원권',  380000, 6, '월', NULL, '회원권', '헬스장 6개월 이용 (20% 할인)', '활성', true, 1),
('PT 10회권',    500000, 3, '월',   10, '개인PT', '1:1 개인 트레이닝 10회', '활성', true, 1),
('PT 20회권',    900000, 5, '월',   20, '개인PT', '1:1 개인 트레이닝 20회 (10% 할인)', '활성', true, 1),
('락커 1개월',    30000, 1, '월', NULL, '락커',   '개인 락커 1개월 이용권', '활성', true, 1),
('필라테스 그룹 1개월', 120000, 1, '월', NULL, '그룹수업', '필라테스 그룹 수업 월정액', '활성', true, 1);
-- products IDs: 1~7

-- ============================================================
-- 2. 직원 (Staff)  — 트레이너 3 + 센터장 1
-- ============================================================
INSERT INTO staff (name, phone, email, position, department, hire_date, salary, work_type, work_days, work_hours, specialties, certifications, status, approval_status, franchise_id) VALUES
('김민준', '010-1111-2222', 'minjun@fitgym.com',  '트레이너', '헬스팀',    '2022-08-01', 3000000, '정규직', ARRAY['월','화','수','목','금'],       '09:00-18:00', ARRAY['헬스','다이어트','근력'], ARRAY['생활스포츠지도사 2급','NSCA-CPT'], '재직', '승인', 1),
('이수진', '010-2222-3333', 'sujin@fitgym.com',   '트레이너', '필라테스팀','2023-03-01', 2800000, '정규직', ARRAY['화','수','목','금','토'],       '10:00-19:00', ARRAY['필라테스','체형교정'], ARRAY['필라테스지도사 1급'], '재직', '승인', 1),
('박지훈', '010-3333-4444', 'jihoon@fitgym.com',  '트레이너', '헬스팀',    '2021-05-10', 3200000, '정규직', ARRAY['월','화','수','목','금','토'], '08:00-17:00', ARRAY['보디빌딩','재활','헬스'], ARRAY['생활스포츠지도사 1급'], '재직', '승인', 1),
('최은영', '010-4444-5555', 'eunyoung@fitgym.com','센터장',  '관리팀',    '2020-01-02', 3500000, '정규직', ARRAY['월','화','수','목','금'],       '09:00-18:00', ARRAY['센터관리','상담'], ARRAY['체육지도사 2급'], '재직', '승인', 1);
-- staff IDs: 1=김민준, 2=이수진, 3=박지훈, 4=최은영

-- ============================================================
-- 3. 회원 (Members) — 25명
--    status: '활성 회원' | '만료 회원' | '정지 회원'
--    last_visit 다양화: AI 이탈 분석 테스트용
-- ============================================================
INSERT INTO members (name, phone, gender, birth_date, email, join_source, status, join_date, last_visit, product_id, franchise_id) VALUES
-- 정기 방문 (저위험) — 최근 1~5일 이내
('홍길동',   '010-1000-0001', '남', '1990-03-15', 'hong1@test.com',  '지인 소개', '활성 회원', NOW()-INTERVAL'120 days', NOW()-INTERVAL'1 day',  2, 1),
('김지영',   '010-1000-0002', '여', '1995-07-22', 'kim2@test.com',   '인스타그램', '활성 회원', NOW()-INTERVAL'90 days',  NOW()-INTERVAL'2 days', 3, 1),
('이준혁',   '010-1000-0003', '남', '1988-11-05', 'lee3@test.com',   '지인 소개', '활성 회원', NOW()-INTERVAL'180 days', NOW()-INTERVAL'1 day',  3, 1),
('박서연',   '010-1000-0004', '여', '1993-04-18', 'park4@test.com',  '검색',      '활성 회원', NOW()-INTERVAL'60 days',  NOW()-INTERVAL'3 days', 1, 1),
('최민수',   '010-1000-0005', '남', '1985-09-30', 'choi5@test.com',  '지인 소개', '활성 회원', NOW()-INTERVAL'200 days', NOW()-INTERVAL'2 days', 3, 1),
('정수아',   '010-1000-0006', '여', '1998-01-12', 'jung6@test.com',  '인스타그램', '활성 회원', NOW()-INTERVAL'45 days',  NOW()-INTERVAL'1 day',  2, 1),
('강동원',   '010-1000-0007', '남', '1992-06-25', 'kang7@test.com',  '지인 소개', '활성 회원', NOW()-INTERVAL'150 days', NOW()-INTERVAL'4 days', 3, 1),
('신유나',   '010-1000-0008', '여', '1996-08-14', 'shin8@test.com',  '블로그',    '활성 회원', NOW()-INTERVAL'30 days',  NOW()-INTERVAL'2 days', 1, 1),
('임태양',   '010-1000-0009', '남', '1991-12-03', 'lim9@test.com',   '지인 소개', '활성 회원', NOW()-INTERVAL'100 days', NOW()-INTERVAL'3 days', 2, 1),
('오채원',   '010-1000-0010', '여', '1994-02-28', 'oh10@test.com',   '검색',      '활성 회원', NOW()-INTERVAL'75 days',  NOW()-INTERVAL'1 day',  2, 1),
-- 중위험 — 8~14일 미방문
('윤성민',   '010-1000-0011', '남', '1989-05-17', 'yoon11@test.com', '지인 소개', '활성 회원', NOW()-INTERVAL'90 days',  NOW()-INTERVAL'8 days',  1, 1),
('한소희',   '010-1000-0012', '여', '1997-09-09', 'han12@test.com',  '인스타그램', '활성 회원', NOW()-INTERVAL'55 days',  NOW()-INTERVAL'10 days', 1, 1),
('배준영',   '010-1000-0013', '남', '1986-03-22', 'bae13@test.com',  '지인 소개', '활성 회원', NOW()-INTERVAL'120 days', NOW()-INTERVAL'13 days', 2, 1),
('서지민',   '010-1000-0014', '여', '1999-11-30', 'seo14@test.com',  '블로그',    '활성 회원', NOW()-INTERVAL'40 days',  NOW()-INTERVAL'9 days',  1, 1),
('권현우',   '010-1000-0015', '남', '1993-07-08', 'kwon15@test.com', '검색',      '활성 회원', NOW()-INTERVAL'85 days',  NOW()-INTERVAL'12 days', 2, 1),
-- 고위험 — 20일+ 미방문 or 회원권 만료 임박
('문지원',   '010-1000-0016', '여', '1990-04-14', 'moon16@test.com', '지인 소개', '활성 회원', NOW()-INTERVAL'110 days', NOW()-INTERVAL'22 days', 1, 1),
('송민기',   '010-1000-0017', '남', '1987-08-19', 'song17@test.com', '인스타그램', '활성 회원', NOW()-INTERVAL'95 days',  NOW()-INTERVAL'28 days', 1, 1),
('나예린',   '010-1000-0018', '여', '1995-12-25', 'na18@test.com',   '검색',      '활성 회원', NOW()-INTERVAL'70 days',  NOW()-INTERVAL'35 days', 2, 1),
-- 만료 회원
('조현철',   '010-1000-0019', '남', '1982-06-11', 'jo19@test.com',   '지인 소개', '만료 회원', NOW()-INTERVAL'365 days', NOW()-INTERVAL'45 days', NULL, 1),
('류미경',   '010-1000-0020', '여', '1988-02-07', 'ryu20@test.com',  '블로그',    '만료 회원', NOW()-INTERVAL'300 days', NOW()-INTERVAL'60 days', NULL, 1),
('황인호',   '010-1000-0021', '남', '1994-10-03', 'hwang21@test.com','검색',      '만료 회원', NOW()-INTERVAL'250 days', NOW()-INTERVAL'80 days', NULL, 1),
-- 추가 활성 회원
('안재원',   '010-1000-0022', '남', '1991-05-20', 'ahn22@test.com',  '지인 소개', '활성 회원', NOW()-INTERVAL'15 days',  NOW()-INTERVAL'5 days',  1, 1),
('김하늘',   '010-1000-0023', '여', '1996-03-11', 'sky23@test.com',  '인스타그램', '활성 회원', NOW()-INTERVAL'25 days',  NOW()-INTERVAL'3 days',  1, 1),
('이동훈',   '010-1000-0024', '남', '1983-09-27', 'dong24@test.com', '지인 소개', '활성 회원', NOW()-INTERVAL'50 days',  NOW()-INTERVAL'6 days',  2, 1),
('장수현',   '010-1000-0025', '여', '2000-01-15', 'su25@test.com',   '검색',      '활성 회원', NOW()-INTERVAL'20 days',  NOW()-INTERVAL'2 days',  1, 1);
-- member IDs: 1~25

-- ============================================================
-- 4. 회원권 (Memberships)
-- ============================================================
-- 활성 회원 1-18, 22-25에게 회원권 부여
INSERT INTO memberships (member_id, type, start_date, end_date, price, instructor_id, status, franchise_id) VALUES
(1,  '3개월 회원권', NOW()-INTERVAL'60 days',  NOW()+INTERVAL'30 days',  210000, 1, '활성', 1),
(2,  '6개월 회원권', NOW()-INTERVAL'30 days',  NOW()+INTERVAL'150 days', 380000, 2, '활성', 1),
(3,  '6개월 회원권', NOW()-INTERVAL'90 days',  NOW()+INTERVAL'90 days',  380000, 3, '활성', 1),
(4,  '1개월 회원권', NOW()-INTERVAL'10 days',  NOW()+INTERVAL'20 days',  80000,  1, '활성', 1),
(5,  '6개월 회원권', NOW()-INTERVAL'120 days', NOW()+INTERVAL'60 days',  380000, 3, '활성', 1),
(6,  '3개월 회원권', NOW()-INTERVAL'20 days',  NOW()+INTERVAL'70 days',  210000, 2, '활성', 1),
(7,  '6개월 회원권', NOW()-INTERVAL'80 days',  NOW()+INTERVAL'100 days', 380000, 1, '활성', 1),
(8,  '1개월 회원권', NOW()-INTERVAL'5 days',   NOW()+INTERVAL'25 days',  80000,  2, '활성', 1),
(9,  '3개월 회원권', NOW()-INTERVAL'50 days',  NOW()+INTERVAL'40 days',  210000, 3, '활성', 1),
(10, '3개월 회원권', NOW()-INTERVAL'40 days',  NOW()+INTERVAL'50 days',  210000, 1, '활성', 1),
(11, '1개월 회원권', NOW()-INTERVAL'15 days',  NOW()+INTERVAL'15 days',  80000,  1, '활성', 1),
(12, '1개월 회원권', NOW()-INTERVAL'10 days',  NOW()+INTERVAL'20 days',  80000,  2, '활성', 1),
(13, '3개월 회원권', NOW()-INTERVAL'60 days',  NOW()+INTERVAL'30 days',  210000, 3, '활성', 1),
(14, '1개월 회원권', NOW()-INTERVAL'12 days',  NOW()+INTERVAL'18 days',  80000,  2, '활성', 1),
(15, '3개월 회원권', NOW()-INTERVAL'45 days',  NOW()+INTERVAL'45 days',  210000, 1, '활성', 1),
(16, '1개월 회원권', NOW()-INTERVAL'25 days',  NOW()+INTERVAL'5 days',   80000,  3, '활성', 1),  -- 곧 만료!
(17, '1개월 회원권', NOW()-INTERVAL'28 days',  NOW()+INTERVAL'2 days',   80000,  1, '활성', 1),  -- 거의 만료!
(18, '3개월 회원권', NOW()-INTERVAL'40 days',  NOW()+INTERVAL'50 days',  210000, 2, '활성', 1),
(22, '1개월 회원권', NOW()-INTERVAL'5 days',   NOW()+INTERVAL'25 days',  80000,  1, '활성', 1),
(23, '1개월 회원권', NOW()-INTERVAL'8 days',   NOW()+INTERVAL'22 days',  80000,  2, '활성', 1),
(24, '3개월 회원권', NOW()-INTERVAL'20 days',  NOW()+INTERVAL'70 days',  210000, 3, '활성', 1),
(25, '1개월 회원권', NOW()-INTERVAL'10 days',  NOW()+INTERVAL'20 days',  80000,  1, '활성', 1);

-- ============================================================
-- 5. PT 등록 (Personal Training)
-- ============================================================
INSERT INTO personal_training (member_id, instructor_id, product_id, total_sessions, remaining_sessions, used_sessions, purchase_date, expiry_date, last_session_date, status, franchise_id) VALUES
(1,  1, 4, 10, 4,  6, NOW()-INTERVAL'60 days',  NOW()+INTERVAL'30 days',  NOW()-INTERVAL'3 days',  '활성', 1),
(3,  3, 4, 10, 7,  3, NOW()-INTERVAL'45 days',  NOW()+INTERVAL'45 days',  NOW()-INTERVAL'4 days',  '활성', 1),
(5,  1, 5, 20, 12, 8, NOW()-INTERVAL'90 days',  NOW()+INTERVAL'60 days',  NOW()-INTERVAL'2 days',  '활성', 1),
(7,  3, 4, 10, 6,  4, NOW()-INTERVAL'50 days',  NOW()+INTERVAL'40 days',  NOW()-INTERVAL'5 days',  '활성', 1),
(9,  1, 5, 20, 15, 5, NOW()-INTERVAL'40 days',  NOW()+INTERVAL'50 days',  NOW()-INTERVAL'3 days',  '활성', 1),
(13, 3, 4, 10, 2,  8, NOW()-INTERVAL'80 days',  NOW()+INTERVAL'10 days',  NOW()-INTERVAL'15 days', '활성', 1),
(18, 1, 4, 10, 8,  2, NOW()-INTERVAL'30 days',  NOW()+INTERVAL'60 days',  NOW()-INTERVAL'36 days', '활성', 1);
-- PT IDs: 1~7

-- ============================================================
-- 6. 출석 기록 (Attendance) — 최근 90일
-- ============================================================
-- 정기 방문 회원들 (member 1-10): 주 3~5회
DO $$
DECLARE
  m INT;
  d INT;
  visit_day TIMESTAMP;
BEGIN
  -- 활성 회원 정기 방문 (member 1~10)
  FOR m IN 1..10 LOOP
    FOR d IN 0..89 LOOP
      -- 약 4일에 한 번 방문 (약 22회/90일)
      IF (d % (2 + (m % 3))) = 0 THEN
        visit_day := NOW() - (d || ' days')::INTERVAL + '09:00:00'::INTERVAL + ((m * 17 % 8) || ' hours')::INTERVAL;
        -- last_visit 범위 내에만 삽입
        IF d >= 1 THEN  -- 고위험 회원 마지막 방문 고려
          INSERT INTO attendance (member_id, check_in_time, check_out_time, date, franchise_id)
          VALUES (m, visit_day, visit_day + INTERVAL'1.5 hours', visit_day, 1);
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- 중위험 회원 (11~15): 최근 8~13일 전까지만 방문
  FOR m IN 11..15 LOOP
    FOR d IN (8 + (m % 6))..89 LOOP
      IF (d % 4) = 0 THEN
        visit_day := NOW() - (d || ' days')::INTERVAL + '14:00:00'::INTERVAL;
        INSERT INTO attendance (member_id, check_in_time, check_out_time, date, franchise_id)
        VALUES (m, visit_day, visit_day + INTERVAL'1 hour', visit_day, 1);
      END IF;
    END LOOP;
  END LOOP;

  -- 고위험 회원 (16~18): 20일 이상 전까지만 방문
  FOR m IN 16..18 LOOP
    FOR d IN 22..89 LOOP
      IF (d % 5) = 0 THEN
        visit_day := NOW() - (d || ' days')::INTERVAL + '18:00:00'::INTERVAL;
        INSERT INTO attendance (member_id, check_in_time, check_out_time, date, franchise_id)
        VALUES (m, visit_day, visit_day + INTERVAL'1 hour', visit_day, 1);
      END IF;
    END LOOP;
  END LOOP;

  -- 추가 활성 회원 (22~25)
  FOR m IN 22..25 LOOP
    FOR d IN 1..15 LOOP
      IF (d % 3) = 0 THEN
        visit_day := NOW() - (d || ' days')::INTERVAL + '10:00:00'::INTERVAL;
        INSERT INTO attendance (member_id, check_in_time, check_out_time, date, franchise_id)
        VALUES (m, visit_day, visit_day + INTERVAL'1.5 hours', visit_day, 1);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- 7. 결제 (Payments) — 최근 6개월
-- ============================================================
-- 회원권 결제
INSERT INTO payments (member_id, amount, payment_method, payment_date, status, description, product_id, staff_id, franchise_id) VALUES
-- 2025년 9월
(19, 210000, '카드', NOW()-INTERVAL'150 days', '완료', '3개월 회원권', 2, 4, 1),
(20, 380000, '현금', NOW()-INTERVAL'148 days', '완료', '6개월 회원권', 3, 4, 1),
-- 2025년 10월
(1,  210000, '카드', NOW()-INTERVAL'120 days', '완료', '3개월 회원권', 2, 1, 1),
(21, 80000,  '카드', NOW()-INTERVAL'118 days', '완료', '1개월 회원권', 1, 4, 1),
(5,  380000, '카드', NOW()-INTERVAL'120 days', '완료', '6개월 회원권', 3, 3, 1),
(3,  380000, '카드', NOW()-INTERVAL'115 days', '완료', '6개월 회원권', 3, 3, 1),
(5,  900000, '카드', NOW()-INTERVAL'90 days',  '완료', 'PT 20회권',   5, 1, 1),
-- 2025년 11월
(7,  380000, '현금', NOW()-INTERVAL'95 days',  '완료', '6개월 회원권', 3, 1, 1),
(9,  210000, '카드', NOW()-INTERVAL'90 days',  '완료', '3개월 회원권', 2, 3, 1),
(9,  900000, '카드', NOW()-INTERVAL'88 days',  '완료', 'PT 20회권',   5, 1, 1),
(10, 210000, '카드', NOW()-INTERVAL'85 days',  '완료', '3개월 회원권', 2, 1, 1),
(13, 210000, '현금', NOW()-INTERVAL'80 days',  '완료', '3개월 회원권', 2, 3, 1),
(13, 500000, '카드', NOW()-INTERVAL'78 days',  '완료', 'PT 10회권',   4, 3, 1),
(15, 210000, '카드', NOW()-INTERVAL'80 days',  '완료', '3개월 회원권', 2, 1, 1),
(1,  30000,  '카드', NOW()-INTERVAL'90 days',  '완료', '락커 1개월',   6, 4, 1),
-- 2025년 12월
(6,  210000, '카드', NOW()-INTERVAL'60 days',  '완료', '3개월 회원권', 2, 2, 1),
(18, 210000, '현금', NOW()-INTERVAL'55 days',  '완료', '3개월 회원권', 2, 2, 1),
(18, 500000, '카드', NOW()-INTERVAL'50 days',  '완료', 'PT 10회권',   4, 1, 1),
(8,  80000,  '카드', NOW()-INTERVAL'50 days',  '완료', '1개월 회원권', 1, 2, 1),
(11, 80000,  '카드', NOW()-INTERVAL'45 days',  '완료', '1개월 회원권', 1, 1, 1),
(12, 80000,  '카드', NOW()-INTERVAL'50 days',  '완료', '1개월 회원권', 1, 2, 1),
(14, 80000,  '현금', NOW()-INTERVAL'48 days',  '완료', '1개월 회원권', 1, 2, 1),
(16, 80000,  '카드', NOW()-INTERVAL'55 days',  '완료', '1개월 회원권', 1, 3, 1),
(17, 80000,  '카드', NOW()-INTERVAL'55 days',  '완료', '1개월 회원권', 1, 1, 1),
(4,  80000,  '카드', NOW()-INTERVAL'45 days',  '완료', '1개월 회원권', 1, 2, 1),
(7,  500000, '카드', NOW()-INTERVAL'60 days',  '완료', 'PT 10회권',   4, 3, 1),
(1,  30000,  '카드', NOW()-INTERVAL'60 days',  '완료', '락커 1개월',   6, 4, 1),
-- 2026년 1월
(2,  380000, '카드', NOW()-INTERVAL'30 days',  '완료', '6개월 회원권', 3, 2, 1),
(3,  500000, '카드', NOW()-INTERVAL'30 days',  '완료', 'PT 10회권',   4, 3, 1),
(22, 80000,  '카드', NOW()-INTERVAL'15 days',  '완료', '1개월 회원권', 1, 4, 1),
(23, 80000,  '현금', NOW()-INTERVAL'8 days',   '완료', '1개월 회원권', 1, 4, 1),
(24, 210000, '카드', NOW()-INTERVAL'20 days',  '완료', '3개월 회원권', 2, 3, 1),
(25, 80000,  '카드', NOW()-INTERVAL'10 days',  '완료', '1개월 회원권', 1, 4, 1),
(10, 30000,  '카드', NOW()-INTERVAL'20 days',  '완료', '락커 1개월',   6, 4, 1),
-- 2026년 2월 (이번 달)
(1,  30000,  '카드', NOW()-INTERVAL'3 days',   '완료', '락커 1개월',   6, 4, 1),
(5,  380000, '카드', NOW()-INTERVAL'5 days',   '완료', '6개월 회원권', 3, 3, 1),
(6,  30000,  '카드', NOW()-INTERVAL'10 days',  '완료', '락커 1개월',   6, 4, 1),
(7,  210000, '카드', NOW()-INTERVAL'7 days',   '완료', '3개월 회원권', 2, 1, 1),
(9,  210000, '카드', NOW()-INTERVAL'6 days',   '완료', '3개월 회원권', 2, 3, 1),
(10, 500000, '카드', NOW()-INTERVAL'4 days',   '완료', 'PT 10회권',   4, 1, 1),
(22, 500000, '카드', NOW()-INTERVAL'5 days',   '완료', 'PT 10회권',   4, 3, 1);

-- ============================================================
-- 8. OT 신청 (OT Applications)
-- ============================================================
INSERT INTO ot_applications (member_id, preferred_instructor_id, product_id, purchase_date, expiry_date, total_ot_sessions, preferred_schedule, status, franchise_id) VALUES
(22, 1, 4, NOW()-INTERVAL'14 days', NOW()+INTERVAL'76 days', 2, '평일 오전', '대기',  1),
(23, 2, 4, NOW()-INTERVAL'7 days',  NOW()+INTERVAL'83 days', 2, '주말 오후', '대기',  1),
(25, 3, 1, NOW()-INTERVAL'9 days',  NOW()+INTERVAL'81 days', 1, '평일 오후', '승인',  1),
(4,  1, 2, NOW()-INTERVAL'8 days',  NOW()+INTERVAL'22 days', 1, '평일 저녁', '완료',  1),
(8,  2, 1, NOW()-INTERVAL'4 days',  NOW()+INTERVAL'26 days', 1, '주말 오전', '대기',  1);

-- ============================================================
-- 9. 상담 (Consultations)
-- ============================================================
INSERT INTO consultations (customer_name, phone, gender, consultation_type, consultation_date, purpose, result, counselor_id, method, status, franchise_id) VALUES
('정해인', '010-9000-0001', '남', '신규 상담', NOW()-INTERVAL'30 days', '다이어트 목적', '3개월 회원권 등록', 4, '방문', '완료', 1),
('손예진', '010-9000-0002', '여', '신규 상담', NOW()-INTERVAL'25 days', 'PT 문의', 'PT 20회권 등록', 1, '방문', '완료', 1),
('공유',   '010-9000-0003', '남', 'PT 상담',   NOW()-INTERVAL'20 days', '근력 향상', '상담 진행 중', 3, '방문', '진행 중', 1),
('김태리', '010-9000-0004', '여', '필라테스',  NOW()-INTERVAL'15 days', '체형 교정', '필라테스 등록 예정', 2, '전화', '진행 중', 1),
('박보검', '010-9000-0005', '남', '신규 상담', NOW()-INTERVAL'10 days', '건강 관리', '검토 중', 4, '방문', '진행 중', 1),
('전지현', '010-9000-0006', '여', '재등록',    NOW()-INTERVAL'7 days',  '재등록 문의', '6개월 등록 완료', 4, '방문', '완료', 1),
('이병헌', '010-9000-0007', '남', 'PT 상담',   NOW()-INTERVAL'5 days',  '다이어트+근력', '상담 예정', 1, '전화', '대기', 1),
('탕웨이', '010-9000-0008', '여', '신규 상담', NOW()-INTERVAL'3 days',  '요가 문의', '필라테스 전환 권유', 2, '방문', '진행 중', 1),
('유아인', '010-9000-0009', '남', '신규 상담', NOW()-INTERVAL'2 days',  '헬스 등록', '1개월 회원권 등록', 4, '방문', '완료', 1),
('김혜수', '010-9000-0010', '여', '재등록',    NOW()-INTERVAL'1 day',   '3개월 연장', '검토 중', 4, '방문', '진행 중', 1);

-- 완료 확인
SELECT 'products' AS table_name, COUNT(*) FROM products UNION ALL
SELECT 'staff',   COUNT(*) FROM staff UNION ALL
SELECT 'members', COUNT(*) FROM members UNION ALL
SELECT 'memberships', COUNT(*) FROM memberships UNION ALL
SELECT 'personal_training', COUNT(*) FROM personal_training UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance UNION ALL
SELECT 'payments', COUNT(*) FROM payments UNION ALL
SELECT 'ot_applications', COUNT(*) FROM ot_applications UNION ALL
SELECT 'consultations', COUNT(*) FROM consultations;
