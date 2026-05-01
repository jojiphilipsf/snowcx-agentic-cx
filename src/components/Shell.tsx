"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Presentation,
  UserSearch,
  PhoneIncoming,
  Headset,
  Bell,
  TrendingUp,
  Snowflake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/storyboard", label: "AE Storyline", icon: Presentation, desc: "Demo narrative" },
  { href: "/customer360", label: "Customer 360", icon: UserSearch, desc: "Unified context" },
  { href: "/call-analytics", label: "Call Analytics", icon: PhoneIncoming, desc: "Interaction insights" },
  { href: "/agent-assist", label: "Agent Assist", icon: Headset, desc: "Case intelligence" },
  { href: "/proactive-care", label: "Proactive Care", icon: Bell, desc: "Incident response" },
  { href: "/next-best-action", label: "Next Best Action", icon: TrendingUp, desc: "Revenue optimization" },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${collapsed ? "w-[68px]" : "w-60"} flex-shrink-0 bg-bg-surface/80 backdrop-blur-xl border-r border-border-default flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 flex items-center gap-2.5 border-b border-border-default min-h-[64px]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center flex-shrink-0">
            <Snowflake size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold tracking-tight text-text-primary leading-tight">SnowCX</div>
              <div className="text-[10px] text-text-muted leading-tight">Agentic CX Intelligence</div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                title={collapsed ? n.label : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  active
                    ? "bg-accent-cyan-glow text-accent-cyan shadow-[inset_3px_0_0_0_#29b5e8]"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
                }`}
              >
                <n.icon size={18} className={`flex-shrink-0 ${active ? "text-accent-cyan" : "text-text-muted group-hover:text-text-secondary"}`} />
                {!collapsed && (
                  <div className="overflow-hidden">
                    <div className="font-medium leading-tight">{n.label}</div>
                    <div className="text-[10px] text-text-muted leading-tight">{n.desc}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border-default">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated/40 transition-colors text-xs"
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
