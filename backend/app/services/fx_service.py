"""
fx_service.py — Foreign Exchange Rate Service for Remittance Tracker (Phase 9).

Fetches live exchange rates for Pakistani Remittance corridors (USD, AED, SAR, GBP to PKR).
Uses async httpx with fallback to cached/snapshot rates if external API is unavailable.
"""

import logging
from typing import Dict, Any, Tuple
import httpx

logger = logging.getLogger(__name__)

# Fallback static rates for Pakistani remittance corridors (1 Unit = X PKR)
FALLBACK_RATES: Dict[str, float] = {
    "USD": 278.50,
    "AED": 75.80,
    "SAR": 74.20,
    "GBP": 365.00,
    "PKR": 1.0,
}

# In-memory rate cache: { currency: rate_in_pkr }
_CACHED_RATES: Dict[str, float] = FALLBACK_RATES.copy()
_IS_FALLBACK: bool = False

PRIMARY_FX_API_URL = "https://open.er-api.com/v6/latest/USD"
SECONDARY_FX_API_URL = "https://api.exchangerate-api.com/v4/latest/USD"


async def fetch_latest_fx_rates() -> Tuple[Dict[str, float], bool]:
    """
    Fetch exchange rates from free FX API.
    Returns (rates_dict, is_fallback_flag).
    """
    global _CACHED_RATES, _IS_FALLBACK

    async with httpx.AsyncClient(timeout=5.0) as client:
        # Try Primary API
        try:
            response = await client.get(PRIMARY_FX_API_URL)
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                pkr_rate = rates.get("PKR")
                if pkr_rate:
                    # open.er-api gives USD-base rates (e.g. 1 USD = 278.5 PKR)
                    new_rates: Dict[str, float] = {
                        "USD": float(pkr_rate),
                        "PKR": 1.0,
                    }
                    for curr in ["AED", "SAR", "GBP"]:
                        if curr in rates and rates[curr] > 0:
                            # 1 CURR in PKR = (1 USD in PKR) / (1 USD in CURR)
                            new_rates[curr] = round(pkr_rate / float(rates[curr]), 2)
                        else:
                            new_rates[curr] = FALLBACK_RATES[curr]

                    _CACHED_RATES = new_rates
                    _IS_FALLBACK = False
                    return _CACHED_RATES, False

        except Exception as e:
            logger.warning(f"Primary FX API call failed: {e}. Trying secondary...")

        # Try Secondary API
        try:
            response = await client.get(SECONDARY_FX_API_URL)
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                pkr_rate = rates.get("PKR")
                if pkr_rate:
                    new_rates: Dict[str, float] = {
                        "USD": float(pkr_rate),
                        "PKR": 1.0,
                    }
                    for curr in ["AED", "SAR", "GBP"]:
                        if curr in rates and rates[curr] > 0:
                            new_rates[curr] = round(pkr_rate / float(rates[curr]), 2)
                        else:
                            new_rates[curr] = FALLBACK_RATES[curr]

                    _CACHED_RATES = new_rates
                    _IS_FALLBACK = False
                    return _CACHED_RATES, False

        except Exception as e:
            logger.warning(f"Secondary FX API call failed: {e}. Using cached/fallback rates.")

    # Fallback return
    _IS_FALLBACK = True
    return _CACHED_RATES, True


def get_fx_rate_snapshot(currency: str) -> Tuple[float, bool]:
    """
    Synchronous helper to get current snapshot rate for a currency.
    Returns (rate_in_pkr, is_fallback).
    """
    currency_upper = currency.upper()
    rate = _CACHED_RATES.get(currency_upper, FALLBACK_RATES.get(currency_upper, 278.50))
    return rate, _IS_FALLBACK
