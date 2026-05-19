import { Link } from "wouter";
import { FadeIn } from "./FadeIn";

interface CTASectionProps {
  label?: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
}

export function CTASection({
  label = "Let's Begin",
  title,
  description,
  ctaText = "상담신청 →",
  ctaHref = "/contact",
}: CTASectionProps) {
  return (
    <section
      className="py-24"
      style={{
        background:
          "linear-gradient(135deg, #0D2244, #0A1628)",
      }}
    >
      <div className="container-landing">
        <FadeIn>
          <div className="text-center max-w-[640px] mx-auto">
            <span className="section-label block text-center mb-6">{label}</span>
            <h2
              className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-tight mb-4"
              dangerouslySetInnerHTML={{ __html: title }}
            />
            <p
              className="text-[1rem] text-[var(--l-text-sub)] leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: description }}
            />
            <Link
              href={ctaHref}
              className="btn-gold"
              style={{ padding: "16px 48px", fontSize: "1rem" }}
            >
              {ctaText}
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
