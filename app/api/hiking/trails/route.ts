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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    // Check permission
    const permission = await checkAccessToTable(user.id, "trails", "read");
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Access denied" },
        { status: 403 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("trails")
      .select("*")
      .eq("user_id", user.id)
      .order("trail_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ trails: data || [] });
  } catch (err) {
    console.error("GET /api/hiking/trails error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    // Check permission
    const permission = await checkAccessToTable(user.id, "trails", "write");
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      trail_name,
      alltrails_url,
      distance_miles,
      elevation_gain_ft,
      avg_duration_minutes,
    } = body;

    if (!trail_name || typeof trail_name !== "string") {
      return NextResponse.json(
        { error: "trail_name is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("trails")
      .insert({
        user_id: user.id,
        trail_name,
        alltrails_url,
        distance_miles,
        elevation_gain_ft,
        avg_duration_minutes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ trail: data });
  } catch (err) {
    console.error("POST /api/hiking/trails error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
