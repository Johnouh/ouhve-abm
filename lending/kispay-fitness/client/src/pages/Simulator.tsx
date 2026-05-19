/**
 * GL ALLPAY 매출 시뮬레이터
 * 원본 HTML의 전체 계산 로직을 React로 이식
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, type Easing } from "framer-motion";
import { ArrowLeft, ChevronUp } from "lucide-react";

const ease: Easing = [0.25, 0.1, 0.25, 1];
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

/* ─── 유틸 ─── */
function fmt(n: number) {
  return Math.round(n).toLocaleString("ko-KR");
}
function fmtWon(n: number) {
  if (!n || !isFinite(n)) return "0원";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const man = Math.round((abs % 100000000) / 10000);
    if (man === 0 || man >= 10000) return sign + (eok + (man >= 10000 ? 1 : 0)) + "억원";
    return sign + eok + "억 " + fmt(man) + "만원";
  }
  if (abs >= 10000) {
    const m = abs / 10000;
    if (m >= 1000) return sign + fmt(Math.round(m)) + "만원";
    return sign + (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + "만원";
  }
  return sign + fmt(abs) + "원";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const KEEPPAY_RATE = 4; // 킵페이 안심결제 서비스 고정 4%

function calcItem(current: number, markup: number, discount: number, feeRate: number) {
  const raised = Math.round(current * (1 + markup));
  const discounted = Math.round(raised * (1 - discount));
  const pgFee = Math.round(discounted * feeRate);
  const keepFee = Math.round(discounted * (KEEPPAY_RATE / 100));
  const fee = pgFee + keepFee;
  const net = discounted - fee;
  return { current, raised, discounted, fee, pgFee, keepFee, net };
}

/* ─── 프리셋 ─── */
const presets: Record<string, Record<string, number>> = {
  small: {
    beRevenue: 15000000, bePrice12: 480000, beFeeRate: 3.3, beExistingFee: 0, beCardRatio: 60, beConvBoost: 20, beVisitors: 15,
    m1: 70000, m3: 180000, m6: 300000, m12: 480000,
    pt10: 400000, pt20: 700000, pt30: 1000000, pt50: 1500000, pt100: 2500000,
    existMembers: 80, prVisitors: 15, prConvBoost: 20, markupRate: 25, discountRate: 8, feeRate: 3.3, churnRate: 10,
  },
  medium: {
    beRevenue: 40000000, bePrice12: 600000, beFeeRate: 3.3, beExistingFee: 2.5, beCardRatio: 80, beConvBoost: 20, beVisitors: 40,
    m1: 100000, m3: 250000, m6: 400000, m12: 600000,
    pt10: 500000, pt20: 900000, pt30: 1300000, pt50: 2000000, pt100: 3500000,
    existMembers: 200, prVisitors: 40, prConvBoost: 20, markupRate: 25, discountRate: 8, feeRate: 3.3, churnRate: 5,
  },
  large: {
    beRevenue: 100000000, bePrice12: 900000, beFeeRate: 3.3, beExistingFee: 3.3, beCardRatio: 90, beConvBoost: 20, beVisitors: 80,
    m1: 150000, m3: 350000, m6: 600000, m12: 900000,
    pt10: 700000, pt20: 1200000, pt30: 1800000, pt50: 3000000, pt100: 5000000,
    existMembers: 500, prVisitors: 80, prConvBoost: 20, markupRate: 25, discountRate: 8, feeRate: 3.3, churnRate: 3,
  },
  boutique: {
    beRevenue: 25000000, bePrice12: 800000, beFeeRate: 3.3, beExistingFee: 3.0, beCardRatio: 85, beConvBoost: 25, beVisitors: 20,
    m1: 120000, m3: 300000, m6: 500000, m12: 800000,
    pt10: 800000, pt20: 1400000, pt30: 2000000, pt50: 3000000, pt100: 5500000,
    existMembers: 50, prVisitors: 20, prConvBoost: 25, markupRate: 30, discountRate: 10, feeRate: 3.3, churnRate: 8,
  },
  local: {
    beRevenue: 10000000, bePrice12: 360000, beFeeRate: 3.3, beExistingFee: 0, beCardRatio: 50, beConvBoost: 15, beVisitors: 10,
    m1: 50000, m3: 130000, m6: 210000, m12: 360000,
    pt10: 300000, pt20: 550000, pt30: 800000, pt50: 1200000, pt100: 2000000,
    existMembers: 60, prVisitors: 10, prConvBoost: 15, markupRate: 20, discountRate: 5, feeRate: 3.3, churnRate: 15,
  },
};

const presetNames: Record<string, string> = {
  small: "소형 동네짐", medium: "중형 역세권", large: "대형 프랜차이즈", boutique: "PT전문 부티크", local: "지방 중소도시",
};
const presetEmojis: Record<string, string> = {
  small: "🏋️", medium: "🏢", large: "🏗️", boutique: "🥊", local: "💪",
};

/* ─── 입력 컴포넌트 ─── */
function InputField({ label, value, onChange, suffix, hint, min = 0, max = 999999999, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; suffix: string;
  hint?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      <div className="flex items-baseline gap-2 border-b border-border focus-within:border-navy transition-colors">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0, min, max))}
          min={min} max={max} step={step}
          className="flex-1 bg-transparent py-2.5 text-right text-lg font-bold text-foreground outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-muted-foreground font-medium pb-2.5 shrink-0">{suffix}</span>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground/60 mt-1">{hint}</p>}
    </div>
  );
}

/* ─── 결과 카드 ─── */
function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className={`bg-card border border-border p-5 ${accent ? `border-l-4 ${accent}` : ""}`}>
      <div className="text-xs text-muted-foreground font-medium mb-2">{label}</div>
      <div className="font-mono text-2xl font-bold text-navy">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */
export default function Simulator() {
  const [activeTab, setActiveTab] = useState<"breakeven" | "pricing">("breakeven");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ─── Breakeven state ───
  const [beRevenue, setBeRevenue] = useState(30000000);
  const [bePrice12, setBePrice12] = useState(540000);
  const [beFeeRate, setBeFeeRate] = useState(3.3);
  const [beExistingFee, setBeExistingFee] = useState(0);
  const [beCardRatio, setBeCardRatio] = useState(75);
  const [beConvBoost, setBeConvBoost] = useState(20);
  const [beVisitors, setBeVisitors] = useState(25);
  const [beResults, setBeResults] = useState<any>(null);

  // ─── Pricing state ───
  const [m1, setM1] = useState(100000);
  const [m3, setM3] = useState(250000);
  const [m6, setM6] = useState(400000);
  const [m12, setM12] = useState(540000);
  const [pt10, setPt10] = useState(500000);
  const [pt20, setPt20] = useState(900000);
  const [pt30, setPt30] = useState(1200000);
  const [pt50, setPt50] = useState(1800000);
  const [pt100, setPt100] = useState(3000000);
  const [markupRate, setMarkupRate] = useState(25);
  const [discountRate, setDiscountRate] = useState(8);
  const [feeRate, setFeeRate] = useState(3.3);
  const [churnRate, setChurnRate] = useState(5);
  const [existMembers, setExistMembers] = useState(120);
  const [prVisitors, setPrVisitors] = useState(30);
  const [prConvBoost, setPrConvBoost] = useState(20);
  const [prResults, setPrResults] = useState<any>(null);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ─── 프리셋 로드 ─── */
  const loadPreset = useCallback((type: string) => {
    const p = presets[type];
    if (!p) return;
    setActivePreset(type);
    setBeRevenue(p.beRevenue); setBePrice12(p.bePrice12); setBeFeeRate(p.beFeeRate);
    setBeExistingFee(p.beExistingFee); setBeCardRatio(p.beCardRatio);
    setBeConvBoost(p.beConvBoost); setBeVisitors(p.beVisitors);
    setM1(p.m1); setM3(p.m3); setM6(p.m6); setM12(p.m12);
    setPt10(p.pt10); setPt20(p.pt20); setPt30(p.pt30); setPt50(p.pt50); setPt100(p.pt100);
    setExistMembers(p.existMembers); setPrVisitors(p.prVisitors); setPrConvBoost(p.prConvBoost);
    setMarkupRate(p.markupRate); setDiscountRate(p.discountRate); setFeeRate(p.feeRate);
    setChurnRate(p.churnRate);
    setBeResults(null);
    setPrResults(null);
  }, []);

  /* ─── 손익분기점 계산 ─── */
  const calcBreakeven = useCallback(() => {
    const fr = beFeeRate / 100;
    const kr = KEEPPAY_RATE / 100;
    const totalRate = fr + kr;
    const efr = beExistingFee / 100;
    const cr = beCardRatio / 100;
    const cardRevenue = Math.round(beRevenue * cr);
    const existingFee = Math.round(cardRevenue * totalRate);
    const existingVan = Math.round(cardRevenue * efr);
    const additionalCost = existingFee - existingVan;
    const netPerNew = Math.round(bePrice12 * (1 - totalRate));
    const breakEvenCount = additionalCost <= 0 ? 0 : (netPerNew > 0 ? Math.ceil(additionalCost / netPerNew) : 999);

    const convBoostR = beConvBoost / 100;
    const baseConv = 0.20;
    const newConv = Math.min(baseConv + baseConv * convBoostR, 1.0);
    const baseReg = Math.round(beVisitors * baseConv);
    const newReg = Math.round(beVisitors * newConv);
    const extraMembers = Math.round(beVisitors * (newConv - baseConv));

    // PG 비교
    const typicalPgRate = 0.033;
    const typicalPgFee = Math.round(cardRevenue * typicalPgRate);
    const glPgFee = Math.round(cardRevenue * fr);
    const glKeepFee = Math.round(cardRevenue * kr);
    const glFee = glPgFee + glKeepFee;
    const savings = typicalPgFee - glPgFee; // PG 수수료만 비교

    // 신규 고객별 손익
    const detailPeople = [1, 2, 3, 5, 7, 10, 15, 20, 30];
    const detailRows = detailPeople.map((c) => {
      const newRev = bePrice12 * c;
      const newFee = Math.round(newRev * totalRate);
      const profitChange = (newRev - newFee) - additionalCost;
      return { count: c, newRev, newFee, additionalCost, totalCost: newFee + additionalCost, profitChange, isProfit: profitChange >= 0 };
    });

    setBeResults({
      revenue: beRevenue, additionalCost, netPerNew, breakEvenCount,
      cardRevenue, typicalPgFee, glPgFee, glKeepFee, glFee, savings, totalRate,
      baseConv, newConv, baseReg, newReg, extraMembers, visitors: beVisitors,
      detailRows, existingFeeRate: efr,
    });
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [beRevenue, bePrice12, beFeeRate, beExistingFee, beCardRatio, beConvBoost, beVisitors]);

  /* ─── 프리미엄 전략 계산 ─── */
  const calcPricing = useCallback(() => {
    const markup = markupRate / 100;
    const discount = discountRate / 100;
    const fr = feeRate / 100;
    const churn = churnRate / 100;

    const memberPrices = [
      { id: "m1", label: "1개월", value: m1 },
      { id: "m3", label: "3개월", value: m3 },
      { id: "m6", label: "6개월", value: m6 },
      { id: "m12", label: "12개월", value: m12 },
    ];
    const ptPrices = [
      { id: "pt10", label: "10회", value: pt10, count: 10 },
      { id: "pt20", label: "20회", value: pt20, count: 20 },
      { id: "pt30", label: "30회", value: pt30, count: 30 },
      { id: "pt50", label: "50회", value: pt50, count: 50 },
      { id: "pt100", label: "100회", value: pt100, count: 100 },
    ];

    const memberRows = memberPrices.filter((p) => p.value > 0).map((p) => {
      const r = calcItem(p.value, markup, discount, fr);
      const monthly = p.id === "m1" ? "-" : "월 " + fmt(Math.round(r.discounted / 12)) + "원";
      return { ...r, label: p.label, id: p.id, monthly };
    });
    const ptRows = ptPrices.filter((p) => p.value > 0).map((p) => {
      const r = calcItem(p.value, markup, discount, fr);
      return { ...r, label: p.label, id: p.id, perSession: fmt(Math.round(r.net / p.count)) + "원", count: p.count };
    });

    const m12data = memberRows.find((r) => r.id === "m12");
    const pt30data = ptRows.find((r) => r.id === "pt30");

    // 전환율
    const convBoostR = prConvBoost / 100;
    const baseConv = 0.20;
    const newConv = Math.min(baseConv + baseConv * convBoostR, 1.0);
    const baseReg = Math.round(prVisitors * baseConv);
    const newReg = Math.round(prVisitors * newConv);
    const extraMembers = Math.round(prVisitors * (newConv - baseConv));

    // 이탈률
    let churnInfo = null;
    if (churn > 0 && m12data) {
      const churnCount = Math.round(existMembers * churn);
      const monthlyNetPerMember = Math.round(m12data.net / 12);
      const churnLoss = monthlyNetPerMember * churnCount;
      churnInfo = { churnPct: churnRate, existMem: existMembers, churnCount, churnLoss };
    }

    // 시나리오
    const sc = [3, 10, 20];
    const scenarios = {
      newMember: m12data ? sc.map((c) => ({ count: c, total: m12data.net * c })) : [],
      reMember: m12data ? sc.map((c) => ({ count: c, total: (m12data.net - m12data.current) * c })) : [],
      newPT: pt30data ? sc.map((c) => ({ count: c, total: pt30data.net * c })) : [],
      rePT: pt30data ? sc.map((c) => ({ count: c, total: (pt30data.net - pt30data.current) * c })) : [],
    };

    // 멘트
    const ments = m12data ? [
      `"저희 센터 12개월 정가가 ${fmtWon(m12data.raised)}인데요, 지금 등록하시면 킵페이 안심결제 서비스를 드리면서 ${fmtWon(m12data.discounted)}에 해드리고 있어요. 무이자 12개월이면 월 ${fmtWon(Math.round(m12data.discounted / 12))}밖에 안 돼요."`,
      `"회원님, 다음 달부터 정가가 ${fmtWon(m12data.raised)}으로 조정되는데요, 지금 재등록하시면 기존 회원 특별가 ${fmtWon(m12data.discounted)}으로 해드릴 수 있어요."`,
      `"PT 걱정되시죠? 저희 센터는 킵페이 안심결제 서비스가 자동 포함이라, 만약 트레이너가 그만두거나 센터 사정이 생겨도 1회 최대 300만원까지 보상됩니다."`,
      `"네, 더 싼 곳도 있을 수 있어요. 다만 저희는 KIS페이 정식 제휴로 합법 결제, 킵페이 안심결제 서비스 자동 포함, 무이자 12개월까지 됩니다."`,
    ] : [];

    // Before/After
    const profitPct = m12data ? Math.round((m12data.net / m12data.current - 1) * 100) : 0;

    // 보험 한도 경고
    const insuranceWarnings = ptRows.filter((r) => r.count >= 50 && r.discounted > 3000000).map((r) => `PT ${r.label} 할인가 ${fmtWon(r.discounted)} — 킵페이 안심결제 서비스 한도(건당 300만원) 초과`);

    setPrResults({
      memberRows, ptRows, m12data, pt30data,
      baseConv, newConv, baseReg, newReg, extraMembers, visitors: prVisitors,
      churnInfo, scenarios, ments, profitPct, insuranceWarnings,
    });
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [m1, m3, m6, m12, pt10, pt20, pt30, pt50, pt100, markupRate, discountRate, feeRate, churnRate, existMembers, prVisitors, prConvBoost]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 바 */}
      <div className="bg-navy text-white/70 text-center text-[10px] py-1.5 font-mono tracking-wide">
        KIS정보통신 공식 파트너 &middot; 금융감독원 정식 인가
      </div>

      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto flex items-center justify-between h-12">
          <Link href="/">
            <span className="flex items-center gap-2 text-sm font-bold text-navy cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> GL ALLPAY
            </span>
          </Link>
          <span className="text-xs text-muted-foreground font-medium">매출 시뮬레이터</span>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto py-6">
        {/* 현실 직면 카드 */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}
          className="border-t-2 border-signal-red bg-card p-5 mb-6">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-signal-red">지금 이 순간에도</span>
            <h3 className="text-lg font-black text-navy mt-1">대표님 센터가 잃고 있는 돈</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "일시불 때문에 포기한 회원", value: "월 3~5명", sub: "무이자 할부가 없어서" },
              { label: "3개월만 끊는 비율", value: "67%", sub: "일시불 67.1% (소비자원)" },
              { label: "PT 고액결제 포기", value: "?만원", sub: "킵페이 안심결제 서비스가 없으니 불안해서" },
            ].map((d) => (
              <div key={d.label} className="bg-muted p-3 text-center">
                <div className="text-[10px] text-muted-foreground">{d.label}</div>
                <div className="text-lg font-bold text-signal-red font-mono mt-1">{d.value}</div>
                <div className="text-[9px] text-muted-foreground/60 mt-0.5">{d.sub}</div>
              </div>
            ))}
          </div>
          <div className="bg-navy text-white p-3 mt-4 text-center text-xs">
            아래 시뮬레이터에 센터 숫자를 넣어보세요. 정확히 얼마를 더 벌 수 있는지 보여드립니다.
          </div>
        </motion.div>

        {/* 탭 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => { setActiveTab("breakeven"); setBeResults(null); }}
            className={`p-4 border-2 text-left transition-all ${activeTab === "breakeven" ? "border-navy bg-navy/5" : "border-border bg-card"}`}
          >
            <span className={`text-[10px] font-bold font-mono tracking-wider ${activeTab === "breakeven" ? "text-navy" : "text-muted-foreground"}`}>PLAN A</span>
            <div className="text-sm font-black text-foreground mt-1">현재 가격 유지</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">가격은 그대로, 손익분기점 확인</div>
          </button>
          <button
            onClick={() => { setActiveTab("pricing"); setPrResults(null); }}
            className={`p-4 border-2 text-left transition-all ${activeTab === "pricing" ? "border-green-600 bg-green-50" : "border-border bg-card"}`}
          >
            <span className={`text-[10px] font-bold font-mono tracking-wider ${activeTab === "pricing" ? "text-green-600" : "text-muted-foreground"}`}>PLAN B</span>
            <div className="text-sm font-black text-foreground mt-1">프리미엄 전략</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">가격 인상 + 킵페이 안심결제 서비스로 수익 극대화</div>
          </button>
        </div>

        {/* 빠른 설정 프리셋 */}
        <div className="mb-6">
          <span className="text-xs text-muted-foreground font-bold block mb-2">빠른 설정</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(presets).map((k) => (
              <button
                key={k}
                onClick={() => loadPreset(k)}
                className={`px-3 py-1.5 text-xs font-bold border transition-all ${activePreset === k ? "border-navy bg-navy/5 text-navy" : "border-border bg-card text-foreground hover:border-navy/30"}`}
              >
                {presetEmojis[k]} {presetNames[k]}
              </button>
            ))}
          </div>
          {activePreset && <div className="text-xs text-navy font-bold mt-2 font-mono">현재: {presetNames[activePreset]}</div>}
        </div>

        {/* ═══ TAB 1: 손익분기점 ═══ */}
        {activeTab === "breakeven" && (
          <div>
            <div className="bg-card border border-border p-5 mb-4">
              <h3 className="text-sm font-bold text-navy mb-4 pb-3 border-b border-border">센터 현황</h3>
              <InputField label="월 매출" value={beRevenue} onChange={setBeRevenue} suffix="원" />
              <InputField label="12개월 회원권 가격" value={bePrice12} onChange={setBePrice12} suffix="원" />
              <InputField label="GL ALLPAY PG 수수료" value={beFeeRate} onChange={setBeFeeRate} suffix="%" min={0} max={15} step={0.1} />
              <div className="bg-navy/5 border border-navy/20 p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">킵페이 안심결제 서비스</span>
                  <span className="font-mono text-lg font-black text-navy">{KEEPPAY_RATE}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1">고정값 · 회원에게 제공되는 안심 보상 비용 (센터 수익 아님)</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-navy font-bold">
                  <span>PG {beFeeRate}% + 킵페이 {KEEPPAY_RATE}% =</span>
                  <span className="font-mono text-sm">합산 {(beFeeRate + KEEPPAY_RATE).toFixed(1)}%</span>
                </div>
              </div>
              <InputField label="현재 결제 수수료 (VAN/카드)" value={beExistingFee} onChange={setBeExistingFee} suffix="%" min={0} max={10} step={0.1} hint="현재 VAN 카드 수수료 (PG 미사용 시 보통 1.5~2.2%)" />
              <InputField label="월 평균 방문 고객" value={beVisitors} onChange={setBeVisitors} suffix="명" max={1000} />
              <InputField label="카드 결제 비율" value={beCardRatio} onChange={setBeCardRatio} suffix="%" max={100} />
              <InputField label="전환율 증가 예상" value={beConvBoost} onChange={setBeConvBoost} suffix="%" max={100} step={5} />
            </div>

            <button onClick={calcBreakeven} className="w-full bg-navy text-white py-3.5 font-bold text-sm hover:bg-navy-light transition-colors mb-6">
              분석 시작
            </button>

            {!beResults && (
              <div className="bg-card border border-dashed border-border p-8 text-center">
                <h3 className="text-base font-bold text-foreground mb-1">센터 가격을 입력하고 분석을 시작해 보세요</h3>
                <p className="text-xs text-muted-foreground">기본값은 예시입니다</p>
              </div>
            )}

            {beResults && (
              <div ref={resultsRef}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <SummaryCard label="현재 월 매출" value={fmtWon(beResults.revenue)} />
                  <SummaryCard label="추가 비용" value={fmtWon(beResults.additionalCost)} />
                  <SummaryCard label="신규 1명 순수익" value={fmtWon(beResults.netPerNew)} />
                  <SummaryCard label="손익분기점" value={beResults.breakEvenCount >= 999 ? "산출불가" : beResults.breakEvenCount === 0 ? "즉시 흑자" : beResults.breakEvenCount + "명"} />
                </div>

                {/* PG 비교 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <SummaryCard label="기존 PG사 (3.3%) 월 수수료" value={fmtWon(beResults.typicalPgFee)} accent="border-l-signal-red" sub={`카드 매출 ${fmtWon(beResults.cardRevenue)} 기준`} />
                  <SummaryCard label={`GL ALLPAY (PG ${beFeeRate}% + 킵페이 ${KEEPPAY_RATE}%)`} value={fmtWon(beResults.glFee)} accent="border-l-navy" sub={`PG ${fmtWon(beResults.glPgFee)} + 킵페이 ${fmtWon(beResults.glKeepFee)}`} />
                  <div className="bg-navy text-white p-5">
                    <div className="text-[10px] text-white/50 mb-2">{beResults.savings >= 0 ? "월 절감액" : "월 추가 비용"}</div>
                    <div className={`font-mono text-xl font-bold ${beResults.savings >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {beResults.savings >= 0 ? "-" : "+"}{fmtWon(Math.abs(beResults.savings))}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">연간 {fmtWon(Math.abs(beResults.savings * 12))} {beResults.savings >= 0 ? "절감" : "추가"}</div>
                  </div>
                </div>

                {/* 신규 고객 수별 손익분석 */}
                <div className="bg-card border border-border p-5 mb-4">
                  <h3 className="text-sm font-bold text-navy mb-1">신규 고객 수별 손익분석</h3>
                  <p className="text-[10px] text-muted-foreground mb-4">가격 변동 없이, 신규 유입만으로 발생하는 순이익</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-2.5 font-semibold text-muted-foreground">신규</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">신규 매출</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">이용료</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">순이익</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">판단</th>
                        </tr>
                      </thead>
                      <tbody>
                        {beResults.detailRows.map((r: any) => (
                          <tr key={r.count} className={`border-b border-border ${r.count === beResults.breakEvenCount ? "bg-navy/5" : ""}`}>
                            <td className="p-2.5 font-medium">{r.count}명</td>
                            <td className="p-2.5 text-center">{fmtWon(r.newRev)}</td>
                            <td className="p-2.5 text-center text-signal-red">-{fmtWon(r.totalCost)}</td>
                            <td className={`p-2.5 text-center font-bold ${r.isProfit ? "text-navy" : "text-signal-red"}`}>
                              {r.profitChange >= 0 ? "+" : ""}{fmtWon(r.profitChange)}
                            </td>
                            <td className="p-2.5 text-center">{r.profitChange > 0 ? "흑자" : r.profitChange === 0 ? "분기" : "적자"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 전환율 시뮬레이션 */}
                <div className="bg-card border border-border p-5 mb-4">
                  <h3 className="text-sm font-bold text-navy mb-1">킵페이 안심결제 서비스 효과 — 전환율 시뮬레이션</h3>
                  <p className="text-[10px] text-muted-foreground mb-4">월 방문 {beResults.visitors}명 기준, 킵페이 안심결제 서비스 도입 시 예상 변화</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-muted p-3 text-center">
                      <div className="text-[10px] text-muted-foreground mb-1">킵페이 안심결제 없음 (전환율 {(beResults.baseConv * 100).toFixed(0)}%)</div>
                      <div className="text-sm font-bold text-signal-red">{beResults.visitors}명 → {beResults.baseReg}명</div>
                    </div>
                    <div className="bg-navy/5 border border-navy/20 p-3 text-center">
                      <div className="text-[10px] text-navy mb-1">킵페이 안심결제 서비스 포함 (전환율 {(beResults.newConv * 100).toFixed(0)}%)</div>
                      <div className="text-sm font-bold text-navy">{beResults.visitors}명 → {beResults.newReg}명</div>
                    </div>
                  </div>
                  <div className="bg-navy text-white p-3 text-center">
                    <span className="text-lg font-bold">월 +{beResults.extraMembers}명</span>
                    <span className="text-xs text-white/50 ml-2">추가 등록 (매출 +{fmtWon(beResults.extraMembers * bePrice12)})</span>
                  </div>
                </div>

                <div className="bg-navy/5 border-l-2 border-navy p-4 text-xs text-foreground leading-relaxed mb-6">
                  <strong>핵심 인사이트:</strong> 가격을 올리지 않아도, 킵페이 안심결제 서비스 + 무이자의 장점으로 신규 고객이 자연스럽게 늘어납니다. 가격을 올리려면 '프리미엄 전략' 탭을 확인하세요.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 2: 프리미엄 전략 ═══ */}
        {activeTab === "pricing" && (
          <div>
            <div className="bg-card border border-border p-5 mb-4">
              <h3 className="text-sm font-bold text-navy mb-4 pb-3 border-b border-border">회원권 가격</h3>
              <InputField label="1개월" value={m1} onChange={setM1} suffix="원" />
              <InputField label="3개월" value={m3} onChange={setM3} suffix="원" />
              <InputField label="6개월" value={m6} onChange={setM6} suffix="원" />
              <InputField label="12개월" value={m12} onChange={(v) => { setM12(v); setBePrice12(v); }} suffix="원" />
            </div>

            <div className="bg-card border border-border p-5 mb-4">
              <h3 className="text-sm font-bold text-navy mb-4 pb-3 border-b border-border">PT 가격</h3>
              <InputField label="10회" value={pt10} onChange={setPt10} suffix="원" />
              <InputField label="20회" value={pt20} onChange={setPt20} suffix="원" />
              <InputField label="30회" value={pt30} onChange={setPt30} suffix="원" />
              <InputField label="50회" value={pt50} onChange={setPt50} suffix="원" />
              <InputField label="100회" value={pt100} onChange={setPt100} suffix="원" />
            </div>

            <div className="bg-card border border-border p-5 mb-4">
              <h3 className="text-sm font-bold text-navy mb-4 pb-3 border-b border-border">설정</h3>
              <InputField label="인상율" value={markupRate} onChange={setMarkupRate} suffix="%" max={100} />
              <InputField label="할인율 (고객 체감)" value={discountRate} onChange={setDiscountRate} suffix="%" max={50} />
              <InputField label="PG 수수료" value={feeRate} onChange={setFeeRate} suffix="%" max={15} step={0.1} />
              <div className="bg-green-50 border border-green-200 p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-green-700">킵페이 안심결제 서비스</span>
                  <span className="font-mono text-lg font-black text-green-700">{KEEPPAY_RATE}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1">고정값 · 회원에게 제공되는 안심 보상 비용 (센터 수익 아님)</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-green-700 font-bold">
                  <span>PG {feeRate}% + 킵페이 {KEEPPAY_RATE}% =</span>
                  <span className="font-mono text-sm">합산 {(feeRate + KEEPPAY_RATE).toFixed(1)}%</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">예상 이탈률</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={30} value={churnRate} onChange={(e) => setChurnRate(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-border rounded appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-navy [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow" />
                  <span className="text-sm font-bold font-mono text-navy w-10 text-right">{churnRate}%</span>
                </div>
              </div>
              <InputField label="기존 회원 수" value={existMembers} onChange={setExistMembers} suffix="명" max={5000} />
              <InputField label="월 평균 방문 고객" value={prVisitors} onChange={setPrVisitors} suffix="명" max={1000} />
              <InputField label="전환율 증가 예상" value={prConvBoost} onChange={setPrConvBoost} suffix="%" max={100} step={5} />
            </div>

            <button onClick={calcPricing} className="w-full bg-green-600 text-white py-3.5 font-bold text-sm hover:bg-green-700 transition-colors mb-6">
              프리미엄 전략 분석
            </button>

            {!prResults && (
              <div className="bg-card border border-dashed border-border p-8 text-center">
                <h3 className="text-base font-bold text-foreground mb-1">가격을 입력하고 분석을 시작해 보세요</h3>
                <p className="text-xs text-muted-foreground">기본값은 예시입니다</p>
              </div>
            )}

            {prResults && (
              <div ref={resultsRef}>
                {/* 요약 카드 */}
                {prResults.m12data && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <SummaryCard label="12개월 순수령액" value={fmtWon(prResults.m12data.net)} sub={`기존 ${fmtWon(prResults.m12data.current)} → +${fmtWon(prResults.m12data.net - prResults.m12data.current)}`} />
                    <SummaryCard label="고객 할인가" value={fmtWon(prResults.m12data.discounted)} sub={`정가 ${fmtWon(prResults.m12data.raised)}에서 ${fmtWon(prResults.m12data.raised - prResults.m12data.discounted)} 할인`} />
                    <SummaryCard label="고객 월 부담" value={`월 ${fmtWon(Math.round(prResults.m12data.discounted / 12))}`} />
                    <SummaryCard label="순이익 증가" value={`+${prResults.profitPct}%`} />
                  </div>
                )}

                {/* 이탈률 경고 */}
                {prResults.churnInfo && (
                  <div className="bg-yellow-50 border-l-2 border-yellow-500 p-4 text-xs text-yellow-800 mb-4">
                    <strong>이탈률 {prResults.churnInfo.churnPct}% 반영:</strong> 기존 회원 {prResults.churnInfo.existMem}명 중 약 {prResults.churnInfo.churnCount}명 이탈 시, 월 <strong>{fmtWon(prResults.churnInfo.churnLoss)}</strong>의 매출 감소 예상 (연간 약 {fmtWon(prResults.churnInfo.churnLoss * 12)})
                  </div>
                )}

                {/* 회원권 가격 설계 */}
                <div className="bg-card border border-border p-5 mb-4">
                  <h3 className="text-sm font-bold text-navy mb-1">회원권 가격 설계</h3>
                  <p className="text-[10px] text-muted-foreground mb-4">인상 정가 → 할인가 제시 → 이용료 차감 후 순수령액</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-2.5 font-semibold text-muted-foreground">기간</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">현재가</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">인상 정가</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">할인가</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">이용료</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">순수령액</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">월 할부</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prResults.memberRows.map((r: any) => (
                          <tr key={r.id} className={`border-b border-border ${r.id === "m12" ? "bg-navy/5" : ""}`}>
                            <td className="p-2.5 font-medium">{r.label}</td>
                            <td className="p-2.5 text-center">{fmt(r.current)}원</td>
                            <td className="p-2.5 text-center text-green-600">{fmt(r.raised)}원</td>
                            <td className="p-2.5 text-center font-bold">{fmt(r.discounted)}원</td>
                            <td className="p-2.5 text-center text-signal-red">-{fmt(r.fee)}원</td>
                            <td className="p-2.5 text-center font-bold text-navy">{fmt(r.net)}원</td>
                            <td className="p-2.5 text-center">{r.monthly}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Before/After */}
                {prResults.m12data && (
                  <div className="border-t-2 border-green-600 bg-card border border-border p-5 mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-muted p-4 text-center">
                        <div className="text-[10px] text-muted-foreground mb-1">BEFORE</div>
                        <div className="font-mono text-xl font-bold text-signal-red">{fmtWon(prResults.m12data.current)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">12개월 수령액</div>
                      </div>
                      <div className="bg-green-50 border-2 border-green-500 p-4 text-center">
                        <div className="text-[10px] text-green-600 font-bold mb-1">AFTER</div>
                        <div className="font-mono text-xl font-bold text-green-600">{fmtWon(prResults.m12data.net)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">12개월 순수령액</div>
                      </div>
                    </div>
                    <div className="bg-navy text-center p-3">
                      <span className="font-mono text-2xl font-bold text-green-400">+{prResults.profitPct}%</span>
                      <span className="text-xs text-white/50 ml-2">순이익 증가</span>
                    </div>
                  </div>
                )}

                {/* PT 가격 설계 */}
                <div className="bg-card border border-border p-5 mb-4">
                  <h3 className="text-sm font-bold text-navy mb-1">PT 가격 설계</h3>
                  <p className="text-[10px] text-muted-foreground mb-4">킵페이 안심결제 서비스로 고객 불안 해소 → 고액 PT 전환율 상승</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-2.5 font-semibold text-muted-foreground">회차</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">현재가</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">인상 정가</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">할인가</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">이용료</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">순수령액</th>
                          <th className="text-center p-2.5 font-semibold text-muted-foreground">회당 단가</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prResults.ptRows.map((r: any) => (
                          <tr key={r.id} className="border-b border-border">
                            <td className="p-2.5 font-medium">{r.label}</td>
                            <td className="p-2.5 text-center">{fmt(r.current)}원</td>
                            <td className="p-2.5 text-center text-green-600">{fmt(r.raised)}원</td>
                            <td className="p-2.5 text-center font-bold">{fmt(r.discounted)}원</td>
                            <td className="p-2.5 text-center text-signal-red">-{fmt(r.fee)}원</td>
                            <td className="p-2.5 text-center font-bold text-navy">{fmt(r.net)}원</td>
                            <td className="p-2.5 text-center">{r.perSession}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 보험 한도 경고 */}
                {prResults.insuranceWarnings.length > 0 && prResults.insuranceWarnings.map((w: string, i: number) => (
                  <div key={i} className="bg-yellow-50 border-l-2 border-yellow-500 p-4 text-xs text-yellow-800 mb-3">
                    <strong>⚠️ {w}</strong> — 초과분은 보상 미적용 구간이므로, 고객에게 분할 결제를 안내하세요.
                  </div>
                ))}

                {/* 전환율 */}
                {prResults.m12data && (
                  <div className="bg-card border border-border p-5 mb-4">
                    <h3 className="text-sm font-bold text-navy mb-1">킵페이 안심결제 서비스가 만드는 전환율 차이</h3>
                    <p className="text-[10px] text-muted-foreground mb-4">같은 {prResults.visitors}명이 방문해도, 킵페이 안심결제 서비스가 있으면 등록하는 사람이 달라집니다</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-muted p-3 text-center">
                        <div className="text-[10px] text-muted-foreground mb-1">킵페이 안심결제 서비스 없음 (전환율 {(prResults.baseConv * 100).toFixed(0)}%)</div>
                        <div className="text-sm font-bold text-signal-red">{prResults.visitors}명 → {prResults.baseReg}명</div>
                      </div>
                      <div className="bg-navy/5 border border-navy/20 p-3 text-center">
                        <div className="text-[10px] text-navy mb-1">킵페이 안심결제 서비스 포함 (전환율 {(prResults.newConv * 100).toFixed(0)}%)</div>
                        <div className="text-sm font-bold text-navy">{prResults.visitors}명 → {prResults.newReg}명</div>
                      </div>
                    </div>
                    <div className="bg-navy text-white p-3 text-center">
                      <span className="text-lg font-bold">월 +{prResults.extraMembers}명</span>
                      <span className="text-xs text-white/50 ml-2">추가 등록 (매출 +{fmtWon(prResults.extraMembers * prResults.m12data.current)})</span>
                    </div>
                  </div>
                )}

                {/* 시나리오 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-card border border-border overflow-hidden">
                    <div className="bg-green-600 text-white text-xs font-bold p-3">신규 고객 12개월 회원권</div>
                    <div className="p-4">
                      {prResults.scenarios.newMember.map((s: any) => (
                        <div key={s.count} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <span className="text-xs text-muted-foreground">신규 {s.count}명</span>
                          <span className="font-mono text-sm font-bold text-navy">{fmtWon(s.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border overflow-hidden">
                    <div className="bg-signal-red text-white text-xs font-bold p-3">기존 고객 재결제</div>
                    <div className="p-4">
                      {prResults.scenarios.reMember.map((s: any) => (
                        <div key={s.count} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <span className="text-xs text-muted-foreground">재결제 {s.count}명</span>
                          <span className="font-mono text-sm font-bold text-navy">{fmtWon(s.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {prResults.pt30data && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-card border border-border overflow-hidden">
                      <div className="bg-green-600 text-white text-xs font-bold p-3">신규 PT 고객</div>
                      <div className="p-4">
                        {prResults.scenarios.newPT.map((s: any) => (
                          <div key={s.count} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                            <span className="text-xs text-muted-foreground">신규 {s.count}명</span>
                            <span className="font-mono text-sm font-bold text-navy">{fmtWon(s.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-card border border-border overflow-hidden">
                      <div className="bg-signal-red text-white text-xs font-bold p-3">기존 PT 재결제</div>
                      <div className="p-4">
                        {prResults.scenarios.rePT.map((s: any) => (
                          <div key={s.count} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                            <span className="text-xs text-muted-foreground">재결제 {s.count}명</span>
                            <span className="font-mono text-sm font-bold text-navy">{fmtWon(s.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 현장 데스크 멘트 */}
                {prResults.ments.length > 0 && (
                  <div className="bg-card border border-border p-5 mb-4">
                    <h3 className="text-sm font-bold text-navy mb-1">현장 데스크 멘트</h3>
                    <p className="text-[10px] text-muted-foreground mb-4">상황별로 바로 쓸 수 있는 세일즈 스크립트</p>
                    {["신규 회원 첫 방문 상담", "기존 회원 재등록", "PT 상담 — 고액 결제 망설이는 회원", "다른 센터와의 가격 비교"].map((sit, i) => (
                      <div key={sit} className="mb-3 last:mb-0">
                        <span className="text-[10px] font-bold text-navy">{sit}</span>
                        <div className="bg-muted p-3 mt-1 text-xs text-foreground leading-relaxed italic">{prResults.ments[i]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="bg-navy text-white p-6 text-center mt-6 mb-6">
          <span className="text-[10px] text-white/40 font-mono block mb-2">도입 절차</span>
          <h3 className="text-lg font-black mb-2">전화 한 통이면 끝납니다</h3>
          <p className="text-xs text-white/50 mb-4">기존 PG 해지, 단말기 설치, 정산 연동 — 전부 저희가 합니다.</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {["가입비 0원", "위약금 없음", "1~3일 설치", "리스크 0"].map((t) => (
              <span key={t} className="bg-white/10 text-white/80 px-3 py-1 text-[10px] font-bold">{t}</span>
            ))}
          </div>
          <Link href="/proposal/franchise">
            <span className="inline-block bg-white text-navy px-6 py-2.5 font-bold text-sm cursor-pointer hover:bg-white/90 transition-colors">도입 상담 신청</span>
          </Link>
        </div>

        {/* 법제화 배너 */}
        <div className="bg-navy text-white p-5 text-center mb-6">
          <p className="text-[10px] text-white/30 mb-1">알고 계셨나요?</p>
          <p className="text-sm font-bold mb-2">체육시설 킵페이 안심결제 서비스, 곷 <span className="text-signal-red">의무</span>가 됩니다</p>
          <p className="text-[10px] text-white/50 leading-relaxed mb-2">
            이재명 대통령 '먹튀방지법' 공약 + 여야 모두 체육시설법 개정안 발의 완료.
            <br />GL ALLPAY는 킵페이 안심결제 서비스가 이미 포함되어 있어, 법 시행 시 추가 조치가 필요 없습니다.
          </p>
          <p className="text-xs text-signal-red font-bold">어차피 해야 할 일, 지금 하면 오히려 선점 효과</p>
        </div>

        {/* 푸터 */}
        <div className="text-center text-[10px] text-muted-foreground py-6">
          GL ALLPAY × KEEPPAY 제휴 | 본 시뮬레이션은 참고용이며 실제 수치와 다를 수 있습니다
          <p className="mt-2 text-muted-foreground/50">Powered by KIS정보통신</p>
        </div>
      </div>

      {/* 스크롤 탑 */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-11 h-11 bg-navy text-white rounded-full shadow-lg flex items-center justify-center hover:bg-navy-light transition-colors z-50"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
