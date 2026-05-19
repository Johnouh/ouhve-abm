import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";
import "../styles/landing.css";

interface LandingLayoutProps {
  children: React.ReactNode;
  footerVariant?: "simple" | "full";
}

export function LandingLayout({ children, footerVariant = "simple" }: LandingLayoutProps) {
  return (
    <div className="landing">
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter variant={footerVariant} />
    </div>
  );
}
