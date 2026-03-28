import { streamText, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { DATE_COLUMNS, TABLE_SCHEMA } from "@/lib/supabase";
import type { Provider } from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

// Build a Supabase client using the service role key (bypasses RLS — server-side only)
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

function buildSystemPrompt() {
  const schemaLines = Object.entries(TABLE_SCHEMA)
    .map(([table, cols]) => `  ${table}: ${cols}`)
    .join("\n");

  return `You are Umair's personal AI assistant with access to his life database.

AVAILABLE TABLES AND THEIR COLUMNS (use ONLY these exact table and column names):

${schemaLines}

IMPORTANT RULES:
- ALWAYS call query_table when asked about any data. NEVER refuse to query or say a table cannot be accessed.
- NEVER specify order_by in query_table calls — the tool handles ordering automatically.
- NEVER invent table or column names — only use what is listed above.
- For filters, only use columns that exist in that table's schema above.
- If unsure which table to query, try the most likely one — the tool will return an error if wrong.

When answering questions, always query the relevant tables first.
For trend/inference questions, pull enough data to give a meaningful analysis.
Be concise but insightful. Format numbers clearly. Use markdown for lists and tables.
Today's date is ${new Date().toISOString().split("T")[0]}.`;
}

const SYSTEM_PROMPT = buildSystemPrompt();

export async function POST(req: Request) {
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

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    maxSteps: 10,
    tools: {
      query_table: tool({
        description:
          "Query any Supabase table with optional filters and date ranges. Use this to retrieve data about health, fitness, finances, family, and personal notes.",
        parameters: z.object({
          table: z
            .string()
            .describe("The name of the Supabase table to query."),
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
          filters,
          date_from,
          date_to,
          limit,
        }) => {
          try {
            let query = supabase.from(table).select("*");

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
            const { data, error } = await supabase
              .from(table)
              .select("*")
              .ilike(column, `%${query}%`)
              .limit(limit ?? 20);

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

      aggregate_table: tool({
        description:
          "Get the count and raw data from a table for computing sums, averages, or other aggregations. Use when you need statistics across a dataset.",
        parameters: z.object({
          table: z.string().describe("The name of the Supabase table."),
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
        execute: async ({ table, filters, date_from, date_to }) => {
          try {
            let query = supabase.from(table).select("*");

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

  return result.toDataStreamResponse();
}
