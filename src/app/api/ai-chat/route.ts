import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(req: NextRequest) {
  try {
    const { context, question } = await req.json();
    const prompt = `You are a concise telecom CX assistant. Use only the context below. Be specific and brief (under 200 words).

CONTEXT:
${context}

Q: ${question}

Answer with: 1) Direct answer 2) Key signals 3) Next agent/action`;

    const escaped = prompt.replace(/'/g, "''").replace(/\\/g, "\\\\");
    const result = await query<{ RESPONSE: string }>(
      `SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '${escaped}') AS RESPONSE`
    );
    return NextResponse.json({ response: result[0]?.RESPONSE || "" });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
