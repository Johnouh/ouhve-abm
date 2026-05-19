import { LandingLayout } from "./components/LandingLayout";
import { PageHero } from "./components/PageHero";
import { CTASection } from "./components/CTASection";
import { SectionHeader } from "./components/SectionHeader";
import { GoldDivider } from "./components/GoldDivider";
import { FadeIn } from "./components/FadeIn";

export default function SettlementPage() {
  return (
    <LandingLayout>
      <PageHero
        breadcrumb="정산 구조"
        label="Settlement Structure"
        title="정산은<br>구조입니다."
        description="GL allpay는 거래흐름과 계약 기준을 반영한<br>정산 체계를 설계합니다.<br>속도경쟁 대신, 기준에 맞는 안정성을 우선합니다."
        ctaText="상담 요청"
      />
      <WhyMattersSection />
      <PrinciplesSection />
      <FlowSection />
      <ConsiderationsSection />
      <FeaturesSection />
      <GlPayStructureSection />
      <CTASection label="Ready to Align?" title="현재 정산 방식이<br>운영 구조와 잘 맞고 있나요?" description="GL allpay가 구조에 맞는 정산 방향을 안내합니다." />
    </LandingLayout>
  );
}

/* ── Why It Matters ── */
function WhyMattersSection() {
  const cards = [
    { icon: "💰", title: "매출 발생 시점", desc: "선결제 시점과 서비스 제공 시점이 다를 때, 매출 인식 기준을 명확히 해야 합니다." },
    { icon: "🔄", title: "환불 가능성", desc: "계약 중도 해지나 환불 발생 시 정산 흐름에 영향을 미치는 요소를 미리 구조에 반영합니다." },
    { icon: "📊", title: "할부 매출 분산", desc: "할부 결제의 경우 매출이 분산되어 발생합니다. 이를 정산 체계에 통합적으로 반영해야 합니다." },
    { icon: "💵", title: "운영 자금 흐름", desc: "정산 시기와 규모가 운영 자금 흐름에 직접적인 영향을 미칩니다. 예측 가능한 구조가 필요합니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Why It Matters" title="왜 정산 구조가 중요한가" description="선결제 기반 업종에서<br>정산은 단순 입금이 아닙니다." titleKr />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((c, i) => (
            <FadeIn key={c.title} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
              <div className="rounded-xl p-7 h-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-2xl block mb-3">{c.icon}</span>
                <div className="text-[1rem] font-bold text-white mb-2">{c.title}</div>
                <p className="text-[0.83rem] text-[var(--l-text-sub)] leading-relaxed">{c.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={2}>
          <div className="note-block"><p>이 모든 요소를 고려한 <strong>정산 구조가 필요합니다.</strong></p></div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Design Principles ── */
function PrinciplesSection() {
  const principles = [
    { num: "01", title: "기준 반영", desc: "PG정책과 계약 조건을 구조에 반영합니다.\n운영 기준이 정산 체계 안에 녹아들도록 설계합니다." },
    { num: "02", title: "흐름 중시", desc: "매출과 운영 자금의 균형을 고려합니다.\n정산 타이밍과 규모가 운영에 미치는 영향을 함께 봅니다." },
    { num: "03", title: "관리 가능성", desc: "예측 가능한 정산 체계를 지향합니다.\n불확실성을 줄이고 관리 가능한 구조를 만듭니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Design Principles" title="GL allpay의 정산 설계 원칙" titleKr />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {principles.map((p, i) => (
            <FadeIn key={p.num} delay={i as 0 | 1 | 2}>
              <div className="rounded-xl p-8 h-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-[2rem] font-[900] text-[rgba(201,168,76,0.2)] font-[var(--l-font-en)] mb-3">{p.num}</div>
                <div className="text-[1.1rem] font-bold text-white mb-3">{p.title}</div>
                <p className="text-[0.85rem] text-[var(--l-text-sub)] leading-relaxed whitespace-pre-line">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={2}>
          <p className="text-center text-[0.95rem] text-[var(--l-text-sub)] italic">
            GL allpay는 <span className="text-[var(--l-gold)] font-semibold">과도한 약속은 하지 않습니다.</span>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Settlement Flow ── */
function FlowSection() {
  const steps = [
    { num: "1", label: "회원결제" },
    { num: "2", label: "승인 및\n거래확정" },
    { num: "3", label: "기준 검토" },
    { num: "4", label: "정산 처리" },
    { num: "5", label: "가맹점\n입금", highlight: true },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Settlement Flow" title="정산 흐름" />
        <FadeIn delay={1}>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-4">
                <div className={`text-center py-5 px-6 rounded-lg min-w-[100px] ${s.highlight ? "" : ""}`} style={{
                  background: s.highlight ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)",
                  border: s.highlight ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                }}>
                  <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-[0.82rem] font-bold ${s.highlight ? "text-[var(--l-navy)]" : "text-[var(--l-gold)]"}`} style={{ background: s.highlight ? "var(--l-gold)" : "rgba(201,168,76,0.15)" }}>{s.num}</div>
                  <div className={`text-[0.85rem] font-semibold whitespace-pre-line ${s.highlight ? "text-[var(--l-gold)] font-bold" : "text-white"}`}>{s.label}</div>
                </div>
                {i < steps.length - 1 && <span className="text-[var(--l-gold)] text-lg" aria-hidden="true">→</span>}
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={2}>
          <div className="note-block max-w-[600px] mx-auto text-center" style={{ borderLeft: "none", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "8px" }}>
            <p>정산은 단순 송금이 아닌 <strong>운영 체계의 일부입니다.</strong></p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Key Considerations ── */
function ConsiderationsSection() {
  const items = [
    { icon: "📋", text: "장기 계약 구조 — 장기간에 걸친 계약 형태에서 정산 기준을 명확히 합니다." },
    { icon: "⚠", text: "중도 해지 가능성 — 해지 발생 시 처리 방식과 정산 영향을 사전에 설계합니다." },
    { icon: "↩", text: "환불 발생 가능성 — 환불 처리 흐름이 정산 체계에 미치는 영향을 관리합니다." },
    { icon: "📊", text: "분할 매출 구조 — 할부 및 분할 결제가 매출 인식에 어떻게 반영되는지 구조화합니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <span className="section-label">Key Considerations</span>
            <FadeIn><h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-tight">선결제 업종에서<br />고려해야 할 점</h2></FadeIn>
            <GoldDivider />
            <FadeIn delay={1}><p className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed">정산은 매출만 보는 것이 아니라<br />구조 전체를 함께 봅니다.</p></FadeIn>
          </div>
          <FadeIn delay={1}>
            <div className="flex flex-col gap-4">
              {items.map((it) => (
                <div key={it.text} className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-lg shrink-0">{it.icon}</span>
                  <span className="text-[0.9rem] text-[var(--l-text-sub)] leading-relaxed">{it.text}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Our Difference ── */
function FeaturesSection() {
  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Our Difference" title="GL allpay만의 특징" description='GL allpay는 <strong style="color:var(--l-white)">빠름을 강조하지 않습니다.</strong>' titleKr />
        <FadeIn delay={2}>
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {["명확성", "일관성", "관리 가능한 구조"].map((t) => (
              <div key={t} className="rounded-lg py-5 px-8 text-[1rem] font-semibold text-white" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>{t}</div>
            ))}
          </div>
        </FadeIn>

        {/* Quote */}
        <FadeIn delay={2}>
          <div className="max-w-[640px] mx-auto mt-14 text-center">
            <div className="w-px h-[60px] mx-auto mb-6" style={{ background: "linear-gradient(transparent, var(--l-gold))" }} />
            <blockquote className="text-[clamp(1.2rem,2.5vw,1.7rem)] font-bold leading-snug tracking-tight">
              정산은 "혜택"이 아니라<br /><span className="text-[var(--l-gold)]">운영 기반입니다.</span>
            </blockquote>
            <div className="w-px h-[60px] mx-auto mt-6" style={{ background: "linear-gradient(var(--l-gold), transparent)" }} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── GL Pay Structure Comparison ── */
function GlPayStructureSection() {
  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="GL Pay — Foundation" title="안정적 정산의 근거,<br>원천사 직접 연결" description='GL allpay의 정산 안정성은 구호가 아닙니다.<br>원천결제사에 공식 입점된 <strong style="color:var(--l-white)">구조적 근거</strong>에서 나옵니다.' titleKr />

        <FadeIn delay={1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14 mb-12">
            {/* General PG */}
            <div className="rounded-xl p-9" style={{ background: "rgba(80,20,20,0.3)", border: "1px solid rgba(231,76,60,0.2)" }}>
              <p className="text-[0.72rem] font-bold tracking-wider uppercase text-[#e07070] mb-5">일반 PG 구조의 정산 리스크</p>
              <div className="flex flex-col items-center text-center gap-0">
                {["원천결제사", "2차 PG사 ← 리스크 시작", "3차 PG사 ← 리스크 증폭", "가맹점 입금 (불안정)"].map((step, i) => (
                  <div key={step} className="w-full">
                    <div className="rounded-lg py-3.5 px-5 text-[0.85rem] w-full" style={{
                      background: i === 1 || i === 2 ? "rgba(231,76,60,0.1)" : "rgba(255,255,255,0.05)",
                      border: i === 1 || i === 2 ? "1px solid rgba(231,76,60,0.2)" : "1px solid rgba(255,255,255,0.08)",
                      color: i === 1 || i === 2 ? "rgba(231,76,60,0.9)" : "rgba(255,255,255,0.6)",
                    }}>{step}</div>
                    {i < 3 && <div className="text-[rgba(231,76,60,0.6)] text-lg py-1">↓</div>}
                  </div>
                ))}
              </div>
              <p className="text-[0.78rem] text-[rgba(231,76,60,0.7)] mt-5 leading-relaxed">
                ✕ 중간 경유사 증가 → 정산 지연·불안정<br />
                ✕ 계약 해지 시 정산 공백 가능성<br />
                ✕ 업종 기피로 인한 불안정한 가맹 관계
              </p>
            </div>

            {/* GL allpay */}
            <div className="relative rounded-xl p-9" style={{ background: "rgba(10,30,10,0.4)", border: "1.5px solid rgba(201,168,76,0.3)" }}>
              <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-b-lg text-[0.68rem] font-extrabold tracking-wider" style={{ background: "var(--l-gold)", color: "var(--l-navy)" }}>GL allpay 구조</div>
              <p className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] mb-5 mt-2">직접 연결, 안정적 정산</p>
              <div className="flex flex-col items-center text-center gap-0">
                {[
                  { text: "원천결제사", highlight: false },
                  { text: "GL페이 (무이자 3-24개월)", highlight: true },
                  { text: "가맹점 직접 입금 ✓", highlight: true, strong: true },
                ].map((step, i) => (
                  <div key={step.text} className="w-full">
                    <div className={`rounded-lg py-3.5 px-5 text-[0.85rem] w-full ${step.strong ? "font-bold text-white" : ""}`} style={{
                      background: `rgba(201,168,76,${step.strong ? "0.15" : step.highlight ? "0.12" : "0.08"})`,
                      border: step.strong ? "2px solid var(--l-gold)" : "1.5px solid rgba(201,168,76,0.35)",
                      color: step.strong ? "white" : step.highlight ? "var(--l-gold)" : "var(--l-gold-light)",
                      fontWeight: step.highlight ? 700 : 600,
                    }}>{step.text}</div>
                    {i < 2 && <div className="text-[var(--l-gold)] text-lg py-1">↓</div>}
                  </div>
                ))}
              </div>
              <p className="text-[0.78rem] text-[rgba(201,168,76,0.8)] mt-5 leading-relaxed">
                ✓ 원천사 공식 입점 — 기피 업종 해소<br />
                ✓ 중간 경유 없는 직접 정산 흐름<br />
                ✓ 무이자 3-24개월로 프리미엄 상품 판매 가능
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={2}>
          <div className="note-block max-w-[680px] mx-auto text-center" style={{ borderLeft: "none", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px" }}>
            <p className="text-center">
              정산이 안정적인 이유는 약속이 아니라,<br /><strong>원천사와의 직접 연결 구조</strong>에 있습니다.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
