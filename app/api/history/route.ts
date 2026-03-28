import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, provider, model_id, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ sessions: data ?? [] });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: {
    messages: unknown[];
    provider: string;
    modelId: string;
    sessionId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, provider, modelId, sessionId } = body;
  if (!messages?.length) {
    return Response.json({ error: "No messages to save" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const firstUser = (messages as { role: string; content: string }[]).find(
      (m) => m.role === "user"
    );
    const title = (firstUser?.content ?? "Chat").slice(0, 80);

    if (sessionId) {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ messages, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ id: sessionId });
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ title, messages, provider, model_id: modelId })
      .select("id")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ id: data.id });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
