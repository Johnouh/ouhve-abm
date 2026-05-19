# CLAUDE.md — OUHVE ABM

> 전역 규칙은 `~/.claude/CLAUDE.md` 참조. 이 파일은 OUHVE ABM 프로젝트별 추가 규칙만 포함.

## 프로젝트 개요

**OUHVE ABM**은 헬스장/PT 운영을 시작으로 **웰니스 전반(요가, 식단, 명상, 스파)으로 확장**되는 운영 관리 시스템입니다. franchise_id 기반의 완전한 데이터 격리를 제공하며, GLFAV(헬스장 전용) 코드를 fork하여 리브랜딩한 베이스 위에 웰니스 영역을 누적 확장합니다.

### 핵심 흐름
```
로그인(franchise 격리) → 대시보드 → 회원/직원/상품/락커/수업/스케줄/출석/상담/통계
                       → (웰니스 확장) → 요가/식단/명상/스파 모듈
```

## 디자인 시스템 (필독)

**위치**: `design-system/` (브랜드 컬러, 사용 규칙, 미리보기 보관)

- **Primary**: Persimmon `#FF5A1F` — 메인 CTA, 브랜드, KPI 강조, 차트 막대
- **Accent**: Forest Teal `#0F766E` — **도형/점 전용, 글자 사용 절대 금지** (다크모드 `#14B8A6`)
- **Base**: Slate (light `#F8FAFC` / dark `#020617` / dark-card `#0F172A`)
- **시맨틱 충돌 처리**: Warning을 `amber-400`으로 시프트 (Persimmon과 분리)

상세 규칙: `design-system/usage-rules.md` (✓허용/✗금지 위치 + 면적 가이드 필수 확인)
도출 과정: `design-system/README.md`
라이브 미리보기: `design-system/preview.html` (브라우저에서 열기)

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui (new-york), wouter, TanStack Query v5 |
| **Backend** | Express 4 + TypeScript |
| **Database** | PostgreSQL 15 (Docker 로컬) + Drizzle ORM |
| **Auth** | Passport.js (local strategy, scrypt 해싱) + express-session |
| **Design** | 라이트/다크 듀얼, Persimmon Primary + Slate Base + Teal Accent (도형 전용) |

## 파일 구조

### 서버 (`server/`)
| 파일 | 역할 |
|------|------|
| `index.ts` | Express 앱 진입점 |
| `routes.ts` | 모든 API 라우트 통합 |
| `storage.ts` | IStorage 인터페이스 + DB CRUD 구현 |
| `auth.ts` | Passport.js 인증 (쿠키명: `ouhve.session`) |
| `db.ts` | PostgreSQL 연결 |
| `middleware/site-gate.ts` | HMAC 사이트 게이트 (쿠키명: `ouhve_gate`) |

### 프론트엔드 (`client/src/`)
GLFAV에서 상속된 페이지들(회원/직원/상품/락커/수업/스케줄/출석/상담/통계) + 향후 웰니스 모듈 추가 예정.

### 디자인 시스템 (`design-system/`)
| 파일 | 역할 |
|------|------|
| `README.md` | 브랜드 요약, 톤, 적용 범위 |
| `tokens.md` | HEX/HSL + CSS 변수 + Tailwind 매핑 |
| `usage-rules.md` | 컬러별 ✓허용/✗금지 위치 + 면적 가이드 |
| `preview.html` | 최종 라이브 미리보기 |

## 개발/실행

```bash
# 로컬 DB (Docker)
docker compose up -d   # ouhve-postgres on port 5432 (필요 시 변경)

# 의존성 설치 + 스키마 동기화
npm install
npm run db:push

# 개발 서버 (port 5000)
npm run dev

# 타입 체크 / 빌드
npm run check
npm run build
```

## 환경변수 (.env)

| 키 | 용도 |
|----|------|
| `DATABASE_URL` | `postgresql://ouhve:ouhve_dev@localhost:5432/ouhve` |
| `SESSION_SECRET` | Express 세션 시크릿 (랜덤 32+ 문자) |
| `SITE_PASSWORD` | 사이트 게이트 비밀번호 (신규 설정 — GLFAV 값 재사용 X) |
| `SITE_AUTH_SECRET` | 사이트 게이트 HMAC 시크릿 (32 bytes hex) |
| `NODE_ENV` | `development` / `production` |

## 아키텍처 규칙

### 데이터 격리 (franchise_id)
- 모든 핵심 테이블에 `franchiseId` 컬럼 적용
- 세션의 `franchiseId`를 모든 쿼리에 자동 적용
- 웰니스 모듈 추가 시 동일 규칙 준수

### 인증
- Passport.js local + scrypt
- 쿠키명: `ouhve.session`, 사이트 게이트: `ouhve_gate`

### 디자인 시스템 준수 (필독)
- 새 UI 작성 전 `design-system/usage-rules.md` 체크리스트 확인
- Persimmon은 메인 CTA + KPI 강조 + 브랜드에만, 본문 텍스트 금지
- Teal은 **도형/점/선/아이콘 칩 배경**에만, **글자 색상 절대 금지**
- 화면당 Teal 사용 면적 합계 100px² 이내

## 금지 사항

절대 수정하지 않을 파일 (전역 + 프로젝트):
- `vite.config.ts`, `server/vite.ts`, `drizzle.config.ts`

## Skills (프로젝트 관련)

전역 스킬 매뉴얼: `~/.claude/skills/SKILL_MANUAL.md`

| 스킬 | 용도 |
|------|------|
| `design-palette-derive` | 신규 모듈/브랜드 컬러 도출 시 (디자인 시스템 확장) |
| `verify-design-system` | UI 변경 후 디자인 규칙 위반 검사 |
| `verify-fluid-typography` | 콘텐츠 분류 + fluid 반응형 검증 |
| `dev-component`, `new-component` | React 컴포넌트 생성 |
| `dev-page`, `new-page` | 페이지 생성 |
| `dev-route`, `new-route` | API 라우트 생성 |
| `dev-schema`, `new-entity` | DB 엔티티 추가 |
| `verify-route-security` | 라우트 인증/인가 검증 |
| `feature-planner` | 기능 구현 전 단계별 계획 수립 |

## OUHVE 확장 로드맵 (개요)

1. **Phase 1 — GLFAV → OUHVE 리브랜드 완료** (현재) — 컬러/브랜딩 치환, 디자인 시스템 적용
2. **Phase 2 — 헬스장 운영 안정화** — 기존 GLFAV 기능 OUHVE 톤으로 재정렬
3. **Phase 3 — 웰니스 확장** — 요가/식단/명상/스파 모듈 추가, 동일 franchise_id 격리 적용

상세는 향후 `docs/plans/` 또는 `BILLOFSYSTEM.md` 참조.
