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
