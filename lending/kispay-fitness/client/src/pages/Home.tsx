/**
 * GL ALLPAY x KEEPPAY 휘트니스 결제구조
 * Swiss Corporate Precision 디자인
 * 수정: 파트너사 로고, 비교표 강화, 하이리스크 팝업, 보상한도, 정산경로 수정 등
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, type Easing } from "framer-motion";
import { Link } from "wouter";

/* ─── Counter ─── */
function CountUp({ end, suffix = "", duration = 1.5 }: {
  end: number; suffix?: string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const inc = end / (duration * 60);
    const t = setInterval(() => {
      v += inc;
      if (v >= end) { setCount(end); clearInterval(t); }
      else setCount(Math.floor(v * 10) / 10);
    }, 1000 / 60);
    return () => clearInterval(t);
  }, [inView, end, duration]);
  return (
    <span ref={ref} className="stat-number">
      {end % 1 !== 0 ? count.toFixed(1) : Math.floor(count)}{suffix}
    </span>
  );
}

const ease: Easing = [0.25, 0.1, 0.25, 1];
const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

/* ─── 유튜브 썸네일 컴포넌트 ─── */
function YoutubeThumbnail({ id, title, channel, isShort }: { id: string; title: string; channel: string; isShort?: boolean }) {
  const url = isShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group block">
      <div className="relative overflow-hidden bg-black aspect-video">
        <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <p className="text-xs font-bold text-foreground mt-2 leading-snug group-hover:text-signal-red transition-colors line-clamp-2">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{channel}</p>
    </a>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHighRisk, setShowHighRisk] = useState(false);
  const [showFakeTooltip, setShowFakeTooltip] = useState(false);
  const [showPgRisk, setShowPgRisk] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm md:text-base tracking-[0.15em] text-navy font-black">GL ALLPAY</span>
            <span className="text-muted-foreground text-[10px]">&times;</span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground font-bold">KEEPPAY</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {["위기", "비교", "GL올페이", "안심서비스", "매출구조"].map((l) => (
              <a key={l} href={`#${l}`} className="text-xs text-muted-foreground hover:text-navy transition-colors font-medium">{l}</a>
            ))}
            <Link href="/simulator">
              <span className="text-xs bg-navy text-white px-3 py-1.5 font-bold hover:bg-navy/80 transition-colors cursor-pointer">매출 시뮬레이터</span>
            </Link>
            <Link href="/proposal">
              <span className="text-xs bg-navy text-white px-3 py-1.5 font-bold hover:bg-navy/80 transition-colors cursor-pointer">제안서</span>
            </Link>
            <Link href="/apply">
              <span className="text-xs bg-signal-red text-white px-3 py-1.5 font-bold hover:bg-signal-red/80 transition-colors cursor-pointer">서류접수</span>
            </Link>
          </div>
          <button className="md:hidden flex flex-col gap-1 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span className={`block w-5 h-0.5 bg-navy transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block w-5 h-0.5 bg-navy transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-navy transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border px-4 py-4 space-y-3">
            {["위기", "비교", "GL올페이", "안심서비스", "매출구조"].map((l) => (
              <a key={l} href={`#${l}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-navy font-medium">{l}</a>
            ))}
            <Link href="/simulator"><span className="block text-sm bg-navy text-white px-3 py-2 font-bold text-center cursor-pointer">매출 시뮬레이터</span></Link>
            <Link href="/proposal"><span className="block text-sm bg-navy text-white px-3 py-2 font-bold text-center cursor-pointer">제안서</span></Link>
            <Link href="/apply"><span className="block text-sm bg-signal-red text-white px-3 py-2 font-bold text-center cursor-pointer">서류접수</span></Link>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <header className="relative pt-14 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663399461499/HBKFmjPeS4mQUtGxY3Txin/hero-bg-oWsdqTkfox4h7fuPbUN7MJ.webp)`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        <div className="relative container max-w-6xl mx-auto py-20 md:py-32">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.span variants={fadeIn} className="font-mono text-[10px] tracking-[0.3em] text-signal-red font-bold uppercase block mb-5">
              GL ALLPAY &middot; Payment, Structured.
            </motion.span>
            <motion.h1 variants={fadeIn} className="text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-navy max-w-3xl">
              구조가 다르면,
              <br />결과도 달라집니다.
            </motion.h1>
            <motion.p variants={fadeIn} className="mt-6 text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              <strong className="text-navy font-black text-base md:text-lg">GL ALLPAY</strong>는 <strong className="text-foreground font-semibold">원천결제사에 휘트니스 업종을 공식 입점</strong>시키고,
              2차·3차 PG를 거치지 않는 <strong className="text-foreground font-semibold">직접 정산 구조</strong> 위에
              킵페이 안심결제 서비스와 무이자 3~24개월 장기할부를 설계합니다.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-10 flex flex-wrap gap-10 md:gap-16">
              <div>
                <div className="text-4xl md:text-5xl"><CountUp end={24} suffix="개월" /></div>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-mono tracking-wide">무이자 3~24개월 장기할부</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl"><CountUp end={300} suffix="만원" /></div>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-mono tracking-wide">소비자 보상 한도</p>
              </div>
              <div>
                <div className="flex gap-1 items-baseline">
                  <span className="font-mono text-4xl md:text-5xl font-bold text-navy">D+1</span>
                  <span className="text-lg text-muted-foreground">/</span>
                  <span className="font-mono text-2xl md:text-3xl font-bold text-navy">D+3</span>
                  <span className="text-lg text-muted-foreground">/</span>
                  <span className="font-mono text-xl md:text-2xl font-bold text-green-600">즉시</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-mono tracking-wide">원천사 직접 정산 (선택 가능)</p>
              </div>
            </motion.div>
            <motion.div variants={fadeIn} className="mt-10 flex flex-wrap gap-3">
              <Link href="/apply">
                <span className="inline-flex items-center gap-2 bg-signal-red text-white px-5 py-2.5 font-bold text-sm hover:bg-signal-red/80 transition-colors cursor-pointer">
                  지금 바로 도입신청 →
                </span>
              </Link>
              <a href="#" className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 font-bold text-sm hover:bg-navy/80 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.113 4.508 6.459-.199.742-.72 2.687-.825 3.104-.13.52.19.513.4.374.164-.109 2.612-1.775 3.672-2.497.725.104 1.474.16 2.245.16 5.523 0 10-3.463 10-7.691S17.523 3 12 3z"/></svg>
                카카오톡 상담
              </a>
              <Link href="/simulator">
                <span className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 font-bold text-sm hover:bg-navy/80 transition-colors cursor-pointer">
                  매출 시뮬레이터
                </span>
              </Link>
              <Link href="/proposal">
                <span className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 font-bold text-sm hover:bg-navy/80 transition-colors cursor-pointer">
                  제안서 보기
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <div className="hr-accent" />
      </header>

      {/* ═══ 01. 위기 인식 ═══ */}
      <section id="위기" className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeIn} className="flex items-center gap-3 mb-10">
              <span className="section-number">01</span>
              <div className="hr-thin flex-1" />
              <span className="section-number">위기 인식</span>
            </motion.div>

            <motion.h2 variants={fadeIn} className="text-2xl md:text-3xl font-black text-navy leading-tight mb-4">
              휘트니스 업종이 처한
              <br />구조적 위기
            </motion.h2>
            <motion.p variants={fadeIn} className="text-sm text-muted-foreground max-w-xl mb-10 leading-relaxed">
              원천결제사가 직접 가맹을 거부하는 대표적 기피 업종. 높은 환불·차지백 리스크, 폐업 시 소비자 피해, 자동결제 민원이 원인입니다.
            </motion.p>

            {/* 핵심 수치 */}
            <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { num: "15,789", unit: "건", label: "소비자 피해구제 신청", sub: "한국소비자원, 2021~2024" },
                { num: "562", unit: "곳", label: "2025년 헬스장 폐업", sub: "전년 570곳과 유사 수준" },
                { num: "90", unit: "%", label: "법적 면제 조항 포함", sub: "체육시설 약관 기준" },
                { num: "116", unit: "곳", label: "불법 PG 적발", sub: "2년간 국정감사 자료" },
              ].map((d) => (
                <div key={d.label} className="border border-border p-5 bg-card">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-navy">{d.num}<span className="text-signal-red text-lg">{d.unit}</span></div>
                  <div className="text-xs font-bold text-foreground mt-2">{d.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{d.sub}</div>
                </div>
              ))}
            </motion.div>

            {/* 법률 변화 */}
            <motion.div variants={fadeIn} className="border-l-2 border-signal-red bg-card p-6 mb-6">
              <h3 className="text-sm font-black text-navy mb-3">법률 환경 변화</h3>
              <div className="space-y-3 text-xs text-foreground leading-relaxed">
                <div className="flex gap-3 items-start">
                  <span className="shrink-0 font-mono text-signal-red font-bold w-20">공약</span>
                  <div>
                    <span>이재명 대통령 '먹튀방지법' — 3개월 이상 선납 체육시설 <strong>킵페이 안심결제 서비스 가입 의무화</strong></span>
                    <a href="https://www.donga.com/news/Politics/article/all/20250528/131698494/1" target="_blank" rel="noopener noreferrer" className="ml-2 text-[10px] text-signal-red hover:underline font-bold">[기사 보기]</a>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="shrink-0 font-mono text-signal-red font-bold w-20">개정안</span>
                  <div>
                    <span>박성훈 의원(국민의힘) 체육시설법 개정안 발의 — 1개월 이상 선불 시설 킵페이 안심결제 서비스/공제 가입 또는 영업보증금 예치 의무화</span>
                    <a href="https://www.busan.com/view/busan/view.php?code=2025122414522430204" target="_blank" rel="noopener noreferrer" className="ml-2 text-[10px] text-signal-red hover:underline font-bold">[기사 보기]</a>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="shrink-0 font-mono text-signal-red font-bold w-20">현행법</span>
                  <div>
                    <span>2025.4.23~ 폐업 14일 전 회원 통지 의무, 위반 시 100만원 이하 과태료</span>
                    <a href="https://v.daum.net/v/YeRTcPV7RW" target="_blank" rel="noopener noreferrer" className="ml-2 text-[10px] text-signal-red hover:underline font-bold">[기사 보기]</a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 우회결제 리스크 */}
            <motion.div variants={fadeIn} className="bg-navy text-white p-6 mb-10">
              <h3 className="text-sm font-black mb-3">12개월 할부의 어두운 뒷면</h3>
              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                휘트니스는 PG 기피업종이라 장기할부가 정상경로로는 불가능합니다.
                대부분의 센터가 학원·여행사·쇼핑몰 등 <strong className="text-white">다른 업종 단말기를 빌려</strong> 위장 결제합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { src: "한국세정신문", title: "'절세단말기'로 가장한 불법 PG사, 2년간 116곳 적발", url: "https://www.intn.co.kr/news/articleView.html?idxno=2031321" },
                  { src: "경향신문", title: "자본잠식 회사에 구상권? 보험도 없는 PG사 손실 떠안을듯", url: "https://www.khan.co.kr/article/202407291708011" },
                  { src: "아시아경제", title: "헬스장·필라테스 '먹튀' 기승…지급보증보험 언제 도입하나", url: "https://www.asiae.co.kr/article/2024081617083134878" },
                  { src: "중앙일보", title: "도박·보이스피싱에 가상 계좌 대줬다…범죄 연루 PG사 적발", url: "https://www.joongang.co.kr/article/25353428" },
                ].map((n) => (
                  <a key={n.src} href={n.url} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-3 flex gap-3 items-start hover:bg-white/10 transition-colors group">
                    <span className="text-[10px] text-white/30 font-mono shrink-0 w-16">{n.src}</span>
                    <span className="text-[11px] text-white/70 leading-snug group-hover:text-white transition-colors">{n.title}</span>
                    <span className="text-[10px] text-signal-red shrink-0 font-bold">→</span>
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-signal-red font-bold mt-4">여신전문금융업법 위반 + 탈세 — 적발 시 사업자 자격 박탈 위험</p>
            </motion.div>

            {/* ═══ 유튜브 피해 영상 ═══ */}
            <motion.div variants={fadeIn} className="mb-6">
              <div className="bg-signal-red text-white p-4 mb-4">
                <h3 className="text-base font-black">소비자도 피해, 가맹점 대표도 피해</h3>
                <p className="text-xs text-white/70 mt-1">헬스장 먹튀로 인한 대표 구속, 금융사 구상권 청구, 회원 집단 고소 — 실제 사례를 확인하세요</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <YoutubeThumbnail id="XCH7hmcAYZM" title='"선불 먹고 튀어!" 헬스장 먹튀 사라질까?' channel="KBS 경제콘서트" />
                <YoutubeThumbnail id="WaD9bJSRahI" title='"돈 이미 냈는데" 돌연 폐업…선결제 먹튀 피해 급증' channel="SBS 뉴스" />
                <YoutubeThumbnail id="hno1X5yZGsU" title="헬스장 진짜 망해가나요? 대표에게 직접 물어봄" channel="크랩" />
                <YoutubeThumbnail id="Jrdk9pc_ljY" title="'먹튀 헬스장' 근절한다…폐업 2주 전 통보 의무" channel="YTN" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <YoutubeThumbnail id="nBX27TJlryA" title='"그만뒀는데 자동결제?" 헬스장 구독서비스 피해 급증' channel="SBS 이슈라이브" />
                <YoutubeThumbnail id="yE4P7S3qAD4" title="헬스장 먹튀 당한 경우, 사기죄로 고소하는 방법" channel="법률 채널" />
                <a href="https://dgmbc.com/article/2qiA_hmKTj8f" target="_blank" rel="noopener noreferrer" className="group block border border-border p-4 bg-card hover:border-signal-red transition-colors">
                  <div className="text-signal-red font-mono text-2xl font-black mb-2">구속</div>
                  <p className="text-xs font-bold text-foreground leading-snug group-hover:text-signal-red transition-colors">전국구 대형 헬스장 폐업하고 '먹튀'…30대 업주 구속</p>
                  <p className="text-[10px] text-muted-foreground mt-1">대구MBC · 2024.12</p>
                </a>
                <a href="https://www.yna.co.kr/view/AKR20251125153800051" target="_blank" rel="noopener noreferrer" className="group block border border-border p-4 bg-card hover:border-signal-red transition-colors">
                  <div className="text-signal-red font-mono text-2xl font-black mb-2">2억</div>
                  <p className="text-xs font-bold text-foreground leading-snug group-hover:text-signal-red transition-colors">헬스장 트레이너 2명, 선결제 2억원 챙겨 잠적</p>
                  <p className="text-[10px] text-muted-foreground mt-1">연합뉴스 · 2025.11</p>
                </a>
              </div>
              <div className="mt-4 bg-navy/5 border-l-2 border-signal-red p-4">
                <p className="text-xs text-foreground font-bold">이것이 현실입니다.</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  소비자는 수십~수백만원을 잃고, 대표는 구속되고, 금융사는 구상권을 청구합니다.
                  <strong className="text-navy"> GL ALLPAY + 킵페이 안심결제 서비스</strong>는 이 악순환을 구조적으로 끊습니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ 02. 비교표 (통합) ═══ */}
      <section id="비교" className="pb-16 md:pb-24">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeIn} className="flex items-center gap-3 mb-10">
              <span className="section-number">02</span>
              <div className="hr-thin flex-1" />
              <span className="section-number">한눈에 비교</span>
            </motion.div>

            <motion.h2 variants={fadeIn} className="text-2xl md:text-3xl font-black text-navy leading-tight mb-4">
              <span className="text-3xl md:text-4xl text-navy font-black">GL ALLPAY</span> vs 2·3차 PG
            </motion.h2>
            <motion.p variants={fadeIn} className="text-sm text-muted-foreground mb-8">정산 경로가 곧 안정성입니다. 구조를 비교하면 답이 보입니다.</motion.p>

            {/* 비교 테이블 */}
            <motion.div variants={fadeIn} className="overflow-x-auto mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 bg-muted font-bold text-muted-foreground border-b-2 border-border w-[28%]">비교 항목</th>
                    <th className="text-center p-4 bg-navy text-white font-black border-b-2 border-navy w-[36%]">
                      <span className="text-xl tracking-wide">GL ALLPAY</span>
                    </th>
                    <th className="text-center p-4 bg-red-50 font-bold text-signal-red border-b-2 border-signal-red w-[36%]">2·3차 PG</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { item: "결제사 입점", gl: "원천결제사 공식 입점", pg: "2차·3차 PG 경유", glHL: true, pgDanger: true },
                    { item: "정산 경로", gl: "카드사 → 제1차원천사 → 센터", pg: "카드사 → 1차원천사 → 2차PG → 3차PG → 가맹점", glHL: true, pgDanger: true, pgRisk: true },
                    { item: "정산 주기", gl: "D+1 / D+3 / 즉시결제 선택", pg: "D+1 ~ D+7일", glHL: true, pgDanger: false },
                    { item: "2·3차 PG 폐업 시", gl: "해당 없음 (원천사 직접)", pg: "정산 중지 · 매출금 증발", glHL: true, pgDanger: true },
                    { item: "무이자 할부", gl: "3~24개월 (업계 최장)", pg: "자체 짧은 할부, 높은 고이자 장기할부", glHL: true, pgDanger: true },
                    { item: "킵페이 안심결제 서비스", gl: "자동 포함 (회원권당 300만원, 중복 가능)", pg: "없음", glHL: true, pgDanger: true },
                    { item: "PG 수수료", gl: "3.3% (투명 단일 요율)", pg: "3~7% (다단계 구조)", glHL: true, pgDanger: true },
                    { item: "법적 리스크", gl: "금감원 정식 인가", pg: "", glHL: true, pgDanger: true, pgSpecial: true },
                    { item: "설치", gl: "전국망 빠른 설치", pg: "지역 제한적", glHL: true, pgDanger: false },
                    { item: "온라인 결제", gl: "카카오/네이버/문자/인증/수기 전체 지원", pg: "제한적 지원", glHL: true, pgDanger: false },
                  ].map((r, i) => (
                    <tr key={r.item} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                      <td className="p-4 font-bold text-foreground text-xs">{r.item}</td>
                      <td className={`p-4 text-center text-xs bg-navy/[0.03] ${r.glHL ? "text-navy font-black" : "text-navy font-bold"}`}>
                        {r.gl}
                      </td>
                      <td className={`p-4 text-center text-xs ${r.pgDanger ? "text-signal-red font-black" : "text-muted-foreground font-medium"}`}>
                        {r.pgSpecial ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-signal-red font-black">라이센스가 있지만 하이리스크</span>
                            <button
                              onClick={() => setShowHighRisk(true)}
                              className="text-[10px] bg-signal-red text-white px-3 py-1 font-bold hover:bg-red-700 transition-colors"
                            >
                              하이리스크인 이유 보기
                            </button>
                          </div>
                        ) : r.pgRisk ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-signal-red font-black">{r.pg}</span>
                            <button
                              onClick={() => setShowPgRisk(true)}
                              className="text-[10px] bg-signal-red text-white px-3 py-1 font-bold hover:bg-red-700 transition-colors"
                            >
                              리스크 보기
                            </button>
                          </div>
                        ) : r.pg}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div variants={fadeIn} className="bg-navy text-white p-5 text-center">
              <p className="text-base font-black">결론: 구조가 다르면, 결과도 다릅니다</p>
              <p className="text-xs text-white/60 mt-1">원천결제사 직접 입점 = 정산 안정 + 장기할부 + 킵페이 안심결제 서비스 + 법적 안전</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ 하이리스크 모달 ═══ */}
      {showHighRisk && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowHighRisk(false)}>
          <div className="bg-white max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-signal-red">2·3차 PG가 하이리스크인 이유</h3>
              <button onClick={() => setShowHighRisk(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-5 text-sm text-foreground leading-relaxed">
              <div className="bg-red-50 border-l-4 border-signal-red p-4">
                <p className="font-black text-signal-red mb-2">핵심 요약</p>
                <p className="text-xs">
                  이재명 정부와 공정거래위원회, 문화체육관광부가 추진하는 <strong>휘트니스 업종 킵페이 안심결제 서비스(보증보험 대체서비스) 가입 의무화</strong>가 시행되면,
                  2·3차 PG사를 통해 결제하는 가맹점에서 폐업이 발생할 경우 <strong className="text-signal-red">2·3차 PG사가 대신 물어줘야 하는 구조</strong>가 됩니다.
                </p>
              </div>

              <div>
                <h4 className="font-black text-navy mb-2">왜 2·3차 PG가 위험한가?</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">1</span>
                    <div>
                      <p className="font-bold">자금 규모가 작다</p>
                      <p className="text-muted-foreground">2·3차 PG사는 대부분 소규모 법인으로, 자본금과 재무건전성이 크지 않습니다. 가맹점 부도 시 환불 재원이 부족합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">2</span>
                    <div>
                      <p className="font-bold">구상권 청구의 연쇄 효과</p>
                      <p className="text-muted-foreground">가맹점 폐업 → 소비자 환불 요청 → 카드사/보증보험사가 PG에 구상권 청구 → 재무건전성이 약한 2·3차 PG사가 대신 물어주다 부도 → 다른 가맹점 정산까지 중단되는 연쇄 붕괴가 발생합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">3</span>
                    <div>
                      <p className="font-bold">의무화 시행 시 리스크 폭증</p>
                      <p className="text-muted-foreground">킵페이 안심결제 서비스 가입이 의무화되면, 2·3차 PG 경유 가맹점도 보상 의무를 져야 합니다. 하지만 2·3차 PG는 유일하게 원천사가 아닌 경로로 결제를 처리하기 때문에, 보상 책임이 PG사에 집중됩니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">4</span>
                    <div>
                      <p className="font-bold">실제 사례: 이미 시작된 붕괴</p>
                      <p className="text-muted-foreground">경향신문 보도에 따르면, 자본잠식 상태의 PG사에 구상권을 청구해도 회수가 불가능한 사례가 이미 발생하고 있습니다. 소규모 PG사가 가맹점 부도 비용을 떠안고 연쇄 도산하는 구조입니다.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-navy text-white p-4">
                <p className="font-black text-sm mb-2">결론</p>
                <p className="text-xs text-white/80 leading-relaxed">
                  라이센스가 있다고 해서 안전한 것이 아닙니다. 킵페이 안심결제 서비스 의무화 시대에 <strong className="text-yellow-300">2·3차 PG 경유 구조는 가맹점에게 정산 중단 리스크를 안기는 시한폭탄</strong>입니다.
                  원천결제사 직접 입점(GL ALLPAY)만이 이 리스크에서 자유롭습니다.
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-bold mb-1">관련 기사</p>
                <a href="https://www.khan.co.kr/article/202407291708011" target="_blank" rel="noopener noreferrer" className="text-signal-red hover:underline block">경향신문 — "자본잠식 회사에 구상권? 보험도 없는 PG사 손실 떠안을듯"</a>
                <a href="https://www.asiae.co.kr/article/2024081617083134878" target="_blank" rel="noopener noreferrer" className="text-signal-red hover:underline block mt-1">아시아경제 — "헬스장·필라테스 '먹튀' 기승…지급보증보험 언제 도입하나"</a>
              </div>
            </div>

            <button onClick={() => setShowHighRisk(false)} className="mt-6 w-full bg-navy text-white py-3 font-bold text-sm hover:bg-navy/80 transition-colors">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ═══ 2·3차 PG 경유 리스크 모달 ═══ */}
      {showPgRisk && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPgRisk(false)}>
          <div className="bg-white max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-signal-red">2·3차 PG 경유 정산의 구조적 리스크</h3>
              <button onClick={() => setShowPgRisk(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-5 text-sm text-foreground leading-relaxed">
              <div className="bg-red-50 border-l-4 border-signal-red p-4">
                <p className="font-black text-signal-red mb-2">핵심 요약</p>
                <p className="text-xs">
                  2·3차 PG를 경유하는 다단계 정산 구조에서는 <strong>결제대금이 여러 단계를 거치며</strong> 중간 사업자의 자금 유용, 정산 지연, 연쇄 도산 리스크가 발생합니다.
                  금융감독원은 이를 <strong className="text-signal-red">"제2의 티메프 사태"</strong>로 규정하고 규제를 강화하고 있습니다.
                </p>
              </div>

              <div>
                <h4 className="font-black text-navy mb-2">다단계 PG 정산의 5대 리스크</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">1</span>
                    <div>
                      <p className="font-bold">정산 자금 유용 · 횡령</p>
                      <p className="text-muted-foreground">결제대금이 카드사 → 1차 → 2차 → 3차 → 가맹점으로 흐르는 과정에서, 중간 PG사가 정산 자금을 운영비로 유용하거나 횡령하는 사례가 반복되고 있습니다. 금감원은 정산자금 외부관리 의무를 신설했습니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">2</span>
                    <div>
                      <p className="font-bold">중간 PG 폐업 시 정산 즉시 중단</p>
                      <p className="text-muted-foreground">2차 또는 3차 PG사가 폐업하면 해당 PG를 경유하는 모든 가맹점의 정산이 즉시 중단됩니다. 가맹점은 이미 서비스를 제공했지만 대금을 받지 못하는 상황에 처합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">3</span>
                    <div>
                      <p className="font-bold">정산 지연의 일상화</p>
                      <p className="text-muted-foreground">다단계 구조에서는 각 단계마다 정산 주기가 누적됩니다. 원천사 D+1이어도 2차·3차를 거치면 실제 가맹점 입금은 D+3~D+7 이상으로 늘어나며, PG사 사정에 따라 추가 지연이 발생합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">4</span>
                    <div>
                      <p className="font-bold">연쇄 도산 구조</p>
                      <p className="text-muted-foreground">하나의 가맹점 부도 → 환불 청구 → PG사 부담 → 재무건전성 악화 → 다른 가맹점 정산 지연 → 추가 부도. 소규모 2·3차 PG사는 이 연쇄 고리에 매우 취약합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-signal-red text-white flex items-center justify-center font-bold text-[10px]">5</span>
                    <div>
                      <p className="font-bold">규제 강화로 퇴출 가속화</p>
                      <p className="text-muted-foreground">2026년부터 상위 PG사가 하위 PG의 재무·정산·불법 연루 이력까지 직접 평가해야 합니다. 기준 미달 하위 PG는 계약 해지 → 가맹점 결제 서비스 중단으로 이어집니다.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-navy text-white p-4">
                <p className="font-black text-sm mb-2">결론</p>
                <p className="text-xs text-white/80 leading-relaxed">
                  다단계 PG 경유 구조는 <strong className="text-yellow-300">정산 자금 유용, 중간 PG 폐업, 정산 지연, 연쇄 도산, 규제 퇴출</strong>이라는 5중 리스크를 안고 있습니다.
                  원천결제사 직접 입점(GL ALLPAY)은 카드사 → 원천사 → 센터로 단 2단계만 거치므로, 이 모든 리스크에서 자유롭습니다.
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-bold mb-1">관련 기사</p>
                <a href="https://biz.heraldcorp.com/article/10535233" target="_blank" rel="noopener noreferrer" className="text-signal-red hover:underline block">헤럴드경제 — "제2 티메프 사태 막아라" 금융위, PG사 규율체계 마련한다</a>
                <a href="https://cm.asiae.co.kr/ampview.htm?no=2025113010195564563" target="_blank" rel="noopener noreferrer" className="text-signal-red hover:underline block">아시아경제 — "다단계 PG 결제행태 개선한다" 금감원 가이드라인 도입</a>
                <a href="https://www.yna.co.kr/view/AKR20251129037000002" target="_blank" rel="noopener noreferrer" className="text-signal-red hover:underline block">연합뉴스 — 내년부터 상위 PG사, 하위업체 '리스크 평가'…부실 PG사 정비</a>
                <a href="https://www.digitaltoday.co.kr/news/articleView.html?idxno=612637" target="_blank" rel="noopener noreferrer" className="text-signal-red hover:underline block">디지털투데이 — 규제 쏟아지는 PG 시장…내년 생태계 대변화 예고</a>
                <a href="https://www.kmib.co.kr/article/view.asp?arcid=0924310106" target="_blank" rel="noopener noreferrer" className="text-signal-red hover:underline block">국민일보 — '헬스장 먹튀' 대표 탈세 의혹… 뒤에는 불법 PG사</a>
              </div>
            </div>

            <button onClick={() => setShowPgRisk(false)} className="mt-6 w-full bg-navy text-white py-3 font-bold text-sm hover:bg-navy/80 transition-colors">
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="container max-w-6xl mx-auto"><div className="hr-thin" /></div>

      {/* ═══ 03. GL올페이 소개 ═══ */}
      <section id="GL올페이" className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeIn} className="flex items-center gap-3 mb-10">
              <span className="section-number">03</span>
              <div className="hr-thin flex-1" />
              <span className="section-number">GL ALLPAY 소개</span>
            </motion.div>

            <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-black text-navy leading-tight mb-4">
              <span className="text-4xl md:text-5xl">GL ALLPAY</span>
              <br /><span className="text-lg md:text-xl text-muted-foreground font-medium">하나의 페이로 모든 결제를 관리합니다</span>
            </motion.h2>

            <motion.div variants={fadeIn} className="grid md:grid-cols-3 gap-6 mt-10">
              {/* 온라인 결제 지원 */}
              <div className="border-2 border-navy p-6 bg-navy text-white">
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/40 block mb-2">ONLINE PAYMENT</span>
                <h3 className="text-lg font-black mb-4">모든 결제 수단 지원</h3>
                <div className="space-y-2">
                  {[
                    { icon: "💳", name: "카카오페이" },
                    { icon: "💚", name: "네이버페이" },
                    { icon: "📱", name: "문자결제" },
                    { icon: "🔐", name: "인증결제" },
                    { icon: "✍️", name: "수기결제" },
                    { icon: "📟", name: "단말기 결제" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-3 bg-white/5 px-3 py-2">
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-sm font-bold text-white/90">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 통합 관리 */}
              <div className="border border-border p-6 bg-card">
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground block mb-2">UNIFIED MANAGEMENT</span>
                <h3 className="text-lg font-black text-navy mb-4">페이 하나로 통합 관리</h3>
                <div className="space-y-4">
                  <div className="border-b border-border pb-4">
                    <div className="font-mono text-2xl font-bold text-navy mb-1">ALL-IN-ONE</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      페이와 단말기 결제 시 <strong className="text-foreground">페이로 모든 내역이 자동 기록</strong>됩니다.
                      별도 장부나 엑셀 관리 없이 간편하게 매출을 확인하세요.
                    </p>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-bold text-navy mb-1">REAL-TIME</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      결제 즉시 내역이 반영되어 실시간으로 매출 현황을 파악할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 알림톡 */}
              <div className="border border-border p-6 bg-card">
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground block mb-2">NOTIFICATION</span>
                <h3 className="text-lg font-black text-navy mb-4">알림톡으로 매출 미리 확인</h3>
                <div className="bg-navy/5 p-5 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold">K</div>
                    <span className="text-xs font-bold text-navy">카카오톡 알림</span>
                  </div>
                  <div className="bg-white border border-border p-3 rounded-lg text-xs text-foreground leading-relaxed">
                    <p className="font-bold mb-1">[GL ALLPAY 정산 알림]</p>
                    <p className="text-muted-foreground">내일 입금 예정 금액</p>
                    <p className="font-mono text-lg font-bold text-navy mt-1">2,340,000원</p>
                    <p className="text-[10px] text-muted-foreground mt-2">정산일: 2026.03.31 (화)</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">입금될 매출을 미리 확인</strong>할 수 있어 자금 계획이 쉬워집니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto"><div className="hr-thin" /></div>

      {/* ═══ 04. 안심서비스 ═══ */}
      <section id="안심서비스" className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeIn} className="flex items-center gap-3 mb-10">
              <span className="section-number">04</span>
              <div className="hr-thin flex-1" />
              <span className="section-number">킵페이 안심결제서비스</span>
            </motion.div>

            <motion.div variants={fadeIn} className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border border-border p-6 bg-card">
                <span className="font-mono text-3xl font-bold text-navy">300만</span>
                <h3 className="font-bold text-sm text-navy mt-3 mb-2">소비자 보상 한도</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  시설 폐업·영업중단 시 잔여금액을 최대 300만원까지 보상하는 대체서비스.
                  <strong className="text-navy block mt-1">회원권당 300만원, 중복 가능</strong>
                </p>
              </div>
              <div className="border border-border p-6 bg-card">
                <span className="font-mono text-3xl font-bold text-navy">자동</span>
                <h3 className="font-bold text-sm text-navy mt-3 mb-2">법령 의무표시 충족</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  2025년 공정위·체육시설법 개정에 따른 선불결제 업종 의무표시 요건을 가맹 즉시 해결.
                </p>
              </div>
              <div className="border border-border p-6 bg-card">
                <span className="font-mono text-3xl font-bold text-navy">4%</span>
                <h3 className="font-bold text-sm text-navy mt-3 mb-2">안심서비스 비용</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  모든 상품에 기본 포함. 가격 인상분에 녹여 고객 체감 부담 없이 운영.
                </p>
              </div>
            </motion.div>

            {/* 비용 구조 */}
            <motion.div variants={fadeIn} className="bg-card border border-border p-6">
              <h3 className="text-sm font-black text-navy mb-4">센터 부담 비용 구조</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-3 font-semibold text-muted-foreground">항목</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground">비용</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { item: "PG 수수료", cost: "3.3%", note: "GL ALLPAY 공식 수수료" },
                      { item: "킵페이 안심결제 서비스", cost: "4%", note: "회원 혜택 — 센터 수익 아님" },
                      { item: "무이자할부 (3~24개월)", cost: "무료 / 가맹점 최저부담", note: "GL페이 자체 제공" },
                      { item: "단말기", cost: "약 1만원/월", note: "리스 또는 구매 선택" },
                      { item: "가입비 / 월회비", cost: "0원", note: "없음" },
                    ].map((r) => (
                      <tr key={r.item} className="border-b border-border">
                        <td className="p-3 font-medium">{r.item}</td>
                        <td className="p-3 text-center font-bold text-navy font-mono">{r.cost}</td>
                        <td className="p-3 text-muted-foreground">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-navy text-white p-3 mt-4 text-center text-xs font-bold">
                센터 실 부담: PG 3.3% + 킵페이 안심결제 서비스 4% + 단말기 약 1만원/월 = 합산 7.3% + 단말기
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto"><div className="hr-thin" /></div>

      {/* ═══ 05. 매출 구조 (표로 비교) ═══ */}
      <section id="매출구조" className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeIn} className="flex items-center gap-3 mb-10">
              <span className="section-number">05</span>
              <div className="hr-thin flex-1" />
              <span className="section-number">프리미엄 매출 구조</span>
            </motion.div>

            <motion.h2 variants={fadeIn} className="text-2xl md:text-3xl font-black text-navy leading-tight mb-4">
              무이자 3~24개월 장기할부가 열어주는
              <br />매출의 차이
            </motion.h2>
            <motion.p variants={fadeIn} className="text-sm text-muted-foreground mb-8">같은 회원, 같은 센터 — 결제 구조만 바꿔도 매출이 달라집니다.</motion.p>

            {/* 매출 비교 표 */}
            <motion.div variants={fadeIn} className="overflow-x-auto mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 bg-muted font-bold text-muted-foreground border-b-2 border-border w-[28%]">비교 항목</th>
                    <th className="text-center p-4 bg-red-50 font-bold text-signal-red border-b-2 border-signal-red w-[36%]">기존 (일시불/단기)</th>
                    <th className="text-center p-4 bg-navy text-white font-black border-b-2 border-navy w-[36%]">
                      <span className="text-base tracking-wide">GL ALLPAY</span> <span className="text-xs font-normal text-white/70">3~24개월</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { item: "회원권 결제", old: "3개월 일시불 120만원", gl: "24개월 무이자 360만원" },
                    { item: "월 부담", old: "120만원 (일시)", gl: "월 15만원" },
                    { item: "객단가", old: "120만원", gl: "360만원 (+200%)" },
                    { item: "PT 50회 결제", old: "포기 (고액 부담)", gl: "월 7.5만원 × 24개월" },
                    { item: "전환율", old: "낮음 (일시불 부담)", gl: "높음 (월 부담 최소화)" },
                    { item: "재등록률", old: "낮음 (3개월 단위)", gl: "높음 (장기 락인)" },
                    { item: "킵페이 안심결제 서비스", old: "없음", gl: "자동 포함 (회원권당 300만원)" },
                  ].map((r, i) => (
                    <tr key={r.item} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                      <td className="p-4 font-bold text-foreground text-xs">{r.item}</td>
                      <td className="p-4 text-center text-xs text-signal-red font-bold">{r.old}</td>
                      <td className="p-4 text-center text-xs text-navy font-black bg-navy/[0.03]">{r.gl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div variants={fadeIn} className="bg-navy/5 border-2 border-navy p-5 text-center mb-8">
              <p className="text-lg font-black text-navy">120만원 → 360만원</p>
              <p className="text-xs text-navy/60 mt-1">같은 회원이 결제 구조만 바꿔도 객단가 3배 상승</p>
            </motion.div>

            <motion.p variants={fadeIn} className="text-[10px] text-muted-foreground font-mono">
              ※ 예시 금액이며 실제 상품 구성은 운영 구조에 따라 달라집니다.
            </motion.p>

            {/* 시뮬레이터 CTA */}
            <motion.div variants={fadeIn} className="mt-8 bg-navy/5 border-2 border-navy p-6 text-center">
              <h3 className="text-base font-black text-navy mb-2">우리 센터 매출을 직접 시뮬레이션 해보세요</h3>
              <p className="text-xs text-navy/60 mb-4">센터 규모별 프리셋 제공 · 가격 전략 A/B 비교 · 현장 데스크 멘트 자동 생성</p>
              <Link href="/simulator">
                <span className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 font-bold text-sm hover:bg-navy/80 transition-colors cursor-pointer">
                  매출 시뮬레이터 시작 →
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ 도입 절차 ═══ */}
      <section className="py-16 bg-navy text-white">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeIn} className="text-center mb-10">
              <span className="font-mono text-[10px] tracking-[0.2em] text-white/30 block mb-3">도입 절차</span>
              <h2 className="text-2xl md:text-3xl font-black mb-2">전화 한 통이면 끝납니다</h2>
              <p className="text-sm text-white/50">기존 PG 교체 혹은 추가 증설, 단말기 설치, 정산 연동 — 전부 저희가 합니다.</p>
            </motion.div>

            <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { step: "01", title: "전화 상담", desc: "서류접수 혹은 전자접수 가능" },
                { step: "02", title: "전담 매니저 배정", desc: "기존 PG 교체 혹은 추가 증설 대행" },
                { step: "03", title: "전국망 빠른 설치", desc: "무선단말기 설치 및 정산 연동" },
                { step: "04", title: "결제 시작", desc: "바로 매출 발생" },
              ].map((s) => (
                <div key={s.step} className="bg-white/5 p-5 text-center">
                  <span className="font-mono text-2xl font-bold text-white/20">{s.step}</span>
                  <h3 className="text-sm font-bold text-white mt-2">{s.title}</h3>
                  <p className="text-[10px] text-white/40 mt-1">{s.desc}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-3 mb-3">
              {["가입비 0원", "위약금 없음", "전국망 빠른 설치", "리스크 0"].map((t) => (
                <span key={t} className="bg-white/10 text-white/80 px-4 py-1.5 text-xs font-bold">{t}</span>
              ))}
            </motion.div>
            <motion.p variants={fadeIn} className="text-center text-[10px] text-white/30 mb-8">
              ※ 무선단말기는 1년 의무사용
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4">
              <Link href="/proposal/consumer">
                <span className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 font-bold text-sm hover:bg-navy/80 transition-colors cursor-pointer">회원용 제안서</span>
              </Link>
              <Link href="/proposal/franchise">
                <span className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 font-bold text-sm hover:bg-navy/80 transition-colors cursor-pointer">가맹점용 제안서</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ 파트너사 로고 ═══ */}
      <section className="py-8 bg-muted/50 border-t border-border">
        <div className="container max-w-6xl mx-auto">
          <p className="text-center text-[10px] text-muted-foreground font-mono tracking-[0.2em] uppercase mb-6">Partners</p>
          <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap opacity-70">
            {/* NICE */}
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663399461499/HBKFmjPeS4mQUtGxY3Txin/nice-logo_9af75a64.png"
                alt="나이스정보통신"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
            {/* KIS정보통신 */}
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663399461499/HBKFmjPeS4mQUtGxY3Txin/kis-logo_db90c8d5.jpg"
                alt="KIS정보통신 (제1차원천사)"
                className="h-6 md:h-8 w-auto object-contain"
              />
              <span className="text-[9px] text-muted-foreground font-medium hidden md:block">제1차원천사</span>
            </div>
            {/* 갤럭시아머니트리 */}
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663399461499/HBKFmjPeS4mQUtGxY3Txin/galaxia-logo_485d26f2.jpg"
                alt="갤럭시아머니트리"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
            {/* 킵페이 */}
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663399461499/HBKFmjPeS4mQUtGxY3Txin/keepay-logo_12e6f68d.png"
                alt="킵페이 KEEPPAY"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
            {/* GL ALLPAY */}
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663399461499/HBKFmjPeS4mQUtGxY3Txin/glallpay-logo-gen-hKKNJzXtzcttLcr76SeDTJ.webp"
                alt="GL ALLPAY"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-10 bg-navy text-white">
        <div className="container max-w-6xl mx-auto">
          {/* 카카오톡 상담 + SNS */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/10">
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <Link href="/apply">
                <span className="inline-flex items-center gap-2 bg-signal-red text-white px-8 py-3.5 font-black text-base hover:bg-signal-red/80 transition-colors cursor-pointer">지금 바로 도입신청 →</span>
              </Link>
              <a href="#" className="inline-flex items-center gap-3 bg-navy text-white px-8 py-3.5 font-black text-base hover:bg-navy/80 transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.113 4.508 6.459-.199.742-.72 2.687-.825 3.104-.13.52.19.513.4.374.164-.109 2.612-1.775 3.672-2.497.725.104 1.474.16 2.245.16 5.523 0 10-3.463 10-7.691S17.523 3 12 3z"/></svg>
                카카오톡 상담하기
              </a>
            </div>
            <div className="flex items-center gap-4">
              {/* 네이버 */}
              <a href="#" className="w-10 h-10 bg-[#03C75A] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" title="네이버">
                <span className="text-white font-black text-sm">N</span>
              </a>
              {/* 인스타그램 */}
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" title="인스타그램">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-sm tracking-[0.15em] font-black">GL ALLPAY</span>
                <span className="text-white/30 text-[10px]">&times;</span>
                <span className="font-mono text-[10px] tracking-[0.1em] text-white/50 font-bold">KEEPPAY</span>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed max-w-sm">
                GL allpay (주식회사 지엘올페이) | 사업자등록번호 112-88-03313
                <br />대표이사 강용신 | 경기도 용인시 수지구 수지로342번길 32, 5층
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30">admin@glallpay.com</p>
              <p className="text-[10px] text-white/30">평일 09:00 – 18:00</p>
              <div className="flex gap-3 mt-2 justify-end">
                <Link href="/simulator"><span className="text-[10px] text-white/50 hover:text-white cursor-pointer">매출 시뮬레이터</span></Link>
                <Link href="/proposal"><span className="text-[10px] text-white/50 hover:text-white cursor-pointer">제안서</span></Link>
                <Link href="/apply"><span className="text-[10px] text-white/50 hover:text-white cursor-pointer">서류접수</span></Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
