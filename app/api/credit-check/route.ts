export async function POST(req: Request) {
  const { apiKey } = await req.json();
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 400 });

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return Response.json({ error: "Failed to fetch credit info" }, { status: res.status });
    const data = await res.json();
    // data.data.limit_remaining is the prepaid credit balance remaining (USD)
    return Response.json({ limit_remaining: data?.data?.limit_remaining ?? null });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
