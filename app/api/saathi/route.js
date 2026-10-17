import { askProviders } from "@/lib/providers";
import { parseAndClean } from "@/lib/clean";
import { buildMessages } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }
  const { mode, language = "hi-IN", history = [], caseContext = null } = body || {};
  if (!["first_call", "follow_up"].includes(mode) || !Array.isArray(history)) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const messages = buildMessages({ mode, language, history, caseContext });
  const result = await askProviders(messages, (text) => parseAndClean(text, { mode, caseContext }));
  if (!result) return Response.json({ error: "ALL_PROVIDERS_FAILED" }, { status: 500 });
  console.log("answered by", result.provider);
  return Response.json(result.data, { headers: { "x-saathi-provider": result.provider } });
}
