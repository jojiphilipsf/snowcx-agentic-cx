"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UserSearch, Send, Sparkles } from "lucide-react";
import { GlassCard, KPICard, StatusBadge, DataTable, PageHeader, TabBar, LoadingState, TextBlock } from "@/components/ui";
import { NocAreaChart, NocGroupedBar } from "@/components/Charts";
import { useFetch } from "@/lib/hooks";
import { CHART_COLORS, RISK_COLORS } from "@/lib/colors";

interface Customer { CUSTOMER_ID: string; NAME: string; PLAN_NAME: string; SEGMENT: string }
interface Detail {
  customer: Record<string, unknown> | null;
  device: Record<string, unknown> | null;
  usage: Record<string, unknown>[];
  billing: Record<string, unknown>[];
  engagement: Record<string, unknown>[];
  qoe: Record<string, unknown>[];
  cases: Record<string, unknown>[];
  churn: Record<string, unknown> | null;
  calls: Record<string, unknown>[];
  incidents: Record<string, unknown>[];
  nba: Record<string, unknown>[];
  memory: Record<string, unknown> | null;
  actionLog: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
}

function buildContext(d: Detail): string {
  const parts: string[] = [];
  if (d.customer) parts.push(`Customer: ${JSON.stringify(d.customer)}`);
  if (d.device) parts.push(`Device: ${JSON.stringify(d.device)}`);
  if (d.churn) parts.push(`Churn: ${JSON.stringify(d.churn)}`);
  if (d.memory) parts.push(`Memory: ${JSON.stringify(d.memory)}`);
  if (d.usage.length > 0) parts.push(`Usage(recent3): ${JSON.stringify(d.usage.slice(0, 3))}`);
  if (d.billing.length > 0) parts.push(`Billing(recent3): ${JSON.stringify(d.billing.slice(0, 3))}`);
  if (d.cases.length > 0) parts.push(`Cases: ${JSON.stringify(d.cases.slice(0, 5))}`);
  if (d.calls.length > 0) parts.push(`Calls(recent5): ${JSON.stringify(d.calls.slice(0, 5))}`);
  if (d.incidents.length > 0) parts.push(`Incidents: ${JSON.stringify(d.incidents.slice(0, 3))}`);
  if (d.nba.length > 0) parts.push(`NBA: ${JSON.stringify(d.nba)}`);
  if (d.recommendations.length > 0) parts.push(`Recommendations: ${JSON.stringify(d.recommendations)}`);
  if (d.engagement.length > 0) parts.push(`Engagement(recent3): ${JSON.stringify(d.engagement.slice(0, 3))}`);
  if (d.qoe.length > 0) parts.push(`QoE: ${JSON.stringify(d.qoe.slice(0, 3))}`);
  return parts.join("\n");
}

const TABS = [
  { key: "journey", label: "Journey" },
  { key: "memory", label: "Memory" },
  { key: "consent", label: "Consent" },
  { key: "ai", label: "AI Assistant" },
  { key: "device", label: "Device" },
  { key: "usage", label: "Usage" },
  { key: "billing", label: "Billing" },
  { key: "engagement", label: "Engagement" },
  { key: "qoe", label: "QoE" },
  { key: "cases", label: "Cases" },
];

const SUGGESTED_QS = [
  "Summarize this customer's journey",
  "What is the churn risk and why?",
  "What next-best-action do you recommend?",
  "Any recent negative interactions?",
  "Draft a retention offer for this customer",
];

export default function Customer360Page() {
  const { data: customers, loading: custLoading } = useFetch<Customer[]>("/api/customers");
  const [cid, setCid] = useState<string>("");
  const { data: detail, loading: detLoading } = useFetch<Detail>(cid ? `/api/customer-detail?cid=${cid}` : null, [cid]);
  const [tab, setTab] = useState("journey");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customers && customers.length > 0 && !cid) setCid(customers[0].CUSTOMER_ID);
  }, [customers, cid]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const askAI = useCallback(async (question: string) => {
    if (!detail || chatLoading) return;
    const ctx = buildContext(detail);
    setChatHistory((h) => [...h, { role: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx, question }),
      });
      const json = await res.json();
      setChatHistory((h) => [...h, { role: "assistant", text: json.response || json.error || "No response" }]);
    } catch {
      setChatHistory((h) => [...h, { role: "assistant", text: "Error connecting to AI service" }]);
    } finally {
      setChatLoading(false);
    }
  }, [detail, chatLoading]);

  const c = detail?.customer;
  const churnRisk = detail?.churn ? String(detail.churn.CHURN_RISK_LEVEL ?? "") : "";
  const riskColor = RISK_COLORS[churnRisk] || "#64748b";

  return (
    <>
      <PageHeader title="Customer 360" sub="Unified customer intelligence — journey, memory, and AI assistant" icon={<UserSearch size={20} />} />

      <div className="flex items-center gap-4 mb-5">
        <select
          value={cid}
          onChange={(e) => { setCid(e.target.value); setChatHistory([]); }}
          className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan min-w-[260px]"
        >
          {custLoading ? (
            <option>Loading…</option>
          ) : (
            (customers ?? []).map((cu) => (
              <option key={cu.CUSTOMER_ID} value={cu.CUSTOMER_ID}>{cu.NAME} — {cu.PLAN_NAME} ({cu.SEGMENT})</option>
            ))
          )}
        </select>
      </div>

      {detLoading ? <LoadingState /> : detail ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            <KPICard label="Plan" value={c ? String(c.PLAN_NAME ?? "—") : "—"} gradient="cyan" />
            <KPICard label="Monthly Charge" value={c ? `$${c.MONTHLY_CHARGE ?? "—"}` : "—"} gradient="blue" />
            <KPICard label="Churn Risk" value={churnRisk || "—"} gradient={churnRisk === "Critical" || churnRisk === "High" ? "red" : "green"} sub={detail.churn ? `Score: ${detail.churn.CHURN_RISK_SCORE ?? ""}` : undefined} />
            <KPICard label="Lines" value={c ? String(c.NUM_LINES ?? "—") : "—"} gradient="purple" />
            <KPICard label="LTV" value={c ? `$${c.LIFETIME_VALUE ?? "—"}` : "—"} gradient="orange" />
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {detail.calls.some((cl) => String(cl.CONVERSATION_SENTIMENT) === "Negative") ? <StatusBadge label="Negative Sentiment" color="#ef4444" /> : null}
            {detail.cases.some((cs) => ["Open", "In Progress", "Escalated"].includes(String(cs.STATUS))) ? <StatusBadge label="Open Case" color="#f59e0b" /> : null}
            {detail.incidents.some((inc) => String(inc.STATUS) === "Active") ? <StatusBadge label="Active Incident" color="#f97316" /> : null}
            {detail.nba.some((n) => String(n.OFFER_CATEGORY) === "Retention") ? <StatusBadge label="Retention NBA" color="#8b5cf6" /> : null}
            {churnRisk === "Critical" || churnRisk === "High" ? <StatusBadge label={`Churn: ${churnRisk}`} color={riskColor} /> : null}
            {detail.memory ? <StatusBadge label="Memory Active" color="#10b981" /> : null}
          </div>

          <TabBar tabs={TABS} active={tab} onChange={setTab} />

          {tab === "journey" ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3 space-y-4">
                <GlassCard>
                  <h3 className="text-accent-cyan font-semibold text-sm mb-3">Journey State</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <KPICard label="Last Intent" value={detail.memory ? String(detail.memory.LAST_INTENT ?? "—") : detail.calls.length > 0 ? String(detail.calls[0].CALL_INTENT ?? "—") : "—"} gradient="cyan" />
                    <KPICard label="Active Specialist" value={detail.memory ? String(detail.memory.ACTIVE_SPECIALIST ?? "—") : "—"} gradient="indigo" />
                    <KPICard label="Language" value={detail.memory ? String(detail.memory.LANGUAGE ?? "EN") : "EN"} gradient="blue" />
                    <KPICard label="Escalation" value={detail.memory ? String(detail.memory.ESCALATION_STATUS ?? "None") : detail.cases.some((cs) => String(cs.PRIORITY) === "Critical") ? "Yes" : "No"} gradient={detail.memory && String(detail.memory.ESCALATION_STATUS) !== "None" && detail.memory.ESCALATION_STATUS ? "red" : "green"} />
                  </div>
                  <TextBlock label="Journey summary" text={detail.memory ? String(detail.memory.LAST_SUMMARY ?? "No summary available") : "No journey data"} />
                  <TextBlock label="Open actions" text={detail.memory && detail.memory.OPEN_ACTIONS ? String(detail.memory.OPEN_ACTIONS) : detail.cases.filter((cs) => String(cs.STATUS) === "Open").map((cs) => `• ${cs.CASE_ID}: ${cs.CATEGORY} (${cs.PRIORITY})`).join("\n") || "No open actions"} />
                  <TextBlock label="Next best action" text={detail.memory && detail.memory.NEXT_BEST_ACTION ? String(detail.memory.NEXT_BEST_ACTION) : detail.nba.map((n) => `• ${n.OFFER_CATEGORY}: ${n.OFFER_NAME ?? "—"}`).join("\n") || "No recommendations"} />
                </GlassCard>
                {detail.recommendations.length > 0 ? (
                  <GlassCard>
                    <h3 className="text-accent-cyan font-semibold text-sm mb-3">Ranked Agent Recommendations</h3>
                    <div className="space-y-2">
                      {detail.recommendations.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface/60 border border-border-default">
                          <span className="w-7 h-7 rounded-full bg-accent-cyan/20 flex items-center justify-center text-xs font-bold text-accent-cyan">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text-primary">{String(r.RECOMMENDATION_TITLE ?? r.AGENT_NAME ?? "Agent")}</div>
                            <div className="text-xs text-text-muted truncate">{String(r.RECOMMENDATION_DETAIL ?? r.EXPECTED_OUTCOME ?? "")}</div>
                          </div>
                          <span className="text-xs font-semibold text-accent-cyan">{r.CONFIDENCE_SCORE ? `${r.CONFIDENCE_SCORE}%` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ) : null}
              </div>
              <div className="lg:col-span-2 space-y-4">
                <GlassCard>
                  <h3 className="text-accent-cyan font-semibold text-sm mb-3">Customer Value</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <KPICard label="LTV" value={c ? `$${c.LIFETIME_VALUE ?? "—"}` : "—"} gradient="orange" />
                    <KPICard label="Tenure" value={c ? `${c.TENURE_MONTHS ?? "—"} mo` : "—"} gradient="cyan" />
                    <KPICard label="Segment" value={c ? String(c.SEGMENT ?? "—") : "—"} gradient="purple" />
                    <KPICard label="Monthly" value={c ? `$${c.MONTHLY_CHARGE ?? "—"}` : "—"} gradient="blue" />
                  </div>
                </GlassCard>
                <GlassCard>
                  <h3 className="text-accent-cyan font-semibold text-sm mb-3">Journey Evidence</h3>
                  <div className="overflow-auto max-h-[300px] rounded-xl border border-border-default">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-bg-elevated/80 sticky top-0">
                        <tr>
                          {["Date", "Channel", "Intent", "Sentiment"].map((h) => (
                            <th key={h} className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.calls.slice(0, 10).map((cl, i) => (
                          <tr key={i} className="border-b border-border-default/50">
                            <td className="px-2 py-1.5 text-text-secondary text-xs">{String(cl.CALL_DATE ?? "—")}</td>
                            <td className="px-2 py-1.5 text-text-secondary text-xs">Voice</td>
                            <td className="px-2 py-1.5 text-text-secondary text-xs">{String(cl.CALL_INTENT ?? "—")}</td>
                            <td className="px-2 py-1.5 text-xs"><StatusBadge label={String(cl.CONVERSATION_SENTIMENT ?? "—")} color={cl.CONVERSATION_SENTIMENT === "Negative" ? "#ef4444" : cl.CONVERSATION_SENTIMENT === "Positive" ? "#10b981" : "#f59e0b"} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : null}

          {tab === "memory" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Conversation Memory</h3>
                {detail.memory ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-surface border border-border-default">
                      <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan text-xs font-bold flex-shrink-0">CH</div>
                      <div>
                        <div className="text-[11px] text-text-muted uppercase tracking-wider">Channel &amp; Language</div>
                        <div className="text-sm text-text-primary">{String(detail.memory.CHANNEL)} · {String(detail.memory.LANGUAGE)}</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20">
                      <div className="text-[11px] text-accent-cyan uppercase tracking-wider font-semibold mb-1">Last Intent</div>
                      <div className="text-sm text-text-primary font-medium">{String(detail.memory.LAST_INTENT)}</div>
                      <div className="text-xs text-text-muted mt-1">Handled by: <span className="text-text-secondary">{String(detail.memory.ACTIVE_SPECIALIST)}</span></div>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-surface border border-border-default">
                      <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">Conversation Summary</div>
                      <div className="text-sm text-text-secondary leading-relaxed">{String(detail.memory.LAST_SUMMARY)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-surface border border-border-default">
                      <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1">Open Actions</div>
                      <div className="text-sm text-text-secondary leading-relaxed">{String(detail.memory.OPEN_ACTIONS)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#10b981]/5 border border-[#10b981]/20">
                      <div className="text-[11px] text-[#10b981] uppercase tracking-wider font-semibold mb-1">Recommended Next Step</div>
                      <div className="text-sm text-text-primary font-medium">{String(detail.memory.NEXT_BEST_ACTION)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-muted px-1">
                      <div>Last contact: <span className="text-text-secondary">{String(detail.memory.LAST_CONTACT_AT)}</span></div>
                      <StatusBadge label={String(detail.memory.ESCALATION_STATUS)} color={String(detail.memory.ESCALATION_STATUS).toLowerCase().includes("escalat") ? "#f97316" : "#10b981"} />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-muted text-center py-8">No conversation memory available for this customer</div>
                )}
              </GlassCard>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Rep Assist Brief</h3>
                <TextBlock label="Customer context" text={detail.memory ? String(detail.memory.REP_ASSIST_BRIEF ?? detail.memory.LAST_SUMMARY ?? "No brief available") : "No memory data"} maxH="max-h-60" />
                <TextBlock label="Key signals" text={[
                  detail.calls.some((cl) => String(cl.CONVERSATION_SENTIMENT) === "Negative") ? "⚠ Recent negative sentiment detected" : null,
                  churnRisk === "Critical" || churnRisk === "High" ? `⚠ Churn risk: ${churnRisk}` : null,
                  detail.incidents.length > 0 ? `⚠ ${detail.incidents.length} active incident(s)` : null,
                  detail.nba.length > 0 ? `✦ ${detail.nba.length} NBA recommendation(s)` : null,
                ].filter(Boolean).join("\n") || "No active signals"} maxH="max-h-40" />
                <TextBlock label="Recommended approach" text={detail.nba.length > 0 ? detail.nba.map((n) => `• ${n.OFFER_CATEGORY}: ${n.OFFER_NAME ?? ""}`).join("\n") : "No recommendations at this time"} maxH="max-h-40" />
              </GlassCard>
            </div>
          ) : null}

          {tab === "consent" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Action Log</h3>
                <DataTable
                  columns={[
                    { key: "ACTION_NAME", label: "Action" },
                    { key: "EXECUTION_STATUS", label: "Status" },
                    { key: "AGENT_NAME", label: "Agent" },
                    { key: "EVENT_TS", label: "Time" },
                  ]}
                  rows={detail.actionLog}
                />
              </GlassCard>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Action Safety Model</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30">
                    <div className="text-sm font-semibold text-[#10b981] mb-1">Tier 1 — Auto-execute</div>
                    <div className="text-xs text-text-secondary">Low-risk, reversible actions: lookup, status check, FAQ, usage summary</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
                    <div className="text-sm font-semibold text-[#f59e0b] mb-1">Tier 2 — Confirm with customer</div>
                    <div className="text-xs text-text-secondary">Moderate risk: plan change, payment arrangement, feature toggle, address update</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30">
                    <div className="text-sm font-semibold text-[#ef4444] mb-1">Tier 3 — Human approval required</div>
                    <div className="text-xs text-text-secondary">High risk, irreversible: account closure, large credit, contract override, escalation</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          ) : null}

          {tab === "ai" ? (
            <GlassCard>
              <h3 className="text-accent-cyan font-semibold text-sm mb-3">AI Assistant</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTED_QS.map((q) => (
                  <button key={q} onClick={() => askAI(q)} className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-default text-xs text-text-secondary hover:border-accent-cyan hover:text-accent-cyan transition-colors">
                    <Sparkles size={12} className="inline mr-1" />{q}
                  </button>
                ))}
              </div>
              <div className="bg-bg-deep/60 rounded-xl border border-border-default p-4 max-h-[400px] overflow-y-auto mb-3 min-h-[120px]">
                {chatHistory.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-8">Ask a question about this customer to get AI-powered insights</div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}>
                      <div className={`inline-block max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.role === "user" ? "bg-accent-cyan/20 text-text-primary" : "bg-bg-surface text-text-secondary"}`}>
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading ? (
                  <div className="flex items-center gap-2 text-sm text-text-muted"><span className="animate-pulse">Thinking…</span></div>
                ) : null}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && chatInput.trim()) askAI(chatInput.trim()); }}
                  placeholder="Ask about this customer…"
                  className="flex-1 bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan"
                />
                <button onClick={() => { if (chatInput.trim()) askAI(chatInput.trim()); }} disabled={chatLoading || !chatInput.trim()} className="px-4 py-2 bg-accent-cyan text-white rounded-lg text-sm font-medium hover:bg-accent-cyan/80 disabled:opacity-40 transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </GlassCard>
          ) : null}

          {tab === "device" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard label="Device" value={detail.device ? String(detail.device.DEVICE_MODEL ?? "—") : "—"} gradient="cyan" />
              <KPICard label="OS" value={detail.device ? String(detail.device.DEVICE_OS ?? "—") : "—"} gradient="blue" />
              <KPICard label="Age" value={detail.device ? `${detail.device.DEVICE_AGE_MONTHS ?? "—"} mo` : "—"} gradient="purple" />
              <KPICard label="Payment Left" value={detail.device ? `$${detail.device.DEVICE_PAYMENT_REMAINING ?? "—"}` : "—"} gradient="orange" />
            </div>
          ) : null}

          {tab === "usage" ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <KPICard label="Data Used" value={detail.usage.length > 0 ? `${detail.usage[0].DATA_USED_GB ?? "—"} GB` : "—"} gradient="cyan" />
                <KPICard label="Data Limit" value={detail.usage.length > 0 ? `${detail.usage[0].DATA_LIMIT_GB ?? "—"} GB` : "—"} gradient="blue" />
                <KPICard label="Voice" value={detail.usage.length > 0 ? `${detail.usage[0].VOICE_MINUTES ?? "—"} min` : "—"} gradient="purple" />
                <KPICard label="SMS" value={detail.usage.length > 0 ? String(detail.usage[0].SMS_COUNT ?? "—") : "—"} gradient="green" />
              </div>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Data Usage Trend</h3>
                <NocAreaChart data={detail.usage} xKey="USAGE_PERIOD" yKey="DATA_USED_GB" color={CHART_COLORS[0]} />
              </GlassCard>
            </>
          ) : null}

          {tab === "billing" ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <KPICard label="Latest Bill" value={detail.billing.length > 0 ? `$${detail.billing[0].TOTAL_AMOUNT ?? "—"}` : "—"} gradient="cyan" />
                <KPICard label="Base Charge" value={detail.billing.length > 0 ? `$${detail.billing[0].BASE_CHARGE ?? "—"}` : "—"} gradient="blue" />
                <KPICard label="Overages" value={detail.billing.length > 0 ? `$${detail.billing[0].OVERAGE_CHARGES ?? "—"}` : "—"} gradient="orange" />
                <KPICard label="Status" value={detail.billing.length > 0 ? String(detail.billing[0].PAYMENT_STATUS ?? "—") : "—"} gradient="green" />
              </div>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Billing Trend</h3>
                <NocAreaChart data={detail.billing} xKey="BILL_DATE" yKey="TOTAL_AMOUNT" color={CHART_COLORS[1]} />
              </GlassCard>
            </>
          ) : null}

          {tab === "engagement" ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <KPICard label="App Logins" value={detail.engagement.length > 0 ? String(detail.engagement[0].APP_LOGINS ?? "—") : "—"} gradient="cyan" />
                <KPICard label="Web Visits" value={detail.engagement.length > 0 ? String(detail.engagement[0].WEB_VISITS ?? "—") : "—"} gradient="blue" />
                <KPICard label="Chat Sessions" value={detail.engagement.length > 0 ? String(detail.engagement[0].CHAT_INTERACTIONS ?? "—") : "—"} gradient="purple" />
                <KPICard label="Last Channel" value={detail.engagement.length > 0 ? String(detail.engagement[0].LAST_CONTACT_CHANNEL ?? "—") : "—"} gradient="green" />
              </div>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Engagement Trend</h3>
                <NocGroupedBar data={detail.engagement} xKey="PERIOD" bars={[
                  { key: "APP_LOGINS", name: "App Logins", color: CHART_COLORS[0] },
                  { key: "WEB_VISITS", name: "Web Visits", color: CHART_COLORS[1] },
                  { key: "CHAT_INTERACTIONS", name: "Chat", color: CHART_COLORS[2] },
                ]} />
              </GlassCard>
            </>
          ) : null}

          {tab === "qoe" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard label="Download Mbps" value={detail.qoe.length > 0 ? String(detail.qoe[0].AVG_DOWNLOAD_MBPS ?? "—") : "—"} gradient="cyan" />
              <KPICard label="Upload Mbps" value={detail.qoe.length > 0 ? String(detail.qoe[0].AVG_UPLOAD_MBPS ?? "—") : "—"} gradient="blue" />
              <KPICard label="Latency ms" value={detail.qoe.length > 0 ? String(detail.qoe[0].AVG_LATENCY_MS ?? "—") : "—"} gradient="orange" />
              <KPICard label="Drop Rate %" value={detail.qoe.length > 0 ? String(detail.qoe[0].DROPPED_CALL_RATE ?? "—") : "—"} gradient="red" />
            </div>
          ) : null}

          {tab === "cases" ? (
            <DataTable
              columns={[
                { key: "CASE_ID", label: "Case ID" },
                { key: "CATEGORY", label: "Category" },
                { key: "STATUS", label: "Status" },
                { key: "PRIORITY", label: "Priority" },
                { key: "SENTIMENT", label: "Sentiment" },
                { key: "CREATED_AT", label: "Created" },
              ]}
              rows={detail.cases}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
