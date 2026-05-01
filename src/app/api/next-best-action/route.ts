import { NextRequest, NextResponse } from "next/server";
import { cachedQuery, DB } from "@/lib/snowflake";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") || "overview";
  const cid = req.nextUrl.searchParams.get("cid");
  const riskLevel = req.nextUrl.searchParams.get("risk") || "All";
  const callOnly = req.nextUrl.searchParams.get("callOnly") === "true";

  try {
    if (section === "overview") {
      const [churnOverview, combined, offers] = await Promise.all([
        cachedQuery(`SELECT cs.CHURN_RISK_LEVEL, COUNT(*) AS CUSTOMER_COUNT, ROUND(AVG(cu.MONTHLY_CHARGE),2) AS AVG_MONTHLY_CHARGE, ROUND(AVG(cu.LIFETIME_VALUE),0) AS AVG_LTV, ROUND(AVG(cu.NPS_SCORE),1) AS AVG_NPS FROM ${DB}.TELECOM_CHURN_SCORES cs JOIN ${DB}.TELECOM_CUSTOMERS cu ON cs.CUSTOMER_ID=cu.CUSTOMER_ID GROUP BY cs.CHURN_RISK_LEVEL ORDER BY CASE cs.CHURN_RISK_LEVEL WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END`, 30000),
        cachedQuery(`SELECT COUNT(DISTINCT cr.CUSTOMER_ID) AS NEG_CALL_CUSTOMERS, COUNT(DISTINCT CASE WHEN cs.CHURN_RISK_LEVEL IN ('Critical','High') THEN cr.CUSTOMER_ID END) AS HIGH_RISK_FROM_CALLS, ROUND(AVG(cs.CHURN_RISK_SCORE),2) AS AVG_RISK_SCORE FROM ${DB}.TELECOM_CALL_RECORDINGS cr JOIN ${DB}.TELECOM_CHURN_SCORES cs ON cr.CUSTOMER_ID=cs.CUSTOMER_ID WHERE cr.CONVERSATION_SENTIMENT='Negative'`, 30000),
        cachedQuery(`SELECT OFFER_CATEGORY, COUNT(*) AS TOTAL_RECOMMENDATIONS, ROUND(AVG(PROPENSITY_SCORE),3) AS AVG_PROPENSITY, ROUND(SUM(ESTIMATED_MONTHLY_VALUE),0) AS TOTAL_POTENTIAL_MRR FROM ${DB}.TELECOM_NBA_RECOMMENDATIONS GROUP BY OFFER_CATEGORY ORDER BY TOTAL_POTENTIAL_MRR DESC`, 30000),
      ]);
      const revenue = (churnOverview as Record<string, unknown>[])
        .filter((r) => ["Critical", "High"].includes(r.CHURN_RISK_LEVEL as string))
        .map((r) => ({ SEGMENT: r.CHURN_RISK_LEVEL, AT_RISK_CUSTOMERS: r.CUSTOMER_COUNT, MONTHLY_REVENUE_AT_RISK: Math.round(Number(r.CUSTOMER_COUNT) * Number(r.AVG_MONTHLY_CHARGE)), LTV_AT_RISK: Math.round(Number(r.CUSTOMER_COUNT) * Number(r.AVG_LTV)) }));
      return NextResponse.json({ churnOverview, callStats: combined[0], revenue, offers });
    }
    if (section === "at-risk") {
      const parts: string[] = [];
      if (riskLevel !== "All") parts.push(`cs.CHURN_RISK_LEVEL='${riskLevel}'`);
      if (callOnly) parts.push("cr.CUSTOMER_ID IS NOT NULL");
      const where = parts.length ? `WHERE ${parts.join(" AND ")}` : "";
      const rows = await cachedQuery(`SELECT DISTINCT cs.CUSTOMER_ID, cu.FIRST_NAME||' '||cu.LAST_NAME AS NAME, cu.PLAN_NAME, cu.SEGMENT, cu.MONTHLY_CHARGE, cu.TENURE_MONTHS, cs.CHURN_RISK_SCORE, cs.CHURN_RISK_LEVEL, cs.PRIMARY_RISK_FACTORS, CASE WHEN cr.CUSTOMER_ID IS NOT NULL THEN TRUE ELSE FALSE END AS HAS_NEGATIVE_CALLS, CASE WHEN ca.CUSTOMER_ID IS NOT NULL THEN TRUE ELSE FALSE END AS HAS_OPEN_CASE FROM ${DB}.TELECOM_CHURN_SCORES cs JOIN ${DB}.TELECOM_CUSTOMERS cu ON cs.CUSTOMER_ID=cu.CUSTOMER_ID LEFT JOIN (SELECT DISTINCT CUSTOMER_ID FROM ${DB}.TELECOM_CALL_RECORDINGS WHERE CONVERSATION_SENTIMENT='Negative') cr ON cs.CUSTOMER_ID=cr.CUSTOMER_ID LEFT JOIN (SELECT DISTINCT CUSTOMER_ID FROM ${DB}.TELECOM_CASES WHERE STATUS IN ('Open','In Progress','Escalated')) ca ON cs.CUSTOMER_ID=ca.CUSTOMER_ID ${where} ORDER BY cs.CHURN_RISK_SCORE DESC LIMIT 50`, 15000);
      return NextResponse.json(rows);
    }
    if (section === "nba" && cid) {
      const rows = await cachedQuery(`SELECT RECOMMENDATION_RANK, OFFER_NAME, OFFER_CATEGORY, PROPENSITY_SCORE, ESTIMATED_MONTHLY_VALUE, REASON, CHANNEL_PREFERENCE FROM ${DB}.TELECOM_NBA_RECOMMENDATIONS WHERE CUSTOMER_ID='${cid}' ORDER BY RECOMMENDATION_RANK LIMIT 10`, 15000);
      return NextResponse.json(rows);
    }
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
