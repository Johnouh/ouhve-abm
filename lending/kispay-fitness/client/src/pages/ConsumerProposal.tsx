/**
 * 회원용 제안서 — GL allpay × KipPay
 * 4페이지 구성: 폐업 불안 → 킵페이 안심결제 → 무이자 할부 → 센터 특별한 이유
 */
import { motion, type Easing } from "framer-motion";
import { Link } from "wouter";
import { Shield, ArrowLeft, ChevronDown, CreditCard, MapPin, Calendar, Award } from "lucide-react";
import { useState } from "react";

const ease: Easing = [0.25, 0.1, 0.25, 1];
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

export default function ConsumerProposal() {
  const [currentPage, setCurrentPage] = useState(1);

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
          <span className="text-xs text-white/30 font-mono">회원님께 드리는 킵페이 안심결제 안내</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setCurrentPage(p);
                  document.getElementById(`page-${p}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`w-6 h-6 rounded text-[10px] font-mono transition-colors ${
                  currentPage === p ? "bg-green-500 text-white" : "bg-white/10 text-white/40 hover:bg-white/20"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-14">
        {/* ===== PAGE 1: 헬스장 폐업하면 내 돈은? ===== */}
        <section id="page-1" className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-2xl">
            <motion.div variants={fadeIn} className="inline-block bg-green-500/20 text-green-400 text-xs px-4 py-1.5 rounded-full mb-8">
              회원님께 드리는 킵페이 안심결제 안내
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl font-black leading-tight mb-6">
              헬스장
              <br /><span className="text-yellow-400">폐업하면</span>
              <br />내 돈은?
            </motion.h1>
            <motion.p variants={fadeIn} className="text-sm text-white/50 mb-10 leading-relaxed">
              뉴스에서 보셨죠.
              <br />선불 회원권 끊었는데 헬스장이 갑자기 문 닫는 그 상황.
            </motion.p>

            {/* 불안 카드 */}
            <motion.div variants={fadeIn} className="bg-white/5 border border-white/10 rounded-lg p-6 mb-10 text-left">
              <p className="text-yellow-400 text-sm font-bold mb-4 text-center">회원님들이 겪고 있는 불안</p>
              <div className="space-y-3">
                {[
                  "헬스장 폐업 → 회원권 환불 거절 → 돈 날린 사례 급증",
                  "6개월·1년 장기 회원권, 과연 믿고 끊어도 될까?",
                  "PT 고액 결제 망설여짐 — \"혹시 나도 피해자가 되면…\""
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <p className="text-sm text-white/70">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeIn}>
              <button
                onClick={() => {
                  setCurrentPage(2);
                  document.getElementById("page-2")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-green-600 transition-colors"
              >
                <Shield className="w-4 h-4" /> 이 헬스장은 다릅니다 &rarr;
              </button>
            </motion.div>
          </motion.div>

          <div className="absolute bottom-8 text-white/20 text-xs font-mono">01 / 04</div>
        </section>

        {/* ===== PAGE 2: 킵페이 안심결제 서비스 ===== */}
        <section id="page-2" className="min-h-screen px-4 py-20 bg-[#f8f7f3]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-block bg-green-500/10 text-green-600 text-xs px-4 py-1.5 rounded-full mb-6">
              KIPPAY 킵페이 안심결제 서비스
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-black text-navy leading-tight mb-2">
              폐업해도
            </motion.h2>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-black text-green-600 leading-tight mb-6">
              2주 안에 잔여금 돌려드립니다
            </motion.h2>
            <motion.p variants={fadeIn} className="text-sm text-navy/60 mb-10 leading-relaxed">
              이 센터는 킵페이 안심결제 공식 인증 매장입니다.
              <br />회원권·PT권 각각 결제 시 개별 보장이 자동 적용됩니다.
            </motion.p>

            {/* 3단계 프로세스 */}
            <motion.div variants={fadeIn} className="space-y-0 mb-10">
              {[
                { step: 1, title: "킵페이 안심결제 회원권 등록", desc: "킵페이 안심결제로 회원권·PT권 결제 완료\n→ 회원권 1개당 자동 보장 등록" },
                { step: 2, title: "만약 센터가 폐업한다면", desc: "폐업 확인 후 KipPay 앱에서 보상 신청\n폐업일로부터 2주 이내 신청 필수" },
                { step: 3, title: "잔여 금액 계산 후 환급", desc: "환불 계산법 — 이용일수 차감 후 잔여금의 95% 입금\n(잔여금 × 95% = 실수령액 · 수수료 5% 제외)\n심사 완료 후 2주 이내 계좌 입금", badge: "회원권 1개당 최대 300만원" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    {item.step < 3 && <div className="w-0.5 h-16 bg-green-200" />}
                  </div>
                  <div className="pb-8">
                    <h3 className="font-bold text-navy text-sm mb-1">{item.title}</h3>
                    {item.badge && (
                      <span className="inline-block bg-green-500 text-white text-[10px] px-2 py-0.5 rounded mb-1">{item.badge}</span>
                    )}
                    <p className="text-xs text-navy/50 whitespace-pre-line leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* 보장 한도 예시 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-6 mb-8">
              <p className="text-sm font-bold text-navy mb-4 text-center">보장 한도 예시 — 회원권 개수만큼 보장됩니다</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-navy/5 rounded-lg">
                  <p className="text-xs text-navy/50 mb-1">헬스 회원권만 가입</p>
                  <p className="text-2xl font-black text-green-600">최대 300만원</p>
                  <p className="text-[10px] text-navy/40 mt-1">1개 &times; 300만원</p>
                </div>
                <div className="text-center p-4 bg-navy/5 rounded-lg">
                  <p className="text-xs text-navy/50 mb-1">헬스 + PT권 둘 다 가입</p>
                  <p className="text-2xl font-black text-green-600">최대 600만원</p>
                  <p className="text-[10px] text-navy/40 mt-1">2개 &times; 300만원</p>
                </div>
              </div>
              <p className="text-[10px] text-navy/40 text-center mt-3">
                회원권 종류별로 각각 최대 300만원 — 여러 개 가입할수록 보장도 늘어납니다
              </p>
            </motion.div>

            {/* 국내 유일 */}
            <motion.div variants={fadeIn} className="bg-navy/5 rounded-lg p-5 flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-navy">국내 유일 · 법적 보장 서비스</p>
                <p className="text-xs text-navy/50 mt-1">대체서비스 연계 · 원천결제사 직연결 구조 — 내 돈이 바로 보장됩니다</p>
              </div>
            </motion.div>

            <p className="text-navy/20 text-xs font-mono text-center mt-8">02 / 04</p>
          </motion.div>
        </section>

        {/* ===== PAGE 3: 무이자 할부 혜택 ===== */}
        <section id="page-3" className="min-h-screen px-4 py-20 bg-[#fffde6]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-block bg-yellow-500/10 text-yellow-600 text-xs px-4 py-1.5 rounded-full mb-6">
              무이자 할부 혜택
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-black text-navy leading-tight mb-2">
              비싼 PT권,
            </motion.h2>
            <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-black text-yellow-500 leading-tight mb-6">
              월 몇만원으로 시작하세요
            </motion.h2>
            <motion.p variants={fadeIn} className="text-sm text-navy/50 mb-10">
              GL allpay 결제 시 기본 무이자 + 장기 분할 납부 가능.
            </motion.p>

            {/* 비교 테이블 */}
            <motion.div variants={fadeIn} className="bg-white rounded-lg border border-navy/10 p-6 mb-8">
              <p className="text-sm font-bold text-navy mb-4 text-center">기존 결제 vs GL ALLPAY 결제 비교</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-red-200 bg-red-50/50">
                  <p className="text-sm font-bold text-red-500 mb-3 text-center">기존 결제</p>
                  <div className="space-y-2 text-xs text-navy/60">
                    <p>무이자 최대 <strong>3~6개월</strong></p>
                    <p>장기 할부 <strong>이자 발생</strong></p>
                    <p>폐업 보장 <strong>없음</strong></p>
                    <p>문화공제 <strong>제한</strong></p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
                  <p className="text-sm font-bold text-green-600 mb-3 text-center">GL allpay</p>
                  <div className="space-y-2 text-xs text-navy/60">
                    <p>무이자 <strong>3~6개월</strong> 기본</p>
                    <p><strong>12~24개월</strong> 무이자 가능</p>
                    <p>폐업 시 <strong>전액 보장</strong></p>
                    <p>문화공제 <strong>전액 지원</strong></p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 4개 카드 */}
            <motion.div variants={fadeIn} className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: <Calendar className="w-5 h-5 text-yellow-500" />, title: "최대 24개월\n무이자 할부", desc: "100만원 PT권도\n월 4.2만원부터", big: "24개월" },
                { icon: <Shield className="w-5 h-5 text-green-500" />, title: "회원권 1개당\n최대 300만원", desc: "헬스+PT 따로 가입 시\n최대 600만원 보장", big: "×개수" },
                { icon: <CreditCard className="w-5 h-5 text-red-500" />, title: "문화공제\n전액 사용", desc: "회사 복지포인트\n그대로 사용 가능", big: "100%" },
                { icon: <MapPin className="w-5 h-5 text-blue-500" />, title: "킵페이 안심결제\n공식 매장", desc: "지도 앱에서\n인증 확인 가능", big: "공식" },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-lg border border-navy/10 p-5 text-center">
                  <div className="flex justify-center mb-3">{card.icon}</div>
                  <h3 className="text-xs font-bold text-navy whitespace-pre-line mb-2">{card.title}</h3>
                  <p className="text-[10px] text-navy/40 whitespace-pre-line mb-3">{card.desc}</p>
                  <p className="text-xl font-black text-green-600">{card.big}</p>
                </div>
              ))}
            </motion.div>

            <p className="text-navy/20 text-xs font-mono text-center">03 / 04</p>
          </motion.div>
        </section>

        {/* ===== PAGE 4: 이 센터가 특별한 이유 ===== */}
        <section id="page-4" className="min-h-screen px-4 py-20 bg-navy">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-block bg-white/10 text-white/60 text-xs px-4 py-1.5 rounded-full mb-6">
              이 센터가 특별한 이유
            </motion.div>

            {/* 인증 배지 */}
            <motion.div variants={fadeIn} className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: <Shield className="w-3.5 h-3.5" />, text: "킵페이 안심결제 인증 매장" },
                { icon: <MapPin className="w-3.5 h-3.5" />, text: "공식 지도 등록 매장" },
                { icon: <CreditCard className="w-3.5 h-3.5" />, text: "원천결제사 직연결" },
                { icon: <Award className="w-3.5 h-3.5" />, text: "문화공제 공식 가맹" },
              ].map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full">
                  {badge.icon} {badge.text}
                </span>
              ))}
            </motion.div>

            {/* 킵페이 안심결제 매장 찾기 */}
            <motion.div variants={fadeIn} className="bg-white/5 border border-white/10 rounded-lg p-6 text-center mb-10">
              <MapPin className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">킵페이 안심결제 매장 찾기</h3>
              <p className="text-xs text-white/50 leading-relaxed mb-4">
                GL allpay &amp; KipPay 공식 홈페이지에서
                <br /><strong className="text-white/80">전국 킵페이 안심결제 인증 매장</strong>을 지도로 확인하세요.
                <br />인증 스티커가 붙어 있는 매장 = 100% 보장 적용
              </p>
              <span className="inline-block bg-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-full">
                킵페이 안심결제 인증 스티커 공식 매장
              </span>
            </motion.div>

            {/* 환불 금액 계산법 */}
            <motion.div variants={fadeIn} className="bg-white/5 border border-white/10 rounded-lg p-6 mb-10">
              <p className="text-sm font-bold text-yellow-400 mb-4 text-center">환불 금액 계산법</p>
              <div className="flex items-center justify-center gap-2 flex-wrap text-center mb-4">
                <span className="bg-white/10 px-3 py-2 rounded text-xs font-mono">결제 금액</span>
                <span className="text-white/30">&minus;</span>
                <span className="bg-white/10 px-3 py-2 rounded text-xs font-mono">이용일수<br/>차감액</span>
                <span className="text-white/30">&times;</span>
                <span className="bg-green-500/20 text-green-400 px-3 py-2 rounded text-xs font-mono">95%<br/>(수수료 5% 제외)</span>
                <span className="text-white/30">=</span>
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-2 rounded text-xs font-mono font-bold">환급액<br/>(최대 300만원)</span>
              </div>
              <p className="text-[10px] text-white/40 text-center leading-relaxed">
                예) 100만원 6개월권 · 2개월 이용 후 폐업
                <br />잔여 66.7% &times; 95% = <strong className="text-white/70">약 63만원 환급</strong>
              </p>
            </motion.div>

            {/* 최종 메시지 */}
            <motion.div variants={fadeIn} className="text-center mb-8">
              <p className="text-sm text-white/60 leading-relaxed mb-2">
                헬스권·PT권 각각 따로 가입 시
              </p>
              <p className="text-lg font-black">
                각 회원권마다 최대 300만원 — 보장도 2배.
              </p>
              <p className="text-sm text-white/60 mt-1">
                많이 가입할수록 더 든든하게 보호됩니다.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-sm">
                <Shield className="w-4 h-4" /> 안심하고 결제하세요
              </div>
            </motion.div>

            <p className="text-white/20 text-xs font-mono text-center mt-8">04 / 04</p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
