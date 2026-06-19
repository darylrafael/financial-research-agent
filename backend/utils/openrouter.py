import os
import httpx
from pydantic import BaseModel
import json

async def call_openrouter(prompt: str, schema: BaseModel = None) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY", "dummy")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Financial Agent"
    }
    
    payload = {
        "model": "deepseek/deepseek-v4-flash",
        "messages": [{"role": "user", "content": prompt}],
    }
    
    if schema:
        payload["response_format"] = {"type": "json_object"}
        payload["messages"][0]["content"] += f"\n\nRespond strictly with JSON matching this schema: {schema.model_json_schema()}"
        
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=20.0)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return json.dumps({"error": str(e)})
