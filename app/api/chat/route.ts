import { streamText, tool, convertToCoreMessages } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { DATE_COLUMNS, TABLE_SCHEMA, KNOWN_TABLES } from "@/lib/supabase";
import type { KnownTable } from "@/lib/supabase";
import { getAuthenticatedUserOrThrow } from "@/lib/auth";
import {
  checkAccessToTable,
  SUBJECT_BASED_TABLES,
  TABLE_BASED_TABLES,
  TABLE_IDENTITY_COLUMN,
  getUserAccessibleSubjects,
} from "@/lib/permissions";
import type { Provider } from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

// Build a Supabase client using the service role key (server-side only)
// All queries will be filtered by user_id via RLS in the database
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars are not configured.");
  }
  return createClient(url, key);
}

// Resolve the AI model from provider + modelId + apiKey
function getModel(provider: Provider, modelId: string, apiKey: string) {
  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    case "openrouter": {
      // OpenRouter is compatible with the OpenAI SDK
      const openrouter = createOpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        headers: {
          "HTTP-Referer": "https://brain-chat.app",
          "X-Title": "Brain Chat",
        },
      } as Parameters<typeof createOpenAI>[0]);
      return openrouter(modelId);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function inferSubjectFromEmail(email: string): string {
  // Map email prefixes to subject names
  const emailToSubject: Record<string, string> = {
    "mumair": "Umair",
    "nyel": "Nyel",
    "emaad": "Emaad",
    "huma": "Huma",
    "omer": "Omer",
  };

  const part = email.split("@")[0].split(".")[0].toLowerCase();
  return emailToSubject[part] || part.charAt(0).toUpperCase() + part.slice(1);
}

function buildSystemPrompt(userEmail: string) {
  const userSubject = inferSubjectFromEmail(userEmail);
  const schemaLines = Object.entries(TABLE_SCHEMA)
    .map(([table, cols]) => `  ${table}: ${cols}`)
    .join("\n");

  return `You are a personal AI assistant with access to a family life database.

**CURRENT USER:** ${userEmail} (subject: ${userSubject})
When the user says "my" or "I", they are referring to ${userSubject}'s data.

AVAILABLE TABLES AND THEIR COLUMNS (use ONLY these exact table and column names):

${schemaLines}

ACCESS CONTROL:
- Some tables require explicit 'subject' parameter (Umair, Nyel, Emaad, Omer): blood_glucose, blood_pressure, weight_log, workouts, health_metrics, scout_progress, college_prep_log, family_events, etc.
- Some tables are restricted (finance_income, finance_donations, finance_net_worth, etc.) — queries may be denied if user lacks permission.
- Thoughts table: users can only see their own thoughts (no subject parameter).
- If a query returns "Access denied", inform the user they don't have permission for that table.

IMPORTANT RULES:
- ALWAYS call query_table when asked about data. If denied, explain the access restriction.
- For subject-based tables (health, scouting, college, etc.), include the subject parameter: query_table('blood_glucose', subject='Nyel')
- When the user asks about "my" data (rank, health, etc.), use subject='${userSubject}' automatically
- NEVER specify order_by in query_table calls — the tool handles ordering automatically.
- NEVER invent table or column names — only use what is listed above.
- For filters, only use columns that exist in that table's schema above.
- If unsure which table to query, try the most likely one — the tool will return an error if wrong.

IMAGE / OCR RULES:
- When the user attaches an image, analyze it carefully and extract all relevant data.
- Identify which table(s) the data belongs to based on content (e.g. CGM screenshot → blood_glucose, lab report → lab_results, weight scale → weight_log).
- Use insert_row to save the extracted data. Include the subject if needed (e.g., if parent uploading child's data: subject="Nyel"). Confirm what you inserted after success.
- If the image contains multiple readings, insert each as a separate row.
- For blood_glucose: include subject (Umair, Nyel, etc.), reading_type based on context (fasting/post-meal/random).
- For weight_log: include subject.
- For lab_results: include subject, set is_flagged=true if value is outside reference range.

THOUGHT CAPTURE RULES:
- When the user says anything like "save this thought", "note this", "remember this", "log this idea", or just shares a raw observation/idea without asking a question — treat it as a thought to capture.
- Use insert_row on the thoughts table with: content=<the thought>, domain=<inferred topic e.g. health/finance/family/hiking/work/ideas>, tags=<array of relevant keywords>.
- Do NOT include subject — thoughts are personal to each user.
- Confirm with a short acknowledgment after saving. Do not ask clarifying questions — just save it and confirm.
- If the user says "what did I think about X" or "show my thoughts on X", query the thoughts table.

When answering questions, always query the relevant tables first.
For trend/inference questions, pull enough data to give a meaningful analysis.

RESPONSE STYLE:
- Lead with facts. No preamble, explanations, or context unless asked.
- Numbers only: avoid prose elaboration. Use concise labels.
- Lists/tables for data comparisons. Markdown-formatted.
- If user asks for more detail: then expand.
- Avoid: "I found...", "Based on the data...", "Let me analyze...". Just answer.

Today's date is ${new Date().toISOString().split("T")[0]}.`;
}

// Note: SYSTEM_PROMPT is now built per-request to include the current user's identity
// (see inside POST handler)

export async function POST(req: Request) {
  // Check authentication
  let user;
  try {
    user = await getAuthenticatedUserOrThrow();
    console.log("Authenticated user:", user.id, user.email);
  } catch (e) {
    console.error("Auth error:", e);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    messages: unknown[];
    provider: Provider;
    apiKey: string;
    modelId: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, provider, apiKey, modelId } = body;

  if (!provider || !apiKey || !modelId) {
    return new Response(
      JSON.stringify({
        error:
          "Missing required fields: provider, apiKey, and modelId are required.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let model: ReturnType<typeof getModel>;
  try {
    model = getModel(provider, modelId, apiKey);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = getSupabase();

  // Sanitize UI messages before converting: drop any assistant message whose
  // tool invocations are not all in "result" state (orphaned calls break the API).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeMessages = (messages as any[]).filter((m: any) => {
    if (m.role === "assistant" && Array.isArray(m.toolInvocations)) {
      return m.toolInvocations.every((t: any) => t.state === "result");
    }
    return true;
  });

  let coreMessages: ReturnType<typeof convertToCoreMessages>;
  try {
    coreMessages = convertToCoreMessages(safeMessages);
  } catch {
    // Fall back to just the last user message if history is unrecoverable
    const lastUser = [...safeMessages].reverse().find((m: any) => m.role === "user");
    coreMessages = convertToCoreMessages(lastUser ? [lastUser] : []);
  }

  let result;
  try {
    console.log("Calling streamText with model:", modelId, "provider:", provider);
    const SYSTEM_PROMPT = buildSystemPrompt(user.email || "unknown");
    result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
    maxSteps: 10,
    tools: {
      query_table: tool({
        description:
          "Query any Supabase table with optional filters and date ranges. Use this to retrieve data about health, fitness, finances, family, and personal notes.",
        parameters: z.object({
          table: z
            .string()
            .describe("The name of the Supabase table to query."),
          subject: z
            .string()
            .optional()
            .describe("Subject filter (Umair, Nyel, Emaad, Omer) for subject-based tables like blood_glucose, scout_progress, etc."),
          filters: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
              "Key-value pairs for exact match filters, e.g. { kid_name: 'Nyel' }"
            ),
          date_from: z
            .string()
            .optional()
            .describe("Start date filter in YYYY-MM-DD format (inclusive)."),
          date_to: z
            .string()
            .optional()
            .describe("End date filter in YYYY-MM-DD format (inclusive)."),
          limit: z
            .number()
            .optional()
            .default(50)
            .describe("Maximum number of rows to return. Default 50."),
        }),
        execute: async ({
          table,
          subject,
          filters,
          date_from,
          date_to,
          limit,
        }) => {
          try {
            // Check permission
            const permission = await checkAccessToTable(
              user.id,
              table,
              "read",
              subject
            );
            if (!permission.allowed) {
              return {
                success: false,
                error: permission.reason || "Access denied",
                table,
              };
            }

            let query = supabase.from(table).select("*");

            // Filter by user_id or subject depending on table type
            if (SUBJECT_BASED_TABLES.has(table)) {
              // Subject-based tables (health, scout, college, etc.): filter by subject, not user_id
              if (subject) {
                const identityCol = TABLE_IDENTITY_COLUMN[table] ?? "subject";
                query = query.eq(identityCol, subject);
              }
            } else {
              // Table-based and personal-only tables: filter by user_id for data isolation
              query = query.eq("user_id", user.id);
            }

            // Apply equality filters
            if (filters && typeof filters === "object") {
              for (const [col, val] of Object.entries(filters)) {
                if (val !== undefined && val !== null) {
                  query = query.eq(col, val as string);
                }
              }
            }

            // Apply date filters — try each candidate column
            if (date_from || date_to) {
              const candidateCols =
                DATE_COLUMNS[table] ?? ["date", "created_at"];

              // We'll try the first column that produces results
              let dateColUsed: string | null = null;
              for (const col of candidateCols) {
                // Probe with a tiny query to see if column exists
                const probe = await supabase
                  .from(table)
                  .select(col)
                  .limit(1);
                if (!probe.error) {
                  dateColUsed = col;
                  break;
                }
              }

              if (dateColUsed) {
                if (date_from) {
                  query = query.gte(dateColUsed, date_from);
                }
                if (date_to) {
                  query = query.lte(dateColUsed, date_to + "T23:59:59");
                }
                query = query.order(dateColUsed, { ascending: false });
              }
            }

            // Always order by the known primary date column
            const primaryDateCol = (DATE_COLUMNS[table] ?? [])[0];
            if (!date_from && !date_to && primaryDateCol) {
              query = query.order(primaryDateCol, { ascending: false, nullsFirst: false });
            }

            query = query.limit(limit ?? 50);

            let { data, error } = await query;

            // If ordering caused an error, retry without it
            if (error && (error.message.includes("column") || error.message.includes("does not exist"))) {
              const fallback = supabase.from(table).select("*").limit(limit ?? 50);
              const result = await fallback;
              data = result.data;
              error = result.error;
            }

            if (error) {
              return {
                success: false,
                error: error.message,
                table,
              };
            }

            return {
              success: true,
              table,
              count: data?.length ?? 0,
              data: data ?? [],
            };
          } catch (err) {
            return {
              success: false,
              error: (err as Error).message,
              table,
            };
          }
        },
      }),

      search_table: tool({
        description:
          "Full-text search across a Supabase table column using case-insensitive pattern matching (ilike). Use to find specific records by keyword.",
        parameters: z.object({
          table: z.string().describe("The name of the Supabase table."),
          column: z
            .string()
            .describe("The column to search within, e.g. 'notes' or 'name'."),
          query: z
            .string()
            .describe("The search term to look for (case-insensitive)."),
          limit: z
            .number()
            .optional()
            .default(20)
            .describe("Max rows to return. Default 20."),
        }),
        execute: async ({ table, column, query, limit }) => {
          try {
            // Check permission
            const permission = await checkAccessToTable(user.id, table, "read");
            if (!permission.allowed) {
              return {
                success: false,
                error: permission.reason || "Access denied",
                table,
                column,
                query,
              };
            }

            let searchQuery = supabase
              .from(table)
              .select("*")
              .ilike(column, `%${query}%`);

            // Filter by user_id only for non-subject-based tables
            if (!SUBJECT_BASED_TABLES.has(table)) {
              searchQuery = searchQuery.eq("user_id", user.id);
            }

            const { data, error } = await searchQuery.limit(limit ?? 20);

            if (error) {
              return {
                success: false,
                error: error.message,
                table,
                column,
                query,
              };
            }

            return {
              success: true,
              table,
              column,
              query,
              count: data?.length ?? 0,
              data: data ?? [],
            };
          } catch (err) {
            return {
              success: false,
              error: (err as Error).message,
              table,
              column,
              query,
            };
          }
        },
      }),

      insert_row: tool({
        description:
          "Insert a new row into a Supabase table. Use this to log data extracted from images (CGM screenshots, lab reports, weight scales, receipts) or when the user asks to record/log something new.",
        parameters: z.object({
          table: z.string().describe("The table name to insert into."),
          data: z
            .record(z.string(), z.unknown())
            .describe(
              "Key-value pairs for the new row. Only include columns that exist in the table schema."
            ),
        }),
        execute: async ({ table, data }) => {
          try {
            // Check permission for write access
            const subject = (data as any).subject;
            const permission = await checkAccessToTable(
              user.id,
              table,
              "write",
              subject
            );
            if (!permission.allowed) {
              return {
                success: false,
                error: permission.reason || "Write access denied",
                table,
              };
            }

            // Auto-add user_id for data isolation
            const dataWithUser = {
              ...data,
              user_id: user.id,
            };

            const { data: result, error } = await supabase
              .from(table)
              .insert(dataWithUser)
              .select();

            if (error) {
              return { success: false, error: error.message, table };
            }

            return {
              success: true,
              table,
              inserted: result,
            };
          } catch (err) {
            return {
              success: false,
              error: (err as Error).message,
              table,
            };
          }
        },
      }),

      delete_row: tool({
        description:
          "Delete a row from a Supabase table by ID. Use with caution as this cannot be undone.",
        parameters: z.object({
          table: z.string().describe("The name of the Supabase table."),
          id: z.string().describe("The ID (UUID) of the row to delete."),
        }),
        execute: async ({ table, id }) => {
          try {
            // Validate table name
            if (!KNOWN_TABLES.includes(table as KnownTable)) {
              return {
                success: false,
                error: `Unknown table: ${table}`,
                table,
              };
            }

            // Check permission
            const permission = await checkAccessToTable(user.id, table, "delete");
            if (!permission.allowed) {
              return {
                success: false,
                error: permission.reason || "Access denied",
                table,
              };
            }

            // For subject-based tables, verify user owns the row
            let deleteQuery = supabase.from(table).delete().eq("id", id);

            // For non-subject tables, also filter by user_id to prevent accidental deletes
            if (!SUBJECT_BASED_TABLES.has(table)) {
              deleteQuery = deleteQuery.eq("user_id", user.id);
            }

            const { error, data } = await deleteQuery;

            if (error) {
              return {
                success: false,
                error: error.message,
                table,
              };
            }

            return {
              success: true,
              table,
              message: `Row ${id} deleted from ${table}`,
            };
          } catch (err) {
            return {
              success: false,
              error: (err as Error).message,
              table,
            };
          }
        },
      }),

      aggregate_table: tool({
        description:
          "Get the count and raw data from a table for computing sums, averages, or other aggregations. Use when you need statistics across a dataset.",
        parameters: z.object({
          table: z.string().describe("The name of the Supabase table."),
          subject: z
            .string()
            .optional()
            .describe("Subject filter (Umair, Nyel, Emaad, Omer) if applicable."),
          filters: z
            .record(z.string(), z.unknown())
            .optional()
            .describe("Optional exact match filters."),
          date_from: z
            .string()
            .optional()
            .describe("Start date filter in YYYY-MM-DD format."),
          date_to: z
            .string()
            .optional()
            .describe("End date filter in YYYY-MM-DD format."),
        }),
        execute: async ({ table, subject, filters, date_from, date_to }) => {
          try {
            // Check permission
            const permission = await checkAccessToTable(
              user.id,
              table,
              "read",
              subject
            );
            if (!permission.allowed) {
              return {
                success: false,
                error: permission.reason || "Access denied",
                table,
              };
            }

            let query = supabase.from(table).select("*");

            // Filter by user_id or subject depending on table type
            if (SUBJECT_BASED_TABLES.has(table)) {
              // Subject-based tables (health, scout, college, etc.): filter by subject, not user_id
              if (subject) {
                const identityCol = TABLE_IDENTITY_COLUMN[table] ?? "subject";
                query = query.eq(identityCol, subject);
              }
            } else {
              // Table-based and personal-only tables: filter by user_id for data isolation
              query = query.eq("user_id", user.id);
            }

            if (filters && typeof filters === "object") {
              for (const [col, val] of Object.entries(filters)) {
                if (val !== undefined && val !== null) {
                  query = query.eq(col, val as string);
                }
              }
            }

            if (date_from || date_to) {
              const candidateCols =
                DATE_COLUMNS[table] ?? ["date", "created_at"];

              let dateColUsed: string | null = null;
              for (const col of candidateCols) {
                const probe = await supabase
                  .from(table)
                  .select(col)
                  .limit(1);
                if (!probe.error) {
                  dateColUsed = col;
                  break;
                }
              }

              if (dateColUsed) {
                if (date_from) {
                  query = query.gte(dateColUsed, date_from);
                }
                if (date_to) {
                  query = query.lte(dateColUsed, date_to + "T23:59:59");
                }
              }
            }

            // Fetch up to 1000 rows for aggregation
            query = query.limit(1000);

            const { data, error, count } = await query;

            if (error) {
              return {
                success: false,
                error: error.message,
                table,
              };
            }

            return {
              success: true,
              table,
              count: count ?? data?.length ?? 0,
              data: data ?? [],
            };
          } catch (err) {
            return {
              success: false,
              error: (err as Error).message,
              table,
            };
          }
        },
      }),
    },
    });
  } catch (err) {
    console.error("streamText error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        const msg = error instanceof Error ? error.message : String(error ?? "");
        console.error("streamText error message:", msg);
        const lower = msg.toLowerCase();
        if (
          lower.includes("402") ||
          lower.includes("credit") ||
          lower.includes("insufficient") ||
          lower.includes("payment") ||
          lower.includes("billing") ||
          lower.includes("quota") ||
          lower.includes("balance")
        ) {
          return "OUT_OF_CREDITS";
        }
        return msg || "An error occurred.";
      },
    });
  } catch (err) {
    console.error("toDataStreamResponse error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
