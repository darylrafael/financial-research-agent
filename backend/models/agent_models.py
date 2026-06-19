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
