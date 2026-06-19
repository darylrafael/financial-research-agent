import pytest
from pydantic import ValidationError
from backend.models.agent_models import TechnicalSignal, NewsSentiment, MacroSignal, SynthesisReport

def test_technical_signal_parsing():
    data = {"signal": "BULLISH", "support_level": 100.0, "resistance_level": 150.0, "reasoning": "test"}
    assert TechnicalSignal.model_validate(data).signal == "BULLISH"

def test_news_sentiment_parsing():
    data = {
        "overall_sentiment": "NEUTRAL",
        "article_count": 5,
        "top_headlines": [],
        "sentiment_breakdown": {"bullish_count": 0, "bearish_count": 0, "neutral_count": 5}
    }
    assert NewsSentiment.model_validate(data).overall_sentiment == "NEUTRAL"

def test_macro_signal_parsing():
    data = {"index_performance_7d": 1.5, "correlation_signal": "HIGH", "sector_context": "test"}
    assert MacroSignal.model_validate(data).correlation_signal == "HIGH"

def test_synthesis_report_parsing():
    data = {
        "executive_summary": "test",
        "bull_case": ["1"],
        "bear_case": ["2"],
        "confidence_score": 85,
        "recommendation": "BUY",
        "time_horizon": "SHORT",
        "key_risks": []
    }
    assert SynthesisReport.model_validate(data).recommendation == "BUY"

def test_synthesis_report_validation_failure():
    data = {
        "executive_summary": "test",
        "confidence_score": 150, # invalid, > 100
        "recommendation": "BUY",
        "time_horizon": "SHORT",
        "key_risks": []
    }
    with pytest.raises(ValidationError):
        SynthesisReport.model_validate(data)
