import aiosqlite

DB_NAME = "research.db"

async def get_db():
    async with aiosqlite.connect(DB_NAME) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT,
                asset_type TEXT,
                created_at TIMESTAMP,
                confidence_score INTEGER,
                recommendation TEXT,
                full_report_json TEXT,
                technical_signal TEXT,
                news_sentiment TEXT,
                macro_signal TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS prediction_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                ticker TEXT,
                predicted_direction TEXT,
                predicted_at TIMESTAMP,
                resolved_at TIMESTAMP,
                actual_outcome TEXT,
                was_correct BOOLEAN
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agent_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                agent_name TEXT,
                duration_ms INTEGER,
                token_usage INTEGER,
                status TEXT,
                error_message TEXT
            )
        """)
        await db.commit()
