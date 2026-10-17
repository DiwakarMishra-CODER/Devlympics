const GROQ = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const TOKENHARBOR = "https://tokenharbor.ai/v1/chat/completions";

// Tiers run in order; providers inside one tier are raced and the first usable answer wins.
// Timeouts add up to 24s worst case, under the route's maxDuration of 30s.
const TIERS = [
  [{ name: "groq-qwen", url: GROQ, model: "qwen/qwen3.8-27b", timeout: 6000, key: () => process.env.GROQ_API_KEY }],
  // reasoning_effort "none" turns off Gemini 2.5 thinking, which otherwise adds seconds
  [{ name: "gemini", url: GEMINI, model: "gemini-2.5-flash", timeout: 8000, extra: { reasoning_effort: "none" }, key: () => process.env.GEMINI_API_KEY }],
  [
    { name: "deepseek-free", url: TOKENHARBOR, model: "deepseek-v4.1-flash:free", timeout: 10000, key: () => process.env.TOKENHARBOR_API_KEY },
    { name: "mimo-free",     url: TOKENHARBOR, model: "mimo-v2.6-flash:free",     timeout: 10000, key: () => process.env.TOKENHARBOR_API_KEY },
  ],
];

async function tryProvider(p, messages, parse, signal) {
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: p.model, messages, temperature: 0.3, ...p.extra }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(p.timeout)]),
    });
    if (!res.ok) { console.warn(p.name, "status", res.status); return null; }
    const json = await res.json();
    const data = parse(json.choices?.[0]?.message?.content ?? "");
    if (data) return { provider: p.name, data };
    console.warn(p.name, "unusable output");
  } catch (e) {
    if (!signal.aborted) console.warn(p.name, e.message);
  }
  return null;
}

export async function askProviders(messages, parse) {
  for (const tier of TIERS) {
    const race = new AbortController();
    const result = await Promise.any(
      tier.map((p) => tryProvider(p, messages, parse, race.signal).then((r) => r ?? Promise.reject()))
    ).catch(() => null);
    race.abort(); // cancel the slower provider so it doesn't burn quota
    if (result) return result;
  }
  return null;
}
