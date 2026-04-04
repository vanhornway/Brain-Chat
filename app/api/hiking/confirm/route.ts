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

interface AttendanceRecord {
  hiker_id: string;
  confidence: number;
  confirmation_status: "auto_detected" | "manually_confirmed" | "false_positive" | "manually_added";
  embedding?: number[]; // For new hikers (manually_added)
  hiker_name?: string; // For new hikers (manually_added)
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserOrThrow();

    // Check permissions
    const sessionPerm = await checkAccessToTable(user.id, "hike_sessions", "read");
    const attendancePerm = await checkAccessToTable(user.id, "attendance", "write");
    const sigsPerm = await checkAccessToTable(user.id, "face_signatures", "write");

    if (!sessionPerm.allowed || !attendancePerm.allowed) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { hike_session_id, attendance_records } = body;

    if (!hike_session_id || !Array.isArray(attendance_records)) {
      return NextResponse.json(
        { error: "hike_session_id and attendance_records (array) are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Process each attendance record
    const results = [];
    for (const record of attendance_records as AttendanceRecord[]) {
      try {
        // For manually_added with embedding, create new hiker first
        let hiker_id = record.hiker_id;
        if (record.confirmation_status === "manually_added" && record.embedding && record.hiker_name) {
          // Create new hiker
          const { data: hikerData, error: hikerError } = await supabase
            .from("hikers")
            .insert({
              user_id: user.id,
              name: record.hiker_name,
              face_trained: true,
            })
            .select()
            .single();

          if (hikerError) {
            results.push({
              status: "error",
              hiker_id: record.hiker_id,
              message: `Failed to create hiker: ${hikerError.message}`,
            });
            continue;
          }

          hiker_id = hikerData.id;

          // Save face signature for new hiker
          if (sigsPerm.allowed) {
            await supabase.from("face_signatures").insert({
              user_id: user.id,
              hiker_id: hiker_id,
              embedding: record.embedding,
              source: "manual_confirmed",
            });
          }
        }

        // If confirmation_status is "false_positive", delete instead of insert
        if (record.confirmation_status === "false_positive") {
          const { error: deleteError } = await supabase
            .from("attendance")
            .delete()
            .eq("hike_session_id", hike_session_id)
            .eq("hiker_id", hiker_id);

          if (deleteError) {
            results.push({
              status: "error",
              hiker_id,
              message: `Failed to remove: ${deleteError.message}`,
            });
          } else {
            results.push({
              status: "success",
              hiker_id,
              action: "removed_false_positive",
            });
          }
          continue;
        }

        // For auto_detected and manually_confirmed, upsert attendance record
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .upsert(
            {
              hike_session_id,
              hiker_id,
              user_id: user.id,
              confirmation_status: record.confirmation_status,
              confidence: record.confidence,
            },
            {
              onConflict: "hike_session_id,hiker_id",
            }
          )
          .select()
          .single();

        if (attendanceError) {
          results.push({
            status: "error",
            hiker_id,
            message: attendanceError.message,
          });
        } else {
          results.push({
            status: "success",
            hiker_id,
            action: record.confirmation_status,
          });
        }
      } catch (err) {
        results.push({
          status: "error",
          hiker_id: record.hiker_id,
          message: (err as Error).message,
        });
      }
    }

    return NextResponse.json({
      hike_session_id,
      total_records: attendance_records.length,
      results,
      message: "Attendance confirmation complete",
    });
  } catch (err) {
    console.error("POST /api/hiking/confirm error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
