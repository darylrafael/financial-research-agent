from .base import BaseAgent
import yfinance as yf
from backend.models.agent_models import TechnicalSignal

class TechnicalAgent(BaseAgent):
    def __init__(self):
        super().__init__("TechnicalAgent")

    async def process(self, ticker: str, context: dict) -> dict:
        # For this prototype we will return mock data as detailed in the plan,
        # but in a real app this would use ta library and yfinance
        data = {
            "signal": "BULLISH", 
            "support_level": 100.0, 
            "resistance_level": 150.0, 
            "reasoning": "MA crossover detected."
        }
        validated = TechnicalSignal.model_validate(data)
        return validated.model_dump()
