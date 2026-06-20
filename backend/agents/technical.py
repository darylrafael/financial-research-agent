from .base import BaseAgent
import yfinance as yf
import pandas as pd
import asyncio
from backend.models.agent_models import TechnicalSignal

class TechnicalAgent(BaseAgent):
    def __init__(self):
        super().__init__("TechnicalAgent")

    def normalize_ticker(self, ticker: str) -> str:
        ticker = ticker.upper().strip()
        if ticker.endswith("USDT"):
            return ticker[:-4] + "-USD"
        if ticker.endswith("USD") and not ticker.endswith("-USD") and len(ticker) > 3:
            return ticker[:-3] + "-USD"
        return ticker

    async def process(self, ticker: str, context: dict) -> dict:
        norm_ticker = self.normalize_ticker(ticker)
        t = yf.Ticker(norm_ticker)
        
        # Fetch 60 days of historical data
        # Run in executor since yfinance is blocking/synchronous
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(None, lambda: t.history(period="60d"))
        
        if df.empty:
            raise ValueError(f"No historical data found for ticker '{ticker}' (normalized: '{norm_ticker}').")
            
        close_prices = df['Close']
        high_prices = df['High']
        low_prices = df['Low']
        
        current_price = close_prices.iloc[-1]
        support_level = round(float(low_prices.min()), 2)
        resistance_level = round(float(high_prices.max()), 2)
        
        window_short = min(20, len(close_prices))
        window_long = min(50, len(close_prices))
        
        sma20 = close_prices.rolling(window=window_short).mean().iloc[-1]
        sma50 = close_prices.rolling(window=window_long).mean().iloc[-1]
        
        if sma20 > sma50:
            signal = "BULLISH"
            reason = f"Current price is at ${current_price:.2f}. The {window_short}-day SMA (${sma20:.2f}) is above the {window_long}-day SMA (${sma50:.2f}), indicating a bullish crossover."
        elif sma20 < sma50:
            signal = "BEARISH"
            reason = f"Current price is at ${current_price:.2f}. The {window_short}-day SMA (${sma20:.2f}) is below the {window_long}-day SMA (${sma50:.2f}), indicating a bearish crossover."
        else:
            signal = "NEUTRAL"
            reason = f"Current price is at ${current_price:.2f}. The moving averages are consolidated, indicating a neutral trend."
            
        data = {
            "signal": signal,
            "support_level": support_level,
            "resistance_level": resistance_level,
            "reasoning": reason
        }
        
        validated = TechnicalSignal.model_validate(data)
        return validated.model_dump()

