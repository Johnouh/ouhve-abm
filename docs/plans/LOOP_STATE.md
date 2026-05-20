# OUHVE ABM — 자율 루프 상태

> 자율 사이클이 자기 위치를 파악하고 다음 작업을 정하는 진실의 원천.
> 매 사이클이 자기 진행분을 여기에 한 줄로 추가한다.

## 현재 라운드: Cycle 6 — AssistFit 흡수 시작 (GAP-19)

> 2026-05-20 AssistFit (https://guide.assistfit.io/crmguide) 95p 크롤 + Agent A/B 분석 완료.
> 96 기능 / 30 GAP 도출. 12 모듈로 확장 (M10 회원앱 / M11 강사앱 / M12 그룹수업 신축).
> 상세: `docs/research/active/2026-05-20-assistfit-absorb/iteration-0.md`

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
