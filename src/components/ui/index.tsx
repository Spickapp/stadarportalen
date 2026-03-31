"use client";

import { cn, formatCurrency } from "@/utils/helpers";
import { type ReactNode, type ButtonHTMLAttributes, useState, useEffect } from "react";
import type { JobType, MatchLevel } from "@/types";
import { JOB_TYPE_CONFIG, getMatchLevel } from "@/types";

// ── Button ──
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-gradient-to-br from-spick to-spick-dark text-white shadow-btn-primary hover:shadow-btn-primary-hover hover:-translate-y-0.5",
    secondary: "bg-white text-sand-600 border-[1.5px] border-sand-300 hover:border-accent-red hover:text-accent-red",
    danger: "bg-white text-accent-red border-[1.5px] border-accent-red",
    ghost: "bg-transparent text-spick hover:bg-spick-50",
  };
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-3.5 text-md",
  };

  return (
    <button
      className={cn(
        "rounded-btn font-bold transition-all duration-150 inline-flex items-center justify-center gap-1.5",
        variants[variant], sizes[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ── Card ──
export function Card({ children, className, ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white rounded-card p-5 border border-sand-200 shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

// ── Badge ──
interface BadgeProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
}

export function Badge({ children, color, bg, className }: BadgeProps) {
  return (
    <span
      className={cn("text-2xs font-semibold px-2.5 py-0.5 rounded-badge whitespace-nowrap inline-flex items-center gap-1", className)}
      style={{ backgroundColor: bg || "#E8F5F0", color: color || "#1A6B57" }}
    >
      {children}
    </span>
  );
}

// ── JobTypeBadge ──
export function JobTypeBadge({ type }: { type: JobType }) {
  const config = JOB_TYPE_CONFIG[type];
  return (
    <Badge bg={config.color + "18"} color={config.color}>
      {config.emoji} {config.label}
    </Badge>
  );
}

// ── MatchBadge ──
export function MatchBadge({ score }: { score: number }) {
  const level = getMatchLevel(score);
  const styles: Record<MatchLevel, { bg: string; color: string; label: string }> = {
    top: { bg: "#D4F5E9", color: "#1A6B57", label: "Toppträff" },
    good: { bg: "#E8F5F0", color: "#2D9F83", label: "Bra match" },
    ok: { bg: "#FFF3E0", color: "#C4952D", label: "Okej match" },
    weak: { bg: "#F5EDE8", color: "#B0856E", label: "Svag match" },
  };
  const s = styles[level];

  return (
    <span className="inline-flex items-center gap-1.5 text-2xs font-bold px-2.5 py-0.5 rounded-badge" style={{ backgroundColor: s.bg, color: s.color }}>
      <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-extrabold" style={{ borderColor: s.color }}>
        {score}
      </span>
      {s.label}
    </span>
  );
}

// ── Toggle ──
interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      className={cn("flex items-center justify-between py-3 cursor-pointer border-b border-sand-100", disabled && "opacity-40 cursor-default")}
    >
      <div>
        <div className="text-sm font-medium text-sand-800">{label}</div>
        {description && <div className="text-xs text-sand-500 mt-0.5">{description}</div>}
      </div>
      <div className={cn("w-11 h-[26px] rounded-full p-[3px] transition-colors", checked ? "bg-spick" : "bg-sand-400")}>
        <div className={cn("w-5 h-5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-[18px]" : "translate-x-0")} />
      </div>
    </div>
  );
}

// ── Slider ──
interface SliderProps {
  label: string;
  description?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}

export function Slider({ label, description, min, max, step = 1, value, onChange, unit }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1.5">
        <div>
          <span className="text-sm font-medium text-sand-700">{label}</span>
          {description && <div className="text-xs text-sand-500 mt-0.5">{description}</div>}
        </div>
        <span className="text-sm font-bold text-spick bg-spick-light px-2.5 py-0.5 rounded-lg">{value} {unit}</span>
      </div>
      <div className="relative h-7 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-sand-200" />
        <div className="absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-spick to-spick-400" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-7 opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-[3px] border-spick shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
    </div>
  );
}

// ── FilterChip ──
export function FilterChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-badge text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1",
        active ? "border-2 border-spick bg-spick-light text-spick-dark font-bold" : "border-[1.5px] border-sand-300 bg-white text-sand-700"
      )}
    >
      {active && "✓ "}{label}
      {count !== undefined && count > 0 && <span className={cn("text-2xs font-bold", active ? "text-spick-dark" : "text-sand-500")}>({count})</span>}
    </button>
  );
}

// ── DayPicker ──
const DAY_LABELS: Record<string, string> = { mon: "M", tue: "T", wed: "O", thu: "T", fri: "F", sat: "L", sun: "S" };

export function DayPicker({ days, onChange }: { days: Record<string, boolean>; onChange: (d: Record<string, boolean>) => void }) {
  return (
    <div className="flex gap-2">
      {Object.entries(DAY_LABELS).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange({ ...days, [key]: !days[key] })}
          className={cn(
            "w-[42px] h-[42px] rounded-xl border-none text-sm font-medium transition-all",
            days[key]
              ? "bg-gradient-to-br from-spick to-spick-dark text-white font-bold shadow-md"
              : "bg-sand-100 text-sand-600"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── StatCard ──
export function StatCard({ label, value, sub, icon, trend, trendUp }: {
  label: string; value: string | number; sub?: string; icon?: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-2xs text-sand-600 font-medium tracking-wider">{label}</span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-sand-800">{value}</div>
      <div className="flex items-center gap-1.5 mt-1">
        {trend && (
          <span className={cn("text-2xs font-bold px-2 py-0.5 rounded-md", trendUp ? "bg-spick-light text-spick-dark" : "bg-red-50 text-accent-red")}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
        {sub && <span className="text-xs text-sand-500">{sub}</span>}
      </div>
    </Card>
  );
}

// ── Toast ──
export function Toast({ text, type = "success", visible }: { text: string; type?: "success" | "decline"; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={cn(
      "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-tag font-bold text-sm text-white shadow-toast animate-toast-in whitespace-nowrap",
      type === "success" ? "bg-spick-dark" : "bg-sand-700"
    )}>
      {type === "success" ? "✓" : "✕"} {text}
    </div>
  );
}

// ── Skeleton ──
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

// ── EmptyState ──
export function EmptyState({ emoji, title, description, action }: {
  emoji: string; title: string; description: string; action?: ReactNode;
}) {
  return (
    <div className="text-center py-10">
      <div className="text-5xl mb-3">{emoji}</div>
      <div className="text-md font-semibold text-sand-800 mb-1">{title}</div>
      <div className="text-sm text-sand-500 mb-4">{description}</div>
      {action}
    </div>
  );
}

// ── ErrorState ──
export function ErrorState({ title, message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
      <h3 className="font-display text-xl font-bold mb-1.5">{title || "Något gick fel"}</h3>
      <p className="text-sm text-sand-600 mb-5 max-w-[360px] mx-auto">{message || "Vi kunde inte ladda datan. Försök igen."}</p>
      {onRetry && <Button onClick={onRetry}>Försök igen</Button>}
    </div>
  );
}
