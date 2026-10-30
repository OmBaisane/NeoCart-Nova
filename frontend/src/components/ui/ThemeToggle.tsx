"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-9 w-9 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50"
        aria-hidden="true"
      />
    );
  }

  const themes = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Laptop },
  ] as const;

  const activeTheme = themes.find((item) => item.key === theme);

  const ActiveIcon =
    theme === "system"
      ? resolvedTheme === "dark"
        ? Moon
        : Sun
      : activeTheme?.icon || Laptop;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select color theme"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <ActiveIcon
          className={`h-4 w-4 ${
            theme === "dark" || resolvedTheme === "dark"
              ? "text-cyan-400"
              : "text-amber-500"
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Color theme options"
          className="absolute right-0 z-50 mt-2 w-36 animate-in fade-in zoom-in-95 rounded-xl border border-slate-200 bg-white p-1 shadow-lg duration-100 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="space-y-0.5">
            {themes.map(({ key, label, icon: Icon }) => {
              const isActive = theme === key;

              return (
                <button
                  key={key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setTheme(key);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-100 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </div>

                  {isActive && (
                    <Check className="h-3.5 w-3.5 text-brand-blue dark:text-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
