import { Link } from "wouter";
import { GoldDivider } from "./GoldDivider";
import { FadeIn } from "./FadeIn";

interface PageHeroProps {
  breadcrumb: string;
  label: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
}

export function PageHero({
  breadcrumb,
  label,
  title,
  description,
  ctaText,
  ctaHref = "/contact",
}: PageHeroProps) {
  return (
    <section
      className="relative overflow-hidden pt-40 pb-20"
      style={{
        background:
          "linear-gradient(135deg, #0A1628 0%, #0D2244 55%, #0F2C54 100%)",
      }}
    >
      <div
        className="absolute top-[-20%] right-[-8%] w-[50%] h-[140%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div className="container-landing relative z-[1]">
        <div className="max-w-[640px]">
          <nav
            className="flex items-center gap-2 text-[0.82rem] text-[var(--l-text-sub)] mb-6"
            aria-label="breadcrumb"
          >
            <Link href="/" className="hover:text-[var(--l-gold)] transition-colors">
              홈
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-[var(--l-white)]">{breadcrumb}</span>
          </nav>
          <span className="section-label">{label}</span>
          <FadeIn>
            <h1
              className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.25] mb-4"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          </FadeIn>
          <FadeIn delay={1}>
            <GoldDivider />
          </FadeIn>
          <FadeIn delay={2}>
            <p
              className="text-[1.05rem] text-[var(--l-text-sub)] leading-relaxed max-w-[560px]"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </FadeIn>
          {ctaText && (
            <FadeIn delay={3}>
              <Link href={ctaHref} className="btn-gold mt-8 inline-flex">
                {ctaText}
              </Link>
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  );
}
