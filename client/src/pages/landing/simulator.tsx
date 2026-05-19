import { useState, useCallback } from "react";
import { Link } from "wouter";
import { LandingLayout } from "./components/LandingLayout";
import { FadeIn } from "./components/FadeIn";

interface SimResult {
  monthlyRevenue: number;
  pgFee: number;
  keepayFee: number;
  glpayFee: number;
  netRevenueBefore: number;
  netRevenueAfter: number;
  extraRevenue: number;
  premiumRevenue: number;
}

export default function SimulatorPage() {
  const [inputs, setInputs] = useState({
    monthlyRevenue: 5000,
    memberCount: 100,
    avgPrice: 50,
    currentPgRate: 3.5,
    glPayRate: 2.8,
    keepayRate: 0.5,
    installmentMonths: 12,
    premiumMultiplier: 2,
  });
  const [result, setResult] = useState<SimResult | null>(null);

  const calculate = useCallback(() => {
    const rev = inputs.monthlyRevenue * 10000;
    const pgFee = rev * (inputs.currentPgRate / 100);
    const glpayFee = rev * (inputs.glPayRate / 100);
    const keepayFee = rev * (inputs.keepayRate / 100);
    const netBefore = rev - pgFee;
    const netAfter = rev - glpayFee - keepayFee;
    const extra = netAfter - netBefore;
    const premiumRev = inputs.avgPrice * 10000 * inputs.premiumMultiplier * inputs.memberCount;

    setResult({
      monthlyRevenue: rev,
      pgFee,
      keepayFee,
      glpayFee,
      netRevenueBefore: netBefore,
      netRevenueAfter: netAfter,
      extraRevenue: extra,
      premiumRevenue: premiumRev,
    });
  }, [inputs]);

  const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");
  const fmtMan = (n: number) => `${Math.round(n / 10000).toLocaleString("ko-KR")}만원`;

  return (
    <LandingLayout>
      {/* Hero */}
      <section className="pt-32 pb-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(160deg, var(--l-mid-navy) 0%, var(--l-blue-dark) 60%, #060E1A 100%)" }}>
        <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 60%)" }} />
        <div className="container-landing relative z-[1]">
          <span className="section-label mb-4 block">Revenue Simulator</span>
          <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-[900] tracking-tight leading-tight mb-3.5">
            GL allpay <span className="text-[var(--l-gold)]">수익 구조</span> 시뮬레이터
          </h1>
          <p className="text-[0.9rem] text-[var(--l-text-sub)] leading-relaxed max-w-[580px] mx-auto mb-7">
            안심보장서비스와 무이자할부 구조에서 수수료를 상쇄하고<br />실수령이 늘어나는 구조를 직접 확인해보세요.
          </p>
          <span className="badge">실시간 계산</span>
        </div>
      </section>

      {/* Calculator */}
      <div className="py-9 px-6" style={{ background: "var(--l-navy)" }}>
        <div className="max-w-[1200px] mx-auto">
          {/* Input panel */}
          <div className="rounded-2xl p-7 mb-6" style={{ background: "var(--l-mid-navy)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] flex items-center gap-2.5 mb-5">
              <span className="w-5 h-0.5 bg-[var(--l-gold)]" /> 기본 정보 입력
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <InputRow label="월 평균 매출" value={inputs.monthlyRevenue} suffix="만원" onChange={(v) => setInputs((p) => ({ ...p, monthlyRevenue: v }))} />
              <InputRow label="월 평균 회원 수" value={inputs.memberCount} suffix="명" onChange={(v) => setInputs((p) => ({ ...p, memberCount: v }))} />
              <InputRow label="회원 평균 결제 단가" value={inputs.avgPrice} suffix="만원" onChange={(v) => setInputs((p) => ({ ...p, avgPrice: v }))} />
              <InputRow label="프리미엄 상품 배수" value={inputs.premiumMultiplier} suffix="배" onChange={(v) => setInputs((p) => ({ ...p, premiumMultiplier: v }))} />
            </div>

            <div className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] flex items-center gap-2.5 mb-5 mt-8">
              <span className="w-5 h-0.5 bg-[var(--l-gold)]" /> 수수료 설정
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5">
              <RateInput label="현재 PG 수수료" value={inputs.currentPgRate} onChange={(v) => setInputs((p) => ({ ...p, currentPgRate: v }))} />
              <RateInput label="GL Pay 수수료" value={inputs.glPayRate} onChange={(v) => setInputs((p) => ({ ...p, glPayRate: v }))} />
              <RateInput label="킵페이 서비스료" value={inputs.keepayRate} onChange={(v) => setInputs((p) => ({ ...p, keepayRate: v }))} />
              <RateInput label="할부 개월수" value={inputs.installmentMonths} suffix="개월" onChange={(v) => setInputs((p) => ({ ...p, installmentMonths: v }))} />
              <div className="rounded-lg p-3.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-[0.72rem] text-[var(--l-gray-text)] font-semibold mb-2">GL 총 수수료</div>
                <div className="text-[1.1rem] font-bold text-[var(--l-gold)] font-[var(--l-font-en)]">{(inputs.glPayRate + inputs.keepayRate).toFixed(1)}%</div>
              </div>
            </div>

            <button onClick={calculate} className="w-full py-4 rounded-xl text-[1rem] font-bold transition-all hover:translate-y-[-2px]" style={{ background: "linear-gradient(135deg, var(--l-gold), var(--l-gold-dark))", color: "var(--l-navy)", boxShadow: "var(--l-shadow-gold)" }}>
              계산하기
            </button>
          </div>

          {/* Result */}
          {result && (
            <FadeIn>
              <div className="rounded-2xl p-7" style={{ background: "var(--l-mid-navy)", border: "1px solid rgba(201,168,76,0.25)" }}>
                <div className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] flex items-center gap-2.5 mb-6">
                  <span className="w-5 h-0.5 bg-[var(--l-gold)]" /> 시뮬레이션 결과
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Before */}
                  <div className="rounded-xl p-6" style={{ background: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.15)" }}>
                    <p className="text-[0.72rem] font-bold tracking-wider uppercase text-[#e07070] mb-4">현재 PG 구조</p>
                    <div className="flex flex-col gap-2 text-[0.88rem]">
                      <div className="flex justify-between"><span className="text-[var(--l-text-sub)]">월 매출</span><span className="text-white font-semibold">{fmtMan(result.monthlyRevenue)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--l-text-sub)]">PG 수수료 ({inputs.currentPgRate}%)</span><span className="text-[#e07070]">-{fmtMan(result.pgFee)}</span></div>
                      <div className="flex justify-between pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                        <span className="font-bold text-white">실수령</span>
                        <span className="font-bold text-white text-lg">{fmtMan(result.netRevenueBefore)}</span>
                      </div>
                    </div>
                  </div>

                  {/* After */}
                  <div className="rounded-xl p-6" style={{ background: "rgba(201,168,76,0.08)", border: "1.5px solid rgba(201,168,76,0.3)" }}>
                    <p className="text-[0.72rem] font-bold tracking-wider uppercase text-[var(--l-gold)] mb-4">GL allpay 구조</p>
                    <div className="flex flex-col gap-2 text-[0.88rem]">
                      <div className="flex justify-between"><span className="text-[var(--l-text-sub)]">월 매출</span><span className="text-white font-semibold">{fmtMan(result.monthlyRevenue)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--l-text-sub)]">GL Pay 수수료 ({inputs.glPayRate}%)</span><span className="text-[var(--l-gold)]">-{fmtMan(result.glpayFee)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--l-text-sub)]">킵페이 서비스료 ({inputs.keepayRate}%)</span><span className="text-[var(--l-gold)]">-{fmtMan(result.keepayFee)}</span></div>
                      <div className="flex justify-between pt-3 mt-2" style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}>
                        <span className="font-bold text-[var(--l-gold)]">실수령</span>
                        <span className="font-bold text-[var(--l-gold)] text-lg">{fmtMan(result.netRevenueAfter)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ResultCard label="월 수수료 절감" value={result.extraRevenue > 0 ? `+${fmtMan(result.extraRevenue)}` : fmtMan(result.extraRevenue)} positive={result.extraRevenue > 0} desc="GL Pay 전환 시 차이" />
                  <ResultCard label="연간 절감 효과" value={result.extraRevenue > 0 ? `+${fmtMan(result.extraRevenue * 12)}` : fmtMan(result.extraRevenue * 12)} positive={result.extraRevenue > 0} desc="12개월 누적 기준" />
                  <ResultCard label="프리미엄 상품 월 매출" value={fmtMan(result.premiumRevenue)} positive desc={`${inputs.installmentMonths}개월 할부 구조 기준`} />
                </div>

                <p className="text-center text-[0.78rem] text-[var(--l-text-sub)] mt-6">
                  ※ 시뮬레이션 결과는 참고용이며, 실제 수수료 및 정산 조건은 가맹 상담 시 안내드립니다.
                </p>
              </div>
            </FadeIn>
          )}

          {/* CTA */}
          <div className="text-center mt-10">
            <Link href="/contact" className="btn-gold" style={{ padding: "16px 40px", fontSize: "1rem" }}>
              가맹 상담 신청하기 →
            </Link>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}

function InputRow({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="text-[0.875rem] text-[var(--l-text-sub)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-[130px] py-2.5 px-3 rounded-lg text-right text-[0.9rem] text-white outline-none transition-all focus:border-[var(--l-gold)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.15)]" style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.12)" }} />
        <span className="text-[0.78rem] text-[var(--l-gray-text)]">{suffix}</span>
      </div>
    </div>
  );
}

function RateInput({ label, value, suffix = "%", onChange }: { label: string; value: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <div className="rounded-lg p-3.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="text-[0.72rem] text-[var(--l-gray-text)] font-semibold mb-2">{label}</div>
      <div className="flex items-center justify-center gap-1">
        <input type="number" step="0.1" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-[72px] py-2 px-2 rounded-lg text-center text-[0.9rem] text-white outline-none transition-all focus:border-[var(--l-gold)] font-[var(--l-font-en)]" style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.1)" }} />
        <span className="text-[0.78rem] text-[var(--l-gray-text)]">{suffix}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, positive, desc }: { label: string; value: string; positive: boolean; desc: string }) {
  return (
    <div className="rounded-xl p-5 text-center" style={{ background: positive ? "rgba(16,185,129,0.08)" : "rgba(231,76,60,0.08)", border: positive ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(231,76,60,0.2)" }}>
      <div className="text-[0.82rem] text-[var(--l-text-sub)] mb-2">{label}</div>
      <div className={`text-xl font-bold font-[var(--l-font-en)] ${positive ? "text-[#10b981]" : "text-[#e07070]"}`}>{value}</div>
      <div className="text-[0.75rem] text-[var(--l-gray-text)] mt-1">{desc}</div>
    </div>
  );
}
