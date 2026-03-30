# Brain Chat Architecture

## Overview

Brain Chat is a Next.js full-stack application that enables conversational access to a personal data lake. The AI backend orchestrates database queries, image processing, and data extraction via a tool-calling interface, while the frontend provides a chat UI with rich features like image upload, shortcuts, and session management.

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client-side)                     │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ ChatInterface│  │ SettingsPanel│  │  MessageBubble   │    │
│  │ (React)      │  │ (localStorage│  │ (markdown render)│    │
│  │              │  │  API keys)   │  │                  │    │
│  └──────────────┘  └─────────────┘  └──────────────────┘    │
│         │                 │                    │              │
└─────────│─────────────────│────────────────────│──────────────┘
          │                 │                    │
        POST /api/chat    Settings          Chat history
          │                │                    │
┌─────────▼──────────────────▼────────────────────▼──────────────┐
│              Next.js API Routes (Server-side)                  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ POST /api/chat (main endpoint)                          │  │
│  │  ├─ Model selection: Anthropic | Google | OpenRouter   │  │
│  │  ├─ System prompt injection (schema, response style)    │  │
│  │  ├─ Message sanitization (orphaned tool calls)          │  │
│  │  ├─ Tool execution loop (maxSteps: 10)                  │  │
│  │  └─ Stream response with structured errors              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ AI Tools (Vercel AI SDK)                                │  │
│  │  ├─ query_table(filters, date_from/to, limit)           │  │
│  │  ├─ search_table(column, query, limit)                  │  │
│  │  ├─ insert_row(table, data)                             │  │
│  │  └─ aggregate_table(filters, date ranges)               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ GET/POST /api/history (session persistence)             │  │
│  │ POST /api/generate-image (Gemini image generation)       │  │
│  │ GET /api/health (uptime check)                          │  │
│  │ GET /api/credit-check (OpenRouter balance)              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Service role key
                     │ (bypasses RLS)
                     │
         ┌───────────▼───────────┐
         │    Supabase Database  │
         │    (PostgreSQL)       │
         │                       │
         │ 30+ tables covering:  │
         │ - Health & fitness    │
         │ - Finance & taxes     │
         │ - Family & education  │
         │ - Personal notes      │
         │ - Activity & goals    │
         └───────────────────────┘
```

## Data Flow

### Chat Request Flow

1. **Frontend**: User submits message + optional image(s) + provider/model selection
2. **API Route** (`POST /api/chat`):
   - Receives JSON with `messages`, `provider`, `apiKey`, `modelId`
   - Instantiates model via Vercel AI SDK
   - Builds system prompt with table schema + response style rules
   - Converts and sanitizes message history (drops orphaned tool calls)
   - Calls `streamText()` with tools registered

3. **AI Loop** (up to 10 iterations):
   - Model processes request + tools list
   - If model calls a tool, executes it against Supabase
   - Tool result streamed back to model
   - Model generates next response (may call more tools)
   - Loop exits when model stops calling tools

4. **Response**: Streamed to frontend as Server-Sent Events (SSE)

### Image Upload Flow

1. **Frontend**: User clicks 📎 → selects image file
2. **Chat API** receives image as base64 or file reference
3. **System Prompt** instructs model to:
   - Analyze image content
   - Identify relevant table (e.g., CGM screenshot → `blood_glucose`)
   - Extract fields and call `insert_row` tool
4. **Tool Execution**: Data inserted, model confirms

### Session Persistence Flow

1. **Frontend**: Saves messages to `/api/history` on each turn
2. **API Route**: Stores JSON-serialized messages in `chat_sessions` table
3. **Load Session**: Fetches previous messages from database
4. **Resume**: Next prompt uses full message history

## Key Components

### Frontend

#### `ChatInterface.tsx`
- Main chat UI component
- Manages chat state, message history, settings
- Handles image upload and preview
- Renders message bubbles and tool calls
- Integrates Vercel `useChat()` hook for streaming

#### `SettingsPanel.tsx`
- Provider/model selection
- API key input (stored in localStorage)
- Session history browser
- Shortcut trigger buttons

#### `MessageBubble.tsx`
- Renders single message
- Syntax highlighting for code
- Markdown support
- Tool invocation display

#### `lib/providers.ts`
- Type definitions for providers and models
- Settings persistence (localStorage)
- Model registry

### Backend

#### `app/api/chat/route.ts`
**Core endpoint**. Handles:
- Multi-provider model instantiation
- System prompt generation with schema
- Message sanitization (orphaned tool calls)
- Tool definitions and execution
- Error handling and credit detection

**Tools**:

1. **`query_table`**
   - Filters: exact match (`eq`)
   - Date ranges: `gte`/`lte` on candidate columns
   - Ordering: descending by date (most recent first)
   - Fallback: if ordering fails, retries without it
   - Default limit: 50 rows

2. **`search_table`**
   - Full-text search via `ilike` (case-insensitive)
   - Single column
   - Default limit: 20 rows

3. **`insert_row`**
   - Validates table name against `KNOWN_TABLES`
   - Auto-inserts `created_at` timestamp
   - Returns inserted row for confirmation
   - No update support (insert-only for immutability)

4. **`aggregate_table`**
   - Fetches raw data (no aggregation SQL)
   - AI computes sums, averages, trends in post-processing
   - Up to 1000 rows per query

#### `app/api/history/route.ts`
- `GET`: List all chat sessions
- `POST`: Save new session
- `[id]/route.ts`: Load/delete individual sessions

#### `app/api/generate-image/route.ts`
- Calls Google Gemini with prompt
- Returns image data
- Requires `GOOGLE_API_KEY`

#### `lib/supabase.ts`
- Supabase client singleton
- `KNOWN_TABLES`: List of all accessible tables (validation)
- `TABLE_SCHEMA`: Full column descriptions for system prompt
- `DATE_COLUMNS`: Primary/fallback date columns per table (auto-detection)

## System Prompt

Injected at runtime, includes:

1. **Table & Column Schema**: AI knows exact table/column names and types
2. **Tool Rules**:
   - Always query when asked about data
   - No `order_by` in tool params (backend handles it)
   - Only use listed tables/columns
3. **Image Processing**: OCR rules for CGM, lab reports, weight logs, receipts
4. **Thought Capture**: Keywords trigger thought-save flows
5. **Response Style**:
   - Facts first, no preamble
   - Numbers only, skip prose
   - Lists/tables for data
   - Expand only on follow-up

## Data Models

### Tables (30+)

**Health**:
- `blood_glucose`: CGM readings, fasting status, trending
- `blood_pressure`: Systolic, diastolic, heart rate
- `weight_log`: Daily weight with body fat %, BMI
- `workouts`: Type, duration, HR zones, calories
- `health_metrics`: Generic metrics (HRV, recovery, sleep, etc.)
- `lab_results`: CBC, CMP, lipid panels, HbA1c, flagged values
- `medications`: Active/past drugs, dosage, conditions
- `medical_conditions`: Diagnoses, severity, status
- `doctor_visits`: Visit notes, findings, vitals
- `inr_readings`: Warfarin INR levels (anticoagulation tracking)
- `lumen_entries`: Metabolic flexibility (1-5 score)

**Finance**:
- `finance_income`: W2, RSU, bonus, dividend by tax year
- `finance_donations`: Cash, stock, DAF contributions (Zakat/Sadaqa)
- `finance_net_worth`: Monthly snapshots (assets, liabilities)
- `finance_tax_profile`: AGI, brackets, effective/marginal rates
- `rental_income` / `rental_expenses`: Property income and costs

**Family & Education**:
- `kids`: Child name, grade, school, graduation year
- `family_events`: Medical, school, religious, travel events
- `school_calendar`: No-school days, breaks, holidays
- `college_prep_log`: Shadowing hours, volunteer, extracurriculars
- `college_prep_timeline`: College prep milestones with deadlines
- `scout_progress`: Eagle Scout rank, badges, hours
- `scout_merit_badges`: Individual badge completion

**Personal**:
- `thoughts`: Captured ideas, observations, tagged by domain
- `goals`: Health, financial, family, career targets
- `eye_prescriptions`: Vision exams, lens types, prescriptions
- `vehicle_log`: Maintenance, repairs, insurance claims

**Activity**:
- `hiking_history`: Group hikes (trail, season, HR data)
- `personal_hikes`: Solo hikes/walks (Strava import)
- `fasting_windows`: Intermittent fasting sessions
- `meals`: Food logs with macros (legacy + current)

**Admin**:
- `chat_sessions`: Persisted conversations
- `prompt_templates`: Reusable AI prompts

### Foreign Keys

Tables with `subject` / `kid_name` / `property` allow querying across users/entities:
- `subject="Umair"`: Personal health/fitness data
- `kid_name="Nyel"` or `"Emaad"`: Each child's records
- `property="Main House"`: Rental property data

## Security

### Authentication
- Supabase Auth (email/password)
- Session cookies managed via middleware
- Routes require valid session

### Authorization (RBAC)

**Three-layer permission system**:

1. **Table-Level Access**: Which tables can user access?
   - `user_table_access(user_id, table_name, can_read, can_write)`
   - Finance tables: requires explicit permission (blocked for kids)
   - Enforced at API + database level

2. **Subject-Level Access**: Can user see Umair's vs Nyel's data?
   - `user_subject_access(user_id, subject, can_read, can_write)`
   - For tables with `subject` column (health, scouting, college, etc.)
   - Parent (Umair) can read kids' data (read-only)
   - Kids can only access their own subject

3. **Personal-Only Tables**: Thoughts visible to owner only
   - RLS filters by `user_id` exclusively
   - No subject mapping

**Enforcement at two levels**:
- **API Layer**: `checkAccessToTable()` in `lib/permissions.ts`
- **Database Layer**: RLS policies on all tables

### Server-side Only
- Service role key (Supabase) stored in environment, never exposed
- Backend filters all queries by user_id + subject (if applicable)
- Client sends only anon key (for direct queries, if needed)

### Client-side
- API keys (Anthropic, Google, OpenRouter) stored in browser localStorage
- User controls which keys are available
- No backend key management (stateless)

### Message Sanitization
- Orphaned tool invocations (state != "result") dropped before processing
- Fallback to last user message if history is unrecoverable
- Prevents API protocol violations

### Error Masking
- Credit/billing errors detected and returned as `OUT_OF_CREDITS`
- Other errors passed through for debugging
- Permission errors include reason: "No read access to finance_income"

## Performance

### Optimization Strategies

1. **Lazy Supabase Client**: Initialized only on first request
2. **Streaming**: SSE response streamed from generation start (no buffering)
3. **Tool Parallelism**: Not used (sequential execution for context), but could be added
4. **Date Column Auto-detection**: Tries candidate columns via probe query
5. **Fallback Queries**: If ordering fails, retry without ORDER BY

### Token Efficiency

- **System Prompt**: Fixed, reused across all queries
- **Response Style**: Concise facts, minimal elaboration
- **Tool Usage**: Only call tools when necessary
- **Limit Defaults**: 50 rows (query), 20 rows (search), 1000 rows (aggregate)

## Deployment

### Vercel
- Serverless Next.js (recommended)
- Environment variables per environment
- Auto-deploys from Git push
- Built-in streaming support

### Netlify
- Serverless functions (Node.js)
- See `netlify.toml`
- Requires build step

### Self-hosted
- Node.js 18+
- `npm run build && npm run start`
- Reverse proxy (nginx/Caddy) for HTTPS

## Extension Points

### Adding New Tables
1. Add table name to `KNOWN_TABLES` in `lib/supabase.ts`
2. Add schema to `TABLE_SCHEMA`
3. Add date columns to `DATE_COLUMNS`
4. System prompt auto-updates

### New Tools
1. Define Zod schema for parameters
2. Implement execute function
3. Add to tools object in `streamText()` call

### New Providers
1. Implement in `getModel()` switch
2. Test API key injection
3. Update settings UI if needed

## Testing

### Manual Testing
```bash
# Local dev
npm run dev

# Test chat
POST http://localhost:3000/api/chat
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "What's my latest glucose reading?"}],
  "provider": "anthropic",
  "apiKey": "sk-...",
  "modelId": "claude-opus-4-1"
}
```

### Image Upload Testing
- Use real CGM screenshot / lab report
- Monitor tool invocations for correctness
- Verify inserted rows in Supabase

### Session Testing
- Save chat → reload → load session
- Verify message history restored

## Future Improvements

- [ ] Batch tool execution (parallel queries)
- [ ] Incremental token counting
- [ ] Chat export (PDF/markdown)
- [ ] Voice input
- [ ] Multi-turn image analysis
- [ ] Caching for repeated queries
- [ ] Rate limiting per provider
- [ ] Conversation tagging/search
