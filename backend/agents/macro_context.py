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
