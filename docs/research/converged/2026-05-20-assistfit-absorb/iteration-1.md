# iter-1 — AssistFit 흡수 수렴 판정

> 작성일: 2026-06-26
> 이전 iter: iteration-0 (2026-05-20, seed — 30 GAP / 12 모듈 확장)
> 검색 축 (신규): 한국 헬스장 CRM 미수금 자동화 2026 / Korean gym family membership 2026

## 수렴 판정: **CONVERGED** ✅

iter-0에서 수립한 30 GAP × 12 모듈 사이클 큐가 10+ 사이클에 걸쳐 대부분 흡수됨.
잔여 GAP은 candidate_features.md로 이관하여 feature-planner 사람 게이트(#4) 승인 후 집행.

---

## 흡수 현황 (iter-0 큐 대비)

### 완료 사이클 (git 기준)
| Cycle | 내용 | 상태 |
|---|---|---|
| 6 | GAP-19 출석 시간대 통계 + AttendanceHeatmapCard | ✅ |
| 7 | GAP-13 보호자 등록 + 출석 푸시 | ✅ |
| 8 | GAP-14 락커 회수/배정 보드 | ✅ |
| 9 | GAP-21 단체 연장 /bulk-extend | ✅ |
| 10 | PushPress GAP-8 Daily Priorities (Owner Report 실행형 전환) | ✅ |
| 11 | PushPress GAP-7 Retention Signals At-Risk 7일 전 | ✅ |
| 12 | PushPress GAP-3 Live Sales Pipeline 칸반 | ✅ |
| 16 | GAP-29 Audit Log 감사로그 (M2/M4) | ✅ |
| 13~15 | 그룹수업(M12), Kiosk, PG, OT프로그램, Staff, Products (코드베이스 확인) | ✅ |

### 코드베이스 스캔 결과 (routes.ts + pages/)
흡수 완료 기능 (iter-0 및 Glofox/PushPress 연구에서 도출):
- M12 그룹수업 스케줄: `/api/group-lessons`, `/api/group-lesson-enrollments` + CRUD UI
- M3 Kiosk: `kiosk-auth-page.tsx`, `kiosk-home-page.tsx`, `/api/kiosk-notices`
- M4 계약서: `/api/contracts` + create/edit UI
- M5 상담·PT: `/api/consultations`, `/api/personal-training`, `/api/pt-sessions`, `ot-application-page.tsx`
- PG 결제: `/api/pg/*` (BillGate), `payment-callback/terminal-page.tsx`
- Products: `/api/products`, `/api/center-programs`, `/api/ot-programs`
- M2 Staff: `/api/staff` + 승인/거부 흐름
- M7 AI: `/api/ai/churn-analysis`, `/api/ai/revenue-insights`, `/api/ai/chat`

---

## iter-1 신규 WebSearch 발견 (2026-06-26)

### 한국 미수금 자동화 트렌드
- **바디코디(BodyCodi)** — 한국 1위 피트니스 CRM (4,000+ 센터), 키오스크+CMS+출입통제 통합. OUHVE가 아직 참조하지 않은 신규 경쟁사.
- **청구스(ChungGuse)** — 미수금 전문 SaaS: 실시간 입금 매칭 + 자동 알림 발송. "보는 시스템" vs "받아주는 시스템" 프레임.
- **CMS 자동이체 패턴**: 최초 1회 동의 → 지정일 자동 출금 → 실패 시 SMS/카카오 알림 → 재시도 → 미회수 플래그.
- **95%+ 회수율** 달성 가능: 조기 재시도 타이밍 최적화가 핵심.

### 가족 멤버십 한국 시장
- 한국 특화 검색에서 구체적 패턴 미발견 (결과: 미국 Planet Fitness, LA Fitness 위주).
- **결론**: Family Plan은 한국 헬스장보다 키즈/태권도/주짓수 도장 중심. OUHVE 타깃(일반 헬스장/PT 센터)에서는 우선순위 낮음.

---

## 잔여 GAP 분석 (미흡수)

| GAP | 내용 | 우선순위 | 사유 |
|---|---|---|---|
| GAP-06 | 미수금 관리 모듈 (청구스 패턴 흡수) | **상** | 수익 직결, 한국 시장 검증됨 |
| GAP-27 | 공지 상단 고정 + 만료일 표시 (M6) | **중** | 작은 기능, DOD 보강 |
| PushPress-1 | AI Assistant Level 3 Decision 제안형 (M7 강화) | **상** | OUHVE 차별 핵심 — AI chat → Decision |
| Glofox-3 | Family Membership 1결제 다인 (M4) | **하** | 한국 시장 수요 불명확 |
| Glofox-6 | Member Milestone 자동 인지 (100회, 1주년) | **중** | 리텐션 강화 |
| BodyCodi | 신규 경쟁사 분석 — 4,000+ 센터 1위 | **중** | 별도 IDRL 권장 |

---

## axmeax 매핑 갱신 (axmeax 5계층 원칙 적용)

1. **#1 의미 단위**: 미수금 = 별도 엔티티 `overdue_payments` 또는 `memberships.payment_status` enum 확장
2. **#2 publishToMaterials L1**: 미수금 알림 생성 시 → 운영자 대시보드 인입 이벤트
3. **#4 사용자 게이트**: 미수금 자동 SMS 발송 전 운영자 확인 (금액, 수신자 리스트 표시)
4. **#8 출처 신뢰도**: BodyCodi crawl 미실시 — 직접 크롤 후 흡수 신뢰도 상승 필요

---

## 수렴 근거

1. iter-0의 30 GAP 중 **22개 이상 흡수** (코드베이스 스캔 기준)
2. 잔여 GAP 8개 이하 — 모두 정의·우선순위 명확, 신규 연구 없이 집행 가능
3. 신규 검색(미수금 자동화, 가족 멤버십)에서 **iter-0 전략 방향과 일치** — 방향 전환 불필요
4. BodyCodi 신규 발견이지만 → 별도 IDRL로 분리 권고 (이 IDRL 범위 밖)

**→ CONVERGED: candidate_features.md 이관, 사람 게이트 #4 대기**
