"use client";

import { useState, useMemo } from "react";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { GlassCard, KPICard, StatusBadge, DataTable, PageHeader, LoadingState, TextBlock } from "@/components/ui";
import { useFetch } from "@/lib/hooks";

const SEV_COLORS: Record<string, string> = { Critical: "#ef4444", Major: "#f97316", Minor: "#eab308" };

interface ImpactDetail {
  impact: Record<string, unknown>[];
  summary: {
    TOTAL_IMPACTED: number;
    NO_SERVICE: number;
    DEGRADED: number;
    INTERMITTENT: number;
    ALREADY_NOTIFIED: number;
    PENDING_NOTIFICATION: number;
    TOTAL_CREDITS_APPLIED: number;
  };
}

export default function ProactiveCarePage() {
  const { data: incidents, loading } = useFetch<Record<string, unknown>[]>("/api/proactive-care");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<Record<string, ImpactDetail>>({});
  const [comms, setComms] = useState<Record<string, string>>({});
  const [commsLoading, setCommsLoading] = useState<string | null>(null);

  const rows = incidents ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === "All") return rows;
    return rows.filter((inc) => String(inc.STATUS ?? "") === statusFilter);
  }, [rows, statusFilter]);

  const activeCount = rows.filter((inc) => String(inc.STATUS) === "Active").length;
  const criticalCount = rows.filter((inc) => String(inc.SEVERITY) === "Critical").length;
  const totalImpacted = rows.reduce((s, inc) => s + Number(inc.CONFIRMED_IMPACTED ?? 0), 0);

  const loadImpact = async (incidentId: string) => {
    if (impactData[incidentId]) return;
    try {
      const res = await fetch(`/api/proactive-care?incidentId=${incidentId}`);
      const json = await res.json();
      setImpactData((prev) => ({ ...prev, [incidentId]: json }));
    } catch {
      /* noop */
    }
  };

  const generateComms = async (inc: Record<string, unknown>) => {
    const incId = String(inc.INCIDENT_ID);
    if (comms[incId]) return;
    setCommsLoading(incId);
    try {
      const context = `Incident: ${inc.INCIDENT_ID}, Severity: ${inc.SEVERITY}, Type: ${inc.INCIDENT_TYPE}, Area: ${inc.AFFECTED_AREA}, Region: ${inc.REGION}, Status: ${inc.STATUS}, Impacted: ${inc.CONFIRMED_IMPACTED} customers, Root Cause: ${inc.ROOT_CAUSE ?? "unknown"}, Services: ${inc.AFFECTED_SERVICES ?? "N/A"}, Started: ${inc.STARTED_AT ?? "N/A"}, Resolved: ${inc.RESOLVED_AT ?? "Ongoing"}`;
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, question: "Draft 3 customer communications: SMS (160 chars), Push Notification (title + body), Email (subject + body). Be empathetic and transparent." }),
      });
      const json = await res.json();
      setComms((prev) => ({ ...prev, [incId]: json.response ?? "No response" }));
    } catch {
      setComms((prev) => ({ ...prev, [incId]: "Error generating communications." }));
    } finally {
      setCommsLoading(null);
    }
  };

  const toggleExpand = (incId: string) => {
    if (expanded === incId) {
      setExpanded(null);
    } else {
      setExpanded(incId);
      loadImpact(incId);
    }
  };

  const statusButtons = ["All", "Active", "Resolved"];

  return (
    <>
      <PageHeader title="Proactive Care" sub="Correlate network incidents to customer impact and trigger communications" icon={<Bell size={20} />} />

      {loading ? <LoadingState /> : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {statusButtons.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-accent-cyan text-white" : "bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary"}`}>{s}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <KPICard label="Total Incidents" value={rows.length} gradient="cyan" />
            <KPICard label="Active" value={activeCount} gradient="orange" />
            <KPICard label="Critical" value={criticalCount} gradient="red" />
            <KPICard label="Customers Impacted" value={totalImpacted.toLocaleString()} gradient="purple" />
          </div>

          <div className="space-y-3">
            {filtered.map((inc) => {
              const incId = String(inc.INCIDENT_ID);
              const isExpanded = expanded === incId;
              const sevColor = SEV_COLORS[String(inc.SEVERITY)] ?? "#64748b";
              const detail = impactData[incId];
              const customers = detail?.impact ?? [];
              const summary = detail?.summary;

              return (
                <GlassCard key={incId} noPad>
                  <button onClick={() => toggleExpand(incId)} className="w-full flex items-center gap-4 p-4 text-left">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: sevColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{incId}</span>
                        <StatusBadge label={String(inc.STATUS ?? "")} color={String(inc.STATUS) === "Active" ? "#f97316" : "#10b981"} />
                      </div>
                      <div className="text-xs text-text-muted truncate">{String(inc.INCIDENT_TYPE ?? "")} — {String(inc.AFFECTED_AREA ?? "")}</div>
                    </div>
                    <div className="text-xs text-text-muted">{String(inc.CONFIRMED_IMPACTED ?? 0)} impacted</div>
                    {isExpanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                  </button>

                  {isExpanded ? (
                    <div className="px-4 pb-4 border-t border-border-default/50 pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <KPICard label="Severity" value={String(inc.SEVERITY ?? "—")} gradient={String(inc.SEVERITY) === "Critical" ? "red" : "orange"} />
                        <KPICard label="Type" value={String(inc.INCIDENT_TYPE ?? "—")} gradient="cyan" />
                        <KPICard label="Region" value={String(inc.REGION ?? "—")} gradient="blue" />
                        <KPICard label="Duration" value={inc.DURATION_HOURS ? `${inc.DURATION_HOURS}h` : "Ongoing"} gradient="purple" />
                        <KPICard label="Impacted" value={String(inc.CONFIRMED_IMPACTED ?? "—")} gradient="red" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
                        <div className="space-y-3">
                          {inc.ROOT_CAUSE ? (
                            <TextBlock label="Root Cause" text={String(inc.ROOT_CAUSE)} maxH="max-h-24" />
                          ) : null}
                          {inc.AFFECTED_SERVICES ? (
                            <TextBlock label="Affected Services" text={String(inc.AFFECTED_SERVICES)} maxH="max-h-20" />
                          ) : null}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Started</div>
                              <div className="text-text-secondary">{String(inc.STARTED_AT ?? "—")}</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Resolved</div>
                              {inc.RESOLVED_AT ? <div className="text-text-secondary">{String(inc.RESOLVED_AT)}</div> : <div className="text-orange-400 text-xs">Ongoing</div>}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <KPICard label="No Service" value={String(summary?.NO_SERVICE ?? "—")} gradient="red" />
                            <KPICard label="Degraded" value={String(summary?.DEGRADED ?? "—")} gradient="orange" />
                            <KPICard label="Notified" value={String(summary?.ALREADY_NOTIFIED ?? "—")} gradient="green" />
                            <KPICard label="Pending" value={String(summary?.PENDING_NOTIFICATION ?? "—")} gradient="purple" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={() => generateComms(inc)}
                            disabled={commsLoading === incId || !!comms[incId]}
                            className="w-full py-3 rounded-xl bg-accent-cyan text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {commsLoading === incId ? "Generating…" : comms[incId] ? "Communications Generated" : "Generate Proactive Communications"}
                          </button>
                          {comms[incId] ? (
                            <TextBlock label="Proactive Communications" text={comms[incId]} maxH="max-h-[280px]" />
                          ) : null}
                        </div>
                      </div>

                      {customers.length > 0 ? (
                        <DataTable
                          columns={[
                            { key: "CUSTOMER_NAME", label: "Customer Name" },
                            { key: "IMPACT_LEVEL", label: "Impact Level" },
                            { key: "SEGMENT", label: "Segment" },
                            { key: "PLAN_TIER", label: "Plan" },
                            { key: "CHURN_RISK_LEVEL", label: "Churn Risk" },
                            { key: "NOTIFIED", label: "Notified" },
                            { key: "CREDIT_AMOUNT", label: "Credit Amount", format: (v) => v ? `$${Number(v).toFixed(2)}` : "—" },
                          ]}
                          rows={customers}
                          maxH="max-h-[300px]"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </GlassCard>
              );
            })}
            {filtered.length === 0 ? <div className="text-sm text-text-muted text-center py-8">No incidents match filter</div> : null}
          </div>
        </>
      )}
    </>
  );
}
