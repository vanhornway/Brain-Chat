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
    const permission = await checkAccessToTable(user.id, "hikers", "read");
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Access denied" },
        { status: 403 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hikers")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ hikers: data || [] });
  } catch (err) {
    console.error("GET /api/hiking/hikers error:", err);
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
    const permission = await checkAccessToTable(user.id, "hikers", "write");
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hikers")
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ hiker: data });
  } catch (err) {
    console.error("POST /api/hiking/hikers error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
