import { useState } from "react";
import { Link } from "wouter";
import { LandingLayout } from "./components/LandingLayout";
import { FadeIn } from "./components/FadeIn";
import { SectionHeader } from "./components/SectionHeader";
import { GoldDivider } from "./components/GoldDivider";

export default function AssurancePage() {
  return (
    <LandingLayout>
      <HeroSection />
      <HighlightStrip />
      <WhatSection />
      <FlowSection />
      <ConditionsSection />
      <MandatorySection />
      <DiffSection />
      <FaqSection />
      <CtaSection />
    </LandingLayout>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center overflow-hidden pt-40 pb-24" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0D2244 60%, #0F2C54 100%)" }}>
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)" }} />
      <div className="container-landing relative z-[1]">
        <div className="max-w-[720px]">
          <span className="badge mb-6">킵페이 안심결제서비스</span>
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.25] mb-5">
            회원권을 결제한 순간부터<br /><span className="text-[var(--l-gold)]">소비자가 보호받습니다.</span>
          </h1>
          <p className="text-[1.1rem] text-[var(--l-text-sub)] max-w-[600px] leading-relaxed mb-10">
            킵페이 안심결제서비스는 회원권 결제 시 자동 가입되는 소비자 보호 프로그램입니다.<br />
            시설 폐업·영업 중단 시 <strong className="text-white">최대 300만원까지 보상</strong>하며, SGI서울보증이 뒷받침합니다.
          </p>
          <div className="flex gap-4 flex-wrap">
            <a href="#what" className="btn-gold">킵페이 안심결제서비스 알아보기</a>
            <Link href="/contact" className="btn-outline">상담 문의하기</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HighlightStrip() {
  const items = [
    { num: "300만원", label: "최대 보상 한도", desc: "회원권 1건당 적용" },
    { num: "SGI", label: "서울보증보험 연계", desc: "공신력 있는 보증 기관" },
    { num: "자동", label: "GL Pay 결제 즉시 가입", desc: "별도 신청 불필요" },
  ];
  return (
    <div className="py-16" style={{ background: "linear-gradient(135deg, var(--l-gold-dark), var(--l-gold))" }}>
      <div className="container-landing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {items.map((it) => (
            <div key={it.label}>
              <span className="block text-[clamp(2.5rem,5vw,4rem)] font-extrabold text-[var(--l-navy)] leading-none font-[var(--l-font-en)]">{it.num}</span>
              <span className="block text-[1rem] font-semibold text-[var(--l-navy)] mt-2">{it.label}</span>
              <span className="block text-[0.85rem] text-[rgba(10,22,40,0.7)] mt-1">{it.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhatSection() {
  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }} id="what">
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <div>
              <span className="section-label">What is Assurance Service</span>
              <h3 className="text-[1.8rem] font-bold leading-snug mb-5">킵페이 안심결제서비스란<br />무엇인가요?</h3>
              <p className="text-[var(--l-text-sub)] leading-relaxed mb-4">
                피트니스·요가·필라테스 등 <strong className="text-white">선불 결제 기반 업종</strong>에서는 소비자가 회원권을 결제한 후 업체가 갑작스럽게 폐업하거나 운영을 중단할 경우 환불을 받지 못하는 문제가 발생합니다.
              </p>
              <p className="text-[var(--l-text-sub)] leading-relaxed mb-4">
                킵페이 안심결제서비스는 회원권 결제 시 자동으로 가입되어, 이러한 상황에서 소비자를 보호하는 <strong className="text-white">보상 연계 서비스</strong>입니다.
              </p>
              <div className="rounded-lg p-5 mt-6" style={{ background: "rgba(201,168,76,0.12)", borderLeft: "3px solid var(--l-gold)" }}>
                가맹점이 GL allpay를 도입하면 소비자에게 "SGI서울보증 연계 킵페이 안심결제서비스 가입 가맹점"임을 표시할 수 있어 신뢰도가 높아지고, 회원 모집이 더 원활해집니다.
              </div>
            </div>
          </FadeIn>
          <FadeIn>
            <div className="rounded-2xl p-10 text-center" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.03))", border: "1px solid rgba(201,168,76,0.2)" }}>
              <div className="text-[6rem] mb-5">SGI</div>
              <div className="inline-block px-8 py-3 rounded-full text-[1.5rem] font-extrabold mb-4" style={{ background: "var(--l-gold)", color: "var(--l-navy)" }}>최대 300만원 보상</div>
              <div className="text-[0.9rem] text-[var(--l-text-sub)] mb-4">회원권 결제 시 자동 적용</div>
              {["🏛 SGI서울보증보험 연계 서비스", "⚖ 공정거래위원회 의무표시 기준 충족", "📋 체육시설법 및 소비자보호법 적합"].map((t) => (
                <div key={t} className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 mt-2 mx-1 text-[0.85rem] text-[var(--l-text-sub)]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {t}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function FlowSection() {
  const steps = [
    { num: 1, title: "GL Pay 결제", desc: "소비자가 회원권을 GL allpay로 결제" },
    { num: 2, title: "자동 서비스 가입", desc: "결제 즉시 안심서비스 자동 등록" },
    { num: 3, title: "폐업·중단 발생", desc: "시설 폐업 또는 영업 중단 사유 발생" },
    { num: 4, title: "보상 신청", desc: "소비자가 GL allpay에 보상 접수 신청" },
    { num: 5, title: "보상금 지급", desc: "심사 완료 후 최대 300만원 보상 지급" },
  ];
  return (
    <section className="py-20" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="How It Works" title="안심서비스 보상 적용 흐름" description="회원권 결제 후 문제 발생 시, 아래 5단계 프로세스로 보상이 이루어집니다." titleKr />
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl relative" style={{ background: "var(--l-mid-navy)", border: "2px solid var(--l-gold)" }}>
                  <span className="absolute top-[-6px] right-[-6px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-[0.7rem] font-extrabold" style={{ background: "var(--l-gold)", color: "var(--l-navy)" }}>{s.num}</span>
                  {["💳", "✅", "⚠", "📋", "💰"][s.num - 1]}
                </div>
                <div className="font-bold text-[0.9rem] text-white mb-1">{s.title}</div>
                <div className="text-[0.78rem] text-[var(--l-text-sub)] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function ConditionsSection() {
  const cards = [
    { icon: "🏢", title: "적용 대상 시설", desc: "GL allpay GL Pay로 결제한 선불 회원권 기반 시설 (피트니스, 요가, 필라테스, 수영장 등)" },
    { icon: "🛡", title: "보상 사유", desc: "시설의 폐업, 영업정지, 영업중단 등으로 계약 이행이 불가한 경우 (소비자 과실 제외)" },
    { icon: "💰", title: "보상 한도", desc: "회원권 1건당 최대 300만원 (잔여 미이용 금액 기준, 이미 사용한 기간은 차감)" },
  ];
  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Coverage Conditions" title="보상 적용 조건" description="다음 조건에 해당하는 경우 안심서비스 보상이 적용됩니다." titleKr />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <FadeIn key={c.title} delay={i as 0 | 1 | 2}>
              <div className="rounded-2xl p-8 h-full transition-all duration-300 hover:translate-y-[-4px] hover:border-[rgba(201,168,76,0.4)]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-[2.5rem] mb-4">{c.icon}</div>
                <h4 className="text-[1.05rem] font-bold text-[var(--l-gold)] mb-3">{c.title}</h4>
                <p className="text-[0.88rem] text-[var(--l-text-sub)] leading-relaxed">{c.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function MandatorySection() {
  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="Mandatory Display" title="2025 법령 개정 — 선불결제 업종 의무표시" titleKr />

        <FadeIn>
          <div className="rounded-2xl p-10 mb-12" style={{ background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.3)" }}>
            <div className="flex items-start gap-3 mb-2">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.8rem] font-bold" style={{ background: "rgba(220,60,60,0.15)", border: "1px solid rgba(220,60,60,0.4)", color: "#FF6B6B" }}>
                ⚖ 법적 의무 사항
              </span>
            </div>
            <h3 className="text-[1.4rem] font-bold text-[#FF8A8A] mb-4">소비자 피해보상 수단 의무표시 시행</h3>
            <p className="text-[var(--l-text-sub)] leading-relaxed mb-3">
              체육시설법 개정 및 공정거래위원회 고시에 따라, 피트니스·요가·필라테스 등 선불 결제 업종 사업자는
              계약 체결 시 <strong className="text-white">SGI서울보증 등 공신력 있는 보증보험 또는 유사 서비스 가입 여부</strong>를
              소비자에게 반드시 표시해야 합니다.
            </p>
            <p className="text-[var(--l-text-sub)] leading-relaxed">
              미이행 시 과태료 및 영업 제재 대상이 될 수 있으며, 소비자 신뢰 확보가 어려워집니다.
            </p>
          </div>
        </FadeIn>

        {/* Comparison table */}
        <FadeIn delay={1}>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(201,168,76,0.15)" }}>
                  <th className="py-4 px-5 text-[0.9rem] font-bold text-[var(--l-gold)]" style={{ borderBottom: "2px solid rgba(201,168,76,0.3)" }}>항목</th>
                  <th className="py-4 px-5 text-[0.9rem] font-bold text-[var(--l-gold)]" style={{ borderBottom: "2px solid rgba(201,168,76,0.3)" }}>GL allpay (킵페이)</th>
                  <th className="py-4 px-5 text-[0.9rem] font-bold text-[var(--l-gold)]" style={{ borderBottom: "2px solid rgba(201,168,76,0.3)" }}>일반 PG / 미가입</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["SGI 보증 연계", "✓ 자동 연계", "✕ 미제공"],
                  ["의무표시 충족", "✓ 자동 충족", "✕ 별도 가입 필요"],
                  ["소비자 보상", "✓ 최대 300만원", "✕ 보상 불가"],
                  ["가맹점 신뢰도", "✓ 안심마크 표시 가능", "✕ 신뢰 표시 불가"],
                  ["과태료 리스크", "✓ 없음", "✕ 과태료 대상"],
                ].map(([item, good, bad]) => (
                  <tr key={item} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td className="py-4 px-5 text-[0.88rem] font-semibold text-white">{item}</td>
                    <td className="py-4 px-5 text-[0.88rem] text-[#5CE888]">{good}</td>
                    <td className="py-4 px-5 text-[0.88rem] text-[#FF6B6B]">{bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function DiffSection() {
  const cards = [
    { icon: "🛡", title: "소비자 자동 보호", desc: "결제 즉시 보호 서비스 자동 가입. 소비자는 별도 신청 없이 보장받습니다.", highlight: "Zero Effort" },
    { icon: "🏛", title: "SGI 보증 기반", desc: "국내 최고 보증보험기관 SGI서울보증과 연계. 정부 인정 공신력 확보.", highlight: "Public Trust" },
    { icon: "⚖", title: "법령 완벽 대응", desc: "공정위 의무표시, 체육시설법, 소비자보호법까지 가맹 즉시 한 번에 충족.", highlight: "One-Stop" },
  ];
  return (
    <section className="py-24" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="What Makes It Different" title="킵페이 안심결제서비스의 차별점" titleKr />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <FadeIn key={c.title} delay={i as 0 | 1 | 2}>
              <div className="rounded-2xl text-center py-10 px-8 h-full transition-all duration-300 hover:translate-y-[-6px] hover:border-[var(--l-gold)]" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.25)" }}>
                <div className="text-[3rem] mb-4">{c.icon}</div>
                <h4 className="text-[1.15rem] font-bold text-[var(--l-gold)] mb-3">{c.title}</h4>
                <p className="text-[0.88rem] text-[var(--l-text-sub)] leading-relaxed mb-3">{c.desc}</p>
                <div className="inline-block rounded-lg px-4 py-2 text-[0.85rem] font-semibold text-[var(--l-gold-light)]" style={{ background: "rgba(201,168,76,0.15)" }}>{c.highlight}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = [
    { q: "킵페이 안심결제서비스에 별도 가입해야 하나요?", a: "아니요. GL allpay GL Pay로 결제하는 순간 자동으로 가입됩니다. 소비자도 가맹점도 별도 절차가 불필요합니다." },
    { q: "보상 한도는 얼마인가요?", a: "회원권 1건당 최대 300만원입니다. 잔여 미이용 금액 기준으로 산정되며, 이미 사용한 기간은 일할 차감됩니다." },
    { q: "어떤 경우에 보상받을 수 있나요?", a: "시설의 폐업, 영업정지, 영업중단 등으로 계약 이행이 불가한 경우에 해당합니다. 소비자 본인 사유에 의한 해지는 대상이 아닙니다." },
    { q: "보상 신청은 어떻게 하나요?", a: "GL allpay 고객센터 또는 킵페이 안심결제서비스 전용 접수 채널을 통해 신청할 수 있습니다. 접수 후 심사를 거쳐 보상금이 지급됩니다." },
    { q: "SGI서울보증보험이란?", a: "대한민국 대표 보증보험기관으로, 정부가 공인하는 공신력 있는 보증 서비스를 제공합니다. 킵페이 안심결제서비스는 이 SGI서울보증과 직접 연계되어 있습니다." },
  ];

  return (
    <section className="py-24" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <SectionHeader label="FAQ" title="자주 묻는 질문" titleKr />
        <div className="max-w-[800px] mx-auto mt-10 flex flex-col gap-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl overflow-hidden transition-colors" style={{ border: openIdx === i ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>
              <button className="w-full flex items-center justify-between px-7 py-5 text-left text-[0.95rem] font-semibold transition-colors" style={{ background: openIdx === i ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.03)", color: openIdx === i ? "var(--l-gold)" : "var(--l-white)" }} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                {f.q}
                <span className={`text-[var(--l-gold)] text-xl shrink-0 transition-transform duration-300 ${openIdx === i ? "rotate-180" : ""}`}>▾</span>
              </button>
              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: openIdx === i ? "300px" : "0", padding: openIdx === i ? "0 28px 22px" : "0 28px" }}>
                <p className="text-[0.88rem] text-[var(--l-text-sub)] leading-relaxed">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-24 text-center" style={{ background: "linear-gradient(135deg, #0D2244, #0A1628)" }}>
      <div className="container-landing">
        <FadeIn>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold leading-tight mb-5">
            아직도 소비자 보호 수단 없이<br /><span className="text-[var(--l-gold)]">회원권을 판매하고 계신가요?</span>
          </h2>
          <p className="text-[1.05rem] text-[var(--l-text-sub)] leading-relaxed mb-10 max-w-[600px] mx-auto">
            GL allpay 하나로 킵페이 안심결제서비스 + 무이자 3-24개월 GL Pay +<br />PG 직접 정산 구조까지 한 번에 해결됩니다.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/contact" className="btn-gold" style={{ padding: "16px 40px", fontSize: "1.05rem" }}>가맹 상담 신청</Link>
            <Link href="/settlement" className="btn-outline">정산 구조 알아보기</Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
