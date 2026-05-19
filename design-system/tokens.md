# OUHVE Design Tokens

## 1. 컬러 팔레트

### Primary — Persimmon

| 토큰 | 값 | 역할 |
|---|---|---|
| `--primary` | `hsl(14, 100%, 56%)` / `#FF5A1F` | 메인 (CTA, 브랜드 로고, KPI 강조, 차트 막대) |
| `--primary-foreground` | `#FFFFFF` | Primary 위 텍스트 |
| `--primary-hover` | `#FF6B33` (light 5%) | hover-elevate 대체 시 |
| `--primary-soft` | `#FF5A1F12` (7% alpha) | 아이콘 칩 배경, 미세 강조 |

### Accent — Forest Teal (도형 전용)

| 토큰 | 값 | 역할 |
|---|---|---|
| `--accent` | `#0F766E` (라이트모드) | 도형 점, 차트 가이드선, 상태 점 |
| `--accent-dark` | `#14B8A6` (다크모드용 밝게) | 다크모드에서만 — 다크 BG 대비 |
| `--accent-soft` | `#0F766E15` (8% alpha) | 패널 아이콘 칩 배경 |

### Base — Slate

#### Light Mode
| 토큰 | 값 | 역할 |
|---|---|---|
| `--bg` | `#F8FAFC` (slate-50) | 페이지 배경 |
| `--bg-card` | `#FFFFFF` | 카드/패널 배경 |
| `--bg-muted` | `#F1F5F9` (slate-100) | hover, 비활성 영역 |
| `--border` | `#E2E8F0` (slate-200) | 카드/입력 보더 |
| `--text` | `#0F172A` (slate-900) | 본문 |
| `--text-muted` | `#64748B` (slate-500) | 보조 텍스트, 캡션 |
| `--text-faint` | `#94A3B8` (slate-400) | 미세 텍스트, 라벨 |

#### Dark Mode
| 토큰 | 값 | 역할 |
|---|---|---|
| `--bg` | `#020617` (slate-950) | 페이지 배경 |
| `--bg-card` | `#0F172A` (slate-900) | 카드/패널 배경 |
| `--bg-muted` | `#1E293B` (slate-800) | hover, 비활성 영역 |
| `--border` | `#1E293B` (slate-800) | 카드/입력 보더 |
| `--text` | `#F1F5F9` (slate-100) | 본문 |
| `--text-muted` | `#94A3B8` (slate-400) | 보조 텍스트 |
| `--text-faint` | `#64748B` (slate-500) | 미세 텍스트 |

### Semantic (시맨틱 상태)

| 상태 | 라이트 | 다크 | 비고 |
|---|---|---|---|
| Success | `#10B981` emerald-500 | `#34D399` emerald-400 | Teal과 비슷하지만 채도 다름 |
| Warning | `#FBBF24` amber-400 | `#FCD34D` amber-300 | Persimmon과 구분 위해 amber-400으로 노란기 |
| Error | `#EF4444` red-500 | `#F87171` red-400 | |
| Info | `#3B82F6` blue-500 | `#60A5FA` blue-400 | |
| Premium | `#A855F7` purple-500 | `#C084FC` purple-400 | |

## 2. CSS 변수 (index.css 적용본)

```css
:root {
  /* OUHVE Primary */
  --primary: 14 100% 56%;          /* HSL — #FF5A1F Persimmon */
  --primary-foreground: 0 0% 100%;

  /* OUHVE Accent (point only — never on text) */
  --accent: 174 78% 26%;           /* #0F766E Forest Teal */
  --accent-foreground: 0 0% 100%;

  /* Base — Slate Light */
  --background: 210 40% 98%;       /* #F8FAFC */
  --foreground: 222 47% 11%;       /* #0F172A */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 210 40% 96%;            /* #F1F5F9 */
  --muted-foreground: 215 16% 47%; /* #64748B */
  --border: 214 32% 91%;           /* #E2E8F0 */

  /* Semantic — sample */
  --destructive: 0 84% 60%;        /* #EF4444 */
  --destructive-foreground: 0 0% 100%;
}

.dark {
  --background: 222 47% 5%;        /* #020617 */
  --foreground: 210 40% 96%;       /* #F1F5F9 */
  --card: 222 47% 11%;             /* #0F172A */
  --card-foreground: 210 40% 96%;
  --muted: 217 33% 17%;            /* #1E293B */
  --muted-foreground: 215 20% 65%; /* #94A3B8 */
  --border: 217 33% 17%;

  /* Accent gets brighter in dark mode for contrast */
  --accent: 173 80% 40%;           /* #14B8A6 */
}
```

## 3. Tailwind 매핑

```ts
// tailwind.config.ts (extend.colors)
colors: {
  brand: {
    persimmon: '#FF5A1F',
    'persimmon-hover': '#FF6B33',
    teal: '#0F766E',
    'teal-dark': '#14B8A6',
  },
}
```

기본 클래스 그대로 사용 가능: `bg-primary`, `text-primary`, `bg-accent` (CSS 변수 연결).

## 4. 그라데이션 / 글로우

| 토큰 | 값 | 용도 |
|---|---|---|
| Accent Line | `linear-gradient(to right, #FF5A1F, #FF5A1F40, transparent)` | 카드 상단 2px 라인 |
| Primary Glow | `0 2px 8px #FF5A1F30` | CTA 버튼 box-shadow |
| Teal Halo | `0 0 0 3px #0F766E25` | 라이브 점 주변 헤일로 |
