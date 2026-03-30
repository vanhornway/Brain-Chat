/**
 * Admin endpoint to seed permissions for family members
 *
 * Usage:
 * POST /api/admin/setup-permissions
 * Body: {
 *   "adminKey": "your-secret-admin-key",
 *   "family": [
 *     { "email": "umair@family.com", "userId": "uuid-1", "name": "Umair", "role": "parent" },
 *     { "email": "nyel@family.com", "userId": "uuid-2", "name": "Nyel", "role": "child" },
 *     { "email": "emaad@family.com", "userId": "uuid-3", "name": "Emaad", "role": "child" },
 *     { "email": "omer@family.com", "userId": "uuid-4", "name": "Omer", "role": "child" }
 *   ]
 * }
 *
 * Returns: { success: true, message: "Permissions seeded for X users" }
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminKey, family } = body;

    // Simple auth check
    if (adminKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!family || !Array.isArray(family)) {
      return NextResponse.json(
        { error: "Invalid family array" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    let successCount = 0;
    const errors: string[] = [];

    for (const member of family) {
      const { email, userId, name, role } = member;

      try {
        if (role === "parent") {
          // Grant full access
          await supabase.rpc("grant_full_access_to_user", {
            user_id: userId,
          });

          // Update to read-only for kids
          await supabase
            .from("user_subject_access")
            .update({ can_write: false })
            .eq("user_id", userId)
            .in("subject", ["Nyel", "Emaad", "Omer"]);

          successCount++;
        } else if (role === "child") {
          // Grant child access (restricted)
          await supabase.rpc("grant_child_access_to_user", {
            user_id: userId,
            child_name: name,
          });

          successCount++;
        }
      } catch (err) {
        errors.push(`${email}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `Permissions seeded for ${successCount}/${family.length} users`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Setup failed:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
