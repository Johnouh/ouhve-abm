# iter-0 — AssistFit 흡수 시드 정의

> 시드 출처: https://guide.assistfit.io/crmguide (95p 가이드, 309 이미지, 48 YouTube)
> 작성일: 2026-05-20
> 후속: hackproject Phase 1+ 자율 chain

## 외부 서비스 요약

### AssistFit 정체성
- 한국 헬스장/PT/필라테스 운영자 대상 CRM (회원 무료 회원관리 프로그램 포지셔닝)
- 차별 무기: 회원앱+강사앱+키오스크+안면인식(Toss Face Pass) **4단 디바이스 생태계**
- 가이드 사이트만 95p — 운영자 친화 문서화 강함

### 핵심 기능 분포 (Agent A 분석)
- 추출 기능: **96개**
- OUHVE 현재 보유: 있음 11 / 부분 28 / 없음 74
- **GAP 보강 후보: 30개** (`analysis_features.md`)

### UI 패턴 (Agent B 분석)
- Primary Orange = OUHVE Persimmon 동일 톤
- 모바일 우선, 카드 그리드 중심, 단계별 캡쳐 매뉴얼
- 12 흡수 패턴 도출 (`analysis_ui.md`)

## 가장 큰 갭 (시스템 위상 변화 트리거)

1. **GAP-01 회원앱 (신규 M10)** — 키오스크/예약/결제/푸시/안면인식의 모든 진입점
2. **GAP-02 강사앱 (신규 M11)** — 강사가 현장에서 모바일로 처리
3. **GAP-11 그룹수업 스케줄 (신규 M12)** — 그룹 클래스 시장 진입 차단 해소
4. **GAP-03 안면인식 (Toss Face Pass)** — 무인 운영 + 한국 시장 차별
5. **GAP-10 계약서 전자서명** — 법적 효력 + 종이 제거

## OUHVE 차별 축 (AssistFit 미보유 — 유지/강화)
- **M7 AI Operation Assistant** — AssistFit 95p에 AI 운영 제안 0건
- **M9 Council Feedback** — 단일 센터 SaaS인 AssistFit엔 협의체 개념 없음
- **M8 자동 인사이트형 Owner Report** — AssistFit은 통계 "조회"만, 의사결정 제안 없음

→ AssistFit이 강한 영역(디바이스 생태계)을 흡수하되, OUHVE만의 AI 차별축은 모방 안 함.

## 융합 전략 (3축)

### 축 1 — 기능 흡수 (GAP-30)
- 30개 GAP을 우선순위로 분류:
  - **즉시 흡수 (1~2 cycle)**: GAP-13/19/20/21/27/29/30 (작은 기능, 기존 모듈 보강)
  - **모듈 신축 (3~5 cycle)**: GAP-06/10/11/14/26 (Module 보강·신규)
  - **시스템 위상 변경 (10+ cycle)**: GAP-01/02/03/08 (회원앱/강사앱/안면인식/키오스크)

### 축 2 — UI 패턴 흡수
- Module 8 Owner Report에 **빅 KPI + 도넛 + 막대 3단** 즉시 적용
- 도움말 페이지 (`/help`) 신축: 챕터 카드 인덱스 + 단계별 캡쳐 매뉴얼
- 마케팅 랜딩(공개 페이지) 신축: 디바이스 사진 + 가격표 + 풀폭 CTA

### 축 3 — 운영자 친화 강화
- 위험 액션 (환불/삭제) 컬러 분리 + 큰 글씨 동의 카드
- 모바일 풀폭 하단 CTA 패턴 통일
- 단계별 가이드 (Stepper) 컴포넌트 신설

## 브리프 확장 (12 모듈)

기존 9 → **12 모듈**로 확장:

```
1. Business Profile           ✅
2. Member Management          ✅  + 보호자/일괄 연장
3. Attendance & Usage         🟡 + 4방식 (수동/QR/전화/안면)
4. Membership & Contract      🟡 + 미수금/계약 전자서명/락커 보드
5. Consultation Log           ⬜
6. Task & Workflow            ⬜
7. AI Operation Assistant     ⬜ ★ 차별
8. Owner Report               🟡 + 시간대 히트맵/도넛
9. Council Feedback           ⬜ ★ 차별
─ 신규 (AssistFit 흡수) ─
10. 회원앱 (Member App)        ⬜ [신축] 회원 모바일
11. 강사앱 (Trainer App)       ⬜ [신축] 강사 모바일
12. 그룹수업 스케줄            ⬜ [신축] 그룹/OT/PT 통합
```

## 다음 사이클 큐 (LOOP_STATE 인계)

| Cycle | 산출 | 모듈 | 갭 |
|---|---|---|---|
| 6 | 출석 시간대 통계 (Module 8 보강, 빅 KPI 패턴) | M8 | GAP-19 |
| 7 | 보호자 등록 + 출석 푸시 (schema + API) | M2/M6 | GAP-13 |
| 8 | 락커 회수/배정 보드 | M4 | GAP-14 |
| 9 | 회원 단체 연장/일괄 처리 | M4 | GAP-21 |
| 10 | 수정 감사로그 (audit log entity) | M2/M4 | GAP-29 |
| 11 | 미수금 관리 모듈 | M4 | GAP-06 |
| 12 | 공지 상단 고정 + 만료일 | M6 | GAP-27 |
| 13 | 출석앱 (태블릿/키오스크 frontend) | M3 | GAP-05 |
| 14 | 키오스크 (결제/입장) 신축 | 신규 | GAP-08 |
| 15 | 계약서 작성 + 전자서명 | M4 | GAP-10 |
| 16 | 그룹수업 스케줄 schema + 기본 CRUD | M12 | GAP-11 |
| 17+ | 회원앱/강사앱 (별도 trail) | M10/M11 | GAP-01/02 |

## 자율 모드
- /loop dynamic (60s heartbeat) 재개
- 1 cycle 1 commit, Railway 자동 재배포
- LOOP_STATE.md 매 cycle 갱신
- 자율 신호 유지 — 사용자 새 지시 없으면 위 큐 순서대로

## 출처
- 크롤 결과: `docs/research/crawl/2026-05-20-assistfit/`
  - `_SUMMARY-v2.md` (95p / 309img / 48 video)
  - `analysis_features.md` (96 features / 30 GAP)
  - `analysis_ui.md` (22 screens / 12 patterns)
- 영상 분석 미실시 (YouTube 403)
- 비주얼 분석 미실시 (Agent 이미지 차원 한도)
