# Financial Research Agent

A production-quality multi-agent AI system for financial market analysis. 
Supports Indonesian stocks (IHSG), US equities, and crypto assets.

![Analysis Screenshot](./docs/screenshot.png)

## Architecture

Four specialized AI agents run in parallel via asyncio, streaming results 
to the frontend in real time through Server-Sent Events (SSE).
User Input (ticker)

↓

Orchestrator

↙    ↓    ↘

Tech  News  Macro   ← parallel execution

Agent Agent Agent

↓

Synthesis Agent

↓

Structured Report + SQLite persistence

## Agents

- **TechnicalAgent** — RSI, MACD, Bollinger Bands, SMA crossover, dynamic support/resistance via yfinance
- **NewsSentimentAgent** — LLM-scored news headlines with PARTIAL state handling when no articles available  
- **MacroContextAgent** — Auto-detects asset type (.JK/IHSG, -USD/crypto, US equity) and pulls relevant index performance
- **SynthesisAgent** — Combines all signals into structured report: executive summary, bull/bear cases, confidence score (0–100), recommendation, key risks

## Engineering Highlights

- Async parallel agent execution with 15-second timeouts and graceful fallbacks
- SSE streaming with typed event schema (agent_started, agent_completed, final_report)
- PARTIAL/SUCCESS/FAILED state distinction — system flags incomplete data rather than silently proceeding
- Pydantic v2 strict validation on all agent inputs and outputs
- Prediction tracking in SQLite — every recommendation is stored for accuracy evaluation
- Unit tests for all agent output parsing (5/5 passing)
- TypeScript strict mode, zero `any` types
- Structured LLM output via JSON schema enforcement

## Tech Stack

- **Backend:** Python FastAPI, asyncio, aiosqlite, yfinance, ta, sse-starlette
- **Frontend:** Next.js 14 (App Router), Tailwind CSS v3, Recharts, Lucide
- **AI:** DeepSeek V4 Flash via OpenRouter (structured JSON output)
- **Database:** SQLite with WAL mode, prediction tracking schema

## Getting Started

### Backend
```bash
cd financial-research-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Supported Tickers
- Indonesian stocks: `BBCA.JK`, `TLKM.JK`, `BBRI.JK`
- Crypto: `BTC-USD`, `ETH-USD`, `SOL-USD`
- US stocks: `AAPL`, `NVDA`, `MSFT`

## Project Structure
backend/

agents/          # 4 specialized AI agents

prompts/         # LLM prompt files (never inline)

models/          # Pydantic schemas

db/              # Async SQLite layer

utils/           # OpenRouter client, logger, asset detection

tests/           # Unit tests

frontend/

src/app/         # Next.js pages

src/components/  # AgentCard, SynthesisReport, ConfidenceGauge

src/hooks/       # useSse, useReport

src/lib/         # Typed API client, TypeScript interfaces
