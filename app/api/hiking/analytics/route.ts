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

    // Check permissions
    const hikersPerm = await checkAccessToTable(user.id, "hikers", "read");
    const attendancePerm = await checkAccessToTable(user.id, "attendance", "read");
    const sessionsPerm = await checkAccessToTable(user.id, "hike_sessions", "read");
    const trailsPerm = await checkAccessToTable(user.id, "trails", "read");

    if (
      !hikersPerm.allowed ||
      !attendancePerm.allowed ||
      !sessionsPerm.allowed ||
      !trailsPerm.allowed
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    // Get hiker leaderboard
    const { data: leaderboardData } = await supabase.rpc(
      "get_hiker_leaderboard",
      { p_user_id: user.id }
    );

    // Fallback: if RPC doesn't exist, query directly
    let hikerLeaderboard: any[] = [];
    if (!leaderboardData) {
      const { data: hikers } = await supabase
        .from("hikers")
        .select("id, name")
        .eq("user_id", user.id);

      if (hikers) {
        hikerLeaderboard = await Promise.all(
          hikers.map(async (hiker) => {
            // Get attendance for this hiker
            const { data: attendance } = await supabase
              .from("attendance")
              .select(
                `
                hike_session_id,
                confirmation_status,
                hike_sessions!inner(hike_date, trail_id, trails!inner(distance_miles, elevation_gain_ft, avg_duration_minutes))
              `
              )
              .eq("hiker_id", hiker.id)
              .eq("user_id", user.id)
              .neq("confirmation_status", "false_positive");

            if (!attendance || attendance.length === 0) {
              return {
                name: hiker.name,
                hikes: 0,
                miles: 0,
                elevation: 0,
                streak: 0,
                avg_distance: 0,
                avg_duration: 0,
                avg_elevation: 0,
              };
            }

            const totalMiles = attendance.reduce(
              (sum: number, a: any) =>
                sum + (a.hike_sessions?.trails?.distance_miles || 0),
              0
            );
            const totalElevation = attendance.reduce(
              (sum: number, a: any) =>
                sum + (a.hike_sessions?.trails?.elevation_gain_ft || 0),
              0
            );
            const totalDuration = attendance.reduce(
              (sum: number, a: any) =>
                sum + (a.hike_sessions?.trails?.avg_duration_minutes || 0),
              0
            );

            return {
              name: hiker.name,
              hikes: attendance.length,
              miles: Math.round(totalMiles * 100) / 100,
              elevation: totalElevation,
              streak: 1, // TODO: Implement streak calculation
              avg_distance: Math.round((totalMiles / attendance.length) * 100) / 100,
              avg_duration: Math.round(totalDuration / attendance.length),
              avg_elevation: Math.round(totalElevation / attendance.length),
            };
          })
        );
      }
    } else {
      hikerLeaderboard = leaderboardData;
    }

    // Get trail analytics
    const { data: trails } = await supabase
      .from("trails")
      .select("id, trail_name, distance_miles, elevation_gain_ft, avg_duration_minutes")
      .eq("user_id", user.id);

    let trailAnalytics: any[] = [];
    if (trails) {
      trailAnalytics = await Promise.all(
        trails.map(async (trail) => {
          const { data: sessions } = await supabase
            .from("hike_sessions")
            .select("id")
            .eq("trail_id", trail.id)
            .eq("user_id", user.id);

          if (!sessions || sessions.length === 0) {
            return {
              trail_name: trail.trail_name,
              count: 0,
              avg_hikers: 0,
              avg_distance: trail.distance_miles || 0,
              avg_duration: trail.avg_duration_minutes || 0,
            };
          }

          // Count unique hikers for this trail
          let totalHikers = 0;
          for (const session of sessions) {
            const { data: attendance } = await supabase
              .from("attendance")
              .select("hiker_id")
              .eq("hike_session_id", session.id)
              .neq("confirmation_status", "false_positive");

            totalHikers += attendance?.length || 0;
          }

          return {
            trail_name: trail.trail_name,
            count: sessions.length,
            avg_hikers: Math.round((totalHikers / sessions.length) * 100) / 100,
            avg_distance: trail.distance_miles || 0,
            avg_duration: trail.avg_duration_minutes || 0,
          };
        })
      );
    }

    return NextResponse.json({
      hiker_leaderboard: hikerLeaderboard.sort(
        (a: any, b: any) => b.hikes - a.hikes
      ),
      trail_analytics: trailAnalytics.sort(
        (a: any, b: any) => b.count - a.count
      ),
    });
  } catch (err) {
    console.error("GET /api/hiking/analytics error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
