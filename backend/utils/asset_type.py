def detect_asset_type(ticker: str) -> tuple[str, str]:
    """Returns (asset_type, relevant_index) for a ticker"""
    if ticker.endswith("-USD"):
        return "Crypto", "BTC-USD"
    elif ticker.endswith(".JK"):
        return "Indonesian Stock", "^JKSE"
    else:
        return "US Stock", "^GSPC"
