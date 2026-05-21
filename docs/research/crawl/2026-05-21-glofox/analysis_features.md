# Glofox 기능 카탈로그 (ABC Fitness)

> Source: `docs/research/crawl/2026-05-21-glofox/pages-v2/` 31개 페이지
> Date: 2026-05-21
> Target: OUHVE ABM (M1~M12) 흡수 후보 도출

## 통계: 추출 57개 / AssistFit 중복 19개 / Glofox 고유 GAP 후보 33개 / 상위 우선 GAP 15개

> Glofox = ABC Fitness 산하 글로벌 boutique 피트니스 SaaS. 80+개국, 17개 언어, 30,000+ 고객. ABC Fitness 합병으로 AI(Churn Predictor, Intelligent Billing, ABC XLerate CRM) 모듈이 강하게 통합됨. Mindbody 대비 "class-based studio + modern app + 자동화" 포지셔닝.

---

## 1. 카테고리별 기능 카탈로그

### A. 회원·CRM·라이프사이클 (Member & CRM)

| # | 기능 | 출처 page | OUHVE 모듈 | AssistFit 중복? | 차별 포인트 |
|---|------|-----------|------------|----------------|------------|
| 1 | 통합 회원 프로필 (가입~갱신 단일 대시보드) | 7,16 | M2 | O | 동일 |
| 2 | 회원 라이프사이클 단계 추적 (Trial → First Class → Member) | 14,32 | M2/M5 | △ | 단계 자동 분류 + 단계별 트리거 |
| 3 | Family Membership (가족 멤버십, 1결제 다인 사용) | 10,40 | M4 | X | 글로벌 표준, 보호자등록과는 별개 개념 |
| 4 | 회원 출입 history 통합 (다지점 1뷰) | 13,15,34 | M3 | △ | Roaming Access — 어느 지점이든 |
| 5 | Waiver Capture (전자 면책 동의서) + 사진 캡처 | 37 | M4 | △ | 키오스크에서 일회용 waiver, 사진까지 |
| 6 | Member Milestone (100회 방문, 1주년 등) 자동 인지 | 13,32 | M2 | X | 마일스톤 기준 자동 트리거 |
| 7 | Member Loyalty/Reward (출석 기반 자동 보상) | 10 | M2/M3 | X | 출석 → 자동 할인/리워드 |

### B. 출입·체크인 (Check-in / Access)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 8 | Barcode/Quick Check-in | 3,13 | M3 | O | 동일 |
| 9 | Kiosk Mode (셀프 체크인 + waiver + photo) | 6,37 | M3 | O | 키오스크 흡수됨 |
| 10 | Door Access Integration (Kisi 등 출입문 연동) | 6,7 | M3 | X | 외부 도어락 시스템 직접 연동 |
| 11 | Eligibility/Policy Check (체크인 시 자격/정지 자동 검증) | 6,8 | M3 | △ | Sub-policy 차단 자동화 강함 |

### C. 예약·스케줄·수업 (Booking & Scheduling)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 12 | Class 스케줄링 + Capacity Cap | 3,4,7,8 | M12 | O | 동일 |
| 13 | Smart Waitlist + Auto Move-up | 4,6,8 | M12 | △ | Auto move-up — 취소 시 다음 사람 자동 배정 |
| 14 | Spot Booking (특정 자전거/매트 자리 선점) | 9 | M12 | X | Spin/Pilates Reformer 자리 지정 예약 |
| 15 | Recurring Booking (반복 예약) | 9 | M12 | X | "단골 9시 클래스 자동 매주 예약" |
| 16 | Late-Cancel/No-Show Policy (벌금/패널티 자동) | 4,5,8 | M12 | △ | 자동 deposit 차감 |
| 17 | Resource Scheduling (방/장비/기구 단위 캐파) | 4,11 | M12 | X | Pilates Reformer 같은 장비 단위 예약 |
| 18 | PT 1:1 + Semi-Private + Group 통합 스케줄 | 5 | M5/M12 | △ | 1대1, 소그룹, 그룹 단일 캘린더 |

### D. 결제·빌링·매출 (Payments & Billing)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 19 | Recurring Membership Auto-billing | 3,5,9 | M4 | O | 동일 |
| 20 | Intelligent Billing — AI 결제 재시도 (98% 회수율) | 22,32 | M4 | X | 결제 실패 시 AI가 최적 타이밍에 재시도 |
| 21 | In-app Payment (회원앱 내 결제) | 13,15 | M10 | O | 동일 |
| 22 | Stripe 통합 결제 + Stripe Capital (운영자 대출) | 36,38 | M4 | X | 운영자 자금 대출까지 연동 |
| 23 | Class Pack / Credits / Intro Offer (체험권/패키지) | 4,5,7,8 | M4 | △ | "Intro Offer" 표준 — 트라이얼 자동 전환 |
| 24 | POS / 굿즈/보충제 Retail Sales | 37 | M4 | △ | In-studio 굿즈/보충제 판매 (OUHVE 기타매출은 단순) |
| 25 | Multi-currency / Country-specific Payment | 16,34 | M4 | X | 100+ 국가, 결제 수단 현지화 |
| 26 | Royalty Management (프랜차이즈 본부 로열티 자동) | 16,34 | M9 | X | 가맹점 본부 정산 자동화 |

### E. 회원앱 (Member App — Branded)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 27 | Branded Member App (자체 브랜드 앱, 마켓플레이스 X) | 6,7,9,13 | M10 | O | 동일 |
| 28 | In-app Booking + Cancellation | 9,13 | M10 | O | 동일 |
| 29 | In-app Push Notification | 9 | M10 | O | 동일 |
| 30 | Progress Tracking (운동 기록/출석 추이, Trainerize 연동) | 5,10 | M10 | X | 운동 프로그램/식단/챌린지 통합 |
| 31 | Article/Video Content in App (자체 콘텐츠 배포) | 13 | M10 | X | 앱 안에 아티클·비디오 공유 → 커뮤니티 |

### F. 스태프·운영 (Staff & Operations)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 32 | Staff App (모바일 직원 앱 — 가입, 스케줄, 결제) | 10,16 | M11 | O | 동일 |
| 33 | Role-Based Permissions | 34 | M1/M11 | △ | 메뉴커스터마이징 흡수, 권한 모델은 더 정교 |
| 34 | Payroll & Trainer 성과 관리 | 10 | M1 | X | 트레이너별 매출/수업/출석 통합 평가 |
| 35 | Real-time Staff Schedule (가용시간 실시간 업데이트) | 10 | M11 | △ | 강사가입승인 흡수, 가용시간은 미구현 |

### G. 마케팅·세일즈·CRM (Growth)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 36 | Lead Capture Forms (웹사이트/SNS 임베드 폼) | 14 | M5 | X | 노코드 폼 빌더, 어디든 임베드 |
| 37 | Lead Source Tracking (UTM/채널별 추적) | 14 | M5/M8 | X | 어떤 채널이 컨버전 잘되는지 |
| 38 | Drag-and-drop Email Builder (브랜드 이메일 빌더) | 14 | M5 | X | 운영자 노코드 이메일 캠페인 |
| 39 | Smart Segments (멤버십/구간/행동 세그먼트) | 14 | M5 | X | 세그먼트 기반 타깃 캠페인 |
| 40 | Automated Email + SMS Nurture (드립 캠페인) | 1,9,14 | M5 | △ | 발송예약 흡수, drip sequence는 미구현 |
| 41 | Sales Pipeline (Trial → Member 단계 관리) | 1,14 | M5 | X | 영업 파이프라인 시각화 |
| 42 | Promo Codes / Referrals | 9,10 | M5 | X | 추천인 코드/할인코드 자동 추적 |
| 43 | Website Cart Abandonment Retargeting | 1 | M5 | X | 결제 이탈 회원 자동 재타깃 |
| 44 | Social Booking (Instagram/Facebook 직접 예약) | 1 | M5 | X | SNS에서 바로 예약 링크 |

### H. AI·인텔리전스 (AI Layer — Glofox 핵심 차별)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 45 | **AI Churn Predictor (30일 전 이탈 예측)** | 18,29,31,32 | M7/M8 | X | 출석/앱활동/결제 신호 → 이탈 예측 |
| 46 | At-Risk Member Report (자동 위험 회원 리포트) | 31,32 | M7/M8 | X | 주간 리포트로 위험 회원 push |
| 47 | Behavior-Triggered Upsell (행동 기반 자동 업셀) | 32 | M7 | X | "10회 출석 = PT 제안" 자동 발사 |
| 48 | Lifecycle-Triggered Campaign (90일/마일스톤 자동) | 32 | M7/M5 | X | 라이프사이클 시점별 자동 메시지 |
| 49 | Underperforming Class Slot 자동 감지 + Targeted Offer | 32 | M7/M8 | X | 40% 캐파 클래스 자동 식별 + 할인 |
| 50 | Wearable/Nutrition Data 통합 (실시간 가이드) | 31 | M7/M10 | X | 헬스 데이터로 코칭 자동화 |

### I. 리포팅·인사이트 (Insights)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 51 | ABC Insights Dashboard (Multi-location BI) | 16,29,34 | M8 | △ | 다지점 비교 대시보드 |
| 52 | Scheduled Report (정기 이메일 보고서) | 16,34 | M8 | X | 임직원에게 자동 정기 보고 |
| 53 | ARPU / LTV / Upsell Conversion 추적 | 32 | M8 | X | SaaS-grade 핵심 지표 추적 |

### J. 멀티 로케이션·프랜차이즈 (Scale)

| # | 기능 | 출처 | OUHVE 모듈 | 중복? | 차별 |
|---|------|------|------------|-------|------|
| 54 | Multi-location Bulk Update (대량 멤버십/상품 변경) | 16,34 | M1/M9 | X | 본부에서 일괄 정책 변경 |
| 55 | Roaming Access (회원이 어느 지점이든 출입) | 16,34 | M3/M9 | X | 회원 통합 접근권 |
| 56 | Localized Experience (다국어/현지 결제 수단) | 16,34 | M1 | X | 17개 언어, 현지화 |
| 57 | Franchise Brand Standards Template (본부 템플릿 강제) | 16 | M9 | X | 브랜드 일관성 강제 |

---

## 2. AssistFit 흡수 완료 항목 (중복 - GAP 후보 X)

회원앱, 강사앱, 키오스크(부분), QR/Barcode 출입, 그룹수업, 회원앱예약, 회원앱푸시, 회원앱결제, 발송예약(부분), 메뉴커스터마이징(부분), 강사가입승인, 정지/노쇼 정책(부분), 보호자등록(Family와는 다름), 미수금, 일일권 = 19개

---

## 3. ⭐ Glofox 고유 GAP — OUHVE 신규 흡수 후보 상위 15

> 선정 기준: ① AssistFit에서 흡수 안 됨, ② Glofox만의 차별 (글로벌 표준 / AI 자동화 / Boutique 운영 통찰), ③ OUHVE 헬스장 → 웰니스 확장 비전에 적합.

| # | 기능 | 모듈 | 도입 이유 (1줄) |
|---|------|------|---------------|
| 1 | **AI Churn Predictor (30일 전 이탈 예측)** | M7+M8 | 출석/앱/결제 신호 통합 분석으로 이탈 사전 차단 — Glofox 최대 차별, 헬스장 90% 이탈 문제 해결 |
| 2 | **Intelligent Billing (AI 결제 재시도, 98% 회수)** | M4 | 결제 실패시 회원별 최적 시점 자동 재시도 — 미수금 직접 감소, 매출 즉시 효과 |
| 3 | **Behavior-Triggered Upsell (행동 기반 자동 업셀)** | M7 | "10회 출석=PT 제안" 등 자동 발사, 영업 없이 ARPU 상승 |
| 4 | **Lifecycle Campaign (라이프사이클 자동 메시지)** | M5/M7 | 가입/90일/마일스톤 시점 자동 메시지, 운영자 손 없이 retention |
| 5 | **Smart Waitlist + Auto Move-up** | M12 | 취소 시 다음 대기자 자동 배정 + 알림, 캐파 100% 유지 |
| 6 | **Spot Booking (자리/장비 단위 예약)** | M12 | Pilates Reformer / Spin 자전거 자리 선점 — 웰니스 확장의 핵심 |
| 7 | **Recurring Booking (반복 예약)** | M12 | 단골 회원의 시간/자리 자동 매주 예약 |
| 8 | **Lead Capture Forms + Source Tracking** | M5 | 웹/SNS 임베드 폼 + UTM 추적, 마케팅 ROI 가시화 |
| 9 | **Drag-and-drop Email Builder + Smart Segments** | M5 | 운영자가 노코드로 세그먼트 캠페인 발송 |
| 10 | **Family Membership (가족 멤버십)** | M4 | 1결제 다인 사용, 모자/부부/형제 단위 가입 표준 |
| 11 | **Multi-location Bulk Update + Roaming Access** | M1+M9 | 본부 일괄 정책 변경 + 회원 통합 출입 — OUHVE 다지점 확장 필수 |
| 12 | **Royalty Management (프랜차이즈 정산 자동)** | M9 | 가맹 본부 로열티 자동 계산/지급 트래킹 |
| 13 | **Localized (다국어/현지결제) + 17 Languages** | M1 | 글로벌 확장 인프라, OUHVE 웰니스 글로벌 진출 대비 |
| 14 | **ARPU / LTV / Upsell Conversion KPI** | M8 | SaaS-grade 핵심 지표 — Owner Report에 즉시 추가 가능 |
| 15 | **Sales Pipeline (Trial → Member 단계 시각화)** | M5 | Kanban 파이프라인으로 영업 단계 가시화, 상담 → 가입 전환 |

---

## 4. 시사점 (요약)

- Glofox의 **최대 차별은 AI Layer (Churn Predictor + Intelligent Billing + Behavior-Triggered)** — AssistFit/국내 솔루션 대비 1세대 앞섬
- **Boutique 표준 기능 (Family/Roaming/Royalty/Spot Booking)** 은 OUHVE 웰니스 확장 (요가/필라테스/스파) 시 필수
- **Marketing CRM 깊이**가 압도적 — Lead Capture, Pipeline, Email Builder, Segment, Source Tracking 5종 세트
- 도입 우선순위 추천: GAP #1~4 (AI 4종) → GAP #5~7 (Boutique 예약) → GAP #8~9 (Marketing CRM)
