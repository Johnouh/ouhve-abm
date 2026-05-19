import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogIn } from "lucide-react";

const NAV_ITEMS = [
  { href: "/service", label: "서비스" },
  { href: "/settlement", label: "정산구조" },
  { href: "/assurance", label: "안심서비스" },
  { href: "/map", label: "가맹점 지도" },
  { href: "/contact", label: "문의하기" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <header
        className={`landing-header ${scrolled ? "scrolled" : ""}`}
      >
        <div className="container-landing">
          <div className="flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-0 text-xl font-extrabold no-underline">
              <span className="text-white font-[var(--l-font-en)]">GL</span>
              <span className="text-[var(--l-gold)] font-[var(--l-font-en)]">&nbsp;allpay</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-[0.88rem] font-medium rounded-md transition-colors ${
                    location === item.href
                      ? "text-[var(--l-gold)]"
                      : "text-[rgba(255,255,255,0.75)] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="btn-gold ml-3"
                style={{ padding: "10px 24px", fontSize: "0.85rem" }}
              >
                상담신청
              </Link>
              <Link
                href="/auth"
                className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 text-[0.85rem] font-semibold rounded-md transition-all text-[rgba(255,255,255,0.75)] hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <LogIn className="w-4 h-4" />
                ABM
              </Link>
            </nav>

            {/* Mobile: ABM + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.8rem] font-semibold rounded-md text-[rgba(255,255,255,0.75)]"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <LogIn className="w-3.5 h-3.5" />
                ABM
              </Link>
              <button
                className="p-2 text-white"
                onClick={() => setMobileOpen(true)}
                aria-label="메뉴 열기"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`landing-mobile-menu ${mobileOpen ? "open" : ""}`}
      >
        <button
          className="absolute top-6 right-6 text-white p-2"
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
        >
          <X className="w-7 h-7" />
        </button>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-lg font-semibold transition-colors ${
              location === item.href
                ? "text-[var(--l-gold)]"
                : "text-white hover:text-[var(--l-gold)]"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/contact"
          className="btn-gold mt-4"
          onClick={() => setMobileOpen(false)}
        >
          상담신청
        </Link>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 mt-3 px-6 py-3 text-[0.95rem] font-semibold rounded-md text-white transition-colors hover:text-[var(--l-gold)]"
          style={{ border: "1px solid rgba(255,255,255,0.25)" }}
          onClick={() => setMobileOpen(false)}
        >
          <LogIn className="w-4 h-4" />
          ABM 로그인
        </Link>
      </div>
    </>
  );
}
