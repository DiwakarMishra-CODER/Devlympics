const GROQ = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const TOKENHARBOR = "https://tokenharbor.ai/v1/chat/completions";

// A key env var may hold several comma-separated keys. When one is rejected (rate limit, quota,
// bad key) the same request is retried at once with the next one.
const keyList = (name) => (process.env[name] ?? "").split(",").map((k) => k.trim()).filter(Boolean);
const ROTATE_ON = new Set([401, 403, 429]);

// Tiers run in order; providers inside one tier are raced and the first usable answer wins.
// Timeouts add up to 24s worst case, under the route's maxDuration of 30s.
const TIERS = [
  [{ name: "groq-qwen", url: GROQ, model: "qwen/qwen3.8-27b", timeout: 6000, keys: () => keyList("GROQ_API_KEY") }],
  // reasoning_effort "none" turns off Gemini 2.5 thinking, which otherwise adds seconds
  [{ name: "gemini", url: GEMINI, model: "gemini-2.5-flash", timeout: 8000, extra: { reasoning_effort: "none" }, keys: () => keyList("GEMINI_API_KEY") }],
  [
    { name: "deepseek-free", url: TOKENHARBOR, model: "deepseek-v4.1-flash:free", timeout: 10000, keys: () => keyList("TOKENHARBOR_API_KEY") },
    { name: "mimo-free",     url: TOKENHARBOR, model: "mimo-v2.6-flash:free",     timeout: 10000, keys: () => keyList("TOKENHARBOR_API_KEY") },
  ],
];

// Index of the key that last worked, per provider, so later requests skip keys already used up.
const cursor = new Map();

async function tryProvider(p, messages, parse, signal) {
  const keys = p.keys();
  if (!keys.length) return null;
  const start = cursor.get(p.name) ?? 0;
  // One deadline for all keys, so rotating can't stretch the tier past its timeout.
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(p.timeout)]);

  for (let i = 0; i < keys.length; i++) {
    const k = (start + i) % keys.length;
    try {
      const res = await fetch(p.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${keys[k]}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: p.model, messages, temperature: 0.3, ...p.extra }),
        signal: deadline,
      });
      if (!res.ok) {
        console.warn(p.name, `key ${k + 1}/${keys.length}`, "status", res.status);
        if (ROTATE_ON.has(res.status)) continue; // this key is spent or invalid: try the next
        return null; // server-side error: another key won't help
      }
      cursor.set(p.name, k);
      const json = await res.json();
      const data = parse(json.choices?.[0]?.message?.content ?? "");
      if (data) return { provider: p.name, data };
      console.warn(p.name, "unusable output");
      return null;
    } catch (e) {
      if (!signal.aborted) console.warn(p.name, e.message);
      return null; // timeout or network failure, not a key problem
    }
  }
  // Every key was rejected; start from the next one next time.
  cursor.set(p.name, (start + 1) % keys.length);
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
