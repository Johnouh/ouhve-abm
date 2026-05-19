import { Link } from "wouter";

interface LandingFooterProps {
  variant?: "simple" | "full";
}

export function LandingFooter({ variant = "simple" }: LandingFooterProps) {
  if (variant === "full") {
    return <FullFooter />;
  }
  return <SimpleFooter />;
}

function SimpleFooter() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.07)] py-16 bg-[var(--l-navy)]">
      <div className="container-landing">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div>
            <div className="text-xl font-extrabold mb-3">
              <span className="text-white font-[var(--l-font-en)]">GL</span>
              <span className="text-[var(--l-gold)] font-[var(--l-font-en)]"> allpay</span>
            </div>
            <p className="text-[0.85rem] text-[var(--l-text-sub)] leading-relaxed">
              PG기반 구조 위에<br />가맹점 직접 정산흐름을 설계합니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[0.85rem] text-[var(--l-text-sub)] leading-relaxed">
            <div>
              <div className="text-[var(--l-gold)] font-semibold text-[0.82rem] uppercase tracking-wider mb-3">
                Company
              </div>
              <p>
                상호명: GL allpay (주식회사 지엘올페이)<br />
                사업자등록번호: 112-88-03313<br />
                대표이사: 강용신<br />
                주소: 경기도 용인시 수지구 수지로342번길 32, 5층 503·504호
              </p>
            </div>
            <div>
              <div className="text-[var(--l-gold)] font-semibold text-[0.82rem] uppercase tracking-wider mb-3">
                Contact
              </div>
              <p>
                대표 이메일: admin@glallpay.com<br />
                고객 문의: info@glallpay.com<br />
                운영시간: 평일 09:00 – 18:00
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-12 pt-8 border-t border-[rgba(255,255,255,0.07)]">
          <p className="text-[0.78rem] text-[var(--l-gray-text)]">
            Copyright &copy; 2026 GL allpay. All rights reserved.
          </p>
          <div className="flex gap-6 text-[0.78rem] text-[var(--l-gray-text)]">
            <a href="#" className="hover:text-[var(--l-gold)] transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-[var(--l-gold)] transition-colors">이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FullFooter() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.07)] py-16 bg-[var(--l-navy)]">
      <div className="container-landing">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="text-xl font-extrabold mb-3">
              <span className="text-white font-[var(--l-font-en)]">GL</span>
              <span className="text-[var(--l-gold)] font-[var(--l-font-en)]"> allpay</span>
            </div>
            <p className="text-[0.82rem] text-[var(--l-gold)] font-medium mb-2">
              Payment, Structured.
            </p>
            <p className="text-[0.82rem] text-[var(--l-text-sub)] leading-relaxed">
              PG기반 직접 정산 구조 위에 설계된<br />결제 솔루션 파트너
            </p>
          </div>

          <div>
            <h4 className="text-[0.82rem] font-bold text-white uppercase tracking-wider mb-4">서비스</h4>
            <div className="flex flex-col gap-2">
              <Link href="/service" className="text-[0.82rem] text-[var(--l-text-sub)] hover:text-[var(--l-gold)] transition-colors">서비스 소개</Link>
              <Link href="/settlement" className="text-[0.82rem] text-[var(--l-text-sub)] hover:text-[var(--l-gold)] transition-colors">정산구조</Link>
              <Link href="/assurance" className="text-[0.82rem] text-[var(--l-text-sub)] hover:text-[var(--l-gold)] transition-colors">안심서비스</Link>
              <Link href="/map" className="text-[0.82rem] text-[var(--l-text-sub)] hover:text-[var(--l-gold)] transition-colors">가맹점 지도</Link>
            </div>
          </div>

          <div>
            <h4 className="text-[0.82rem] font-bold text-white uppercase tracking-wider mb-4">회사</h4>
            <div className="flex flex-col gap-2">
              <Link href="/contact" className="text-[0.82rem] text-[var(--l-text-sub)] hover:text-[var(--l-gold)] transition-colors">상담 문의</Link>
              <a href="#" className="text-[0.82rem] text-[var(--l-text-sub)] hover:text-[var(--l-gold)] transition-colors">개인정보처리방침</a>
              <a href="#" className="text-[0.82rem] text-[var(--l-text-sub)] hover:text-[var(--l-gold)] transition-colors">이용약관</a>
            </div>
          </div>

          <div>
            <h4 className="text-[0.82rem] font-bold text-white uppercase tracking-wider mb-4">연락처</h4>
            <div className="flex flex-col gap-2 text-[0.82rem] text-[var(--l-text-sub)]">
              <p>admin@glallpay.com</p>
              <p>info@glallpay.com</p>
              <p>평일 09:00 – 18:00</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.07)]">
          <div className="flex flex-wrap gap-4 text-[0.75rem] text-[var(--l-gray-text)] mb-3">
            <span>(주)지엘올페이</span>
            <span>사업자등록번호: 112-88-03313</span>
            <span>대표: 강용신</span>
            <span>경기도 용인시 수지구 수지로342번길 32, 5층 503·504호</span>
          </div>
          <p className="text-[0.75rem] text-[var(--l-gray-text)]">
            &copy; 2026 GL allpay. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
