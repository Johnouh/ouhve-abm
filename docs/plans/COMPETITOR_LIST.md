# OUHVE ABM — 경쟁/유사 서비스 라운드 로빈 흡수 큐

> 2026-05-21 시작. AssistFit 흡수 후 정의된 경쟁사 풀.
> 라운드 로빈: 한 사이클 = 1 서비스 crawl → analyze → GAP queue 적재 → 다음 dev cycle.

## 큐 (우선순위 순)

### 한국 시장 (헬스/필라테스/요가 CRM)
| # | 서비스 | URL | 비고 | 상태 |
|---|---|---|---|---|
| 1 | **AssistFit** | https://guide.assistfit.io/crmguide | 회원앱+키오스크+안면인식 | ✅ 완료 (96 features / 30 GAP) |
| 2 | **HiCC** | https://hicc.co.kr | 필라테스/요가 특화 | ⬜ NEXT |
| 3 | **Fitiva (피트니바)** | https://fitiva.kr | 운영자 통합 | ⬜ |
| 4 | **짐플렉스** | https://gymplex.io | 결제+회원 관리 | ⬜ |
| 5 | **TLX Pass** | https://www.tlxpass.com | 멀티센터 패스 | ⬜ |

### 해외 표준 (Top 5)
| # | 서비스 | URL | 비고 | 상태 |
|---|---|---|---|---|
| 6 | **Mindbody** | https://www.mindbodyonline.com | 글로벌 1위 wellness platform | ⬜ |
| 7 | **PerfectGym** | https://perfectgym.com | AI 이탈 예측 | ⬜ |
| 8 | **ABC Glofox** | https://www.glofox.com | 30일 전 churn flag | ⬜ |
| 9 | **Zenoti** | https://www.zenoti.com | 예측 인게이지먼트 | ⬜ |
| 10 | **PushPress** | https://www.pushpress.com | Boutique 피트니스 | ⬜ |

### 보조 (시간 남으면)
| # | 서비스 | URL | 비고 |
|---|---|---|---|
| 11 | ClubAutomation | https://www.clubautomation.com | 통합 단일 레이어 |
| 12 | Virtuagym | https://business.virtuagym.com | 트레이너 도구 |
| 13 | 1Club | https://1club.ai | AI 운영 자동화 |
| 14 | WellnessLiving | https://www.wellnessliving.com | 종합 운영 |
| 15 | MarianaTek | https://www.marianatek.com | Boutique studio |

## 사이클 패턴 (3시간 자율)

| Cycle | 작업 | 예상 시간 |
|---|---|---|
| **odd** | 다음 경쟁사 crawl + Agent A 분석 → GAP 추가 | 20~30 min |
| **even** | GAP queue 상단 dev cycle (schema+API+UI DOD) | 15~25 min |

3시간 = 약 6~9 cycle. 큐 최소 4 신규 경쟁사 + 4 dev cycle 예상.

## DOD 강제

매 사이클:
- crawl 사이클: `docs/research/crawl/<DATE>-<svc>/analysis_features.md` 생성 + GAP을 LOOP_STATE 큐에 추가
- dev 사이클: schema + API + UI + DB 마이그 + 라이브 검증 URL 보고

## 중단 조건
- 사용자 명시 중단
- 3시간 경과 (2026-05-21 시작 + 3h)
- 큐 소진 (모든 경쟁사 + GAP 처리 완료)

## 자동화
- 매 사이클 git push → Railway 자동 배포
- 매 crawl 끝 LOOP_STATE에 신규 GAP 추가
- 사이클 사이 ScheduleWakeup 270~600s
