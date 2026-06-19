from abc import ABC, abstractmethod
import asyncio
import time
from backend.utils.logger import get_logger

logger = get_logger("BaseAgent")

class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name
        self.timeout = 15.0

    @abstractmethod
    async def process(self, ticker: str, context: dict) -> dict:
        pass

    async def execute(self, ticker: str, context: dict) -> dict:
        start_time = time.time()
        try:
            result = await asyncio.wait_for(self.process(ticker, context), timeout=self.timeout)
            duration = int((time.time() - start_time) * 1000)
            logger.info(f"{self.name} completed in {duration}ms")
            return {"status": "SUCCESS", "data": result, "duration_ms": duration, "tokens": 0}
        except asyncio.TimeoutError:
            duration = int((time.time() - start_time) * 1000)
            logger.error(f"{self.name} timed out after {duration}ms")
            return {"status": "FAILED", "error": "Timeout", "duration_ms": duration, "tokens": 0}
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            logger.error(f"{self.name} failed: {str(e)}")
            return {"status": "FAILED", "error": str(e), "duration_ms": duration, "tokens": 0}
