const TOKENHARBOR = "https://tokenharbor.ai/v1/chat/completions";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const PROVIDERS = [
  { name: "deepseek-free", url: TOKENHARBOR, model: "deepseek-v4.1-flash:free", key: () => process.env.TOKENHARBOR_API_KEY },
  { name: "mimo-free",     url: TOKENHARBOR, model: "mimo-v2.6-flash:free",     key: () => process.env.TOKENHARBOR_API_KEY },
  { name: "gemini",        url: GEMINI,      model: "gemini-2.5-flash",         key: () => process.env.GEMINI_API_KEY },
];
export async function askProviders(messages, parse) {
  for (const p of PROVIDERS) {
    try {
      const res = await fetch(p.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${p.key()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: p.model, messages, temperature: 0.3 }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) { console.warn(p.name, "status", res.status); continue; }
      const json = await res.json();
      const data = parse(json.choices?.[0]?.message?.content ?? "");
      if (data) return { provider: p.name, data };
      console.warn(p.name, "unusable output");
    } catch (e) { console.warn(p.name, e.message); }
  }
  return null;
}
