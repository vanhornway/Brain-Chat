import { createClient } from "@supabase/supabase-js";

// Initialize service role client for permission checks
function getPermissionSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars not configured");
  }
  return createClient(url, key);
}

/**
 * Check if user has table-level access (read or write)
 * Used for tables like finance_income, finance_donations, etc.
 */
export async function checkTableAccess(
  userId: string,
  tableName: string,
  operation: "read" | "write"
): Promise<boolean> {
  try {
    const supabase = getPermissionSupabase();

    const { data, error } = await supabase
      .from("user_table_access")
      .select("can_read, can_write")
      .eq("user_id", userId)
      .eq("table_name", tableName)
      .single();

    if (error || !data) {
      // No explicit permission = deny
      return false;
    }

    if (operation === "read") {
      return data.can_read === true;
    }
    if (operation === "write") {
      return data.can_write === true;
    }

    return false;
  } catch (err) {
    console.error("Permission check failed:", err);
    return false;
  }
}

/**
 * Check if user has subject-level access (e.g., can user access Nyel's health data?)
 * Used for tables with 'subject' column: blood_glucose, scout_progress, college_prep_log, etc.
 */
export async function checkSubjectAccess(
  userId: string,
  subject: string,
  operation: "read" | "write"
): Promise<boolean> {
  try {
    const supabase = getPermissionSupabase();

    const { data, error } = await supabase
      .from("user_subject_access")
      .select("can_read, can_write")
      .eq("user_id", userId)
      .eq("subject", subject)
      .single();

    if (error || !data) {
      return false;
    }

    if (operation === "read") {
      return data.can_read === true;
    }
    if (operation === "write") {
      return data.can_write === true;
    }

    return false;
  } catch (err) {
    console.error("Permission check failed:", err);
    return false;
  }
}

/**
 * Tables that use subject-level access control
 * These tables have a 'subject' column (Umair, Nyel, Emaad, Omer)
 */
export const SUBJECT_BASED_TABLES = new Set([
  "blood_glucose",
  "blood_pressure",
  "weight_log",
  "workouts",
  "health_metrics",
  "fasting_windows",
  "meals",
  "lumen_entries",
  "lab_results",
  "inr_readings",
  "medications",
  "medical_conditions",
  "doctor_visits",
  "eye_prescriptions",
  "goals",
  "scout_progress",
  "scout_merit_badges",
  "college_prep_log",
  "college_prep_timeline",
  "family_events",
  "school_calendar",
  "vehicle_log",
  "kids",
  "hiking_history",
  "personal_hikes",
]);

/**
 * Tables that use table-level access control (no subject)
 * These tables are either sensitive or don't have subject column
 */
export const TABLE_BASED_TABLES = new Set([
  "finance_income",
  "finance_donations",
  "finance_net_worth",
  "finance_tax_profile",
  "rental_income",
  "rental_expenses",
  "chat_sessions",
  "prompt_templates",
]);

/**
 * Tables that are personal/private to the authenticated user (no subject mapping)
 * User can only see their own data
 */
export const PERSONAL_ONLY_TABLES = new Set(["thoughts"]);

/**
 * Main permission check function
 * Handles all three types of tables: subject-based, table-based, personal
 */
export async function checkAccessToTable(
  userId: string,
  tableName: string,
  operation: "read" | "write",
  subject?: string // Required for subject-based tables
): Promise<{ allowed: boolean; reason?: string }> {
  // Personal tables: only own data
  if (PERSONAL_ONLY_TABLES.has(tableName)) {
    return { allowed: true }; // RLS handles user_id filtering
  }

  // Subject-based tables: check both table and subject access
  if (SUBJECT_BASED_TABLES.has(tableName)) {
    if (!subject) {
      return {
        allowed: false,
        reason: `${tableName} requires subject parameter`,
      };
    }

    // Check table access first
    const tableOk = await checkTableAccess(userId, tableName, operation);
    if (!tableOk) {
      return {
        allowed: false,
        reason: `No ${operation} access to ${tableName}`,
      };
    }

    // Check subject access
    const subjectOk = await checkSubjectAccess(userId, subject, operation);
    if (!subjectOk) {
      return {
        allowed: false,
        reason: `No ${operation} access to subject "${subject}"`,
      };
    }

    return { allowed: true };
  }

  // Table-based tables: only check table access
  if (TABLE_BASED_TABLES.has(tableName)) {
    const tableOk = await checkTableAccess(userId, tableName, operation);
    if (!tableOk) {
      return {
        allowed: false,
        reason: `No ${operation} access to ${tableName}`,
      };
    }
    return { allowed: true };
  }

  // Unknown table
  return {
    allowed: false,
    reason: `Unknown table: ${tableName}`,
  };
}

/**
 * Get all subjects the user can access
 * Useful for populating UI dropdowns
 */
export async function getUserAccessibleSubjects(
  userId: string,
  operation: "read" | "write" = "read"
): Promise<string[]> {
  try {
    const supabase = getPermissionSupabase();

    const { data, error } = await supabase
      .from("user_subject_access")
      .select("subject")
      .eq("user_id", userId)
      .eq(operation === "read" ? "can_read" : "can_write", true);

    if (error || !data) {
      return [];
    }

    return data.map((row) => row.subject);
  } catch (err) {
    console.error("Failed to fetch accessible subjects:", err);
    return [];
  }
}

/**
 * Get all tables the user can access
 */
export async function getUserAccessibleTables(
  userId: string,
  operation: "read" | "write" = "read"
): Promise<string[]> {
  try {
    const supabase = getPermissionSupabase();

    const { data, error } = await supabase
      .from("user_table_access")
      .select("table_name")
      .eq("user_id", userId)
      .eq(operation === "read" ? "can_read" : "can_write", true);

    if (error || !data) {
      return [];
    }

    return data.map((row) => row.table_name);
  } catch (err) {
    console.error("Failed to fetch accessible tables:", err);
    return [];
  }
}
