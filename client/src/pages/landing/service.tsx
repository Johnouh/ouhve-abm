import { Link } from "wouter";
import { LandingLayout } from "./components/LandingLayout";
import { PageHero } from "./components/PageHero";
import { CTASection } from "./components/CTASection";
import { SectionHeader } from "./components/SectionHeader";
import { GoldDivider } from "./components/GoldDivider";
import { FadeIn } from "./components/FadeIn";

export default function ServicePage() {
  return (
    <LandingLayout>
      <PageHero
        breadcrumb="서비스"
        label="Service Overview"
        title='GL allpay는<br>선결제 기반 업종을 위한<br><span style="color:var(--l-gold)">구조 설계 파트너</span>입니다.'
        description="연결보다 먼저 기반을 정렬합니다.<br>기준을 이해하는 것에서 시작합니다."
        ctaText="상담요청"
      />
      <DifferenceSection />
      <PerspectiveSection />
      <ApproachSection />
      <ScopeSection />
      <PrincipleSection />
      <WhoSection />
      <CTASection title="지금의 구조,<br>어디까지 정리되어 있으신가요?" description="GL allpay와 함께 그 흐름을 정돈해 보십시오." />
    </LandingLayout>
  );
}

/* ── 핵심 차별점 ── */
function DifferenceSection() {
  const cards = [
    { num: "01", badge: "원천사 공식 입점", title: "2차·3차 PG를 거치지 않는<br>직접 연결 구조", desc: "일반적으로 원천결제사는 선결제 장기할부 업종인 헬스·피트니스 업종을 공식 가맹점으로 승인하지 않습니다.<br><br>GL allpay는 GL페이를 통해 원천결제사에 <strong style='color:var(--l-gold-light)'>휘트니스 업종을 정식 입점</strong>시킬 수 있는 유일한 구조를 보유하고 있습니다." },
    { num: "02", badge: "무이자 3-24개월", title: "업계 최장<br>무이자 장기할부 구조", desc: "GL페이는 <strong style='color:var(--l-gold-light)'>무이자 3-24개월 할부</strong>를 공식 지원합니다.<br><br>회원의 월 납부 부담을 낮추면서 센터는 고단가 장기 상품을 자연스럽게 제안할 수 있는 구조가 만들어집니다." },
    { num: "03", badge: "프리미엄 매출 설계", title: "장기할부로 설계하는<br>프리미엄 회원권", desc: "24개월 할부가 가능해지면 상품 단가 자체가 달라집니다.<br><br>월 15만원 × 24개월이면 <strong style='color:var(--l-gold-light)'>360만원짜리 프리미엄 회원권</strong>을 자연스럽게 제시할 수 있습니다. 동일 회원 수로 더 높은 매출을 만드는 구조입니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="badge mb-5">Why GL allpay</span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold tracking-tight leading-tight">
              원천사 공식 입점,<br />GL allpay만 가능한 이유
            </h2>
            <GoldDivider centered className="my-6" />
            <p className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed max-w-[640px] mx-auto">
              선결제 장기할부 업종인 휘트니스는 원천결제사가 공식적으로 기피하는 업종입니다.<br />
              GL allpay는 자체 <strong className="text-[rgba(255,255,255,0.85)]">GL페이</strong>를 통해 이 구조적 한계를 해결합니다.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {cards.map((c, i) => (
            <FadeIn key={c.num} delay={i as 0 | 1 | 2}>
              <div className="relative overflow-hidden rounded-xl h-full" style={{ padding: "40px 32px", background: "linear-gradient(160deg, rgba(10,26,50,0.9), var(--l-blue-dark))", border: "1px solid rgba(201,168,76,0.25)" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--l-gold), var(--l-gold-dark))" }} />
                <div className="text-[2.5rem] font-[900] text-[rgba(201,168,76,0.15)] leading-none font-[var(--l-font-en)] mb-4">{c.num}</div>
                <span className="origin-badge mb-4 inline-block">{c.badge}</span>
                <h4 className="text-[1.05rem] font-bold text-white mb-3 leading-snug" dangerouslySetInnerHTML={{ __html: c.title }} />
                <p className="text-[0.83rem] text-[var(--l-text-sub)] leading-relaxed" dangerouslySetInnerHTML={{ __html: c.desc }} />
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Structure summary */}
        <FadeIn delay={2}>
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(10,22,40,0.9))", border: "1px solid rgba(201,168,76,0.2)" }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 p-8 lg:p-12">
              <div>
                <div className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] mb-4 font-[var(--l-font-en)]">Structure Summary</div>
                <h3 className="text-[clamp(1.4rem,2.5vw,2rem)] font-bold leading-tight mb-4">GL페이가 만드는<br /><span className="text-[var(--l-gold)]">안전한 연결</span></h3>
                <p className="text-[0.9rem] text-[var(--l-text-sub)] leading-relaxed">
                  원천사 → GL페이 → 가맹점(휘트니스)<br /><br />
                  중간 경유 없는 직접 구조이기 때문에<br />
                  <strong className="text-white">정산 안정성</strong>과 <strong className="text-white">장기할부 지원</strong>이 동시에 가능합니다.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                {[
                  { num: "원천사 직접", label: "공식 가맹점 입점", sub: "2·3차 PG 없이 원천사와 직결\n정산 구조의 근본적 안정성 확보" },
                  { num: "24개월", label: "무이자 장기할부", sub: "프리미엄 고단가 상품 판매 가능\n회원 부담 ↓ · 센터 매출 ↑" },
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

/* ── Perspective ── */
function PerspectiveSection() {
  const items = [
    { icon: "💰", text: "매출 흐름 — 각 매장의 매출 패턴과 발생 타이밍은 서로 다릅니다." },
    { icon: "📄", text: "계약 조건 — 계약 기간, 갱신 조건, 해지 정책이 운영 구조를 결정합니다." },
    { icon: "🔄", text: "환불 가능성 — 업종별로 환불 발생 빈도와 방식이 다르게 나타납니다." },
    { icon: "📊", text: "할부 분산 구조 — 할부 결제 비율과 분산 방식이 정산에 영향을 미칩니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <span className="section-label">Perspective</span>
            <FadeIn><h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-tight">같은 업종이라도,<br />같은 구조는 아닙니다.</h2></FadeIn>
            <GoldDivider />
            <FadeIn delay={1}>
              <div className="flex flex-col gap-4 mt-6">
                {items.map((it) => (
                  <div key={it.text} className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-lg shrink-0">{it.icon}</span>
                    <span className="text-[0.9rem] text-[var(--l-text-sub)] leading-relaxed">{it.text}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={2}>
            <div className="h-full flex flex-col justify-center rounded-xl p-12" style={{ background: "linear-gradient(135deg, var(--l-mid-navy), var(--l-blue-dark))", border: "1px solid rgba(201,168,76,0.15)" }}>
              <p className="text-[0.85rem] text-[var(--l-text-sub)] leading-relaxed mb-8">겉으로는 비슷해 보여도<br />내부 구조는 모두 다릅니다.</p>
              <div className="text-[clamp(1.4rem,2.5vw,2rem)] font-bold leading-snug mb-8">
                GL allpay는<br /><span className="text-[var(--l-gold)]">그 차이를 봅니다.</span>
              </div>
              <div className="w-10 h-0.5 bg-[var(--l-gold)]" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Our Approach ── */
function ApproachSection() {
  const steps = [
    { en: "Flow", title: "매출의 흐름을 봅니다.", desc: "매출이 어떻게 발생하고 어떻게 이동하는지, 전체 흐름을 파악하는 것에서 시작합니다. 데이터와 계약 조건을 함께 검토합니다." },
    { en: "Structure", title: "운영 체계를 점검합니다.", desc: "현재 운영 방식, 계약 구조, 정산 현황을 종합적으로 점검합니다. 개선이 필요한 지점을 파악합니다." },
    { en: "Alignment", title: "요구 기준과 구조를 맞춥니다.", desc: "PG 기준, 계약 조건, 업종 특성을 구조에 통합합니다. 기준과 실제 운영이 일치하도록 정렬합니다." },
    { en: "Preparation", title: "필요 요소를 정돈합니다.", desc: "실제 운영 전 필요한 모든 요소를 점검하고 정돈합니다. 빠진 부분 없이 준비된 구조를 완성합니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Our Approach" title="Our Approach" description='설계는 단순 준비가 아닙니다. <strong style="color:var(--l-gold)">정렬입니다.</strong>' />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={s.en} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
              <div className="rounded-xl p-7 h-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] font-[var(--l-font-en)] mb-3">{s.en}</div>
                <div className="text-[1rem] font-bold text-white mb-3">{s.title}</div>
                <p className="text-[0.83rem] text-[var(--l-text-sub)] leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Scope ── */
function ScopeSection() {
  const items = ["계약 구조", "정산 흐름", "리스크 요소", "할부 적용 가능성", "운영 관리 체계"];

  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <span className="section-label">Scope</span>
            <FadeIn><h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold font-[var(--l-font-en)]">Scope</h2></FadeIn>
            <GoldDivider />
            <FadeIn delay={1}><p className="text-[0.95rem] text-[var(--l-text-sub)]">설계의 범위는 단편적이지 않습니다.</p></FadeIn>
            <FadeIn delay={2}>
              <p className="mt-8 text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed">
                GL allpay는<br />일부가 아닌 <strong className="text-white">전체를 정렬합니다.</strong>
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={1}>
            <div className="flex flex-col gap-3">
              {items.map((item, i) => (
                <div key={item} className="flex items-center gap-4 rounded-lg px-6 py-5 transition-all duration-300 hover:translate-x-2 hover:border-[rgba(201,168,76,0.4)]" style={{ background: "linear-gradient(135deg, var(--l-mid-navy), var(--l-blue-dark))", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <span className="text-[1rem] font-bold text-[var(--l-gold)] font-[var(--l-font-en)] min-w-[24px]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[0.9rem] font-semibold text-white">{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Principle ── */
function PrincipleSection() {
  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Our Principle" title="Principle" />
        <FadeIn delay={1}>
          <div className="max-w-[680px] mx-auto rounded-xl p-12" style={{ background: "linear-gradient(135deg, var(--l-mid-navy), var(--l-blue-dark))", border: "1px solid rgba(201,168,76,0.2)" }}>
            <p className="text-[1.05rem] text-[var(--l-text-sub)] leading-relaxed mb-8">
              무리한 조건을 제시하지 않습니다.<br />과도한 약속을 하지 않습니다.
            </p>
            <div className="flex flex-col gap-4 mb-10">
              {["기준을 존중합니다.", "구조를 정돈합니다."].map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="text-[var(--l-gold)] text-lg">✦</span>
                  <span className="text-[0.95rem] text-white font-medium">{t}</span>
                </div>
              ))}
            </div>
            <div className="pt-7" style={{ borderTop: "1px solid rgba(201,168,76,0.15)" }}>
              <p className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed">
                단기 결과보다<br />
                <strong className="text-[var(--l-gold)] text-lg">지속 가능한 운영을 선택합니다.</strong>
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Who It's For ── */
function WhoSection() {
  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Who It's For" title="이런 사업장을 위한 솔루션입니다" titleKr />
        <FadeIn delay={1}>
          <div className="max-w-[640px] flex flex-col gap-3 mb-12">
            {["장기 회원권 기반 업종", "선결제 중심 매출 구조", "운영 기준을 명확히 정리하고 싶은 사업장"].map((t) => (
              <div key={t} className="rounded-lg px-6 py-4 text-[0.95rem] font-medium text-white" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>{t}</div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={2}>
          <div className="max-w-[640px] rounded-xl p-10" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <p className="text-[1rem] text-[var(--l-text-sub)] leading-relaxed">
              GL allpay는<br />준비된 구조 위에서<br />
              <strong className="text-white">안정적으로 운영하고 싶은 모든 사업장</strong>을 위한 솔루션입니다.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
