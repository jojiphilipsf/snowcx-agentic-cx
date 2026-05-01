"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { GlassCard, KPICard, DataTable, PageHeader, TabBar, LoadingState, StatusBadge } from "@/components/ui";
import { NocBarChart, NocDonutChart } from "@/components/Charts";
import { useFetch } from "@/lib/hooks";
import { RISK_COLORS } from "@/lib/colors";

interface Overview {
  churnOverview: Record<string, unknown>[];
  callStats: Record<string, unknown>;
  revenue: Record<string, unknown>[];
  offers: Record<string, unknown>[];
}

const TABS = [
  { key: "overview", label: "Churn Risk Overview" },
  { key: "upsell", label: "Offers & Upsell" },
];

const CATEGORY_COLORS: Record<string, string> = { Retention: "#ef4444", Upsell: "#10b981" };

export default function NextBestActionPage() {
  const [tab, setTab] = useState("overview");
  const { data: overview, loading: ovLoading } = useFetch<Overview>("/api/next-best-action?section=overview");
  const [riskFilter, setRiskFilter] = useState("All");
  const [callOnly, setCallOnly] = useState(false);

  const atRiskUrl = tab === "overview"
    ? `/api/next-best-action?section=at-risk${riskFilter !== "All" ? `&risk=${riskFilter}` : ""}${callOnly ? "&callOnly=true" : ""}`
    : null;
  const { data: atRisk, loading: arLoading } = useFetch<Record<string, unknown>[]>(atRiskUrl, [riskFilter, callOnly]);

  const [selectedCid, setSelectedCid] = useState<string | null>(null);
  const nbaUrl = selectedCid ? `/api/next-best-action?section=nba&cid=${selectedCid}` : null;
  const { data: nbaData, loading: nbaLoading } = useFetch<Record<string, unknown>[]>(nbaUrl, [selectedCid]);

  const churnOverview = overview?.churnOverview ?? [];
  const callStats = overview?.callStats ?? {};
  const revenue = overview?.revenue ?? [];
  const offers = overview?.offers ?? [];

  const atRiskRows = atRisk ?? [];
  const selIdx = selectedCid ? atRiskRows.findIndex((r) => String(r.CUSTOMER_ID) === selectedCid) : -1;
  const nbaRows = nbaData ?? [];

  return (
    <>
      <PageHeader title="Next Best Action" sub="Churn prevention, retention offers, and revenue optimization" icon={<TrendingUp size={20} />} />
      <TabBar tabs={TABS} active={tab} onChange={(t) => { setTab(t); setSelectedCid(null); }} />

      {tab === "overview" ? (
        ovLoading ? <LoadingState /> : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Risk Distribution</h3>
                <NocDonutChart data={churnOverview} nameKey="CHURN_RISK_LEVEL" valueKey="CUSTOMER_COUNT" colorMap={RISK_COLORS} />
              </GlassCard>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Revenue at Risk by Segment</h3>
                <NocBarChart data={revenue} xKey="SEGMENT" yKey="MONTHLY_REVENUE_AT_RISK" color="#ef4444" />
              </GlassCard>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <KPICard label="Negative Call Customers" value={String(callStats.NEG_CALL_CUSTOMERS ?? "—")} gradient="red" />
              <KPICard label="High Risk from Calls" value={String(callStats.HIGH_RISK_FROM_CALLS ?? "—")} gradient="orange" />
              <KPICard label="Avg Risk Score" value={callStats.AVG_RISK_SCORE ? Number(callStats.AVG_RISK_SCORE).toFixed(3) : "—"} gradient="cyan" />
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setSelectedCid(null); }} className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan">
                <option value="All">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={callOnly} onChange={(e) => { setCallOnly(e.target.checked); setSelectedCid(null); }} className="accent-[#29b5e8]" />
                Negative call history only
              </label>
              <span className="text-xs text-text-muted ml-auto">{atRiskRows.length} customers</span>
            </div>

            {arLoading ? <LoadingState /> : (
              <DataTable
                columns={[
                  { key: "CUSTOMER_ID", label: "ID" },
                  { key: "NAME", label: "Customer" },
                  { key: "PLAN_NAME", label: "Plan" },
                  { key: "SEGMENT", label: "Segment" },
                  { key: "MONTHLY_CHARGE", label: "Monthly ($)", format: (v) => v ? `$${Number(v).toFixed(0)}` : "—" },
                  { key: "CHURN_RISK_SCORE", label: "Score", format: (v) => v ? Number(v).toFixed(3) : "—" },
                  { key: "CHURN_RISK_LEVEL", label: "Risk" },
                  { key: "HAS_NEGATIVE_CALLS", label: "Neg Calls", format: (v) => v ? "Yes" : "" },
                ]}
                rows={atRiskRows}
                onRowClick={(row) => setSelectedCid(String(row.CUSTOMER_ID))}
                selectedIndex={selIdx >= 0 ? selIdx : undefined}
                maxH="max-h-[320px]"
              />
            )}

            {selectedCid ? (
              <GlassCard className="mt-5">
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">NBA Recommendations — {selectedCid}</h3>
                {nbaLoading ? <LoadingState /> : nbaRows.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {nbaRows.map((nba, i) => {
                      const cat = String(nba.OFFER_CATEGORY ?? "");
                      const catColor = CATEGORY_COLORS[cat] ?? "#29b5e8";
                      return (
                        <div key={i} className="rounded-xl border border-border-default bg-bg-surface p-4 hover:border-border-hover transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-text-muted">#{String(nba.RECOMMENDATION_RANK ?? i + 1)}</span>
                            <StatusBadge label={cat} color={catColor} />
                          </div>
                          <div className="text-sm font-semibold text-text-primary mb-1">{String(nba.OFFER_NAME ?? "—")}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                            <div>Propensity: <span className="text-text-primary font-medium">{nba.PROPENSITY_SCORE ? `${Number(nba.PROPENSITY_SCORE).toFixed(0)}%` : "—"}</span></div>
                            <div>Value: <span className="text-text-primary font-medium">{nba.ESTIMATED_MONTHLY_VALUE ? `$${Number(nba.ESTIMATED_MONTHLY_VALUE).toFixed(0)}/mo` : "—"}</span></div>
                            <div>Channel: <span className="text-text-primary font-medium">{String(nba.CHANNEL_PREFERENCE ?? "—")}</span></div>
                          </div>
                          {nba.REASON ? (
                            <div className="mt-2 text-[11px] text-text-muted leading-relaxed">{String(nba.REASON)}</div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : <div className="text-sm text-text-muted text-center py-4">No recommendations available</div>}
              </GlassCard>
            ) : null}
          </>
        )
      ) : null}

      {tab === "upsell" ? (
        ovLoading ? <LoadingState /> : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Offer Categories</h3>
                <NocDonutChart data={offers} nameKey="OFFER_CATEGORY" valueKey="TOTAL_RECOMMENDATIONS" />
              </GlassCard>
              <GlassCard>
                <h3 className="text-accent-cyan font-semibold text-sm mb-3">Potential MRR by Category</h3>
                <NocBarChart data={offers} xKey="OFFER_CATEGORY" yKey="TOTAL_POTENTIAL_MRR" color="#10b981" />
              </GlassCard>
            </div>

            <DataTable
              columns={[
                { key: "OFFER_CATEGORY", label: "Category" },
                { key: "TOTAL_RECOMMENDATIONS", label: "Recommendations" },
                { key: "AVG_PROPENSITY", label: "Avg Propensity %", format: (v) => v ? `${Number(v).toFixed(1)}%` : "—" },
                { key: "TOTAL_POTENTIAL_MRR", label: "Potential MRR $", format: (v) => v ? `$${Number(v).toLocaleString()}` : "—" },
              ]}
              rows={offers}
            />
          </>
        )
      ) : null}
    </>
  );
}
