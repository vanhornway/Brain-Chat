import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserOrThrow } from "@/lib/auth";
import { checkAccessToTable } from "@/lib/permissions";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars not configured");
  }
  return createClient(url, key);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    // Check permission
    const permission = await checkAccessToTable(user.id, "face_signatures", "read");
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Access denied" },
        { status: 403 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("face_signatures")
      .select("id, embedding, source, created_at")
      .eq("hiker_id", params.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ signatures: data || [] });
  } catch (err) {
    console.error("GET /api/hiking/hikers/[id]/signatures error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
