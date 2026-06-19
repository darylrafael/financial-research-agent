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
