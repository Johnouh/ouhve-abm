/**
 * 제안서 선택 페이지 — GL allpay × KipPay
 * 회원용 / 가맹점용 제안서 선택 화면
 */
import { motion, type Easing } from "framer-motion";
import { Link } from "wouter";
import { Shield, TrendingUp } from "lucide-react";

const ease: Easing = [0.25, 0.1, 0.25, 1];
const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

export default function Proposal() {
  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <span className="font-mono text-sm tracking-[0.1em] font-bold">GL allpay &times; KipPay</span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-12">
          <motion.h1 variants={fadeIn} className="text-3xl md:text-4xl font-black leading-tight mb-3">
            누구에게 보여드릴
            <br />제안서인가요?
          </motion.h1>
          <motion.p variants={fadeIn} className="text-sm text-white/50">
            대상에 맞는 제안서를 선택하세요
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* 회원용 */}
          <motion.div variants={fadeIn}>
            <Link href="/proposal/consumer">
              <div className="border border-white/10 rounded-lg p-7 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group h-full">
                <div className="text-xs text-white/40 mb-4">회원 · 소비자용</div>
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-lg font-black mb-4">
                  안심하고
                  <br />결제하셔요
                </h2>
                <div className="space-y-2 text-sm text-white/60 mb-6">
                  <p>폐업 보장 최대 600만원 · 2주 환급</p>
                  <p>최대 24개월 무이자 할부</p>
                  <p>킵페이 안심결제 공식 매장 지도 등록</p>
                </div>
                <div className="text-sm font-semibold text-green-400 group-hover:translate-x-1 transition-transform">
                  회원용 제안서 보기 &rarr;
                </div>
              </div>
            </Link>
          </motion.div>

          {/* 가맹점용 */}
          <motion.div variants={fadeIn}>
            <Link href="/proposal/franchise">
              <div className="border border-white/10 rounded-lg p-7 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group h-full">
                <div className="text-xs text-white/40 mb-4">센터 대표 · 가맹점용</div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="text-lg font-black mb-4">
                  매출상승을 위해
                  <br />킵페이 안심결제 회원권을 도입하셔요
                </h2>
                <div className="space-y-2 text-sm text-white/60 mb-6">
                  <p>무이자 24개월 &rarr; 고액권 계약 상승</p>
                  <p>2·3차 PG 위험 구조 &amp; 탈출 방법</p>
                  <p>킵페이 안심결제 인증 스티커 · 공식 지도 등록</p>
                </div>
                <div className="text-sm font-semibold text-yellow-400 group-hover:translate-x-1 transition-transform">
                  가맹점용 제안서 보기 &rarr;
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* 하단 태그 */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mt-12 flex flex-wrap justify-center gap-3">
          {["원천결제사 직연결", "킵페이 안심결제 서비스 독점", "전국 7만 체육시설", "킵페이 안심결제 서비스 선점"].map((tag) => (
            <motion.span key={tag} variants={fadeIn} className="text-[10px] text-white/30 border border-white/10 rounded-full px-3 py-1">
              {tag}
            </motion.span>
          ))}
        </motion.div>

        {/* 푸터 */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 text-[10px] text-white/20 text-center">
          &copy; 2025 GL allpay &times; KipPay (Paysia) · CONFIDENTIAL
          <br />본 제안서는 영업 및 파트너십 목적으로 구성되었습니다
        </motion.p>
      </div>
    </div>
  );
}
