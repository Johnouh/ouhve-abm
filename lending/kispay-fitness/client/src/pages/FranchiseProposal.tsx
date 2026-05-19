/**
 * 가맹점용 제안서 — GL allpay × KipPay
 * 4페이지: 망설임 이유 → 법 변경/PG 리스크 → 매출 상승 → 도입 혜택
 */
import { motion, type Easing } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, TrendingUp, AlertTriangle, Shield, CreditCard,
  ChevronDown, Calendar, Award, MapPin, Sticker, FileText
} from "lucide-react";
import { useState } from "react";

const ease: Easing = [0.25, 0.1, 0.25, 1];
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

export default function FranchiseProposal() {
  const [currentPage, setCurrentPage] = useState(1);

  const scrollTo = (p: number) => {
    setCurrentPage(p);
    document.getElementById(`fp-${p}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* 고정 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/proposal">
            <span className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> 돌아가기
            </span>
          </Link>
          <span className="text-xs text-white/30 font-mono">센터 대표님께 드리는 제안</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                onClick={() => scrollTo(p)}
                className={`w-6 h-6 rounded text-[10px] font-mono transition-colors ${
                  currentPage === p ? "bg-yellow-500 text-navy" : "bg-white/10 text-white/40 hover:bg-white/20"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-14">
        {/* ===== PAGE 1: 회원이 장기권·PT를 망설이는 이유 ===== */}
        <section id="fp-1" className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-2xl">
            <motion.div variants={fadeIn} className="inline-block bg-yellow-500/20 text-yellow-400 text-xs px-4 py-1.5 rounded-full mb-8">
              센터 대표님께 드리는 제안
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl font-black leading-tight mb-6">
              회원이
              <br /><span className="text-yellow-400">장기권·PT</span>를
              <br />망설이는 이유가 있습니다
            </motion.h1>
            <motion.p variants={fadeIn} className="text-sm text-white/50 mb-4 leading-relaxed">
              소비자는 이미 알고 있습니다.
              <br />뉴스에 나온 헬스장 폐업 사례를.
              <br />그 불안이 <strong className="text-white/80">센터의 매출을 막고 있습니다.</strong>
            </motion.p>

            {/* 3개 문제 카드 */}
            <motion.div variants={fadeIn} className="grid grid-cols-3 gap-3 mt-10 mb-10">
              {[
                { icon: <TrendingUp className="w-6 h-6 text-yellow-400" />, title: "고액 회원권\n계약률 하락", desc: "3개월짜리만 끊으려는\n회원이 늘고 있다" },
                { icon: <CreditCard className="w-6 h-6 text-yellow-400" />, title: "무이자 할부\n한계 3~6개월", desc: "100만원 PT권이\n부담스러운 이유" },
                { icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />, title: "현재 PG사\n리스크 모름", desc: "법 바뀌면 센터에\n직접 피해가 온다" },
              ].map((card, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">{card.icon}</div>
                  <h3 className="text-xs font-bold whitespace-pre-line mb-1">{card.title}</h3>
                  <p className="text-[10px] text-white/40 whitespace-pre-line">{card.desc}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeIn}>
              <button
                onClick={() => scrollTo(2)}
                className="inline-flex items-center gap-2 bg-yellow-500 text-navy px-6 py-3 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors"
              >
                <ChevronDown className="w-4 h-4" /> 3가지 해결책 보기
              </button>
            </motion.div>
          </motion.div>
          <div className="absolute bottom-8 text-white/20 text-xs font-mono">01 / 04</div>
        </section>

        {/* ===== PAGE 2: 법이 바뀝니다 + 2·3차 PG 리스크 ===== */}
        <section id="fp-2" className="px-4 py-20 bg-[#f8f7f3]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-block bg-red-500/10 text-red-600 text-xs px-4 py-1.5 rounded-full mb-6">
              지금 당장 알아야 할 사실 — 공식 정부 발표
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-black text-navy leading-tight mb-2">
              법이 바뀝니다.
            </motion.h2>
            <motion.h2 variants={fadeIn} className="text-xl md:text-2xl font-black text-red-500 leading-tight mb-6">
              준비 안 한 센터는 과태료 1억
            </motion.h2>
            <motion.p variants={fadeIn} className="text-sm text-navy/50 mb-8">
              공정거래위원회 · 문화체육관광부 공식 발표. 이미 시작됐습니다.
            </motion.p>

            {/* 공정위 발표 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-navy">공정거래위원회 공식발표</span>
              </div>
              <p className="text-[10px] text-navy/40 mb-4">2025년 8월 28일 행정예고</p>
              <p className="text-xs font-bold text-navy mb-3">헬스장·요가·필라테스 사업자 의무사항</p>
              <div className="space-y-2">
                {[
                  "킵페이 안심결제 서비스 가입 여부 — 광고·계약서에 반드시 표시",
                  "보장기관명 · 보장기간 · 보장금액 명시 의무",
                  "선불결제 이용요금 총액 · 환급기준 사전 공개",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded shrink-0 mt-0.5">필수</span>
                    <p className="text-xs text-navy/70">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-red-50 rounded p-3">
                <p className="text-xs text-red-600 font-bold">미표시 시 즉시 부과 — 과태료 최대 1억원</p>
                <p className="text-[10px] text-red-400">표시·광고의 공정화에 관한 법률 위반</p>
              </div>
            </motion.div>

            {/* 국회 발의 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
              <p className="text-xs font-bold text-navy mb-1">국회 발의 · 진행중</p>
              <p className="text-[10px] text-navy/40 mb-3">윤후덕의원 등 10인 · 의안번호 제2207244호 (2025.1.6)</p>
              <p className="text-xs font-bold text-navy mb-2">체육시설의 설치·이용에 관한 법률 일부개정법률안</p>
              <div className="space-y-1.5 text-xs text-navy/60">
                <p>▶ 체육시설업자 <strong>킵페이 안심결제 서비스 가입 의무화</strong> — 법률로 강제</p>
                <p>▶ 미가입 사업자 → <strong>시정명령 + 과태료</strong> 동시 부과</p>
                <p>▶ 문화체육관광위원회 검토 완료 → 입법 절차 진행 중</p>
              </div>
            </motion.div>

            {/* 킵페이 vs 2·3차 PG */}
            <motion.div variants={fadeIn} className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg border border-green-200 p-5">
                <p className="text-xs font-bold text-green-700 mb-2">킵페이 = 법 인정 수단</p>
                <p className="text-[10px] text-navy/50 leading-relaxed">
                  공정위 고시 명시 "킵페이 안심결제 서비스 또는 이에 상응하는 피해보상수단"
                  → 킵페이 안심결제 = <strong>법적 의무 즉시 충족</strong>
                </p>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-200 p-5">
                <p className="text-xs font-bold text-red-600 mb-2">2·3차 PG사 구조</p>
                <div className="text-[10px] text-navy/50 text-center space-y-0.5">
                  <p>카드사(원천)</p>
                  <p className="text-red-400">↓</p>
                  <p>2차 PG사</p>
                  <p className="text-red-400">↓</p>
                  <p>3차 PG</p>
                  <p className="text-red-400">↓</p>
                  <p className="font-bold text-red-600">우리 센터</p>
                </div>
              </div>
            </motion.div>

            {/* 4단계 붕괴 구조 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
              <p className="text-sm font-bold text-navy mb-1 text-center">왜 2·3차 PG사는 규제 강화 시 결국 무너지나</p>
              <p className="text-[10px] text-navy/40 mb-4 text-center">— 초보자도 이해할 수 있는 4단계 붕괴 구조 —</p>
              <div className="space-y-4">
                {[
                  { step: 1, title: "사고 책임은 무조건 2·3차 PG가 진다", desc: "헬스장이 폐업해 회원 피해가 생기면, 원천 카드사는 계약상 2·3차 PG에 전액 책임을 전가합니다. 이미 폐업한 센터에서 돈을 받을 방법이 없습니다." },
                  { step: 2, title: "킵페이 안심결제 서비스 의무화 → 2·3차의 부담만 커진다", desc: "보상 한도는 매우 작은데 — 피해 규모가 한도를 초과하면 초과분 전액은 PG사 자체 자금으로 메워야 합니다. → 재무 구조가 빠르게 무너짐" },
                  { step: 3, title: "민원 급증 → 원천사가 정산 중지 또는 계약 강제 취소", desc: "① 2·3차 PG → 정산 못 받음 → 현금 흐름 끊김 → 부도·도산\n② 센터 → 결제 시스템 연동 갑자기 중단 → 영업 마비" },
                  { step: 4, title: "피해는 결국 우리 센터와 회원에게 돌아온다", desc: "2·3차 PG가 도산하면 미정산 대금은 센터가 손실 처리해야 합니다. 회원 환불도 막히고, 결제 수단도 사라집니다." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy mb-1">{item.title}</h4>
                      <p className="text-[10px] text-navy/50 whitespace-pre-line leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 붕괴 연쇄 흐름 */}
            <motion.div variants={fadeIn} className="bg-red-50 rounded-lg border border-red-200 p-4 mb-6">
              <p className="text-xs font-bold text-red-600 mb-3 text-center">붕괴 연쇄 흐름 (한눈에)</p>
              <div className="flex items-center justify-center gap-1 flex-wrap text-center">
                {[
                  "헬스장 폐업\n회원 피해",
                  "카드사→\n2·3차에 책임",
                  "구상권 청구\n회수 불가",
                  "민원 급증\n정산 중지",
                  "2·3차 PG\n부도·도산"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="bg-white px-2 py-1.5 rounded text-[9px] text-navy/70 whitespace-pre-line leading-tight">{text}</span>
                    {i < 4 && <span className="text-red-400 text-xs">→</span>}
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-red-400 text-center mt-2">※ 규제 강화 한 번으로 이 모든 과정이 동시 진행될 수 있습니다</p>
            </motion.div>

            {/* 원천결제사 직접 입점 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
              <p className="text-sm font-bold text-navy mb-3">그렇다면 왜 원천결제사에 직접 입점하면 안전한가?</p>
              <p className="text-[10px] text-navy/40 italic mb-4">— 사실 원천결제사는 헬스장을 직접 받지 않습니다 —</p>
              <div className="space-y-3">
                <div className="bg-red-50 rounded p-3">
                  <p className="text-xs font-bold text-red-600 mb-1">원천결제사(카드사)는 헬스장 직접 입점을 거부합니다</p>
                  <p className="text-[10px] text-navy/50">카드사·PG 원천사는 헬스장·필라테스·요가 같은 체육시설을 입점 기피 업종으로 분류합니다.</p>
                </div>
                <div className="bg-yellow-50 rounded p-3">
                  <p className="text-xs font-bold text-yellow-700 mb-1">2·3차 PG도 헬스장을 꺼리지만, 해주는 곳은 이유가 있습니다</p>
                  <p className="text-[10px] text-navy/50">리스크를 알면서도 입점시키는 구조 → 문제 발생 시 고스란히 우리 센터에 전가</p>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">GL Allpay가 유일한 이유</p>
                  <p className="text-[10px] text-navy/50">원천사가 직접 받지 않는 헬스장을, 킵페이 보증 구조와 결합하여 원천결제사 수준의 안전성으로 입점시킵니다.</p>
                  <p className="text-[10px] text-green-600 font-bold mt-1">원천결제사 — GL Allpay — 우리 센터 단 3단계</p>
                </div>
              </div>
            </motion.div>

            {/* 시행 타임라인 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
              <p className="text-xs font-bold text-navy mb-4 text-center">시행 타임라인</p>
              <div className="flex items-center justify-center gap-1 flex-wrap text-center">
                {[
                  { date: "2025.8.29", label: "행정예고\n시작" },
                  { date: "2025.9.18", label: "의견수렴\n마감" },
                  { date: "시행 후", label: "계도기간\n운영" },
                  { date: "계도 종료", label: "과태료\n1억 부과" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="bg-navy/5 px-3 py-2 rounded">
                      <p className="text-[9px] font-bold text-navy">{item.date}</p>
                      <p className="text-[8px] text-navy/40 whitespace-pre-line">{item.label}</p>
                    </div>
                    {i < 3 && <span className="text-navy/20 text-xs">→</span>}
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-green-600 text-center mt-3">※ 계도기간 중 킵페이 가입 완료 시 과태료 리스크 완전 해소</p>
            </motion.div>

            <p className="text-navy/20 text-xs font-mono text-center">02 / 04</p>
          </motion.div>
        </section>

        {/* ===== PAGE 3: 매출이 오르는 이유 ===== */}
        <section id="fp-3" className="px-4 py-20 bg-[#fffde6]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-block bg-yellow-500/10 text-yellow-600 text-xs px-4 py-1.5 rounded-full mb-6">
              매출이 오르는 이유
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-black text-navy leading-tight mb-2">
              무이자 24개월이
            </motion.h2>
            <motion.h2 variants={fadeIn} className="text-xl md:text-2xl font-black text-yellow-500 leading-tight mb-6">
              고액권 계약률을 올립니다
            </motion.h2>
            <motion.p variants={fadeIn} className="text-sm text-navy/50 mb-8">
              고객이 망설이는 이유는 단 하나 — "한 번에 내기 부담스럽다"
            </motion.p>

            {/* 비교 테이블 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 overflow-hidden mb-8">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-navy/5">
                    <th className="text-left p-3 text-navy/60 font-medium">항목</th>
                    <th className="text-center p-3 text-navy/60 font-medium">기존 결제사</th>
                    <th className="text-center p-3 text-green-600 font-bold">GL allpay</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["기본 무이자", "3~6개월", "3~6개월"],
                    ["장기 무이자", "불가", "최대 24개월"],
                    ["분담 이자율", "전액 고객 부담", "약 5% 분담"],
                    ["폐업 보장", "없음", "KipPay 보장"],
                    ["문화공제", "제한적", "전액 지원"],
                    ["마케팅 효과", "없음", "킵페이 안심결제 홍보"],
                  ].map(([item, old, gl], i) => (
                    <tr key={i} className="border-t border-navy/5">
                      <td className="p-3 text-navy/70 font-medium">{item}</td>
                      <td className="p-3 text-center text-navy/40">{old}</td>
                      <td className="p-3 text-center text-green-600 font-bold">{gl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* 4개 수치 카드 */}
            <motion.div variants={fadeIn} className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: <Calendar className="w-5 h-5 text-yellow-500" />, title: "100만원 PT권 월 납부액", big: "월 4.2만원", sub: "24개월 무이자 시" },
                { icon: <TrendingUp className="w-5 h-5 text-green-500" />, title: "고액권 계약 전환율", big: "최대 3배↑", sub: "망설임 제거 효과" },
                { icon: <CreditCard className="w-5 h-5 text-blue-500" />, title: "회원 1인당 객단가", big: "2~3배↑", sub: "장기·고가권 유도" },
                { icon: <Shield className="w-5 h-5 text-green-500" />, title: "킵페이 안심결제 가입비", big: "센터 부담 無", sub: "회원이 선택 가입" },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-lg border border-navy/10 p-5 text-center">
                  <div className="flex justify-center mb-2">{card.icon}</div>
                  <p className="text-[10px] text-navy/40 mb-1">{card.title}</p>
                  <p className="text-xl font-black text-navy">{card.big}</p>
                  <p className="text-[10px] text-navy/30 mt-1">{card.sub}</p>
                </div>
              ))}
            </motion.div>

            {/* 핵심 포인트 */}
            <motion.div variants={fadeIn} className="bg-green-50 rounded-lg border border-green-200 p-4 mb-6">
              <p className="text-xs text-green-700 leading-relaxed">
                <strong>핵심 포인트:</strong> 킵페이 안심결제 회원권은 기존 일반 회원권과 병행 운영합니다.
                <br />일반권 → 기존 결제 그대로 / 장기·고가권 → GL allpay + 킵페이 안심결제 선택
              </p>
            </motion.div>

            {/* 환불 계산법 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-5 mb-6">
              <p className="text-xs font-bold text-navy mb-3">고객에게 설명하는 환불 계산법</p>
              <p className="text-sm font-mono text-navy/70 mb-2">잔여 금액 &times; 95% = 환급액 (수수료 5% 차감)</p>
              <p className="text-[10px] text-navy/40">예) 100만원 1년권 · 6개월 이용 → 50만원 잔여 &times; 95% = 47.5만원 환급</p>
              <div className="mt-3 bg-yellow-50 rounded p-2">
                <p className="text-[10px] text-yellow-700">
                  PT권 따로 + 헬스권 따로 = 각 최대 300만원 → 합산 최대 600만원 보장
                  <br />고가권을 여러 개 끊을수록 소비자 보장도 커짐 — <strong>영업 포인트로 활용하세요</strong>
                </p>
              </div>
            </motion.div>

            <p className="text-navy/20 text-xs font-mono text-center">03 / 04</p>
          </motion.div>
        </section>

        {/* ===== PAGE 4: GL ALLPAY 도입 시 센터 혜택 ===== */}
        <section id="fp-4" className="px-4 py-20 bg-navy">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-block bg-white/10 text-white/60 text-xs px-4 py-1.5 rounded-full mb-6">
              GL ALLPAY 도입 시 센터가 받는 혜택
            </motion.div>

            {/* 4가지 혜택 */}
            <motion.div variants={fadeIn} className="space-y-4 mb-10">
              {[
                { num: 1, title: "매출 증대 — 장기·고가권 계약률 상승", desc: "24개월 무이자 + 킵페이 안심결제로 고객의 \"망설임 장벽\" 제거.\n고가 PT권·1년 회원권 계약이 자연스럽게 늘어납니다." },
                { num: 2, title: "PG 리스크 제로 — 법 바뀌어도 안전", desc: "원천 카드사 직연결 구조. 2·3차 PG 규제 강화에 완전히 무관.\n지금 바꾸는 것이 나중에 강제 전환보다 훨씬 유리합니다." },
                { num: 3, title: "마케팅 효과 — \"이 센터는 안전해요\"", desc: "킵페이 안심결제 인증 스티커 제공 + 공식 지도에 킵페이 안심결제 매장 등록.\n\"우리 센터는 보장됩니다\"가 최고의 영업 멘트가 됩니다." },
                { num: 4, title: "문화공제 + CRM 연동 자동화", desc: "문화공제 100% 지원. 주요 CRM 플랫폼 API 자동 연동 예정.\n기존 운영 방식 그대로 — 단말기 교체 혹은 GL Allpay 추가." },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 bg-white/5 border border-white/10 rounded-lg p-5">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-navy text-sm font-bold flex items-center justify-center shrink-0">
                    {item.num}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                    <p className="text-xs text-white/50 whitespace-pre-line leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* 인증 패키지 */}
            <motion.div variants={fadeIn} className="mb-10">
              <p className="text-xs text-white/40 mb-4 text-center">도입 즉시 제공되는 공식 인증 패키지</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["킵페이 안심결제 인증 스티커", "공식 지도 등록", "홈페이지 킵페이 안심결제 매장 노출", "킵페이 안심결제 인증서"].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                    <p className="text-xs text-white/70">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeIn} className="text-center">
              <h3 className="text-2xl font-black mb-2">
                지금 도입이
                <br />가장 빠른 답입니다
              </h3>
              <p className="text-sm text-white/50 mb-6">
                법이 바뀌기 전, 경쟁 센터보다 먼저.
                <br />GL allpay 도입은 단말기 하나로 끝납니다.
              </p>
              <div className="inline-flex items-center gap-2 bg-yellow-500 text-navy px-6 py-3 rounded-lg font-bold text-sm">
                지금 바로 상담 신청
              </div>
            </motion.div>

            <p className="text-white/20 text-xs font-mono text-center mt-8">04 / 04</p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
