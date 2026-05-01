"use client";
import { ReactNode } from "react";

export function GlassCard({ children, className = "", noPad = false }: { children: ReactNode; className?: string; noPad?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border-default bg-bg-glass backdrop-blur-xl ${noPad ? "" : "p-5"} ${className}`}>
      {children}
    </div>
  );
}

type KPIGradient = "cyan" | "red" | "green" | "orange" | "purple" | "blue" | "indigo";
const gradients: Record<KPIGradient, string> = {
  cyan: "from-[#29b5e8] to-[#3b82f6]",
  red: "from-[#ef4444] to-[#f97316]",
  green: "from-[#10b981] to-[#059669]",
  orange: "from-[#f97316] to-[#eab308]",
  purple: "from-[#8b5cf6] to-[#ec4899]",
  blue: "from-[#3b82f6] to-[#6366f1]",
  indigo: "from-[#6366f1] to-[#8b5cf6]",
};

export function KPICard({ label, value, sub, gradient = "cyan", className = "" }: { label: string; value: string | number; sub?: string; gradient?: KPIGradient; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-border-default bg-bg-surface p-4 group hover:border-border-hover transition-all duration-200 ${className}`}>
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradients[gradient]} opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mt-1">{label}</div>
      <div className="text-xl font-bold text-text-primary mt-0.5 truncate" title={String(value)}>{value}</div>
      {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: `${color}18`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function DataTable({ columns, rows, onRowClick, selectedIndex, maxH = "max-h-[500px]" }: {
  columns: { key: string; label: string; format?: (v: unknown) => string }[];
  rows: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>, idx: number) => void;
  selectedIndex?: number;
  maxH?: string;
}) {
  return (
    <div className={`overflow-auto ${maxH} rounded-xl border border-border-default`}>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-bg-elevated/80 backdrop-blur-sm sticky top-0 z-10">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row, i)}
              className={`border-b border-border-default/50 transition-colors ${onRowClick ? "cursor-pointer hover:bg-accent-cyan-glow" : ""} ${selectedIndex === i ? "bg-accent-cyan-glow" : ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-text-secondary whitespace-nowrap">{c.format ? c.format(row[c.key]) : String(row[c.key] ?? "")}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-text-muted text-sm">No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, sub, icon }: { title: string; sub?: string; icon?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="w-10 h-10 rounded-xl bg-accent-cyan-glow flex items-center justify-center text-accent-cyan">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
          {sub && <p className="text-sm text-text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 bg-bg-surface/60 backdrop-blur-sm border border-border-default rounded-xl p-1 mb-5 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            active === t.key
              ? "bg-accent-cyan text-white shadow-lg shadow-accent-cyan/20"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active === t.key ? "bg-white/20" : "bg-bg-elevated text-text-muted"}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className = "", h = "h-4" }: { className?: string; h?: string }) {
  return <div className={`animate-shimmer rounded-lg ${h} ${className}`} />;
}

export function LoadingState() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} h="h-20" />)}
      </div>
      <Skeleton h="h-64" />
    </div>
  );
}

export function TextBlock({ label, text, maxH = "max-h-40" }: { label?: string; text: string; maxH?: string }) {
  return (
    <div className="mb-3">
      {label && <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}</div>}
      <div className={`bg-bg-deep/60 rounded-xl border border-border-default p-3 text-sm text-text-secondary ${maxH} overflow-y-auto whitespace-pre-wrap leading-relaxed`}>{text}</div>
    </div>
  );
}
