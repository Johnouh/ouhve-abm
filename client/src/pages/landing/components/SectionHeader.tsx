import { GoldDivider } from "./GoldDivider";
import { FadeIn } from "./FadeIn";

interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  centered?: boolean;
  titleKr?: boolean;
}

export function SectionHeader({
  label,
  title,
  description,
  centered = true,
  titleKr = false,
}: SectionHeaderProps) {
  return (
    <div className={centered ? "text-center mb-16" : "mb-16"}>
      <span className="section-label">{label}</span>
      <FadeIn>
        <h2
          className={`text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-tight tracking-tight ${
            titleKr ? "font-[var(--l-font-kr)]" : "font-[var(--l-font-en)]"
          }`}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </FadeIn>
      <GoldDivider centered={centered} />
      {description && (
        <FadeIn delay={1}>
          <p
            className="text-[0.95rem] text-[var(--l-text-sub)] leading-relaxed max-w-[640px] mt-4"
            style={centered ? { margin: "16px auto 0" } : undefined}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </FadeIn>
      )}
    </div>
  );
}
