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
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportDB(BaseModel):
    id: Optional[int] = None
    ticker: str
    asset_type: str
    created_at: datetime
    confidence_score: int
    recommendation: str
    full_report_json: str
    technical_signal: str
    news_sentiment: str
    macro_signal: str

class PredictionTrackingDB(BaseModel):
    id: Optional[int] = None
    report_id: int
    ticker: str
    predicted_direction: str
    predicted_at: datetime
    resolved_at: Optional[datetime] = None
    actual_outcome: Optional[str] = None
    was_correct: Optional[bool] = None

class AgentLogDB(BaseModel):
    id: Optional[int] = None
    report_id: Optional[int] = None
    agent_name: str
    duration_ms: int
    token_usage: int
    status: str
    error_message: Optional[str] = None
```

- [ ] **Step 4: Commit**
```bash
git add backend/requirements.txt backend/models/
git commit -m "feat: setup backend models and requirements"
```
