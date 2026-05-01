import { NextRequest, NextResponse } from "next/server";
import { cachedQuery, DB } from "@/lib/snowflake";

export async function GET(req: NextRequest) {
  const incidentId = req.nextUrl.searchParams.get("incidentId");

  try {
    if (incidentId) {
      const esc = incidentId.replace(/'/g, "''");
      const [impact, summary] = await Promise.all([
        cachedQuery(`SELECT ii.CUSTOMER_ID, ii.IMPACT_LEVEL, ii.NOTIFIED, ii.CREDIT_AMOUNT, cu.FIRST_NAME||' '||cu.LAST_NAME AS CUSTOMER_NAME, cu.PLAN_TIER, cu.SEGMENT, cu.MONTHLY_CHARGE, cs.CHURN_RISK_LEVEL FROM ${DB}.TELECOM_INCIDENT_IMPACT ii JOIN ${DB}.TELECOM_CUSTOMERS cu ON ii.CUSTOMER_ID=cu.CUSTOMER_ID LEFT JOIN ${DB}.TELECOM_CHURN_SCORES cs ON ii.CUSTOMER_ID=cs.CUSTOMER_ID WHERE ii.INCIDENT_ID='${esc}' ORDER BY cu.SEGMENT DESC, cu.MONTHLY_CHARGE DESC LIMIT 100`, 15000),
        cachedQuery(`SELECT COUNT(*) AS TOTAL_IMPACTED, SUM(CASE WHEN IMPACT_LEVEL='No Service' THEN 1 ELSE 0 END) AS NO_SERVICE, SUM(CASE WHEN IMPACT_LEVEL='Degraded' THEN 1 ELSE 0 END) AS DEGRADED, SUM(CASE WHEN IMPACT_LEVEL='Intermittent' THEN 1 ELSE 0 END) AS INTERMITTENT, SUM(CASE WHEN NOTIFIED=TRUE THEN 1 ELSE 0 END) AS ALREADY_NOTIFIED, SUM(CASE WHEN NOTIFIED=FALSE THEN 1 ELSE 0 END) AS PENDING_NOTIFICATION, SUM(CREDIT_AMOUNT) AS TOTAL_CREDITS_APPLIED FROM ${DB}.TELECOM_INCIDENT_IMPACT WHERE INCIDENT_ID='${esc}'`, 15000),
      ]);
      return NextResponse.json({ impact, summary: summary[0] });
    }

    const rows = await cachedQuery(`SELECT i.INCIDENT_ID, i.INCIDENT_TYPE, i.SEVERITY, i.STATUS, i.AFFECTED_AREA, i.AFFECTED_SERVICES, i.ROOT_CAUSE, i.REGION, i.STARTED_AT, i.RESOLVED_AT, i.DURATION_HOURS, COUNT(DISTINCT ii.CUSTOMER_ID) AS CONFIRMED_IMPACTED FROM ${DB}.TELECOM_INCIDENTS i LEFT JOIN ${DB}.TELECOM_INCIDENT_IMPACT ii ON i.INCIDENT_ID=ii.INCIDENT_ID GROUP BY ALL ORDER BY CASE i.SEVERITY WHEN 'Critical' THEN 1 WHEN 'Major' THEN 2 ELSE 3 END, i.STARTED_AT DESC`, 30000);
    return NextResponse.json(rows);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
