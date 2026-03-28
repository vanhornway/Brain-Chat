export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { prompt: string; apiKey: string; aspectRatio?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, apiKey, aspectRatio = "9:16" } = body;
  if (!prompt || !apiKey) {
    return Response.json({ error: "Missing prompt or apiKey" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            outputMimeType: "image/png",
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message ?? `Google API error ${res.status}`;
      return Response.json({ error: msg }, { status: res.status });
    }

    const base64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) {
      return Response.json({ error: "No image returned from API" }, { status: 500 });
    }

    return Response.json({ base64, mimeType: "image/png" });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
