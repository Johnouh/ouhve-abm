# OUHVE ABM — Design System

> 헬스장 → 웰니스 전반으로 확장하는 운영 시스템 브랜드.
> 2026년 5월 19일 확정 (palette derive 첫 적용).

## 한 줄 요약

- **Persimmon #FF5A1F** 메인 — 활력/따뜻함/생명력
- **Slate** 베이스 — 차분한 테크 톤 (light #F8FAFC / dark #020617)
- **Forest Teal #0F766E** 액센트 — **도형/점에만**, 글자 절대 금지

## 톤 & 무드

- 따뜻한 에너지 (Persimmon) + 차분한 신뢰 (Slate) + 자연 시그널 (Teal 점)
- 라이프스타일 매거진의 절제된 컬러 운용
- 2026 트렌드: "Generic Blue 탈출" + "Zinc-tinted near-black" 다크 베이스

## 적용 범위

- OUHVE ABM 본 제품 (헬스장/PT 운영)
- 향후 OUHVE 산하 웰니스 라인업 (요가, 식단, 명상, 스파 등) — 동일 팔레트 유지

## 파일 구성

| 파일 | 용도 |
|---|---|
| `tokens.md` | HEX/HSL/RGB + Tailwind 매핑 + CSS 변수 |
| `usage-rules.md` | 컬러별 허용/금지 위치 (특히 Teal) |
| `preview.html` | Light/Dark 풀 대시보드 모형 (라이브 미리보기) |

## 미리보기

로컬에서 열기: `open ~/.claude/reference/design-systems/ouhve/preview.html`

## 도출 과정

`design-palette-derive` 스킬로 도출 (5 iteration). 핵심 결정:
1. 메인 컬러: 4개 후보 중 Persimmon 선택 (도메인 = 웰니스 → 따뜻한 에너지)
2. 뉴트럴: Cream 거부 (누런톤) → Slate 채택 (시원한 테크)
3. 액센트: Forest Teal 선택하되 **글자 사용 금지, 도형 포인트만**
