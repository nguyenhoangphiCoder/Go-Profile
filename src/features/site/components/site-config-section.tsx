"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SiteConfigSectionProps {
  id?: string;
  step: number;
  title: string;
  description: string;
  badge?: ReactNode;
  open: boolean;
  highlighted?: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SiteConfigSection({
  id,
  step,
  title,
  description,
  badge,
  open,
  highlighted = false,
  onToggle,
  children,
}: SiteConfigSectionProps) {
  return (
    <section
      id={id}
      className={`rounded-2xl border transition-all overflow-hidden scroll-mt-4 ${
        highlighted
          ? "border-primary ring-2 ring-primary/40 bg-card shadow-sm"
          : open
            ? "border-foreground/20 bg-card shadow-2xs"
            : "border-border/80 bg-card/70 hover:bg-card"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`mt-0.5 w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors ${
              open ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}
          >
            {step}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[13px] font-bold text-foreground leading-snug">{title}</h2>
              {badge}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-foreground" : ""
          }`}
        />
      </button>

      {open && <div className="px-4 pb-4 pt-3 border-t border-border/60 space-y-4">{children}</div>}
    </section>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <label
      className={`flex items-center justify-between gap-3 ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="min-w-0">
        <span className="text-xs font-semibold text-foreground block leading-snug">{label}</span>
        {description && (
          <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed ${
          checked ? "bg-foreground" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-background shadow-xs transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
