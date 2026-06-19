from .base import BaseAgent
import json
from backend.utils.openrouter import call_openrouter
from backend.models.agent_models import SynthesisReport

class SynthesisAgent(BaseAgent):
    def __init__(self):
        super().__init__("SynthesisAgent")

    def _get_fallback_data(self, agent_name: str) -> str:
        if agent_name == "TechnicalAgent":
            return '{"signal": "NEUTRAL", "support_level": 0.0, "resistance_level": 0.0, "reasoning": "Data unavailable."}'
        elif agent_name == "NewsSentimentAgent":
            return '{"overall_sentiment": "NEUTRAL", "article_count": 0, "top_headlines": [], "sentiment_breakdown": {"bullish_count": 0, "bearish_count": 0, "neutral_count": 0}}'
        elif agent_name == "MacroContextAgent":
            return '{"index_performance_7d": 0.0, "correlation_signal": "MODERATE", "sector_context": "Data unavailable."}'
        return "{}"

    async def process(self, ticker: str, context: dict) -> dict:
        # Check inputs and apply fallbacks if FAILED
        tech_data = context.get("TechnicalAgent", {})
        news_data = context.get("NewsSentimentAgent", {})
        macro_data = context.get("MacroContextAgent", {})

        tech_str = json.dumps(tech_data.get("data")) if tech_data.get("status") == "SUCCESS" else self._get_fallback_data("TechnicalAgent")
        news_str = json.dumps(news_data.get("data")) if news_data.get("status") == "SUCCESS" else self._get_fallback_data("NewsSentimentAgent")
        macro_str = json.dumps(macro_data.get("data")) if macro_data.get("status") == "SUCCESS" else self._get_fallback_data("MacroContextAgent")

        with open("backend/prompts/synthesis_prompt.txt", "r") as f:
            prompt = f.read() + f"\nTicker: {ticker}\n\nTechnical:\n{tech_str}\n\nNews:\n{news_str}\n\nMacro:\n{macro_str}"
        
        response = await call_openrouter(prompt, SynthesisReport)
        data = json.loads(response)
        if "error" in data:
            raise Exception(data["error"])
        
        validated = SynthesisReport.model_validate(data)
        return validated.model_dump()
