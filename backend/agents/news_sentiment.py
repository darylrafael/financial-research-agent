from .base import BaseAgent
import json
from backend.utils.openrouter import call_openrouter
from backend.models.agent_models import NewsSentiment

class NewsSentimentAgent(BaseAgent):
    def __init__(self):
        super().__init__("NewsSentimentAgent")

    async def process(self, ticker: str, context: dict) -> dict:
        with open("backend/prompts/news_sentiment_prompt.txt", "r") as f:
            prompt = f.read() + f"\nTicker: {ticker}"
        response = await call_openrouter(prompt, NewsSentiment)
        data = json.loads(response)
        if "error" in data:
            raise Exception(data["error"])
        # Validate schema
        validated = NewsSentiment.model_validate(data)
        result_dict = validated.model_dump()
        if validated.article_count == 0:
            result_dict["_agent_status"] = "PARTIAL"
            result_dict["_agent_warning"] = "No news articles found for this ticker."
        return result_dict
