import React from "react";
import Link from "next/link";

interface LogoProps {
  variant?: "full" | "icon-only";
  theme?: "light" | "dark";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  theme = "light",
  className = "",
  size = "md",
}) => {
  const sizeMap = {
    sm: { icon: 28, text: "text-lg", sub: "text-[9px]" },
    md: { icon: 38, text: "text-2xl", sub: "text-[11px]" },
    lg: { icon: 48, text: "text-3xl", sub: "text-[13px]" },
  };

  const currentSize = sizeMap[size];
  const textColor = theme === "dark" ? "text-white" : "text-brand-charcoal";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
    >
      {/* Official NeoCart Nova Scalable Vector Emblem */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Left vertical pillar */}
        <path d="M20 85V28L34 16V85H20Z" fill="#2563EB" />

        {/* Diagonal dynamic connector */}
        <path d="M34 38L64 74H78L34 22V38Z" fill="url(#neonGradient)" />

        {/* Upward dynamic arrow pillar */}
        <path d="M66 85V42L80 54V85H66Z" fill="#06B6D4" />
        <path d="M73 20L90 38H56L73 20Z" fill="#06B6D4" />

        {/* Nova Star Accent */}
        <path
          d="M50 18L52.5 25L60 27.5L52.5 30L50 37L47.5 30L40 27.5L47.5 25L50 18Z"
          fill="#06B6D4"
        />
      </svg>

      {/* Wordmark (Shown on 'full' variant) */}
      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold tracking-tight ${currentSize.text} ${textColor}`}
          >
            NeoCart
          </span>
          <span
            className={`font-semibold tracking-widest text-brand-cyan uppercase ${currentSize.sub}`}
          >
            NOVA
          </span>
        </div>
      )}
    </Link>
  );
};
