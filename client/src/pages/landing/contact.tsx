import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { LandingLayout } from "./components/LandingLayout";
import { FadeIn } from "./components/FadeIn";

export default function ContactPage() {
  return (
    <LandingLayout footerVariant="full">
      <HeroSection />
      <ProcessBar />
      <MainSection />
      <FaqSection />
    </LandingLayout>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[52vh] flex items-center overflow-hidden pt-40 pb-20" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0D2244 55%, #0F2C54 100%)" }}>
      <div className="absolute top-[-20%] right-[-8%] w-[50%] h-[140%] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 65%)" }} />
      <div className="container-landing relative z-[1]">
        <div className="max-w-[640px]">
          <span className="badge mb-5">상담 & 서류접수</span>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.25] mb-4">
            가맹 신청부터 서류 제출까지<br /><span className="text-[var(--l-gold)]">한 번에 처리하세요.</span>
          </h1>
          <p className="text-[1.05rem] text-[var(--l-text-sub)] leading-relaxed max-w-[560px]">
            아래 양식을 작성하시면 GL allpay 담당자가 검토 후 연락드립니다.<br />모든 정보는 상담 목적으로만 활용되며 안전하게 보호됩니다.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProcessBar() {
  const steps = [
    { num: 1, title: "양식 작성", desc: "아래 폼에 정보 입력" },
    { num: 2, title: "서류 첨부", desc: "필요 서류 업로드" },
    { num: 3, title: "접수 완료", desc: "자동 확인 이메일 발송" },
    { num: 4, title: "담당자 검토", desc: "영업일 1~2일 내" },
    { num: 5, title: "상담 진행", desc: "맞춤 구조 안내" },
  ];
  return (
    <div className="py-8" style={{ background: "#0B1A30", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="container-landing">
        <div className="flex items-center justify-center flex-wrap gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className="flex flex-col items-center text-center px-4 lg:px-7 relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[0.85rem] font-extrabold mb-2 font-[var(--l-font-en)]" style={{ background: "rgba(201,168,76,0.15)", border: "1.5px solid rgba(201,168,76,0.4)", color: "var(--l-gold)" }}>{s.num}</div>
                <div className="text-[0.82rem] font-bold text-white mb-0.5">{s.title}</div>
                <div className="text-[0.72rem] text-[var(--l-text-sub)]">{s.desc}</div>
              </div>
              {i < steps.length - 1 && <span className="text-[var(--l-gold)] opacity-50 text-sm hidden md:block">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MainSection() {
  const [tallyLoaded, setTallyLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setTallyLoaded(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20" style={{ background: "var(--l-navy)" }}>
      <div className="container-landing">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-16 items-start">
          {/* Side panel */}
          <div className="lg:sticky lg:top-[100px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5">
            <SideCard title="이런 내용을<br>작성해 주세요" items={["사업자명 & 대표자 정보", "업종 및 운영 형태", "현재 결제 / PG 사용 현황", "회원권 계약 기간 및 선결제 비율", "할부 운영 여부", "월 평균 매출 규모 (선택)", "문의 내용 또는 요청 사항"]} />
            <SideCard title="첨부 가능한<br>서류 목록" items={["사업자 등록증", "임대차 계약서", "최근 3개월 매출 자료", "기존 PG 계약서", "기타 운영 관련 자료"]} note="※ 서류는 선택사항입니다. 추후 별도 요청 시 제출도 가능합니다." />

            <div className="rounded-2xl p-6" style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <div className="text-2xl mb-3">⏱</div>
              <h4 className="text-[0.92rem] font-bold text-[var(--l-gold)] mb-2">빠른 검토 안내</h4>
              <p className="text-[0.82rem] text-[var(--l-text-sub)] leading-relaxed">
                양식 제출 후 <strong className="text-white">영업일 1~2일 내</strong> 담당자가 연락드립니다.<br /><br />접수 후 자동 확인 이메일이 발송되니 스팸함도 확인해 주세요.
              </p>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-[0.88rem] font-bold text-[var(--l-gold-light)] mb-3">직접 연락하기</h4>
              {[
                { icon: "✉", text: "admin@glallpay.com" },
                { icon: "📧", text: "info@glallpay.com" },
                { icon: "🕘", text: "평일 09:00 – 18:00" },
              ].map((c) => (
                <div key={c.text} className="flex items-center gap-2.5 text-[0.82rem] text-[var(--l-text-sub)] py-1.5">{c.icon} {c.text}</div>
              ))}
              <div className="mt-3.5 pt-3.5 text-[0.78rem] text-[var(--l-gray-text)] leading-relaxed" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                경기도 용인시 수지구 수지로342번길 32<br />5층 503·504호
              </div>
            </div>
          </div>

          {/* Tally form */}
          <div>
            <div className="rounded-2xl overflow-hidden relative" style={{ background: "#FFFFFF", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              {/* Form header */}
              <div className="flex items-center justify-between px-8 py-6" style={{ background: "linear-gradient(135deg, #0A1628, #0D2244)", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                <div className="flex items-center gap-3.5">
                  <div className="text-[1rem] font-extrabold text-white font-[var(--l-font-en)]"><span className="text-[var(--l-gold)]">GL</span> allpay</div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div>
                    <div className="text-[0.9rem] font-semibold text-white">가맹 상담 & 서류접수</div>
                    <div className="text-[0.75rem] text-[var(--l-text-sub)] mt-0.5">Merchant Consultation & Document Submission</div>
                  </div>
                </div>
                <span className="badge text-[0.72rem] py-1 px-3">보안 접수</span>
              </div>

              {/* Loading */}
              {!tallyLoaded && (
                <div className="flex flex-col items-center justify-center py-20 bg-white gap-4">
                  <div className="w-9 h-9 rounded-full animate-spin" style={{ border: "3px solid rgba(201,168,76,0.2)", borderTopColor: "var(--l-gold)" }} />
                  <p className="text-[0.88rem] text-gray-500">양식을 불러오는 중입니다...</p>
                </div>
              )}

              {/* Tally iframe */}
              <iframe
                ref={iframeRef}
                className="w-full block"
                src="https://tally.so/embed/2EL8ab?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="100%"
                height="860"
                style={{ minHeight: "860px", border: "none", display: tallyLoaded ? "block" : "none" }}
                title="GL allpay 가맹 상담 및 서류접수"
                onLoad={() => setTallyLoaded(true)}
                allow="camera; microphone; autoplay; encrypted-media"
              />
            </div>

            {/* Security note */}
            <div className="flex items-center gap-3 mt-4 rounded-lg px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-[1rem]">🔒</span>
              <p className="text-[0.8rem] text-[var(--l-text-sub)] leading-relaxed">
                제출하신 모든 정보와 서류는 가맹 상담 목적으로만 활용되며, 제3자에게 제공되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SideCard({ title, items, note }: { title: string; items: string[]; note?: string }) {
  return (
    <div className="rounded-2xl p-9" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <h3 className="text-[1.05rem] font-bold text-white leading-snug mb-4" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="w-8 h-0.5 bg-[var(--l-gold)] my-3.5" />
      <ul className="mt-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[0.85rem] text-[var(--l-text-sub)] py-2 leading-relaxed" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="text-[var(--l-gold)] font-bold shrink-0 mt-0.5">✓</span>{item}
          </li>
        ))}
      </ul>
      {note && <p className="mt-3.5 text-[0.78rem] text-[var(--l-gray-text)]">{note}</p>}
    </div>
  );
}

function FaqSection() {
  const faqs = [
    { q: "상담 신청 후 얼마나 기다려야 하나요?", a: "영업일 기준 1~2일 내에 담당자가 연락드립니다. 접수 즉시 확인 이메일이 발송됩니다." },
    { q: "서류 첨부는 필수인가요?", a: "아니요, 선택사항입니다. 초기 상담 후 필요에 따라 추후에 요청드릴 수도 있습니다." },
    { q: "어떤 업종이 신청 가능한가요?", a: "헬스·피트니스, 요가, 필라테스, 수영장 등 선불 회원권 기반 모든 업종이 신청 가능합니다." },
    { q: "모든 신청이 승인되나요?", a: "내부 기준에 따라 구조 적합성을 검토합니다. 모든 신청이 동일하게 진행되지는 않으나, 검토 결과는 반드시 안내드립니다." },
    { q: "현재 다른 PG를 사용 중인데 가능한가요?", a: "가능합니다. 현재 PG 계약 상태를 확인 후 전환 가능 여부와 절차를 안내드립니다." },
    { q: "킵페이 안심결제서비스도 함께 신청되나요?", a: "네. GL allpay 가맹 진행 시 킵페이 안심결제서비스가 자동으로 연동됩니다. 별도 신청 불필요합니다." },
  ];
  return (
    <section className="py-20" style={{ background: "var(--l-mid-navy)" }}>
      <div className="container-landing">
        <div className="text-center mb-12">
          <span className="section-label">FAQ</span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.2rem)] font-extrabold">자주 묻는 질문</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[900px] mx-auto">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl p-6 transition-colors hover:border-[rgba(201,168,76,0.3)]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-[0.92rem] font-bold text-[var(--l-gold)] mb-2">{f.q}</h4>
              <p className="text-[0.83rem] text-[var(--l-text-sub)] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
