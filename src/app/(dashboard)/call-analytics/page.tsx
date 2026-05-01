"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PhoneIncoming, Send, Sparkles } from "lucide-react";
import { GlassCard, KPICard, DataTable, PageHeader, TabBar, LoadingState, TextBlock } from "@/components/ui";
import { NocAreaChart, NocBarChart, NocDonutChart } from "@/components/Charts";
import { useFetch } from "@/lib/hooks";
import { SENTIMENT_COLORS, CHART_COLORS } from "@/lib/colors";

const QUALITY_COLORS: Record<string, string> = { Excellent: "#10b981", Good: "#29b5e8", Average: "#f59e0b", Poor: "#ef4444" };

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "calls", label: "Call Explorer" },
  { key: "reps", label: "Rep Performance" },
];

interface DashData {
  kpis: Record<string, unknown>;
  sentiment: Record<string, unknown>[];
  volume: Record<string, unknown>[];
  intent: Record<string, unknown>[];
  quality: Record<string, unknown>[];
}

const SUGGESTED_QS = [
  "What are the top call drivers this week?",
  "Which reps have the lowest FCR?",
  "Summarize sentiment trends",
  "Any quality concerns?",
];

export default function CallAnalyticsPage() {
  const [tab, setTab] = useState("dashboard");
  const { data: dashData, loading: dashLoading } = useFetch<DashData>(tab === "dashboard" ? "/api/call-analytics?section=dashboard" : null, [tab]);
  const { data: callsData, loading: callsLoading } = useFetch<Record<string, unknown>[]>(tab === "calls" ? "/api/call-analytics?section=calls" : null, [tab]);
  const { data: repsData, loading: repsLoading } = useFetch<Record<string, unknown>[]>(tab === "reps" ? "/api/call-analytics?section=reps" : null, [tab]);
  const [selectedCall, setSelectedCall] = useState<Record<string, unknown> | null>(null);
  const [intentFilter, setIntentFilter] = useState("");
  const [sentFilter, setSentFilter] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const kpis = dashData ? dashData.kpis : null;
  const volume = dashData ? dashData.volume ?? [] : [];
  const sentimentDist = dashData ? dashData.sentiment ?? [] : [];
  const intentDist = dashData ? dashData.intent ?? [] : [];
  const qualityDist = dashData ? dashData.quality ?? [] : [];

  const filteredCalls = (callsData ?? []).filter((c) => {
    if (intentFilter && String(c.CALL_INTENT ?? "") !== intentFilter) return false;
    if (sentFilter && String(c.CONVERSATION_SENTIMENT ?? "") !== sentFilter) return false;
    return true;
  });

  const intents = [...new Set((callsData ?? []).map((c) => String(c.CALL_INTENT ?? "")))].filter(Boolean);
  const sentiments = [...new Set((callsData ?? []).map((c) => String(c.CONVERSATION_SENTIMENT ?? "")))].filter(Boolean);

  const selIdx = selectedCall ? filteredCalls.findIndex((c) => c.AUDIO_FILE === selectedCall.AUDIO_FILE) : -1;

  const askAI = useCallback(async (question: string) => {
    if (chatLoading) return;
    const ctx = selectedCall ? `Selected Call: ${JSON.stringify(selectedCall)}` : dashData ? `Dashboard KPIs: ${JSON.stringify(dashData.kpis)}` : "";
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
  }, [chatLoading, selectedCall, dashData]);

  return (
    <>
      <PageHeader title="Call Analytics" sub="AI-powered interaction analysis — sentiment, intent, and quality scoring" icon={<PhoneIncoming size={20} />} />
      <TabBar tabs={TABS} active={tab} onChange={(t) => { setTab(t); setSelectedCall(null); }} />

      {tab === "dashboard" ? (
        dashLoading ? <LoadingState /> : kpis ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-5">
              <KPICard label="Total Calls" value={String(kpis.TOTAL_CALLS ?? "—")} gradient="cyan" />
              <KPICard label="Total Duration" value={kpis.TOTAL_DURATION_MINS ? `${kpis.TOTAL_DURATION_MINS} min` : "—"} gradient="blue" />
              <KPICard label="Avg Duration" value={kpis.AVG_DURATION_MINS ? `${kpis.AVG_DURATION_MINS} min` : "—"} gradient="indigo" />
              <KPICard label="FCR Rate" value={kpis.FCR_RATE ? `${kpis.FCR_RATE}%` : "—"} gradient="green" />
              <KPICard label="Positive Sentiment" value={kpis.POSITIVE_SENTIMENT_PCT ? `${kpis.POSITIVE_SENTIMENT_PCT}%` : "—"} gradient="green" />
              <KPICard label="Avg NPS" value={String(kpis.AVG_NPS ?? "—")} gradient="purple" />
              <KPICard label="Active Reps" value={String(kpis.ACTIVE_REPS ?? "—")} gradient="orange" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Call Volume Trend</h3>
                <NocAreaChart data={volume} xKey="CALL_DATE" yKey="CALL_COUNT" color={CHART_COLORS[0]} />
              </GlassCard>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Sentiment Distribution</h3>
                <NocDonutChart data={sentimentDist} nameKey="CONVERSATION_SENTIMENT" valueKey="CALL_COUNT" colorMap={SENTIMENT_COLORS} />
              </GlassCard>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Intent Distribution</h3>
                <NocBarChart data={intentDist} xKey="CALL_INTENT" yKey="CALL_COUNT" color={CHART_COLORS[1]} />
              </GlassCard>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Quality Distribution</h3>
                <NocDonutChart data={qualityDist} nameKey="CALL_QUALITY" valueKey="CALL_COUNT" colorMap={QUALITY_COLORS} />
              </GlassCard>
            </div>
            <GlassCard>
              <h3 className="text-accent-cyan font-semibold text-sm mb-3">AI Assistant</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTED_QS.map((q) => (
                  <button key={q} onClick={() => askAI(q)} className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-default text-xs text-text-secondary hover:border-accent-cyan hover:text-accent-cyan transition-colors">
                    <Sparkles size={12} className="inline mr-1" />{q}
                  </button>
                ))}
              </div>
              <div className="bg-bg-deep/60 rounded-xl border border-border-default p-4 max-h-[300px] overflow-y-auto mb-3 min-h-[80px]">
                {chatHistory.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-4">Ask about call analytics trends and insights</div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}>
                      <div className={`inline-block max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.role === "user" ? "bg-accent-cyan/20 text-text-primary" : "bg-bg-surface text-text-secondary"}`}>
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading ? <div className="flex items-center gap-2 text-sm text-text-muted"><span className="animate-pulse">Thinking…</span></div> : null}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && chatInput.trim()) askAI(chatInput.trim()); }}
                  placeholder="Ask about call analytics…"
                  className="flex-1 bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan"
                />
                <button onClick={() => { if (chatInput.trim()) askAI(chatInput.trim()); }} disabled={chatLoading || !chatInput.trim()} className="px-4 py-2 bg-accent-cyan text-white rounded-lg text-sm font-medium hover:bg-accent-cyan/80 disabled:opacity-40 transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </GlassCard>
          </>
        ) : null
      ) : null}

      {tab === "calls" ? (
        callsLoading ? <LoadingState /> : (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              <select value={intentFilter} onChange={(e) => setIntentFilter(e.target.value)} className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan">
                <option value="">All Intents</option>
                {intents.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={sentFilter} onChange={(e) => setSentFilter(e.target.value)} className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan">
                <option value="">All Sentiments</option>
                {sentiments.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-xs text-text-muted self-center">{filteredCalls.length} calls</span>
            </div>
            <DataTable
              columns={[
                { key: "AUDIO_FILE", label: "Audio File" },
                { key: "CUSTOMER_NAME", label: "Customer" },
                { key: "CALL_INTENT", label: "Intent" },
                { key: "CONVERSATION_SENTIMENT", label: "Sentiment" },
                { key: "CALL_QUALITY", label: "Quality" },
                { key: "CALL_DURATION_SECONDS", label: "Duration (s)" },
                { key: "CALL_DATE", label: "Date" },
              ]}
              rows={filteredCalls}
              onRowClick={(row) => setSelectedCall(row)}
              selectedIndex={selIdx >= 0 ? selIdx : undefined}
              maxH="max-h-[320px]"
            />
            {selectedCall ? (
              <GlassCard className="mt-5">
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Call Detail — {String(selectedCall.AUDIO_FILE ?? "")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                  <KPICard label="Customer" value={String(selectedCall.CUSTOMER_NAME ?? "—")} gradient="cyan" />
                  <KPICard label="Intent" value={String(selectedCall.CALL_INTENT ?? "—")} gradient="blue" />
                  <KPICard label="Sentiment" value={String(selectedCall.CONVERSATION_SENTIMENT ?? "—")} gradient={selectedCall.CONVERSATION_SENTIMENT === "Negative" ? "red" : "green"} />
                  <KPICard label="Quality" value={String(selectedCall.CALL_QUALITY ?? "—")} gradient="purple" />
                  <KPICard label="Duration" value={selectedCall.CALL_DURATION_SECONDS ? `${selectedCall.CALL_DURATION_SECONDS}s` : "—"} gradient="orange" />
                  <KPICard label="FCR" value={String(selectedCall.FIRST_CALL_RESOLUTION ?? "—")} gradient="green" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  <TextBlock label="Issue" text={String(selectedCall.ISSUE ?? "Not available")} />
                  <TextBlock label="Resolution" text={String(selectedCall.RESOLUTION ?? "Not available")} />
                  <TextBlock label="Summary" text={String(selectedCall.CONVERSATION_SUMMARY ?? "Not available")} />
                </div>
                {selectedCall.CONVERSATION_STRUCTURED ? (
                  <div>
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Transcript</div>
                    <div className="bg-bg-deep/60 rounded-xl border border-border-default p-3 max-h-[300px] overflow-y-auto">
                      <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">{String(selectedCall.CONVERSATION_STRUCTURED)}</pre>
                    </div>
                  </div>
                ) : null}
              </GlassCard>
            ) : null}
          </>
        )
      ) : null}

      {tab === "reps" ? (
        repsLoading ? <LoadingState /> : repsData ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">FCR by Rep</h3>
                <NocBarChart data={repsData} xKey="REPRESENTATIVE" yKey="FCR_RATE" color={CHART_COLORS[2]} />
              </GlassCard>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">NPS by Rep</h3>
                <NocBarChart data={repsData} xKey="REPRESENTATIVE" yKey="AVG_NPS" color={CHART_COLORS[3]} />
              </GlassCard>
            </div>
            <DataTable
              columns={[
                { key: "REPRESENTATIVE", label: "Rep" },
                { key: "TOTAL_CALLS", label: "Calls" },
                { key: "AVG_DURATION_MINS", label: "Avg Duration (min)" },
                { key: "FCR_RATE", label: "FCR %" },
                { key: "POSITIVE_SENTIMENT_PCT", label: "Positive %" },
                { key: "AVG_NPS", label: "NPS" },
              ]}
              rows={repsData}
            />
          </>
        ) : null
      ) : null}
    </>
  );
}
