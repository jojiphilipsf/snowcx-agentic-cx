import { NextRequest, NextResponse } from "next/server";
import { cachedQuery, DB } from "@/lib/snowflake";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") || "cases";
  const caseId = req.nextUrl.searchParams.get("caseId");
  const cid = req.nextUrl.searchParams.get("cid");

  try {
    if (section === "cases") {
      const rows = await cachedQuery(`SELECT c.CASE_ID, c.CUSTOMER_ID, cu.FIRST_NAME||' '||cu.LAST_NAME AS CUSTOMER_NAME, c.CATEGORY, c.SUBCATEGORY, c.STATUS, c.PRIORITY, c.SENTIMENT, c.CREATED_AT, c.CHANNEL, c.ASSIGNED_AGENT, c.CALL_AUDIO_FILE, c.CALL_INTENT, c.CALL_ISSUE, cs.CHURN_RISK_LEVEL, cs.CHURN_RISK_SCORE FROM ${DB}.TELECOM_CASES c JOIN ${DB}.TELECOM_CUSTOMERS cu ON c.CUSTOMER_ID=cu.CUSTOMER_ID LEFT JOIN ${DB}.TELECOM_CHURN_SCORES cs ON c.CUSTOMER_ID=cs.CUSTOMER_ID WHERE c.STATUS IN ('Open','In Progress','Escalated') ORDER BY CASE WHEN c.CALL_AUDIO_FILE IS NOT NULL THEN 0 ELSE 1 END, CASE c.PRIORITY WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, c.CREATED_AT LIMIT 100`, 20000);
      return NextResponse.json(rows);
    }
    if (section === "notes" && caseId) {
      const rows = await cachedQuery(`SELECT NOTE_SEQUENCE, NOTE_TEXT, AGENT_ID, NOTE_TIMESTAMP, CHANNEL FROM ${DB}.TELECOM_CASE_NOTES WHERE CASE_ID='${caseId}' ORDER BY NOTE_SEQUENCE LIMIT 50`, 15000);
      return NextResponse.json(rows);
    }
    if (section === "context" && cid) {
      const rows = await cachedQuery(`SELECT cu.FIRST_NAME, cu.LAST_NAME, cu.PLAN_NAME, cu.PLAN_TIER, cu.TENURE_MONTHS, cu.MONTHLY_CHARGE, cu.SEGMENT, cu.NPS_SCORE, cu.CSAT_SCORE, d.DEVICE_MODEL, d.DEVICE_OS, d.DEVICE_AGE_MONTHS, cs.CHURN_RISK_SCORE, cs.CHURN_RISK_LEVEL, cs.PRIMARY_RISK_FACTORS FROM ${DB}.TELECOM_CUSTOMERS cu LEFT JOIN ${DB}.TELECOM_DEVICES d ON cu.CUSTOMER_ID=d.CUSTOMER_ID LEFT JOIN ${DB}.TELECOM_CHURN_SCORES cs ON cu.CUSTOMER_ID=cs.CUSTOMER_ID WHERE cu.CUSTOMER_ID='${cid}'`, 15000);
      return NextResponse.json(rows[0] || null);
    }
    if (section === "call-history" && cid) {
      const rows = await cachedQuery(`SELECT AUDIO_FILE, CALL_DATE, CALL_INTENT, CONVERSATION_SENTIMENT, FIRST_CALL_RESOLUTION, NET_PROMOTER_SCORE, ISSUE, RESOLUTION, REPRESENTATIVE, CONVERSATION_SUMMARY FROM ${DB}.TELECOM_CALL_RECORDINGS WHERE CUSTOMER_ID='${cid}' ORDER BY CALL_DATE DESC LIMIT 20`, 15000);
      return NextResponse.json(rows);
    }
    return NextResponse.json({ error: "invalid section" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
