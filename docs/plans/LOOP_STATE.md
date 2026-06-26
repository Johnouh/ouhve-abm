# OUHVE ABM — 자율 루프 상태

> 자율 사이클이 자기 위치를 파악하고 다음 작업을 정하는 진실의 원천.
> 매 사이클이 자기 진행분을 여기에 한 줄로 추가한다.

## 현재 라운드: Cycle 17 — GAP-06 미수금 관리 모듈

> 2026-06-26 AssistFit 흡수 IDRL iter-1 수렴 완료. 22+ GAP 흡수, 잔여 GAP → candidate_features.md 이관.
> 신규 발견: BodyCodi(한국 1위 CRM), 청구스(미수금 자동화 SaaS).
> 다음: Cycle 17 — GAP-06 미수금 관리 (overdue-management + migration + /overdue 페이지)
> 상세: `docs/research/converged/2026-05-20-assistfit-absorb/candidate_features.md`

## 모듈 진척

| 모듈 | 상태 | 마지막 커밋 |
|---|---|---|
| 1. Business Profile | ✅ DONE (Schema + API + UI) | abd2c57 |
| 2. Member Status Engine | 🟡 BACKEND (UI 미적용) | 6260b7b |
| 3. Attendance Analysis | 🟡 Module 2에 흡수 | (6260b7b) |
| **8. Owner Report** | 🟡 BACKEND+UI 동작, HomePage 대체는 추후 | (cycle 5) |
| 4. Membership & Contract | ⬜ TODO (재정렬) | - |
| 5. Consultation Log | ⬜ TODO (AI 요약 추가) | - |
| 6. Task & Workflow | ⬜ TODO (신규) | - |
| 7. AI Operation Assistant (LLM) | ⬜ TODO | - |
| 9. Council Feedback | ⬜ TODO | - |

## 우선순위 (자율 루프 — AssistFit GAP 흡수 큐 + 차별 모듈)

### 즉시 흡수 (Cycle 6~12, 1~2 cycle each)
| Cycle | 산출 | 모듈 | GAP |
|---|---|---|---|
| **6** | **출석 시간대 통계 (빅 KPI + 도넛 패턴)** | M8 | GAP-19 |
| 7 | 보호자 등록 + 출석 푸시 | M2/M6 | GAP-13 |
| 8 | 락커 회수/배정 보드 | M4 | GAP-14 |
| 9 | 회원 단체 연장/일괄 처리 | M4 | GAP-21 |
| 10 | 수정 감사로그 (audit log) | M2/M4 | GAP-29 |
| 11 | 미수금 관리 모듈 | M4 | GAP-06 |
| 12 | 공지 상단 고정 + 만료일 | M6 | GAP-27 |

### OUHVE 차별 (사이클 사이 끼워 — 모방 X 강화 O)
| Cycle | 산출 | 모듈 |
|---|---|---|
| 13 | M2 Member Status UI (derived 배지 표시) | M2 |
| 14 | M6 Task & Workflow 신축 | M6 |
| 15 | M5 Consultation AI 요약 (Claude) | M5/M7 |
| 16 | M7 LLM Owner Report 자연어 추천 | M7/M8 |
| 17 | M9 Council Feedback 폼 | M9 |

### 모듈 신축 (시스템 위상)
| Cycle | 산출 | 모듈 | GAP |
|---|---|---|---|
| 18 | 출석앱 (태블릿 frontend) | M3 | GAP-05 |
| 19 | 키오스크 (결제/입장) | 신규 | GAP-08 |
| 20 | 계약서 작성 + 전자서명 | M4 | GAP-10 |
| 21 | M12 그룹수업 스케줄 schema + CRUD | M12 | GAP-11 |
| 22+ | M10 회원앱 / M11 강사앱 (별도 trail) | M10/M11 | GAP-01/02 |

## 사이클 패턴 (axmeax 표준)

```
1. Discover (선택): WebSearch 1~2회 — 모듈 도메인 트렌드/벤치마크
2. Define: 무엇을 만들지 1~3줄 명확화
3. Plan: 파일 변경 리스트 (schema/route/page/component)
4. Develop: 코드 작성 (병렬 가능 시 Agent 위임)
5. Verify: npm check (TypeScript 타입 게이트)
6. Commit: 1 사이클 1 커밋, conventional commit
7. LOOP_STATE.md 업데이트: 진행 한 줄 추가, 다음 라운드 명시
```

## 진행 로그 (한 줄씩 추가)

- 2026-05-19 Cycle 1: Module 1 schema (4d9b3be)
- 2026-05-19 Cycle 2: Module 1 API + helper + REFERENCE_SERVICES (f5eead7)
- 2026-05-19 Cycle 3: Module 1 UI + route (abd2c57)
- 2026-05-19 Cycle 4: Module 2 Status Engine + summary API (6260b7b)
- 2026-05-19 Cycle 5: Module 8 Owner Report — service + API + UI page /report (ba743d9)
- 2026-05-19 Rebrand: Full GLFAV → OUHVE sweep + first-screen swap + site-gate drop + GL Pay/회사정보 wipe (1ee25bd, 8e4564f, 7b41899, 7c79c0e)
- 2026-05-20 AssistFit 크롤 흡수: 95p / 309img / 48 video → 96 features / 30 GAP / 12 패턴 → 12 모듈로 확장 (iter-0)
- 다음: Cycle 6 — GAP-19 출석 시간대 통계 + 빅 KPI 도넛 패턴 (M8 보강)
- 2026-05-20 Cycle 6: GAP-19 attendance-analytics service + /api/attendance-analytics + AttendanceHeatmapCard 위젯 (Owner Report에 임베드). AssistFit page-082/033 빅KPI+24h 막대+피크/한산 칩+요일 분포 패턴 흡수. Persimmon 솔리드 + Teal 점 (도형 전용 규칙). 다음: Cycle 7 — GAP-13 보호자 등록
- 2026-05-20 Deploy: Railway upload API timeout 지속 → GitHub repo 생성 (Johnouh/ouhve-abm public) + Railway 신규 service ouhve-app-gh GitHub-linked → git push 자동 배포로 전환. 새 URL: https://ouhve-app-gh-production.up.railway.app
- 2026-05-20 Cycle 7: GAP-13 보호자 등록 schema + migration 0002 + guardian-notification service + /api/attendance POST에 트리거 통합 + /api/guardian-notification/stats. AssistFit page-050 흡수, 키즈/청소년 시장 차별. 다음: Cycle 8 — GAP-14 락커 회수/배정 보드
- 2026-05-21 Visibility fix (a0ebeef): Cycle 6/7 UI 완성 — HomePage 대시보드에 AttendanceHeatmapCard + 회원 등록 폼에 보호자 4필드 섹션. DOD 원칙 박음 (feedback_cycle_dod.md)
- 2026-05-21 Cycle 8: GAP-14 락커 보드 — locker-overview service + /api/locker-overview + LockerOverviewCard 위젯 (점유율/섹션별/만료임박/회수). HomePage 대시보드 2컬럼 그리드로 임베드. AssistFit page-067/080 흡수. 다음: Cycle 9 (HiCC 타임아웃 → Mindbody crawl 진행 중)
- 2026-05-21 Cycle 9 (f0966a4): GAP-21 단체 연장 — bulk-extension service + POST /api/memberships/bulk-extend + /bulk-extend 페이지 (회원 검색/다중선택, 일수 빠른선택, 사유/메모, 처리결과 시각화). AssistFit page-009 흡수.
- 2026-05-21 신규 크롤 결과:
  * Glofox 40p / 57 features / 15 고유 GAP (AI Churn 30일, Intelligent Billing, Behavior Upsell, Spot Booking, Lead Pipeline, Family Membership, Royalty)
  * PushPress 40p / 47 features / 29 고유 GAP (AI Assistant 4-Level, Multi-Channel Nurture, Live Pipeline, Failed Payment Recovery, Trial→Member 시퀀스, Family Plan, Retention Signals, Daily Priorities, WOD Leaderboard, Habit Tracking, Affiliate Marketplace, GymHappy 리뷰자동화, White-label App, Priority Booking, Progressive Programming)
- 2026-05-21 Cycle 10 (935cbb5): Daily Priorities — daily-priorities.ts service + /api/daily-priorities + Owner Report 실행형 전환. PushPress GAP-8 흡수.
- 2026-05-21 Cycle 11 (cd1552d): Retention Signals — retention-signals.ts + /api/retention-signals + At-Risk 7일 전 경고 카드. PushPress GAP-7 흡수.
- 2026-05-21 Cycle 12 (c616c3b): Live Sales Pipeline — sales-pipeline.ts + /api/sales-pipeline + /sales-pipeline 칸반 페이지. PushPress GAP-3 흡수.
- 2026-05-21~2026-06-25 Cycles 13~15 (코드베이스 확인): M12 그룹수업 스케줄(/api/group-lessons + CRUD + enrollment), Kiosk(kiosk-auth/home-page, /api/kiosk-notices), PG 결제(billgate-service, /api/pg/*), OT프로그램(/api/ot-programs), Staff 관리(/api/staff), Products(/api/products, center-programs), AI Insights(/api/ai/churn-analysis, revenue-insights, chat), 계약서/환불/기타매출/정지 CRUD. 구체적 commit hash 불명 (LOOP_STATE 누락 구간).
- 2026-06-25 Cycle 16 (8ef2c92): GAP-29 Audit Log — audit-log.ts service + /api/audit-logs + /api/audit-logs/summary + audit-log-page.tsx. M2/M4 감사로그 완성.
- 2026-06-26 IDRL 수렴 (Auto-17): AssistFit 흡수 IDRL iter-1 — 22+ GAP 흡수 확인, 잔여 GAP → candidate_features.md 이관, docs/research/active/ → converged/ 이동. WebSearch 신규 발견: BodyCodi(한국 1위 CRM, 4,000+센터), 청구스(미수금 자동화 SaaS).
- 다음 사이클 큐 (2026-06-26 기준, candidate_features.md 참조):
  * Cycle 17: GAP-06 미수금 관리 (overdue-management service + migration + /overdue 페이지)
  * Cycle 18: AI Level 3 Decision 제안형 (M7 AI chat → 실행형 버튼)
  * Cycle 19: 공지 상단 고정(GAP-27) + Member Milestone 자동 인지
  * Cycle 20: BodyCodi 신규 IDRL (사람 게이트 후)

## 완성 기준 (Done Definition)

브리프(`OUHVE_ABM_BRIEF.md`) 모든 모듈이 다음 충족 시:
- [ ] 9개 모듈 모두 backend + UI 구현
- [ ] AI Operation Assistant (Module 7) 자연어 추천 동작
- [ ] 첫 화면이 AI 운영 리포트형 (회원 목록 X)
- [ ] 메뉴 구조가 브리프 #13 따름 (Coming Soon 처리 포함)
- [ ] npm check 통과
- [ ] preview.html 디자인 토큰과 실제 UI 정합 (verify-design-system 통과)

## 외부 의존 (루프가 막힐 때)

- npm install 미실행 → 타입 체크 불가 시 자율 진행
- LLM API 키 미설정 → Module 7 LLM 부분만 mock 또는 룰 기반 폴백
- DB 없음 → 마이그레이션은 SQL 파일로만 작성, 실행은 사용자 환경에서
