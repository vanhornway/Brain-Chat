import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return Response.json({
      ok: false,
      error: "Missing env vars",
      hasUrl: !!url,
      hasServiceKey: !!key,
    });
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from("thoughts").select("id").limit(1);

    if (error) {
      return Response.json({ ok: false, error: error.message, hint: error.hint });
    }

    return Response.json({ ok: true, rowsReturned: data?.length ?? 0 });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message });
  }
}
