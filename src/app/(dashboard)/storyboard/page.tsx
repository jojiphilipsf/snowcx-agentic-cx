"use client";

import { Presentation } from "lucide-react";
import { GlassCard, KPICard, PageHeader } from "@/components/ui";

const demoTrack = [
  { step: "1. Customer 360", value: "Show unified context, conversation memory", outcome: "Faster resolution", demo: "Pick customer with negative calls. Show signal badges, journey tab." },
  { step: "2. AI assistant", value: "Grounded CX intelligence", outcome: "Higher agent confidence", demo: "Use suggested question like Journey summary." },
  { step: "3. Call analytics", value: "Interaction data becomes structured intelligence", outcome: "Reduce quality review effort", demo: "Filter to negative calls, open transcript." },
  { step: "4. Agent assist", value: "Rep inherits summary and risk", outcome: "Lower AHT", demo: "Pick case from negative call, show AI briefing." },
  { step: "5. Proactive care", value: "Prevent inbound when network issues known", outcome: "Call deflection", demo: "Open active incident, show impacted customers." },
  { step: "6. Next best action", value: "Connect signals to save/upsell decisions", outcome: "Protect revenue", demo: "Select at-risk customer, show NBA offers." },
];

const agentInventory = [
  { agent: "Intent router", purpose: "Classify inbound intent and route to specialist", metric: "Routing accuracy %" },
  { agent: "Upgrade specialist", purpose: "Handle plan upgrade inquiries and recommendations", metric: "Upgrade conversion rate" },
  { agent: "Billing specialist", purpose: "Resolve billing disputes, explain charges", metric: "First-call resolution %" },
  { agent: "Technical support", purpose: "Troubleshoot network, device, and connectivity issues", metric: "Mean time to resolve" },
  { agent: "Plan optimization", purpose: "Analyze usage and recommend optimal plan", metric: "Plan fit score improvement" },
  { agent: "Retention specialist", purpose: "Engage at-risk customers with save offers", metric: "Save rate %" },
  { agent: "Transaction / action", purpose: "Execute account changes, payments, activations", metric: "Completion rate %" },
  { agent: "Diagnostics & personalization", purpose: "Run network diagnostics and tailor experience", metric: "QoE improvement %" },
  { agent: "Conversation memory", purpose: "Persist context across interactions and channels", metric: "Context recall accuracy" },
  { agent: "Escalation / handoff", purpose: "Transfer to human with full AI briefing", metric: "Handoff completeness score" },
];

const confirmedCapabilities = [
  "Unified customer profile with device, billing, usage, engagement, QoE, and case data",
  "AI-powered journey state engine with real-time signal detection",
  "Conversation memory that persists across sessions and channels",
  "Cortex-driven AI assistant grounded in customer context",
  "Call analytics with automatic sentiment, intent, and quality scoring",
  "Proactive care: network incident detection with customer impact mapping",
  "Next-best-action engine combining churn risk, usage, and engagement signals",
];

const inferredCapabilities = [
  "Multi-turn agent orchestration with autonomous specialist routing",
  "Real-time voice analytics with live sentiment streaming",
  "Predictive network degradation alerts before customer impact",
  "Cross-channel journey stitching (voice + digital + in-store)",
  "Automated compliance and consent-aware action gating",
];

export default function StoryboardPage() {
  return (
    <>
      <PageHeader title="AE Storyline" sub="Demo narrative — value, business outcome, and CX intelligence talk track" icon={<Presentation size={20} />} />

      <div className="mb-6">
        <h3 className="text-accent-cyan font-semibold text-sm mb-3">Business outcomes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Call Deflection" value="10–20%" sub="Proactive care reduces inbound volume" gradient="cyan" />
          <KPICard label="AHT Reduction" value="15–30%" sub="AI briefing + memory accelerates resolution" gradient="green" />
          <KPICard label="Save Uplift" value="5–10 pts" sub="NBA-driven retention offers" gradient="orange" />
          <KPICard label="Upgrade Conversion" value="+8–15%" sub="Context-aware upsell recommendations" gradient="purple" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GlassCard>
          <h3 className="text-accent-cyan font-semibold text-sm mb-3">Recommended 7-minute story arc</h3>
          <ol className="space-y-2 text-text-secondary text-sm">
            <li><span className="text-text-primary font-semibold">1.</span> Set context — who the customer is, what they&apos;re experiencing</li>
            <li><span className="text-text-primary font-semibold">2.</span> Define problem — fragmented tools, no memory, reactive service</li>
            <li><span className="text-text-primary font-semibold">3.</span> Introduce answer — unified CX intelligence platform on Snowflake</li>
            <li><span className="text-text-primary font-semibold">4.</span> Prove intelligence — walk through live demo with real customer data</li>
            <li><span className="text-text-primary font-semibold">5.</span> Land outcome — quantified business impact across care, revenue, ops</li>
          </ol>
        </GlassCard>

        <GlassCard>
          <h3 className="text-accent-cyan font-semibold text-sm mb-3">Value framing</h3>
          <div className="space-y-3 text-sm text-text-secondary">
            <div><span className="text-text-primary font-semibold">Care leaders:</span> Reduce AHT, improve FCR, deflect calls with proactive care</div>
            <div><span className="text-text-primary font-semibold">Digital leaders:</span> Unified data platform, AI-native architecture, real-time signals</div>
            <div><span className="text-text-primary font-semibold">Revenue teams:</span> Churn prediction, save/upsell recommendations, LTV optimization</div>
            <div><span className="text-text-primary font-semibold">Operations:</span> Network incident impact, automated triage, agent efficiency</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mb-6">
        <h3 className="text-accent-cyan font-semibold text-sm mb-3">Live demo talk track</h3>
        <div className="overflow-auto max-h-[500px] rounded-xl border border-border-default">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-bg-elevated/80 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                {["Step", "Value", "Business Outcome", "How to Demo"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoTrack.map((r, i) => (
                <tr key={i} className="border-b border-border-default/50">
                  <td className="px-3 py-2 text-text-primary font-medium whitespace-nowrap">{r.step}</td>
                  <td className="px-3 py-2 text-text-secondary">{r.value}</td>
                  <td className="px-3 py-2 text-text-secondary">{r.outcome}</td>
                  <td className="px-3 py-2 text-text-secondary">{r.demo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GlassCard>
          <h3 className="text-accent-cyan font-semibold text-sm mb-3">Confirmed capabilities</h3>
          <ul className="space-y-1.5 text-sm text-text-secondary">
            {confirmedCapabilities.map((c, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-[#10b981] mt-0.5">✓</span>{c}</li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <h3 className="text-accent-cyan font-semibold text-sm mb-3">Inferred / future-state</h3>
          <ul className="space-y-1.5 text-sm text-text-secondary">
            {inferredCapabilities.map((c, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-[#f59e0b] mt-0.5">◆</span>{c}</li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard className="mb-6">
        <h3 className="text-accent-cyan font-semibold text-sm mb-3">Agent inventory</h3>
        <div className="overflow-auto max-h-[500px] rounded-xl border border-border-default">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-bg-elevated/80 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                {["Agent", "Purpose", "Success Metric"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agentInventory.map((r, i) => (
                <tr key={i} className="border-b border-border-default/50">
                  <td className="px-3 py-2 text-text-primary font-medium whitespace-nowrap">{r.agent}</td>
                  <td className="px-3 py-2 text-text-secondary">{r.purpose}</td>
                  <td className="px-3 py-2 text-text-secondary">{r.metric}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
