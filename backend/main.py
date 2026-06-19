from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from backend.orchestrator import run_analysis
from backend.db.database import init_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": str(exc)})

@app.post("/api/analyze/{ticker}")
async def analyze_ticker(ticker: str):
    # db lifecycle is now safely encapsulated inside run_analysis generator
    return EventSourceResponse(run_analysis(ticker))
