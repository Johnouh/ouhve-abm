# OUHVE ABM — 자율 루프 상태

> 자율 사이클이 자기 위치를 파악하고 다음 작업을 정하는 진실의 원천.
> 매 사이클이 자기 진행분을 여기에 한 줄로 추가한다.

## 현재 라운드: Module 8 (Owner Report — 첫 화면)

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

## 우선순위 (자율 루프 진행 순서)

1. **Module 8 Owner Report** — 첫 화면 (가장 중요한 정체성 차별점)
2. **Module 2 Member Status UI** — 회원 목록에 derived status 표시
3. **Module 6 Task & Workflow** — 인포 업무 자동 생성
4. **Module 5 Consultation AI Summary** — 상담 LLM 요약
5. **Module 7 AI Operation Assistant** — Anthropic API 통합, 자연어 추천
6. **Module 4 Membership 재정렬** — 만료/재등록 워크플로우
7. **Module 9 Council Feedback** — 피드백 수집 폼
8. **메뉴 재구성 + Coming Soon 표기** — 브리프 #13
9. **30-Day Sprint 가이드** — 온보딩 페이지

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
- 2026-05-19 Cycle 5: Module 8 Owner Report — service + API + UI page /report (pending commit)
- 다음: Cycle 6 — Module 2 회원 목록 UI에 derived status 배지 표시 OR Module 6 Task 신규

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
