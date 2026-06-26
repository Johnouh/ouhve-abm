# candidate_features — AssistFit 흡수 IDRL 수렴 후 잔여 GAP

> 생성: 2026-06-26 (iter-1 수렴 판정 시)
> 상태: 사람 게이트 #4 (feature-planner 자동 호출 X — 운영자 승인 필요)

## 우선순위 A — 즉시 집행 가능

### A-1. 미수금 관리 모듈 (GAP-06)
- **모듈**: M4 (Membership & Contract)
- **범위**: 미수금 상태 추적 + CMS 자동이체 동의 플래그 + 수동 SMS 알림 트리거
- **참조 패턴**: 청구스(ChungGuse) — "보는 시스템" → "받아주는 시스템"
- **axmeax 변형**: 
  - `memberships` 테이블에 `payment_status enum('paid','overdue','cms_pending')` 컬럼 추가
  - overdue-management.ts 서비스: 미수금 목록 + 예상 회수액 + SMS 발송 트리거
  - `/overdue` 페이지: 미수금 회원 카드 + 회수 현황 KPI + 1클릭 SMS
- **예상 규모**: ~300 LOC + migration
- **사람 게이트**: SMS 발송 목록 확인 후 운영자 승인

### A-2. AI Assistant Level 3 Decision 제안형 (PushPress GAP-1 강화)
- **모듈**: M7 (AI Operation Assistant)
- **범위**: 현재 /api/ai/chat → 데이터 기반 오늘의 Top 3 액션 제안 + 클릭 실행 연결
- **참조 패턴**: PushPress "Direction" — "정보 표시" → "결정 제안 + 바로 실행"
- **axmeax 변형**:
  - daily-priorities.ts와 retention-signals.ts 연계 → AI chat 응답에 실행형 버튼 추가
  - "⚠️ 미수금 3건 — SMS 발송하기" 버튼 형식
- **예상 규모**: ~200 LOC (기존 AI chat UI 확장)
- **OUHVE 차별축**: AssistFit 95p에 AI 운영 제안 0건 — 핵심 차별 유지

## 우선순위 B — 다음 2~3 사이클

### B-1. 공지 상단 고정 + 만료일 표시 (GAP-27)
- **모듈**: M6 (Task & Workflow / 공지)
- **범위**: 공지사항 pin 기능 + 회원 멤버십 만료 D-7/D-3/D-0 뱃지
- **axmeax 변형**: posts 테이블 `is_pinned boolean` + 만료임박 회원 필터 뱃지
- **예상 규모**: ~150 LOC

### B-2. Member Milestone 자동 인지 (Glofox GAP-6)
- **모듈**: M2 (Member Status Engine)
- **범위**: 100회 방문, 1주년 가입일 자동 감지 → 운영자 알림 카드
- **axmeax 변형**: member-status-engine.ts에 milestone 체크 로직 추가
- **예상 규모**: ~150 LOC

## 우선순위 C — 조건부 집행

### C-1. BodyCodi 신규 경쟁사 분석 IDRL
- **모듈**: 신규 IDRL (별도 사이클)
- **이유**: 한국 1위 CRM(4,000+ 센터) — OUHVE 포지셔닝 검증에 필요
- **액션**: `docs/research/active/2026-06-XX-bodycodi-absorb/` 신규 IDRL 개설
- **조건**: 운영자 지시 또는 자율 루프 판단

### C-2. Family Membership 1결제 다인 (Glofox GAP-3)
- **모듈**: M4
- **우선순위 하**: 한국 시장 수요 불명확 (태권도/키즈 도장 중심, 일반 헬스장 수요 약함)
- **조건**: 운영자 확인 후 집행

## 집행 순서 권고

```
Cycle 17: A-1 미수금 관리 (migration + service + page)
Cycle 18: A-2 AI Level 3 Decision 제안형 (UI 확장)
Cycle 19: B-1 공지 상단 고정 + B-2 Milestone 병합 (작은 기능 2개)
Cycle 20: C-1 BodyCodi 신규 IDRL (사람 게이트 후)
```
