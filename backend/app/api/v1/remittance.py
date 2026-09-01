"""
remittance.py — API routes for Remittance Tracker & Savings Allocation (Phase 9).
"""

from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import extract, func

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.remittance import RemittanceRecord
from app.services.fx_service import fetch_latest_fx_rates, get_fx_rate_snapshot
from app.services.remittance_savings_engine import calculate_savings_suggestion

router = APIRouter(prefix="/remittance", tags=["remittance"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class LogRemittanceRequest(BaseModel):
    amount_received: float = Field(..., gt=0, description="Amount in origin currency")
    origin_currency: str = Field(..., min_length=3, max_length=3, description="USD, AED, SAR, GBP")
    sender_relationship: Optional[str] = Field(None, max_length=60, description="spouse, child, parent, etc.")
    source_country: Optional[str] = Field(None, max_length=60, description="Country of origin")
    notes: Optional[str] = Field(None, description="Optional note")


class RemittanceRecordOut(BaseModel):
    id: str
    amount_received: float
    origin_currency: str
    sender_relationship: Optional[str] = None
    source_country: Optional[str] = None
    date_received: str
    fx_rate_snapshot: float
    converted_pkr_amount: float
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class TrendItem(BaseModel):
    month_label: str
    year: int
    month: int
    total_pkr: float
    record_count: int


class FxRatesOut(BaseModel):
    rates: dict
    is_fallback: bool
    data_may_be_outdated: bool


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/records", response_model=List[RemittanceRecordOut])
def get_remittance_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List user's remittance records ordered by date_received DESC.
    """
    records = (
        db.query(RemittanceRecord)
        .filter(RemittanceRecord.user_id == current_user.id)
        .order_by(RemittanceRecord.date_received.desc())
        .all()
    )
    return [
        RemittanceRecordOut(
            id=str(r.id),
            amount_received=r.amount_received,
            origin_currency=r.origin_currency,
            sender_relationship=r.sender_relationship,
            source_country=r.source_country,
            date_received=r.date_received.isoformat(),
            fx_rate_snapshot=r.fx_rate_snapshot,
            converted_pkr_amount=r.converted_pkr_amount,
            notes=r.notes,
        )
        for r in records
    ]


@router.post("/records", response_model=RemittanceRecordOut, status_code=status.HTTP_201_CREATED)
def log_remittance_record(
    payload: LogRemittanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Log a new remittance record. Snapshots current FX rate and converts to PKR.
    """
    currency = payload.origin_currency.upper()
    rate_snapshot, _ = get_fx_rate_snapshot(currency)
    converted_pkr = round(payload.amount_received * rate_snapshot, 2)

    record = RemittanceRecord(
        user_id=current_user.id,
        amount_received=payload.amount_received,
        origin_currency=currency,
        sender_relationship=payload.sender_relationship,
        source_country=payload.source_country,
        fx_rate_snapshot=rate_snapshot,
        converted_pkr_amount=converted_pkr,
        notes=payload.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return RemittanceRecordOut(
        id=str(record.id),
        amount_received=record.amount_received,
        origin_currency=record.origin_currency,
        sender_relationship=record.sender_relationship,
        source_country=record.source_country,
        date_received=record.date_received.isoformat(),
        fx_rate_snapshot=record.fx_rate_snapshot,
        converted_pkr_amount=record.converted_pkr_amount,
        notes=record.notes,
    )


@router.get("/records/{record_id}", response_model=RemittanceRecordOut)
def get_remittance_record_detail(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get single remittance record detail.
    """
    record = (
        db.query(RemittanceRecord)
        .filter(RemittanceRecord.id == record_id, RemittanceRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Remittance record not found", "code": "RECORD_NOT_FOUND"},
        )

    return RemittanceRecordOut(
        id=str(record.id),
        amount_received=record.amount_received,
        origin_currency=record.origin_currency,
        sender_relationship=record.sender_relationship,
        source_country=record.source_country,
        date_received=record.date_received.isoformat(),
        fx_rate_snapshot=record.fx_rate_snapshot,
        converted_pkr_amount=record.converted_pkr_amount,
        notes=record.notes,
    )


@router.get("/trends", response_model=List[TrendItem])
def get_remittance_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get monthly remittance totals in PKR for trend chart visualization.
    """
    records = (
        db.query(RemittanceRecord)
        .filter(RemittanceRecord.user_id == current_user.id)
        .order_by(RemittanceRecord.date_received.asc())
        .all()
    )

    # Aggregate by YYYY-MM
    monthly_data = {}
    for r in records:
        dt = r.date_received
        key = (dt.year, dt.month)
        if key not in monthly_data:
            monthly_data[key] = {"total_pkr": 0.0, "count": 0}
        monthly_data[key]["total_pkr"] += r.converted_pkr_amount
        monthly_data[key]["count"] += 1

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    result = []
    for (year, month), val in sorted(monthly_data.items()):
        label = f"{month_names[month - 1]} {year}"
        result.append(
            TrendItem(
                month_label=label,
                year=year,
                month=month,
                total_pkr=round(val["total_pkr"], 2),
                record_count=val["count"],
            )
        )

    return result


@router.get("/savings-suggestion")
def get_savings_suggestion(
    record_id: Optional[str] = Query(None),
    pkr_amount: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get explainable savings suggestion for latest remittance or specified amount.
    Cross-references real Wallet auto-save settings and active Committee dues.
    """
    target_pkr = 0.0
    if record_id:
        rec = (
            db.query(RemittanceRecord)
            .filter(RemittanceRecord.id == record_id, RemittanceRecord.user_id == current_user.id)
            .first()
        )
        if rec:
            target_pkr = rec.converted_pkr_amount
    elif pkr_amount and pkr_amount > 0:
        target_pkr = pkr_amount
    else:
        # Fallback to latest record
        latest_rec = (
            db.query(RemittanceRecord)
            .filter(RemittanceRecord.user_id == current_user.id)
            .order_by(RemittanceRecord.date_received.desc())
            .first()
        )
        if latest_rec:
            target_pkr = latest_rec.converted_pkr_amount
        else:
            target_pkr = 50000.0  # Default 50k PKR reference for preview if no records exist yet

    return calculate_savings_suggestion(db, current_user.id, target_pkr, record_id)


@router.get("/fx-rates", response_model=FxRatesOut)
async def get_fx_rates(
    current_user: User = Depends(get_current_user),
):
    """
    Get current cached FX rates for USD, AED, SAR, GBP to PKR + fallback status.
    """
    rates, is_fallback = await fetch_latest_fx_rates()
    return FxRatesOut(
        rates=rates,
        is_fallback=is_fallback,
        data_may_be_outdated=is_fallback,
    )
