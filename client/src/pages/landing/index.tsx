import { Link } from "wouter";
import { LandingLayout } from "./components/LandingLayout";
import { FadeIn } from "./components/FadeIn";
import { GoldDivider } from "./components/GoldDivider";
import { SectionHeader } from "./components/SectionHeader";
import { CTASection } from "./components/CTASection";

export default function LandingIndex() {
  return (
    <LandingLayout>
      <HeroSection />
      <PgRiskSection />
      <StabilitySection />
      <StructureFirstSection />
      <IndustryProblemSection />
      <PremiumRevenueSection />
      <PgInfraSection />
      <BeyondPaymentSection />
      <AssurancePreviewSection />
      <CTASection
        label="Get Started"
        title="우리 매장에 맞는지<br>확인해보세요"
        description="적용 가능 여부는 현재 운영 구조에 따라 달라집니다.<br>간편한 상담을 통해 방향을 안내드립니다."
        ctaText="지금 상담하기 →"
      />
    </LandingLayout>
  );
}

/* ── Hero ── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(160deg, #0A1628 0%, #0D2244 40%, #0F2C54 100%)" }}>
      <div className="container-landing relative z-[1]" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
        <div className="max-w-[640px]">
          <span className="text-[0.82rem] font-semibold tracking-[0.15em] uppercase text-[var(--l-gold)] mb-4 block font-[var(--l-font-en)]">GL allpay</span>
          <FadeIn>
            <h1 className="text-[clamp(2.2rem,5.5vw,3.8rem)] font-[900] leading-[1.15] tracking-tight mb-4">
              구조가 다르면,<br />결과도 달라집니다.
            </h1>
          </FadeIn>
          <FadeIn delay={1}>
            <p className="text-[clamp(1.1rem,2vw,1.5rem)] font-semibold text-[var(--l-gold)] tracking-wide font-[var(--l-font-en)] mb-6">Payment, Structured.</p>
          </FadeIn>
          <FadeIn delay={2}>
            <p className="text-[1rem] text-[var(--l-text-sub)] leading-relaxed mb-8">
              GL allpay는<br />
              <strong className="text-white">PG기반 구조 위에</strong><br />
              가맹점 직접 정산흐름을 설계합니다.<br />
              결제와 운영을 하나의 시스템으로 통합합니다.
            </p>
          </FadeIn>
          <FadeIn delay={3}>
            <div className="flex flex-wrap gap-4">
              <Link href="/service" className="btn-gold">서비스 보기</Link>
              <Link href="/contact" className="btn-outline">문의하기</Link>
            </div>
          </FadeIn>
        </div>
      </div>
      {/* Decorative circles */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none" aria-hidden="true">
        <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
          <circle cx="300" cy="300" r="280" stroke="#C9A84C" strokeWidth="1" />
          <circle cx="300" cy="300" r="200" stroke="#C9A84C" strokeWidth="1" />
          <circle cx="300" cy="300" r="120" stroke="#C9A84C" strokeWidth="1" />
        </svg>
      </div>
    </section>
  );
}

/* ── PG Risk Alert ── */
function PgRiskSection() {
  const risks = [
    { title: "PG사 폐업 → 정산금 증발", desc: "2차·3차 PG사는 재무건전성 심사가 원천사 대비 느슨합니다. 해당 PG사가 영업 정지·폐업할 경우 <strong class='text-[rgba(255,255,255,0.7)]'>수개월치 미정산 대금이 동결·소멸</strong>될 수 있습니다. 헬스장 등 선결제 업종은 피해 규모가 특히 큽니다." },
    { title: "일방적 가맹 해지 → 영업 중단", desc: "원천사 정책 변경이나 리스크 재심사 시 2차 PG사는 가맹점에 <strong class='text-[rgba(255,255,255,0.7)]'>사전 고지 없이 일방 해지</strong>하는 경우가 발생합니다. 하루아침에 카드결제가 막히면서 회원·매출·신뢰 모두를 잃을 수 있습니다." },
    { title: "불투명 수수료 → 실수령 감소", desc: "중간 경유사가 많을수록 수수료 구조가 불투명해집니다. <strong class='text-[rgba(255,255,255,0.7)]'>실제 적용 수수료가 계약서 수치보다 높게</strong> 나타나는 경우가 빈번하며, 정산 내역을 검증하기도 어렵습니다." },
  ];

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #060E1A 0%, var(--l-navy) 100%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(231,76,60,0.05) 0%, transparent 60%)" }} />
      <div className="container-landing relative z-[1]">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-label" style={{ color: "#e74c3c" }}>Industry Risk Alert</span>
          <FadeIn>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-tight">
              지금 이 순간에도 반복되는<br />2차·3차 PG사 리스크
            </h2>
          </FadeIn>
          <div className="w-12 h-0.5 bg-[#e74c3c] mx-auto my-6" />
          <FadeIn delay={1}>
            <p className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed max-w-[640px] mx-auto">
              원천결제사가 기피하는 선결제 장기할부 업종은<br />
              2차·3차 PG사를 통해 가맹점을 운영하는 경우가 대부분입니다.<br />
              이 구조는 단순한 불편함이 아닌 <strong className="text-[rgba(255,255,255,0.9)]">경영 존폐 수준의 위험</strong>을 내포합니다.
            </p>
          </FadeIn>
        </div>

        {/* Risk cards */}
        <FadeIn delay={1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {risks.map((r, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl p-8" style={{ background: "rgba(231,76,60,0.07)", border: "1px solid rgba(231,76,60,0.2)" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #e74c3c, #c0392b)" }} />
                <h4 className="text-[1rem] font-bold text-[#e07070] mb-3">{r.title}</h4>
                <p className="text-[0.83rem] text-[var(--l-text-sub)] leading-relaxed" dangerouslySetInnerHTML={{ __html: r.desc }} />
              </div>
            ))}
          </div>
        </FadeIn>

        {/* News quote */}
        <FadeIn delay={2}>
          <div className="max-w-[780px] mx-auto mb-14">
            <div className="relative rounded-xl p-9" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="absolute top-[-1px] left-10 px-3.5 py-1 rounded-b-lg text-[0.7rem] font-bold tracking-wider uppercase" style={{ background: "#e74c3c", color: "white" }}>실제 사례</div>
              <div className="flex gap-4 items-start mt-2">
                <span className="text-[2rem] text-[rgba(231,76,60,0.5)] shrink-0 leading-none">"</span>
                <div>
                  <p className="text-[0.95rem] text-[rgba(255,255,255,0.75)] leading-relaxed italic">
                    복수의 헬스장·피트니스 업체가 이용하던 결제대행(PG)사가 폐업하면서 수개월치 정산금을 받지 못하는 피해가 발생했다. 가맹점주들은 영문도 모른 채 결제가 차단되고, 이미 받은 회원권 대금이 PG사에 묶인 채 돌아오지 않았다.
                  </p>
                  <p className="text-[0.78rem] text-[var(--l-text-sub)] mt-3">
                    ─ 국민일보 관련 보도 및 업계 복합 사례 요약
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Risk vs Solution */}
        <FadeIn delay={2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
            <div className="rounded-xl p-9" style={{ background: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.15)" }}>
              <p className="text-[0.72rem] font-bold tracking-wider uppercase text-[#e07070] mb-4">왜 이런 일이 반복되나</p>
              <p className="text-[0.875rem] text-[var(--l-text-sub)] leading-relaxed">
                원천결제사는 리스크 관리를 위해<br />선결제 장기할부 업종을 <strong className="text-[rgba(255,255,255,0.7)]">원칙적으로 직접 가맹 거부</strong>합니다.<br /><br />
                이에 따라 대부분의 헬스장은<br />검증이 덜 된 2차·3차 PG사를 통해<br />결제 인프라를 운영할 수밖에 없습니다.<br /><br />
                이 구조적 공백이 반복적 피해의 근본 원인입니다.
              </p>
            </div>
            <div className="relative rounded-xl p-9 overflow-hidden" style={{ background: "rgba(201,168,76,0.07)", border: "1.5px solid rgba(201,168,76,0.25)" }}>
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--l-gold), var(--l-gold-dark))" }} />
              <p className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] mb-4">GL allpay의 해법</p>
              <p className="text-[0.875rem] text-[var(--l-text-sub)] leading-relaxed">
                GL allpay는 GL페이를 통해<br />
                <strong className="text-[var(--l-gold-light)]">원천결제사에 휘트니스 업종을 공식 입점</strong>시킵니다.<br /><br />
                2차·3차 PG 경유 없이<br />원천사 → GL페이 → 가맹점으로<br />
                <strong className="text-white">직접 정산 흐름</strong>이 연결됩니다.<br /><br />
                구조 자체가 다르기 때문에,<br />리스크의 발생 경로가 차단됩니다.
              </p>
              <Link href="/settlement" className="inline-flex items-center gap-2 mt-5 text-[0.8rem] text-[var(--l-gold)] font-semibold border-b border-[rgba(201,168,76,0.3)] pb-0.5 hover:text-[var(--l-gold-light)] transition-colors">
                정산 구조 자세히 보기 →
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Stability By Design ── */
function StabilitySection() {
  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="section-label">Stability, By Design.</span>
            <FadeIn>
              <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-tight font-[var(--l-font-en)]">Stability,<br />By Design.</h2>
            </FadeIn>
            <GoldDivider />
            <FadeIn delay={1}>
              <p className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed">
                결제대금은 가맹점으로 직접 정산됩니다.<br />GL allpay는 그 흐름 위에 운영 기준을 설계합니다.
              </p>
            </FadeIn>
            <FadeIn delay={2}>
              <div className="flex gap-4 mt-8 mb-8">
                {["한도.", "약관.", "절차."].map((kw) => (
                  <div key={kw} className="px-5 py-3 rounded-lg text-[0.9rem] font-bold text-[var(--l-gold)]" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>{kw}</div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={3}>
              <Link href="/settlement" className="btn-outline">정산 구조 자세히 보기 →</Link>
            </FadeIn>
          </div>

          {/* Settlement Flow SVG */}
          <FadeIn delay={2}>
            <div className="rounded-xl p-8" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.15)" }}>
              <svg viewBox="0 0 400 280" fill="none" className="w-full h-auto">
                <text x="200" y="28" fill="#C9A84C" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="600" letterSpacing="2" textAnchor="middle">SETTLEMENT FLOW</text>
                <rect x="20" y="50" width="80" height="56" rx="6" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.4)" strokeWidth="1" />
                <text x="60" y="74" fill="#FFFFFF" fontFamily="Noto Sans KR,sans-serif" fontSize="9.5" textAnchor="middle" fontWeight="600">회원결제</text>
                <text x="60" y="89" fill="#8A8FA8" fontFamily="Noto Sans KR,sans-serif" fontSize="8" textAnchor="middle">Member Payment</text>
                <line x1="101" y1="78" x2="124" y2="78" stroke="#C9A84C" strokeWidth="1.5" />
                <polygon points="124,74 132,78 124,82" fill="#C9A84C" />
                <rect x="133" y="50" width="80" height="56" rx="6" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.4)" strokeWidth="1" />
                <text x="173" y="74" fill="#FFFFFF" fontFamily="Noto Sans KR,sans-serif" fontSize="9.5" textAnchor="middle" fontWeight="600">PG 처리</text>
                <text x="173" y="89" fill="#8A8FA8" fontFamily="Noto Sans KR,sans-serif" fontSize="8" textAnchor="middle">PG Processing</text>
                <line x1="214" y1="78" x2="237" y2="78" stroke="#C9A84C" strokeWidth="1.5" />
                <polygon points="237,74 245,78 237,82" fill="#C9A84C" />
                <rect x="246" y="50" width="80" height="56" rx="6" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.4)" strokeWidth="1" />
                <text x="286" y="74" fill="#FFFFFF" fontFamily="Noto Sans KR,sans-serif" fontSize="9.5" textAnchor="middle" fontWeight="600">기준 검토</text>
                <text x="286" y="89" fill="#8A8FA8" fontFamily="Noto Sans KR,sans-serif" fontSize="8" textAnchor="middle">Review</text>
                <line x1="286" y1="107" x2="286" y2="140" stroke="#C9A84C" strokeWidth="1.5" />
                <polygon points="282,140 286,148 290,140" fill="#C9A84C" />
                <rect x="246" y="149" width="80" height="56" rx="6" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" />
                <text x="286" y="173" fill="#FFFFFF" fontFamily="Noto Sans KR,sans-serif" fontSize="9.5" textAnchor="middle" fontWeight="600">정산 처리</text>
                <text x="286" y="188" fill="#8A8FA8" fontFamily="Noto Sans KR,sans-serif" fontSize="8" textAnchor="middle">Settlement</text>
                <line x1="245" y1="177" x2="222" y2="177" stroke="#C9A84C" strokeWidth="1.5" />
                <polygon points="222,173 214,177 222,181" fill="#C9A84C" />
                <rect x="133" y="149" width="80" height="56" rx="6" fill="rgba(201,168,76,0.2)" stroke="#C9A84C" strokeWidth="2" />
                <text x="173" y="173" fill="#C9A84C" fontFamily="Noto Sans KR,sans-serif" fontSize="9.5" textAnchor="middle" fontWeight="700">가맹점 입금</text>
                <text x="173" y="188" fill="#C9A84C" fontFamily="Noto Sans KR,sans-serif" fontSize="8" textAnchor="middle" opacity="0.7">Direct Deposit</text>
                <text x="200" y="240" fill="#8A8FA8" fontFamily="Noto Sans KR,sans-serif" fontSize="8" textAnchor="middle">PG 기반 위에 운영 기준을 설계하는 정산 흐름</text>
                <text x="200" y="255" fill="rgba(201,168,76,0.6)" fontFamily="Noto Sans KR,sans-serif" fontSize="8" textAnchor="middle">GL allpay Direct Settlement Structure</text>
                <circle cx="360" cy="200" r="28" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.3)" strokeWidth="1" />
                <text x="360" y="196" fill="#C9A84C" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="800" textAnchor="middle">GL</text>
                <text x="360" y="210" fill="#C9A84C" fontFamily="Inter,sans-serif" fontSize="7" textAnchor="middle" letterSpacing="1">allpay</text>
              </svg>
              <div className="mt-4 text-center">
                <p className="text-[0.85rem] text-[var(--l-text-sub)]">운영 리스크를 낮추기 위한 기본 구조입니다.</p>
                <p className="text-[0.9rem] text-[var(--l-gold)] italic mt-1">"신뢰는 구조에서 나옵니다."</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Structure First ── */
function StructureFirstSection() {
  const points = [
    { icon: "🛡", title: "리스크 관리 중심 설계", desc: "운영 전 단계에서 리스크 요소를 식별하고 구조에 반영합니다." },
    { icon: "🏢", title: "업종에 맞춘 운영 구조", desc: "선결제 기반 업종의 특성을 반영한 맞춤형 설계를 제공합니다." },
    { icon: "✂", title: "불필요한 복잡함 제거", desc: "필요한 구조만 남기고 불필요한 과정을 단순화합니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <span className="section-label">Core Philosophy</span>
            <FadeIn><h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold font-[var(--l-font-en)]">Structure First</h2></FadeIn>
            <GoldDivider />
            <FadeIn delay={1}>
              <p className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed">
                GL allpay는 기능을 더하지 않습니다.<br />기준을 정의합니다.
              </p>
            </FadeIn>
            <FadeIn delay={2}>
              <div className="mt-8 flex flex-col gap-5">
                {points.map((p) => (
                  <div key={p.title} className="flex items-start gap-4">
                    <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">{p.icon}</span>
                    <div>
                      <strong className="text-white text-[0.95rem]">{p.title}</strong>
                      <p className="text-[0.85rem] text-[var(--l-text-sub)] mt-1">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={2}>
            <div className="relative">
              <div className="font-[var(--l-font-en)] text-[clamp(5rem,12vw,9rem)] font-[900] text-[rgba(201,168,76,0.05)] leading-[0.85] tracking-tighter select-none mb-[-24px]" aria-hidden="true">
                STR<br />UCT<br />URE
              </div>
              <div className="rounded-lg p-6" style={{ background: "rgba(201,168,76,0.08)", borderLeft: "3px solid var(--l-gold)" }}>
                <p className="text-[var(--l-text-sub)]">결제는 도구입니다.</p>
                <strong className="text-white text-lg">구조가 본질입니다.</strong>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[{ val: "PG+", label: "직접 정산 결합 구조" }, { val: "1:1", label: "업종 맞춤 설계" }].map((s) => (
                  <div key={s.val} className="rounded-lg text-center py-5 px-6" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)" }}>
                    <div className="text-[2rem] font-extrabold text-[var(--l-gold)] font-[var(--l-font-en)] mb-1">{s.val}</div>
                    <div className="text-[0.78rem] text-[var(--l-text-sub)]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Industry Problem + Compare ── */
function IndustryProblemSection() {
  const dangerItems = [
    "원천결제사가 선결제 장기할부 업종을 공식 기피",
    "2차·3차 PG사 경유로 정산 불안정성 증가",
    "장기 할부 상품 구성이 사실상 불가",
    "매출이 높아질수록 정산 리스크 동반 증가",
    "가맹점 계약 해지 시 정산 공백 발생 가능",
  ];
  const safeItems = [
    { bold: "원천결제사 공식 입점", desc: "GL페이를 통해 휘트니스 업종 정식 승인 가능" },
    { bold: "무이자 3-24개월 GL페이", desc: "업계 최장 장기할부 공식 구조 보유" },
    { bold: "가맹점 직접 정산", desc: "중간 경유 없는 안정적 정산 흐름" },
    { bold: "프리미엄 회원권 설계", desc: "장기할부로 고단가 상품 판매 구조 지원" },
    { bold: "운영 리스크 관리 체계", desc: "리스크 중심의 구조 설계로 안정성 확보" },
  ];

  return (
    <section className="py-24" style={{ background: "linear-gradient(135deg, var(--l-mid-navy), var(--l-blue-dark))" }}>
      <div className="container-landing">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="badge mb-5">Industry Problem</span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold tracking-tight leading-tight">
              휘트니스 업종이 마주한<br />구조적 문제
            </h2>
            <GoldDivider centered className="my-6" />
            <p className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed max-w-[640px] mx-auto">
              원천결제사들은 선결제 장기할부 업종인 휘트니스를 <strong className="text-[rgba(255,255,255,0.8)]">공식 기피</strong>합니다.<br />
              그 결과 대부분의 헬스장이 2차·3차 PG사를 통해 가맹점을 승인받고 있습니다.
            </p>
          </div>
        </FadeIn>

        {/* Compare */}
        <FadeIn delay={1}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
            {/* Danger */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.2)" }}>
              <div className="flex items-center gap-3 p-5" style={{ borderBottom: "1px solid rgba(231,76,60,0.15)" }}>
                <span className="text-xl">⚠</span>
                <div>
                  <div className="font-bold text-[#e07070]">일반 PG 구조의 현실</div>
                  <div className="text-[0.78rem] text-[var(--l-text-sub)]">2차·3차 PG사를 통한 승인</div>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {dangerItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-[#e07070] shrink-0 font-bold">✕</span>
                    <span className="text-[0.88rem] text-[var(--l-text-sub)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VS */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[0.8rem] font-bold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>VS</div>
            </div>

            {/* Safe */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(201,168,76,0.06)", border: "1.5px solid rgba(201,168,76,0.25)" }}>
              <div className="flex items-center gap-3 p-5" style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
                <span className="text-xl text-[var(--l-gold)]">✦</span>
                <div>
                  <div className="font-bold text-[var(--l-gold)]">GL allpay 구조</div>
                  <div className="text-[0.78rem] text-[var(--l-text-sub)]">원천결제사 공식 입점 기반</div>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {safeItems.map((item) => (
                  <div key={item.bold} className="flex items-start gap-3">
                    <span className="text-[var(--l-gold)] shrink-0 font-bold">✓</span>
                    <span className="text-[0.88rem] text-[var(--l-text-sub)]"><strong className="text-white">{item.bold}</strong> — {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* GL Pay highlight */}
        <FadeIn delay={2}>
          <div className="mt-12 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(10,22,40,0.9))", border: "1px solid rgba(201,168,76,0.2)" }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 p-8 lg:p-12">
              <div>
                <div className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] mb-4 font-[var(--l-font-en)]">GL Pay — Exclusive</div>
                <h3 className="text-[clamp(1.4rem,2.5vw,2rem)] font-bold leading-tight mb-4">
                  무이자 <span className="text-[var(--l-gold)]">3-24개월</span>,<br />원천사 공식 구조.
                </h3>
                <p className="text-[0.9rem] text-[var(--l-text-sub)] leading-relaxed">
                  GL allpay는 자체 GL페이를 통해<br />원천결제사에 <strong className="text-white">휘트니스 업종을 공식 입점</strong>시킵니다.<br /><br />
                  2차·3차 PG사를 거치지 않는<br /><strong className="text-[var(--l-gold-light)]">직접 구조</strong>이기 때문에 가능합니다.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                {[
                  { num: "3-24개월", label: "무이자 장기할부", sub: "업계 최장 무이자 할부 구조\n원천사 공식 승인 기반" },
                  { num: "원천사 직접", label: "공식 입점 구조", sub: "2·3차 PG 우회 없이\n원천결제사 가맹점으로 정식 등록" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-5" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                    <div className="text-[1.6rem] font-extrabold text-[var(--l-gold)] font-[var(--l-font-en)]">{s.num}</div>
                    <div className="text-[0.85rem] font-bold text-white mt-1">{s.label}</div>
                    <div className="text-[0.78rem] text-[var(--l-text-sub)] mt-2 whitespace-pre-line">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Premium Revenue ── */
function PremiumRevenueSection() {
  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Revenue Expansion" title="장기할부가 열어주는<br>프리미엄 매출 구조" description="무이자 3-24개월 할부가 가능해지면,<br>회원에게 제시할 수 있는 상품의 스펙이 달라집니다." titleKr />

        {/* 3-step flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { num: "01", title: "무이자 3-24개월 할부", desc: "GL페이로 원천사에\n공식 연결된 장기할부" },
            { num: "02", title: "프리미엄 회원권 설계", desc: "월 부담을 낮추면서\n고단가 상품 제안 가능" },
            { num: "03", title: "매출 단가 상승", desc: "동일 회원 수로\n더 높은 매출을 만드는 구조" },
          ].map((s, i) => (
            <FadeIn key={s.num} delay={i as 0 | 1 | 2}>
              <div className="text-center py-8 px-6 rounded-xl" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-[0.85rem] font-extrabold font-[var(--l-font-en)]" style={{ background: "rgba(201,168,76,0.15)", border: "1.5px solid rgba(201,168,76,0.4)", color: "var(--l-gold)" }}>{s.num}</div>
                <div className="font-bold text-white mb-2">{s.title}</div>
                <div className="text-[0.83rem] text-[var(--l-text-sub)] whitespace-pre-line">{s.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Price comparison */}
        <FadeIn delay={2}>
          <p className="text-center text-[0.8rem] font-bold tracking-wider uppercase text-[var(--l-gold)] mb-7 font-[var(--l-font-en)]">Price Example</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="rounded-xl text-center py-8 px-10" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[0.82rem] text-[var(--l-gray-text)] mb-2">기존 단기 상품</div>
              <div className="text-3xl font-extrabold text-white font-[var(--l-font-en)]">120만</div>
              <div className="text-[0.82rem] text-[var(--l-text-sub)] mt-2">3개월 일시불<br />회원 부담 高</div>
            </div>
            <div className="text-center">
              <span className="text-2xl text-[var(--l-gold)]">→</span>
              <div className="text-[0.75rem] text-[var(--l-gold)] font-semibold mt-1">GL페이<br />24개월</div>
            </div>
            <div className="rounded-xl text-center py-8 px-10" style={{ background: "rgba(201,168,76,0.1)", border: "1.5px solid rgba(201,168,76,0.3)" }}>
              <div className="text-[0.82rem] text-[var(--l-gold)] mb-2">프리미엄 장기 상품</div>
              <div className="text-3xl font-extrabold text-[var(--l-gold)] font-[var(--l-font-en)]">360만</div>
              <div className="text-[0.82rem] text-[var(--l-text-sub)] mt-2">월 15만원 x 24개월<br />회원 부담 ↓ · 센터 매출 ↑</div>
            </div>
          </div>
          <p className="text-center text-[0.78rem] text-[var(--l-text-sub)] mt-5">※ 예시 금액이며 실제 상품 구성은 운영 구조에 따라 달라집니다.</p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── PG Infrastructure ── */
function PgInfraSection() {
  const steps = [
    { num: "01", title: "PG 인프라", desc: "안정적인 PG결제 인프라를 기반으로 합니다" },
    { num: "02", title: "직접 정산", desc: "가맹점으로의 직접 정산 흐름을 유지합니다" },
    { num: "03", title: "운영 관리", desc: "운영 관리 체계를 구조 위에 결합합니다" },
    { num: "04", title: "통합 시스템", desc: "결제와 운영이 하나로 통합됩니다", highlight: true },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Technology Foundation" title="Built on PG Infrastructure" />
        <FadeIn delay={1}>
          <p className="text-center text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed max-w-[640px] mx-auto mb-12">
            PG결제 기반 위에 직접 정산 흐름을 유지합니다.<br />그 위에 운영 관리 체계를 결합합니다.<br />하나의 구조 안에서 결제와 운영을 설계합니다.
          </p>
        </FadeIn>
        <FadeIn delay={2}>
          <div className="flex flex-col md:flex-row items-stretch gap-4 justify-center">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-4">
                <div className="flex-1 rounded-xl text-center py-6 px-5 min-w-[180px]" style={{
                  background: s.highlight ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)",
                  border: s.highlight ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(255,255,255,0.08)",
                }}>
                  <span className="text-[0.72rem] font-extrabold text-[var(--l-gold)] font-[var(--l-font-en)]">{s.num}</span>
                  <div className={`font-bold mt-2 mb-1 ${s.highlight ? "text-[var(--l-gold)]" : "text-white"}`}>{s.title}</div>
                  <div className="text-[0.78rem] text-[var(--l-text-sub)]">{s.desc}</div>
                </div>
                {i < steps.length - 1 && <span className="hidden md:block text-[var(--l-gold)] text-xl" aria-hidden="true">→</span>}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Beyond Payment ── */
function BeyondPaymentSection() {
  const cards = [
    { title: "회원관리", desc: "회원 정보와 계약 현황을 체계적으로 관리합니다. 가입부터 운영까지 한 곳에서 확인할 수 있습니다." },
    { title: "계약관리", desc: "계약 조건, 기간, 갱신 현황을 통합 관리합니다. 선결제 기반 계약 구조에 최적화되어 있습니다." },
    { title: "결제이력", desc: "모든 결제 내역과 정산 현황을 투명하게 기록합니다. 필요한 데이터에 빠르게 접근할 수 있습니다." },
    { title: "마케팅 확장", desc: "운영 데이터를 기반으로 마케팅 기능을 확장합니다. 매장에 맞는 방식으로 고객 접점을 늘립니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Operational Management" title="Beyond Payment" description="결제 이후의 운영을 정리합니다." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <FadeIn key={c.title} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
              <div className="rounded-xl p-7 h-full transition-all duration-300 hover:translate-y-[-4px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-[1.05rem] font-bold text-white mb-3">{c.title}</div>
                <div className="text-[0.85rem] text-[var(--l-text-sub)] leading-relaxed">{c.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={2}>
          <div className="note-block mt-10 text-center" style={{ borderLeft: "none", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "8px" }}>
            <p>매장 운영 데이터를 <strong>체계적으로 관리합니다.</strong></p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Assurance Preview ── */
function AssurancePreviewSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0D2244 50%, #0A1628 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-5%] w-[45%] h-[130%]" style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
      </div>
      <div className="container-landing relative z-[1]">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="badge mb-5">Consumer Protection</span>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold leading-tight mb-4">
              결제하는 순간,<br /><span className="text-[var(--l-gold)]">소비자가 자동으로 보호됩니다.</span>
            </h2>
            <p className="text-[1rem] text-[var(--l-text-sub)] max-w-[600px] mx-auto leading-relaxed">
              2025년부터 피트니스·요가·필라테스 등 선불결제 업종은 소비자 피해보상 수단을 <strong className="text-white">의무 표시</strong>해야 합니다.<br />
              GL allpay 킵페이 안심결제서비스 하나로 법령 요건과 소비자 신뢰를 동시에 해결합니다.
            </p>
          </div>
        </FadeIn>

        {/* Law alert */}
        <FadeIn>
          <div className="flex items-start gap-5 rounded-2xl p-7 mb-12" style={{ background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.25)" }}>
            <div className="text-2xl shrink-0 mt-0.5">⚖</div>
            <div>
              <div className="text-[1rem] font-bold text-[#FF8A8A] mb-2">2025 공정위 법령 개정 — 선불결제 업종 의무표시 시행</div>
              <p className="text-[0.88rem] text-[var(--l-text-sub)] leading-relaxed">
                체육시설법 개정 및 공정거래위원회 중요정보 고시 행정예고에 따라, 피트니스·요가·필라테스 사업자는 계약 체결 시
                <strong className="text-white"> SGI서울보증 등 공신력 있는 보증보험 또는 유사서비스 가입 여부</strong>를 소비자에게 반드시 표시해야 합니다.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* 3 cards */}
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "🛡", value: "최대 300만원", label: "소비자 보상 한도", desc: "킵페이 안심결제서비스 자동 가입, 시설 폐업·영업중단 시 잔여금액 보상", color: "gold" },
              { icon: "🏛", value: "SGI 서울보증", label: "공신력 있는 보증 기관 연계", desc: "국내 최고 보증보험기관과 연계하여 법령 의무표시 요건을 자동 충족", color: "gold" },
              { icon: "✅", value: "자동 충족", label: "법령 의무표시 One-Stop", desc: "GL allpay 가맹 즉시 공정위·체육시설법 요건을 한 번에 해결", color: "green" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl text-center py-9 px-7" style={{
                background: c.color === "green"
                  ? "linear-gradient(135deg, rgba(92,232,136,0.08), rgba(92,232,136,0.01))"
                  : "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.02))",
                border: c.color === "green"
                  ? "1px solid rgba(92,232,136,0.2)"
                  : "1px solid rgba(201,168,76,0.25)",
              }}>
                <div className="text-2xl mb-4">{c.icon}</div>
                <div className="text-[1.8rem] font-extrabold mb-2" style={{ color: c.color === "green" ? "#5CE888" : "var(--l-gold)" }}>{c.value}</div>
                <div className="font-bold text-white mb-2">{c.label}</div>
                <p className="text-[0.85rem] text-[var(--l-text-sub)] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* CTA links */}
        <FadeIn>
          <div className="text-center flex flex-wrap items-center justify-center gap-3">
            <Link href="/assurance" className="btn-gold" style={{ fontSize: "1.05rem", padding: "16px 40px" }}>
              킵페이 안심결제서비스 자세히 알아보기 →
            </Link>
            <span className="text-[var(--l-text-sub)] text-[0.9rem]">또는</span>
            <Link href="/map" className="btn-outline">전국 가맹점 지도 보기</Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
