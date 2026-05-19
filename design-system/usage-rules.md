# OUHVE 컬러 사용 규칙

## Persimmon #FF5A1F (Primary)

### ✓ 허용
- 브랜드 로고 박스, 로고 텍스트 일부 (`OUHVE [ABM]`의 ABM)
- 모든 Primary CTA 버튼 배경
- KPI 카드 상단 그라데이션 라인 (AccentLine)
- KPI 카드 우상단 아이콘 칩 (`bg-persimmon/10 text-persimmon`)
- 차트 막대 (기본 시리즈)
- 토글 켜진 상태, 라디오 선택 상태
- Focus ring (`focus-visible:ring-1 ring-primary`)
- 헤더 활성 메뉴 언더라인

### ✗ 금지
- 본문 paragraph 텍스트
- 카드 배경 채움 (브랜드 컬러가 너무 강해짐 — soft alpha만)
- 페이지 전체 BG
- 데이터 테이블 행 배경

## Forest Teal #0F766E (Accent · 도형 전용)

### ✓ 허용 — 작은 도형/점/선만
- 로고 우하단 상태 점 (브랜드 시그너처)
- 헤더 "실시간 동기화" 펄스 점
- KPI 상승 인디케이터 점 (`+12% MoM` 옆 작은 점)
- 차트 Goal 가로선 (1~2px)
- 패널 제목 옆 사각형 아이콘 칩 배경
- 아바타 우하단 온라인 상태 점 (10px 원)
- 태그 앞 점 (`• 활성 24명`)
- 빈 상태 일러스트의 장식 사각형
- 체크박스 체크 마크 색 (선택)

### ✗ 절대 금지
- **본문/헤딩/캡션 등 모든 텍스트 색** (가장 중요한 규칙)
- KPI 숫자 색
- 버튼 텍스트
- 링크 텍스트
- 큰 영역 배경 (50px² 초과)
- 보더 라인 단독 (1px border-only로 사용 X — 도형의 일부일 때만)

### 면적 가이드
- 한 화면당 Teal 사용 면적 **합계 100px² 이내**
- 평균 1~3% 면적 점유, 절대 5% 초과 금지

## Slate 베이스

### Light Mode 규칙
- 페이지 BG: `#F8FAFC` 항상
- 카드는 한 단계 밝게: `#FFFFFF`
- Hover는 한 단계 어둡게: `#F1F5F9`
- 텍스트 위계: 본문 `#0F172A` → 보조 `#64748B` → 미세 `#94A3B8`

### Dark Mode 규칙
- 페이지 BG: `#020617` (Zinc/Slate-tinted near-black)
- 카드는 한 단계 밝게: `#0F172A`
- Hover/Border 동일: `#1E293B`
- 다크모드에선 Teal `#0F766E` → `#14B8A6` (밝게 시프트)

## 시맨틱 색상 충돌 방지

| 충돌 가능성 | 처리 |
|---|---|
| Persimmon vs Warning(amber-500) | warning을 amber-400으로 노란기 강화 |
| Teal vs Success(emerald) | Teal은 점/도형 전용이라 텍스트 success와 분리 |
| Teal vs Info(blue) | 색상군 다름 — 충돌 없음 |

## 체크리스트 (디자인 리뷰 시)

- [ ] 글자색에 `#0F766E` 또는 `text-accent` 사용 안 함
- [ ] Persimmon이 페이지당 메인 CTA 1개 + KPI 강조 + 차트 막대 외에 남용 안 됨
- [ ] Teal 사용 위치가 "점/선/작은 사각형" 중 하나
- [ ] 다크모드에서 Teal이 `#14B8A6`로 시프트
- [ ] 라이트 BG는 `#F8FAFC`, 카드는 `#FFFFFF` 위계 지켜짐
- [ ] Warning 색이 `amber-400`으로 시프트되어 Persimmon과 구분됨
