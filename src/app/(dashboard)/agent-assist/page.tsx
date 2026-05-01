"use client";

import { useState, useMemo } from "react";
import { Headset } from "lucide-react";
import { GlassCard, KPICard, StatusBadge, PageHeader, LoadingState, TextBlock } from "@/components/ui";
import { useFetch } from "@/lib/hooks";
import { PRIORITY_COLORS } from "@/lib/colors";

export default function AgentAssistPage() {
  const { data: cases, loading } = useFetch<Record<string, unknown>[]>("/api/agent-assist?section=cases");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);

  const rows = cases ?? [];

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      if (sourceFilter === "Call Center" && !c.CALL_AUDIO_FILE) return false;
      if (sourceFilter === "Other" && c.CALL_AUDIO_FILE) return false;
      if (priorityFilter !== "All" && String(c.PRIORITY ?? "") !== priorityFilter) return false;
      return true;
    });
  }, [rows, sourceFilter, priorityFilter]);

  const selectedCase = filtered.find((c) => String(c.CASE_ID) === selectedCaseId) ?? null;

  const callCount = rows.filter((c) => c.CALL_AUDIO_FILE).length;
  const critHigh = rows.filter((c) => c.PRIORITY === "Critical" || c.PRIORITY === "High").length;

  const generateSummary = async (caseRow: Record<string, unknown>) => {
    const cid = String(caseRow.CASE_ID);
    if (aiSummary[cid]) return;
    setAiLoading(true);
    try {
      const context = `Case ID: ${caseRow.CASE_ID}, Customer: ${caseRow.CUSTOMER_NAME}, Category: ${caseRow.CATEGORY}, Priority: ${caseRow.PRIORITY}, Sentiment: ${caseRow.SENTIMENT}, Channel: ${caseRow.CHANNEL}, Churn Risk: ${caseRow.CHURN_RISK_LEVEL}` +
        (caseRow.CALL_AUDIO_FILE ? `, Call File: ${caseRow.CALL_AUDIO_FILE}, Intent: ${caseRow.CALL_INTENT}, Issue: ${caseRow.CALL_ISSUE}` : "");
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, question: "Summarize this case and provide recommended actions, de-escalation strategy if needed, and a suggested resolution script." }),
      });
      const json = await res.json();
      setAiSummary((prev) => ({ ...prev, [cid]: json.response ?? "No response" }));
    } catch {
      setAiSummary((prev) => ({ ...prev, [cid]: "Error generating summary." }));
    } finally {
      setAiLoading(false);
    }
  };

  const sourceButtons = ["All", "Call Center", "Other"];
  const priorityButtons = ["All", "Critical", "High", "Medium", "Low"];

  return (
    <>
      <PageHeader title="Agent Assist" sub="AI-powered case summarization and recommendations" icon={<Headset size={20} />} />

      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <KPICard label="Open Cases" value={rows.length} gradient="cyan" />
            <KPICard label="From Call Center" value={callCount} gradient="orange" />
            <KPICard label="Critical / High Churn" value={critHigh} gradient="red" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Source:</span>
            {sourceButtons.map((s) => (
              <button key={s} onClick={() => setSourceFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sourceFilter === s ? "bg-accent-cyan text-white" : "bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary"}`}>{s}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Priority:</span>
            {priorityButtons.map((p) => (
              <button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${priorityFilter === p ? "bg-accent-cyan text-white" : "bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary"}`}>{p}</button>
            ))}
            <span className="text-xs text-text-muted ml-auto">{filtered.length} cases</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 max-h-[600px] overflow-y-auto space-y-2 pr-1">
              {filtered.map((c) => {
                const cid = String(c.CASE_ID);
                const isSelected = cid === selectedCaseId;
                return (
                  <button
                    key={cid}
                    onClick={() => setSelectedCaseId(cid)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-accent-cyan bg-accent-cyan-glow" : "border-border-default bg-bg-surface hover:border-border-hover"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text-primary">{cid}</span>
                      <StatusBadge label={String(c.PRIORITY ?? "")} color={PRIORITY_COLORS[String(c.PRIORITY ?? "")] ?? "#64748b"} />
                    </div>
                    <div className="text-sm text-text-secondary truncate">{String(c.CUSTOMER_NAME ?? "")}</div>
                    <div className="text-[11px] text-text-muted truncate">{String(c.CATEGORY ?? "")}</div>
                    {c.CALL_AUDIO_FILE ? (
                      <div className="mt-1 text-[10px] font-semibold text-red-400">From negative call</div>
                    ) : null}
                  </button>
                );
              })}
              {filtered.length === 0 ? <div className="text-sm text-text-muted text-center py-8">No cases match filters</div> : null}
            </div>

            <div className="lg:col-span-2">
              {selectedCase ? (
                <GlassCard>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <KPICard label="Case ID" value={String(selectedCase.CASE_ID ?? "—")} gradient="cyan" />
                    <KPICard label="Customer" value={String(selectedCase.CUSTOMER_NAME ?? "—")} gradient="blue" />
                    <KPICard label="Churn Risk" value={String(selectedCase.CHURN_RISK_LEVEL ?? "—")} gradient="red" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <KPICard label="Category" value={String(selectedCase.CATEGORY ?? "—")} gradient="purple" />
                    <KPICard label="Priority" value={String(selectedCase.PRIORITY ?? "—")} gradient="orange" />
                    <KPICard label="Sentiment" value={String(selectedCase.SENTIMENT ?? "—")} gradient={selectedCase.SENTIMENT === "Negative" ? "red" : "green"} />
                    <KPICard label="Channel" value={String(selectedCase.CHANNEL ?? "—")} gradient="indigo" />
                  </div>

                  {selectedCase.CALL_AUDIO_FILE ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4">
                      <div className="text-xs font-semibold text-red-400 mb-2">Flagged from Negative Call</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div><span className="text-text-muted text-[11px]">Audio File:</span> <span className="text-text-secondary">{String(selectedCase.CALL_AUDIO_FILE)}</span></div>
                        <div><span className="text-text-muted text-[11px]">Intent:</span> <span className="text-text-secondary">{String(selectedCase.CALL_INTENT ?? "—")}</span></div>
                        <div><span className="text-text-muted text-[11px]">Issue:</span> <span className="text-text-secondary">{String(selectedCase.CALL_ISSUE ?? "—")}</span></div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    onClick={() => generateSummary(selectedCase)}
                    disabled={aiLoading || !!aiSummary[String(selectedCase.CASE_ID)]}
                    className="w-full py-3 rounded-xl bg-accent-cyan text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {aiLoading ? "Generating…" : aiSummary[String(selectedCase.CASE_ID)] ? "Summary Generated" : "Generate AI Summary"}
                  </button>

                  {aiSummary[String(selectedCase.CASE_ID)] ? (
                    <TextBlock label="AI Summary & Recommendations" text={aiSummary[String(selectedCase.CASE_ID)]} maxH="max-h-[300px]" />
                  ) : null}
                </GlassCard>
              ) : (
                <GlassCard className="flex items-center justify-center min-h-[300px]">
                  <div className="text-text-muted text-sm">Select a case to view details</div>
                </GlassCard>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
