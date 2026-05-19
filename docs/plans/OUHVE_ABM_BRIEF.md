# OUHVE ABM — 제품 기획 브리프

> 2026-05-19 확정. 모든 시스템 변경의 기준 문서.

## 1. 브랜드 정의

- **OUHVE** — Omni Unified Harmony Vitality Ecosystem
- **슬로건** — An AI Operating Ecosystem for Wellness
- **첫 제품** — OUHVE ABM (AI Business Management)
- **첫 타깃** — 피트니스·웰니스 운영자 (헬스장, PT샵, 필라테스, 요가, 뷰티샵)
- **첫 가치** — 인포/운영 업무 자동화 + 매일 운영 제안

## 2. 핵심 포지셔닝 전환

| 기존 방향 | 수정 방향 |
|---|---|
| OUHVE Studio (CRM + 마케팅 + 콘텐츠 + 커머스) | **OUHVE ABM (AI Business Management)** |
| 다 한다 | 내부 운영만 잡는다 |
| 마케팅 앞세움 | 마케팅·콘텐츠·커머스 **초기 제외** |

> OUHVE ABM은 CRM이 아니다. OUHVE ABM은 웰니스 사업자를 위한 **AI 운영 직원**이다.

## 3. 한 줄 정의 (외부 노출용)

> OUHVE ABM은 피트니스·웰니스 사업자의 내부 운영을 AI가 이해하고, 반복적인 인포 업무를 줄이며, 회원 관리·운영 판단·재등록·출결·상담·일정 관리를 제안해주는 AI 운영 시스템입니다.

## 4. OUH Inc. 전체 시스템 구조

```
OUH Inc.
├── AXMEAX
│   └── AI Operating System / Ontology / Decision Engine
└── OUHVE
    └── Wellness Ecosystem Brand
        ├── 1. OUHVE ABM           ← 이번 1단계
        ├── 2. OUHVE Membership    ← 곧 (선별형 무료)
        ├── 3. Fameax              ← Phase 3 (마케팅/콘텐츠)
        ├── 4. OUHVE Customer App  ← Phase 4
        ├── 5. OUHVE Creator App
        ├── 6. OUHVE Pay
        └── 7. OUHVE Market
```

## 5. 단계별 실행

| Phase | 내용 |
|---|---|
| **1. OUHVE ABM** | 내부 운영 + 회원 관리 + 인포 자동화 + 운영 제안 |
| 2. OUHVE Membership | 좋은 센터/트레이너/운영자 선별 (무료, 심사제) |
| 3. Fameax 연동 | ABM 데이터 기반 콘텐츠·마케팅 제안 |
| 4. Customer App | 회원용 AI 헬스·뷰티 케어 |
| 5. Creator/Pay/Market | 경제권 확장 |

## 6. OUHVE ABM 핵심 모듈 (9개)

| # | 모듈 | 역할 |
|---|---|---|
| 1 | Business Profile | 센터 정보 (유형/지역/시간/프로그램/대표/문제) |
| 2 | Member Management | 회원 정보 + 상태 분류(정상/관심/감소/임박/위험/미처리/미납/휴면) |
| 3 | Attendance & Usage | 출석 기록 + 감소 감지 + 패턴 분석 |
| 4 | Membership & Contract | 회원권/계약/만료/미납 + 재등록 예정 |
| 5 | Consultation Log | 상담 기록 + **AI 요약** + 후속 업무 |
| 6 | Task & Workflow | 인포 업무 자동 생성 + 담당자 지정 + 미처리 알림 |
| 7 | AI Operation Assistant | 운영 상황 요약 + 누락 감지 + 다음 액션 추천 (**핵심**) |
| 8 | Owner Report | 대표 전용 매일/매주 리포트 |
| 9 | Council Feedback | 사용자 피드백 수집 (제품 진화용) |

## 7. AI 직원 구조 (5종)

| AI 역할 | 책임 |
|---|---|
| AI Front Manager | 예약/만료/미납/상담 후속 인포 업무 체크리스트 |
| AI Member Care Manager | 출석 감소·이탈 위험 감지, 담당 트레이너 알림 |
| AI Operation Manager | 센터 운영 요약, 업무 누락 감지, 대표 리포트 |
| AI Sales Assistant | 재등록 추천, 체험 전환 분석, 객단가 개선 |
| AI Growth Assistant | Fameax 연결 (초기 Coming Soon) |

## 8. 사용자별 핵심 화면

| 사용자 | 첫 화면이 보여야 할 것 |
|---|---|
| 대표/원장 | "오늘 센터에서 대표가 봐야 할 것" (리포트형) |
| 인포 담당자 | "오늘 처리할 업무 체크리스트" (자동 생성) |
| 트레이너 | "담당 회원 케어 보조" (개별 회원 상태) |
| OUHVE 운영팀 | 어떤 센터/기능 요청/문제 (생태계 데이터) |

## 9. AI 추천 룰 (초기 룰베이스 + LLM 요약)

```
최근 14일 출석 없음 → 출석 감소
만료일 14일 이내 → 만료 임박
상담 후 3일 이상 후속 업무 없음 → 상담 미처리
체험 수업 후 24시간 연락 없음 → 전환 누락
미납 3일 이상 → 미납 관리 필요
최근 출석률 높고 만료 임박 → 재등록 가능성 높음
```

## 10. MVP 범위

### ✓ 반드시 있어야 함
센터 등록, 직원 등록, 회원 등록, 회원권 등록, 출석 기록, 상담 기록, 업무 생성, AI 요약, AI 운영 제안, 대표 리포트, 피드백 수집

### ✗ 초기 제외
광고 캠페인, 콘텐츠 자동 생성, 인플루언서 매칭, 커머스 판매, 고객 앱, 복잡한 결제 정산, 고도화 ML 예측

## 11. 30-Day Operating Sprint (초기 멤버 온보딩)

| Week | 활동 |
|---|---|
| 1 | 운영 데이터 세팅 (센터/회원/회원권/상담/출석) |
| 2 | 인포 업무 자동화 (오늘 할 일/만료/저하/후속) |
| 3 | AI 운영 제안 (대표 리포트/재등록/이탈 위험/누락) |
| 4 | 개선 리포트 (업무 감소 효과/추가 기능 제안) |

## 12. 성공 지표 (초기는 매출보다 운영 효율)

```
- 인포 업무 감소율
- 미처리 업무 감소
- 만료 회원 연락률
- 출석 감소 회원 대응률
- 상담 후속 처리율
- 재등록 대상자 관리율
- 대표 리포트 확인율
- AI 제안 수락률
- 피드백 제출 수
```

## 13. 메뉴 구조

### 초기 (오픈)
Dashboard / Members / Attendance / Memberships / Consultations / Tasks / Staff / Reports / **AI Assistant** / Council Feedback / Settings

### Coming Soon (숨김)
Fameax Marketing / Creator Match / Commerce / Pay / Customer App

## 14. 개발 우선순위

```
1. Center (Business Profile)
2. User / Staff
3. Member
4. Membership (Contract)
5. Attendance
6. Consultation
7. Task
8. AI Recommendation (룰 + LLM)
9. Report (Owner)
10. Feedback (Council)
```

## 15. 첫 화면의 결정적 차이

**기존 CRM**: 회원 목록 → 사용자가 필터 → 행동 결정
**OUHVE ABM**: AI 운영 리포트 → "오늘 해야 할 것" → 클릭 한 번에 실행

## 핵심 문장 (개발 기준점)

> **OUHVE ABM은 CRM이 아니다. OUHVE ABM은 웰니스 사업자를 위한 AI 운영 직원이다.**

## 출처

2026-05-19 사용자 직접 기획. 산만한 OUHVE Studio 방향에서 운영 중심 ABM으로 축소·집중 전환.
