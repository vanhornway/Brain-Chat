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

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    // Check permission
    const permission = await checkAccessToTable(user.id, "hike_sessions", "write");
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { hike_date, trail_id, notes, photo_count } = body;

    if (!hike_date || typeof hike_date !== "string") {
      return NextResponse.json(
        { error: "hike_date is required (YYYY-MM-DD format)" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Create hike session
    const { data, error } = await supabase
      .from("hike_sessions")
      .insert({
        user_id: user.id,
        hike_date,
        trail_id,
        notes,
        photo_count: photo_count || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      hike_session: data,
      message: "Hike session created. Ready for face detection.",
    });
  } catch (err) {
    console.error("POST /api/hiking/upload error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
