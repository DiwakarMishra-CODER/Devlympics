export async function askSaathi(request) {
  const res = await fetch("/api/saathi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`askSaathi failed: ${res.status}`);
  return res.json();
}
