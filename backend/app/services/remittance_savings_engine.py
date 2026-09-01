"""
remittance_savings_engine.py — Rule-based Savings Allocation Engine (Phase 9).

Cross-references user's real Wallet auto-save settings and active Committee dues
to generate a transparent, explainable savings recommendation for logged remittances.
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.wallet import WalletAccount
from app.models.committee import CommitteeMember, Committee, CommitteeStatus
from app.models.remittance import RemittanceRecord


def calculate_savings_suggestion(
    db: Session,
    user_id: Any,
    pkr_amount: float,
    remittance_id: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Calculate explainable savings recommendation for a remittance amount.
    Cross-references real Wallet auto-save rate and active Committee commitments.
    """
    # 1. Fetch user's Wallet auto-save rate
    wallet = db.query(WalletAccount).filter(WalletAccount.user_id == user_id).first()
    wallet_auto_save_pct = float(wallet.auto_save_pct) if (wallet and wallet.auto_save_pct is not None) else 10.0
    wallet_balance = float(wallet.balance) if wallet else 0.0

    # 2. Fetch active Committee commitments
    active_committee_memberships = (
        db.query(CommitteeMember)
        .join(Committee, CommitteeMember.committee_id == Committee.id)
        .filter(
            CommitteeMember.user_id == user_id,
            Committee.status.in_([CommitteeStatus.forming, CommitteeStatus.active]),
        )
        .all()
    )

    committee_count = len(active_committee_memberships)
    monthly_committee_dues = 0.0
    for m in active_committee_memberships:
        c = m.committee
        if c and c.contribution_amount:
            # Estimate monthly equivalent based on frequency
            freq = str(c.cycle_frequency or "").lower()
            if "week" in freq:
                monthly_committee_dues += float(c.contribution_amount) * 4
            else:
                monthly_committee_dues += float(c.contribution_amount)

    # 3. Rule-based allocation calculation
    base_save_pct = wallet_auto_save_pct
    committee_booster_pct = 5.0 if committee_count > 0 else 0.0
    
    total_suggested_pct = base_save_pct + committee_booster_pct
    # Cap total suggested savings percentage between 10% and 35%
    total_suggested_pct = max(10.0, min(35.0, total_suggested_pct))

    suggested_pkr_amount = round(pkr_amount * (total_suggested_pct / 100.0), 2)
    remaining_pkr_amount = round(pkr_amount - suggested_pkr_amount, 2)

    # 4. Generate plain-language explainable reasoning
    reasoning_en = (
        f"Based on your Wallet auto-save rate of {base_save_pct:.0f}%"
        + (f" and your {committee_count} active committee commitment(s) (Rs. {monthly_committee_dues:,.0f}/mo)" if committee_count > 0 else "")
        + f", we recommend allocating {total_suggested_pct:.0f}% (Rs. {suggested_pkr_amount:,.0f}) to your savings."
    )

    reasoning_ur = (
        f"آپ کے والٹ کی خودکار بچت کی شرح ({base_save_pct:.0f}%)"
        + (f" اور کمیٹی کی ماہانہ اقساط ({committee_count} کمیٹیاں، {monthly_committee_dues:,.0f} روپے) کی بنیاد پر" if committee_count > 0 else "")
        + f"، ہم اس رقم میں سے {total_suggested_pct:.0f}% ({suggested_pkr_amount:,.0f} روپے) بچت میں محفوظ کرنے کی تجویز دیتے ہیں۔"
    )

    return {
        "remittance_pkr_total": round(pkr_amount, 2),
        "suggested_savings_pct": total_suggested_pct,
        "suggested_savings_pkr": suggested_pkr_amount,
        "remaining_pkr": remaining_pkr_amount,
        "wallet_auto_save_pct": base_save_pct,
        "current_wallet_balance": round(wallet_balance, 2),
        "active_committees_count": committee_count,
        "monthly_committee_dues_pkr": round(monthly_committee_dues, 2),
        "reasoning_en": reasoning_en,
        "reasoning_ur": reasoning_ur,
    }
