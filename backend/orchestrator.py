import asyncio
import json
import aiosqlite
from datetime import datetime
from backend.agents.technical import TechnicalAgent
from backend.agents.news_sentiment import NewsSentimentAgent
from backend.agents.macro_context import MacroContextAgent
from backend.agents.synthesis import SynthesisAgent
from backend.db.queries import create_report, log_agent_execution
from backend.utils.asset_type import detect_asset_type

DB_NAME = "research.db"

async def wrap_agent(agent, ticker, context):
    result = await agent.execute(ticker, context)
    return agent.name, result

async def run_analysis(ticker: str):
    async with aiosqlite.connect(DB_NAME) as db:
        agents = [TechnicalAgent(), NewsSentimentAgent(), MacroContextAgent()]
        context = {}
        logs_buffer = []

        yield json.dumps({"event": "started", "ticker": ticker, "timestamp": datetime.now().isoformat()})

        for agent in agents:
            yield json.dumps({"event": "agent_started", "agent": agent.name, "timestamp": datetime.now().isoformat()})

        tasks = [asyncio.create_task(wrap_agent(agent, ticker, context)) for agent in agents]
        
        for coro in asyncio.as_completed(tasks):
            agent_name, result = await coro
            context[agent_name] = result
            logs_buffer.append((agent_name, result["duration_ms"], result.get("tokens", 0), result["status"], result.get("error")))
            
            if result["status"] == "SUCCESS":
                yield json.dumps({"event": "agent_completed", "agent": agent_name, "result": result["data"]})
            else:
                yield json.dumps({"event": "error", "agent": agent_name, "error": result["error"]})
        
        yield json.dumps({"event": "agent_started", "agent": "SynthesisAgent", "timestamp": datetime.now().isoformat()})
        synth_agent = SynthesisAgent()
        synth_result = await synth_agent.execute(ticker, context)
        logs_buffer.append(("SynthesisAgent", synth_result["duration_ms"], synth_result.get("tokens", 0), synth_result["status"], synth_result.get("error")))
        
        report_id = None
        if synth_result["status"] == "SUCCESS":
            asset_type, _ = detect_asset_type(ticker)
            full_context = {
                "technical": context.get("TechnicalAgent", {}).get("data", {}),
                "news": context.get("NewsSentimentAgent", {}).get("data", {}),
                "macro": context.get("MacroContextAgent", {}).get("data", {}),
                "synthesis": synth_result["data"]
            }
            report_id = await create_report(db, ticker, asset_type, full_context)
            yield json.dumps({"event": "final_report", "agent": "SynthesisAgent", "report": synth_result["data"], "report_id": report_id})
        else:
            yield json.dumps({"event": "error", "agent": "SynthesisAgent", "error": synth_result["error"]})

        # Insert all buffered logs for this run
        for log in logs_buffer:
            await log_agent_execution(db, report_id, *log)
