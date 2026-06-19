# Financial Research System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality Multi-Agent Financial Research System with real-time SSE streaming.

**Architecture:** Python FastAPI backend running 4 parallel async agents, connected to a Next.js 14 frontend via Server-Sent Events, using an aiosqlite database and OpenRouter for LLM inference.

**Tech Stack:** FastAPI, Next.js 14, Tailwind CSS v4, aiosqlite, yfinance, ta, OpenRouter.

## Global Constraints

- Backend must run on port 8000, Frontend on port 3000.
- All agent LLM prompts must be in `/prompts/*.txt`, never inline.
- Each agent has a strict 15-second timeout with graceful fallback.
- Use strict TypeScript (no `any`) in the frontend.
- Global exception handler in backend returning JSON errors (no stack traces).
- Use `deepseek/deepseek-v4-flash` via OpenRouter.
- Tests required for each agent's output parsing logic in `backend/tests/`.

---

### Task 1: Environment and Backend Models

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/models/agent_models.py`
- Create: `backend/models/db_models.py`

**Interfaces:**
- Produces: Pydantic models for inputs/outputs and DB schemas.

- [ ] **Step 1: Write requirements.txt**
```text
fastapi
uvicorn
aiosqlite
yfinance
ta
pydantic
pydantic-settings
httpx
sse-starlette
pytest
pytest-asyncio
```

- [ ] **Step 2: Write agent Pydantic models**
```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class TechnicalSignal(BaseModel):
    signal: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    support_level: float
    resistance_level: float
    reasoning: str

class SentimentBreakdown(BaseModel):
    bullish_count: int
    bearish_count: int
    neutral_count: int

class NewsSentiment(BaseModel):
    overall_sentiment: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    article_count: int
    top_headlines: List[str]
    sentiment_breakdown: SentimentBreakdown

class MacroSignal(BaseModel):
    index_performance_7d: float
    correlation_signal: Literal["HIGH", "MODERATE", "LOW"]
    sector_context: str

class SynthesisReport(BaseModel):
    executive_summary: str
    bull_case: List[str]
    bear_case: List[str]
    confidence_score: int = Field(ge=0, le=100)
    recommendation: Literal["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]
    time_horizon: Literal["SHORT", "MEDIUM", "LONG"]
    key_risks: List[str]
```

- [ ] **Step 3: Write DB models/schema structures**
*(Omitted full code here for brevity, assume full ReportDB, PredictionTrackingDB, AgentLogDB models are written exactly as requested, making sure `report_id` is Optional for AgentLogDB)*

- [ ] **Step 4: Commit**
```bash
git add backend/requirements.txt backend/models/
git commit -m "feat: setup backend models and requirements"
```

### Task 2: Database Connection & Queries

**Files:**
- Create: `backend/db/database.py`
- Create: `backend/db/queries.py`

**Interfaces:**
- Produces: Async functions for DB initialization and CRUD.

- [ ] **Step 1: Write DB logic**
```python
import aiosqlite

DB_NAME = "research.db"

async def get_db():
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT,
                asset_type TEXT,
                created_at TIMESTAMP,
                confidence_score INTEGER,
                recommendation TEXT,
                full_report_json TEXT,
                technical_signal TEXT,
                news_sentiment TEXT,
                macro_signal TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS prediction_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                ticker TEXT,
                predicted_direction TEXT,
                predicted_at TIMESTAMP,
                resolved_at TIMESTAMP,
                actual_outcome TEXT,
                was_correct BOOLEAN
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agent_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                agent_name TEXT,
                duration_ms INTEGER,
                token_usage INTEGER,
                status TEXT,
                error_message TEXT
            )
        """)
        await db.commit()
```

- [ ] **Step 2: Write queries logic**
```python
import aiosqlite
from datetime import datetime
import json
from typing import Optional

async def create_report(db: aiosqlite.Connection, ticker: str, asset_type: str, result: dict) -> int:
    cursor = await db.execute(
        """INSERT INTO reports 
           (ticker, asset_type, created_at, confidence_score, recommendation, full_report_json, technical_signal, news_sentiment, macro_signal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            ticker, 
            asset_type, 
            datetime.now().isoformat(), 
            result.get("synthesis", {}).get("confidence_score", 0),
            result.get("synthesis", {}).get("recommendation", "HOLD"),
            json.dumps(result),
            json.dumps(result.get("technical")),
            json.dumps(result.get("news")),
            json.dumps(result.get("macro"))
        )
    )
    report_id = cursor.lastrowid
    
    await db.execute(
        """INSERT INTO prediction_tracking (report_id, ticker, predicted_direction, predicted_at)
           VALUES (?, ?, ?, ?)""",
        (report_id, ticker, result.get("synthesis", {}).get("recommendation", "HOLD"), datetime.now().isoformat())
    )
    await db.commit()
    return report_id
    
async def log_agent_execution(db: aiosqlite.Connection, report_id: Optional[int], agent_name: str, duration: int, tokens: int, status: str, error: str = None):
    await db.execute(
        "INSERT INTO agent_logs (report_id, agent_name, duration_ms, token_usage, status, error_message) VALUES (?, ?, ?, ?, ?, ?)",
        (report_id, agent_name, duration, tokens, status, error)
    )
    await db.commit()
```

- [ ] **Step 3: Commit**
```bash
git add backend/db/
git commit -m "feat: setup db queries with WAL mode and prediction tracking"
```

### Task 3: BaseAgent & Utils

**Files:**
- Create: `backend/utils/logger.py`
- Create: `backend/utils/openrouter.py`
- Create: `backend/utils/asset_type.py`
- Create: `backend/agents/base.py`

**Interfaces:**
- Produces: Base wrapper, API wrapper, and asset type detection util.

- [ ] **Step 1: Write openrouter.py with proper error handling**
*(Code identical to previous revision using `json.dumps({"error": str(e)})`)*

- [ ] **Step 2: Write BaseAgent**
*(Code identical to previous revision)*

- [ ] **Step 3: Write asset_type.py**
```python
# backend/utils/asset_type.py
def detect_asset_type(ticker: str) -> tuple[str, str]:
    """Returns (asset_type, relevant_index) for a ticker"""
    if ticker.endswith("-USD"):
        return "Crypto", "BTC-USD"
    elif ticker.endswith(".JK"):
        return "Indonesian Stock", "^JKSE"
    else:
        return "US Stock", "^GSPC"
```

- [ ] **Step 4: Commit**
```bash
git add backend/utils/ backend/agents/base.py
git commit -m "feat: setup base agent, utils and asset detection"
```

### Task 4: Agents Implementation (with Validation and Fallbacks)

*(TechnicalAgent, NewsSentimentAgent, SynthesisAgent as written previously)*

- [ ] **Step 1: Write MacroContextAgent utilizing shared asset type detection**
```python
# backend/agents/macro_context.py
from .base import BaseAgent
import json
from backend.utils.openrouter import call_openrouter
from backend.models.agent_models import MacroSignal
from backend.utils.asset_type import detect_asset_type

class MacroContextAgent(BaseAgent):
    def __init__(self):
        super().__init__("MacroContextAgent")

    async def process(self, ticker: str, context: dict) -> dict:
        asset_type, index = detect_asset_type(ticker)
        
        with open("backend/prompts/macro_context_prompt.txt", "r") as f:
            prompt = f.read() + f"\nTicker: {ticker}\nAsset Type: {asset_type}\nRelevant Index: {index}"
        
        response = await call_openrouter(prompt, MacroSignal)
        data = json.loads(response)
        if "error" in data:
            raise Exception(data["error"])
        
        validated = MacroSignal.model_validate(data)
        return validated.model_dump()
```

- [ ] **Step 2: Commit Agents**
```bash
git add backend/agents/ backend/prompts/
git commit -m "feat: implement agents with validation, fallbacks, and shared util"
```

### Task 5: Testing Agent Output Parsing

*(Testing models parsing including MacroSignal and SynthesisReport tests)*

- [ ] **Step 1: Commit Tests**
```bash
git add backend/tests/
git commit -m "test: add comprehensive model parsing tests"
```

### Task 6: Orchestrator + SSE Layer

**Files:**
- Create: `backend/orchestrator.py`

**Interfaces:**
- Consumes: 4 Agents, `BaseAgent` structure, `db` functions.
- Produces: An async generator yielding specific SSE JSON events.

- [ ] **Step 1: Write Orchestrator logic with buffered DB logs and self-managed connection**
```python
# backend/orchestrator.py
import asyncio
import json
import aiosqlite
from datetime import datetime
from backend.agents.technical import TechnicalAgent
from backend.agents.news_sentiment import NewsSentimentAgent
from backend.agents.macro_context import MacroContextAgent
from backend.agents.synthesis import SynthesisAgent
from backend.db.queries import create_report, log_agent_execution
from backend.utils.asset_type import detect_asset_type

DB_NAME = "research.db"

async def wrap_agent(agent, ticker, context):
    result = await agent.execute(ticker, context)
    return agent.name, result

async def run_analysis(ticker: str):
    async with aiosqlite.connect(DB_NAME) as db:
        agents = [TechnicalAgent(), NewsSentimentAgent(), MacroContextAgent()]
        context = {}
        logs_buffer = []

        yield json.dumps({"event": "started", "ticker": ticker, "timestamp": datetime.now().isoformat()})

        for agent in agents:
            yield json.dumps({"event": "agent_started", "agent": agent.name, "timestamp": datetime.now().isoformat()})

        tasks = [asyncio.create_task(wrap_agent(agent, ticker, context)) for agent in agents]
        
        for coro in asyncio.as_completed(tasks):
            agent_name, result = await coro
            context[agent_name] = result
            logs_buffer.append((agent_name, result["duration_ms"], result.get("tokens", 0), result["status"], result.get("error")))
            
            if result["status"] == "SUCCESS":
                yield json.dumps({"event": "agent_completed", "agent": agent_name, "result": result["data"]})
            else:
                yield json.dumps({"event": "error", "agent": agent_name, "error": result["error"]})
        
        yield json.dumps({"event": "agent_started", "agent": "SynthesisAgent", "timestamp": datetime.now().isoformat()})
        synth_agent = SynthesisAgent()
        synth_result = await synth_agent.execute(ticker, context)
        logs_buffer.append(("SynthesisAgent", synth_result["duration_ms"], synth_result.get("tokens", 0), synth_result["status"], synth_result.get("error")))
        
        report_id = None
        if synth_result["status"] == "SUCCESS":
            asset_type, _ = detect_asset_type(ticker)
            full_context = {
                "technical": context.get("TechnicalAgent", {}).get("data", {}),
                "news": context.get("NewsSentimentAgent", {}).get("data", {}),
                "macro": context.get("MacroContextAgent", {}).get("data", {}),
                "synthesis": synth_result["data"]
            }
            report_id = await create_report(db, ticker, asset_type, full_context)
            yield json.dumps({"event": "final_report", "agent": "SynthesisAgent", "report": synth_result["data"], "report_id": report_id})
        else:
            yield json.dumps({"event": "error", "agent": "SynthesisAgent", "error": synth_result["error"]})

        # Insert all buffered logs for this run
        for log in logs_buffer:
            await log_agent_execution(db, report_id, *log)
```

- [ ] **Step 2: Commit**
```bash
git add backend/orchestrator.py
git commit -m "feat: implement sse orchestrator with log buffering and strict db lifecycle"
```

### Task 7: FastAPI App & Routes

**Files:**
- Create: `backend/main.py`

**Interfaces:**
- Consumes: `orchestrator.py`, `database.py`
- Produces: API server.

- [ ] **Step 1: Write FastAPI app with streaming DB safety**
```python
# backend/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from backend.orchestrator import run_analysis
from backend.db.database import init_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": str(exc)})

@app.post("/api/analyze/{ticker}")
async def analyze_ticker(ticker: str):
    # db lifecycle is now safely encapsulated inside run_analysis generator
    return EventSourceResponse(run_analysis(ticker))
```

- [ ] **Step 2: Commit**
```bash
git add backend/main.py
git commit -m "feat: setup FastAPI routes with safe streaming endpoint"
```

### Task 8: Frontend Setup & Next.js Implementation

*(Identical frontend setup matching prior TS/Buffer parsing implementation)*

- [ ] **Step 1: Commit**
```bash
git add frontend/
git commit -m "feat: setup frontend with typed SSE logic and UI switches"
```

---

**Execution Options:**
1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task
2. **Inline Execution** - execute tasks in this session using executing-plans

Which approach?
