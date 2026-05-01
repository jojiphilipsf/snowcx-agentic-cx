import { NextResponse } from "next/server";
import { cachedQuery, DB } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await cachedQuery(
      `SELECT CUSTOMER_ID, FIRST_NAME || ' ' || LAST_NAME AS NAME, PLAN_NAME, SEGMENT FROM ${DB}.TELECOM_CUSTOMERS ORDER BY CUSTOMER_ID`, 60000
    );
    return NextResponse.json(rows);
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
