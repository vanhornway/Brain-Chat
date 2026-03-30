# Brain Chat

Personal AI assistant with access to a comprehensive life database. Chat with Claude, Google Gemini, or OpenRouter models to query and manage personal data—health metrics, finances, family events, scouting progress, and more.

## Features

- **Multi-provider support**: Anthropic Claude, Google Gemini, OpenRouter models
- **Supabase integration**: Query 30+ tables across health, finance, family, and personal domains
- **Database tools**: Query, search, insert, and aggregate data via AI
- **Image OCR**: Upload CGM screenshots, lab reports, receipts—AI extracts and logs data automatically
- **Thought capture**: Save ideas, observations, and notes with domain tagging
- **Chat history**: Save and resume conversations
- **Concise responses**: Token-efficient output focused on facts
- **Multi-modal**: Analyze images, process documents, extract structured data

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Vercel serverless
- **AI**: Vercel AI SDK (with Anthropic, Google, OpenRouter providers)
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod

## Prerequisites

- Node.js 18+
- Supabase project and database
- API keys for at least one provider:
  - Anthropic Claude
  - Google Gemini
  - OpenRouter (optional, for alternative models)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/vanhornway/Brain-Chat.git
cd brain-chat
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key  # Server-side only

# API Keys (optional, configure in UI)
# ANTHROPIC_API_KEY=...
# GOOGLE_API_KEY=...
# OPENROUTER_API_KEY=...
```

See `.env.local.example` for reference.

### 3. Database Schema

Use the schema defined in `lib/supabase.ts`. Key tables:

- **Health**: `blood_glucose`, `blood_pressure`, `weight_log`, `workouts`, `health_metrics`, `lab_results`
- **Finance**: `finance_income`, `finance_donations`, `finance_net_worth`, `finance_tax_profile`
- **Family**: `kids`, `family_events`, `school_calendar`, `college_prep_log`, `scout_progress`
- **Personal**: `thoughts`, `goals`, `medications`, `medical_conditions`, `doctor_visits`
- **Activity**: `hiking_history`, `personal_hikes`, `fasting_windows`, `meals`

Full schema available in `lib/supabase.ts` under `TABLE_SCHEMA` and `DATE_COLUMNS`.

### 4. Run Locally

```bash
npm run dev
```

Opens http://localhost:3000.

## Usage

### Chat

1. **Select a provider** and **model** in settings
2. **Paste your API key** (stored in browser localStorage)
3. **Ask questions** about your data:
   - "What's my HbA1c trend over the last 3 months?"
   - "Show me my net worth over time"
   - "What are Nyel's remaining Eagle Scout requirements?"

### Upload Images

Click the **📎** button to upload:
- **CGM screenshots** → extracted to `blood_glucose`
- **Lab reports** → extracted to `lab_results`
- **Weight scales** → extracted to `weight_log`
- **Receipts** → extracted to `finance_donations` or `rental_expenses`

AI analyzes images and auto-populates fields.

### Capture Thoughts

Use the **💭 Capture a Thought** shortcut to save ideas:
- Automatically tagged with domain (health, finance, family, etc.)
- Searchable by keyword

### Shortcuts

Quick-access prompts for common queries:
- **Daily Health Summary**: glucose, workouts, weight, readings
- **Finance Snapshot**: net worth, income, expenses
- **Scout Progress**: Eagle Scout requirements and status
- **Hike Summary Image**: prepare data for Gemini image generation

## API Routes

### POST `/api/chat`

Stream AI responses with tool support.

**Request**:
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "provider": "anthropic",
  "apiKey": "sk-...",
  "modelId": "claude-opus-4-1"
}
```

**Tools Available**:
- `query_table`: Query data with filters and date ranges
- `search_table`: Full-text search within a table column
- `insert_row`: Insert new rows (logs, thoughts, etc.)
- `aggregate_table`: Statistics and aggregations

### GET/POST `/api/history`

Save, load, and list chat sessions.

### POST `/api/generate-image`

Generate images via Google Gemini (requires `GOOGLE_API_KEY`).

### GET `/api/health`

Health check endpoint.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design, data flow, and tool implementation.

## Deployment

### Vercel

```bash
vercel
```

Set environment variables in Vercel dashboard.

### Netlify

```bash
npm run build
# Deploy dist folder
```

See `netlify.toml` for configuration.

## Contributing

Contributions welcome. Follow existing code style (TypeScript, Tailwind for UI).

## License

Private project. All rights reserved.

## Support

For issues or questions, open a GitHub issue or contact the maintainer.
