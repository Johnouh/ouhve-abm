# GL allpay 공식 홈페이지

> PG기반 구조 위에 가맹점 직접 정산흐름을 설계하는 **GL allpay**의 공식 웹사이트입니다.

---

## 🎯 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | GL allpay 공식 홈페이지 |
| 버전 | v02_260303 기준 |
| 구조 | 메인 원페이지(One-Page) + 하이브리드 구조 |
| 기술 스택 | HTML5 / CSS3 / Vanilla JavaScript |
| 타겟 | 선결제 기반 업종 사업장 (헬스, 필라테스, 수영, 교육 등) |

---

## 📁 파일 구조

```
/
├── index.html          # 메인 페이지 (원페이지)
├── settlement.html     # 정산 구조 서브 페이지
├── service.html        # 서비스 소개 서브 페이지
├── contact.html        # 문의/상담신청 서브 페이지
├── css/
│   └── style.css       # 전체 공통 스타일시트
├── js/
│   ├── main.js         # 공통 JS (헤더, 모바일 메뉴, 애니메이션)
│   └── contact.js      # 상담신청 폼 처리 JS
└── README.md
```

---

## 🗂️ 페이지 구성 및 URL

| 파일 | 경로 | 설명 |
|---|---|---|
| `index.html` | `/` 또는 `/index.html` | 메인 원페이지 (6개 섹션) |
| `settlement.html` | `/settlement.html` | 정산 구조 상세 페이지 |
| `service.html` | `/service.html` | 서비스 소개 상세 페이지 |
| `contact.html` | `/contact.html` | 문의하기 / 상담신청 폼 |

---

## ✅ 구현된 기능

### 메인 페이지 (index.html)
- **Hero 섹션**: 헤드라인, 서브 카피, CTA 버튼 2개 (서비스 보기 / 문의하기)
- **Stability by Design**: 키워드 강조(한도/약관/절차) + SVG 정산 흐름 다이어그램
- **Structure First**: 3가지 핵심 포인트 카드 + 강조 문구
- **⭐ 업계 리스크 & GL 차별성**: 일반 PG vs GL allpay 비교표 + GL페이 하이라이트 블록
- **⭐ 프리미엄 회원권 설계**: 무이자 24개월 → 프리미엄 상품 3단계 플로우 + 가격 비교 예시
- **Built on PG Infrastructure**: 4단계 가로 플로우 다이어그램
- **Beyond Payment**: 4개 기능 카드 (회원관리/계약관리/결제이력/마케팅 확장)
- **CTA 섹션**: 상담 유도 버튼

### 정산 구조 페이지 (settlement.html)
- Hero + 6개 섹션 구성
- 왜 정산 구조가 중요한가 (4개 카드)
- GL allpay 정산 설계 원칙 3가지
- 정산 흐름 5단계 다이어그램
- 선결제 업종 고려사항
- GL allpay만의 특징 + 인용구

### 서비스 페이지 (service.html)
- Hero + 6개 섹션 구성
- Perspective: 업종별 구조 차이 설명
- Our Approach: 4단계 설계 프로세스 (Flow/Structure/Alignment/Preparation)
- Scope: 설계 범위 5가지
- Principle: 운영 원칙
- Who it's for: 대상 사업장

### 문의하기 페이지 (contact.html)
- 상담신청 폼 (기본정보 + 운영현황 + 자료첨부)
- 드래그 & 드롭 파일 업로드 (최대 10MB)
- 실시간 폼 유효성 검사
- 개인정보처리방침 동의
- 제출 성공 시 성공 화면으로 전환
- 접수 데이터 `consultations` 테이블 자동 저장

### 공통 기능
- 고정형(Sticky) 헤더 (스크롤 시 배경 적용)
- 모바일 햄버거 메뉴
- IntersectionObserver 기반 Fade-in 애니메이션
- 토스트 알림 시스템
- 반응형 레이아웃 (1024px, 768px, 480px 브레이크포인트)

---

## 🎨 디자인 시스템

### 컬러 팔레트
| 변수명 | 헥스 코드 | 용도 |
|---|---|---|
| `--navy` | `#0A1628` | 배경 기본 |
| `--mid-navy` | `#0D2244` | 카드/섹션 배경 |
| `--gold` | `#C9A84C` | 포인트/CTA |
| `--gold-light` | `#E2C47A` | 호버 상태 |
| `--white` | `#FFFFFF` | 주요 텍스트 |
| `--text-sub` | `#B0BAD1` | 서브 텍스트 |

### 타이포그래피
- 한국어: `Noto Sans KR` (Google Fonts)
- 영문: `Inter` / `Helvetica Neue`

---

## 💾 데이터 모델

### `consultations` 테이블
상담신청 폼 제출 데이터 저장

| 필드명 | 타입 | 설명 |
|---|---|---|
| `id` | text | UUID |
| `biz_name` | text | 사업자명 |
| `biz_num` | text | 사업자등록번호 |
| `rep_name` | text | 대표자명 |
| `phone` | text | 연락처 |
| `email` | text | 이메일 |
| `industry` | text | 업종 |
| `operating_period` | text | 운영기간 |
| `contract_period` | text | 회원권 평균 계약기간 |
| `prepay_ratio` | text | 선결제 비율 구간 |
| `installment` | text | 할부 운영 여부 |
| `pg_status` | text | PG 사용 상태 |
| `message` | rich_text | 추가 문의사항 |
| `files_count` | number | 첨부 파일 수 |
| `status` | text | 처리 상태 (pending/reviewing/approved/rejected) |
| `submitted_at` | datetime | 신청 일시 |

**API 엔드포인트**: `tables/consultations`

---

## 🔧 미구현 / 향후 개발 권장 사항

- [ ] **관리자 대시보드**: 접수된 상담 신청 목록 조회 및 상태 관리 페이지
- [ ] **실제 파일 업로드**: 현재 파일 선택 UI만 구현, 실제 파일 서버 저장은 별도 백엔드 필요
- [ ] **이메일 알림**: 신청 접수 시 담당자 자동 이메일 발송 기능
- [ ] **사업자 정보 실제 입력**: 푸터의 플레이스홀더 정보를 실제 사업자 정보로 교체
- [ ] **개인정보처리방침/이용약관 페이지**: 별도 페이지 또는 모달 구현
- [ ] **SEO 최적화**: Open Graph 메타태그, 구조화 데이터 추가
- [ ] **GA 연동**: 구글 애널리틱스 트래킹 코드 삽입
- [ ] **실제 로고 이미지**: 텍스트 로고를 실제 브랜드 로고 이미지로 교체
- [ ] **다국어 지원**: 영문 버전 페이지 추가 고려

---

## 🚀 배포

배포 방법:
1. **Publish 탭**으로 이동
2. [Publish] 버튼 클릭
3. 발급된 라이브 URL 확인

---

*Copyright © 2026 GL allpay. All rights reserved.*
