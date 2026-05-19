interface GoldDividerProps {
  centered?: boolean;
  className?: string;
}

export function GoldDivider({ centered, className = "" }: GoldDividerProps) {
  return (
    <div
      className={`gold-divider ${centered ? "mx-auto" : ""} ${className}`}
    />
  );
}
