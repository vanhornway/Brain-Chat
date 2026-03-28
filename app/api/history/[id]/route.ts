import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return Response.json({ error: error.message }, { status: 404 });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
