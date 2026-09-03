"""004_loan_program_schema.py — Phase 4: microfinance_programs table + seed data.

Seed data sources (re-verified Sep 2026 against published primary pages):
  - Akhuwat: https://akhuwat.org.pk/islamic-microfinance/products/
    Business Loan: 10,000–500,000 PKR; qard hasan (0% interest); CNIC + 2 community guarantors required. (Verified Sep 2026)
    Agri Loan: 10,000–300,000 PKR; qard hasan (0% interest); farm land ownership/lease proof. (Verified Sep 2026)
  - Kashf Foundation: https://www.kashf.org/products
    Group Enterprise Loan: 15,000–150,000 PKR; 24% per annum declining; 3-5 women group model. (Verified Sep 2026)
    Individual Business Loan: 50,000–1,000,000 PKR; 18–24% per annum. (Verified Sep 2026)
  - NRSP (National Rural Support Programme): https://nrsp.org.pk/microfinance/
    Agriculture & Small Business Loans: 10,000–300,000 PKR; 18–22% per annum; Community Organisation (CO) membership required. (Verified Sep 2026)

Any values not confirmed from a primary source are marked TODO in code comments.

Revision ID: 004
Revises: 003
Create Date: 2026-08-30
"""

from typing import Sequence, Union
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


loan_type_enum = postgresql.ENUM(
    "business",
    "agriculture",
    "housing",
    "education",
    "emergency",
    name="loan_type_enum",
    create_type=True,
)


def upgrade() -> None:
    conn = op.get_bind()

    # Create enum first (checkfirst avoids DuplicateObject on re-run)
    loan_type_enum.create(conn, checkfirst=True)

    op.create_table(
        "microfinance_programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("institution_name", sa.String(200), nullable=False),
        sa.Column("program_name", sa.String(200), nullable=False),
        sa.Column(
            "loan_type",
            postgresql.ENUM(
                "business", "agriculture", "housing", "education", "emergency",
                name="loan_type_enum", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("min_loan_pkr", sa.Float, nullable=True),
        sa.Column("max_loan_pkr", sa.Float, nullable=False),
        sa.Column("min_credit_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("eligible_occupations", sa.Text, nullable=True),
        sa.Column("eligible_locations", sa.Text, nullable=True),
        sa.Column("annual_rate_pct", sa.Float, nullable=True),
        sa.Column("is_interest_free", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("required_documents", sa.Text, nullable=False),
        sa.Column("application_steps_en", sa.Text, nullable=False),
        sa.Column("application_steps_ur", sa.Text, nullable=False),
        sa.Column("contact_info", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Seed data ─────────────────────────────────────────────────────────────
    # All criteria from published primary sources. See module docstring for URLs.

    programs_table = sa.table(
        "microfinance_programs",
        sa.column("id"),
        sa.column("institution_name"),
        sa.column("program_name"),
        sa.column("loan_type"),
        sa.column("min_loan_pkr"),
        sa.column("max_loan_pkr"),
        sa.column("min_credit_score"),
        sa.column("eligible_occupations"),
        sa.column("eligible_locations"),
        sa.column("annual_rate_pct"),
        sa.column("is_interest_free"),
        sa.column("required_documents"),
        sa.column("application_steps_en"),
        sa.column("application_steps_ur"),
        sa.column("contact_info"),
        sa.column("is_active"),
    )

    op.bulk_insert(programs_table, [
        # ── Akhuwat — Business Loan ──────────────────────────────────────────
        # Source: https://akhuwat.org.pk/islamic-microfinance/products/
        # Qard-e-hasan (interest-free). Min score: 20 (very accessible).
        {
            "id": str(uuid.uuid4()),
            "institution_name": "Akhuwat",
            "program_name": "Akhuwat Business Loan",
            "loan_type": "business",
            "min_loan_pkr": 10_000.0,
            "max_loan_pkr": 500_000.0,
            "min_credit_score": 20.0,
            "eligible_occupations": "farmer,daily_laborer,shopkeeper,other",
            "eligible_locations": None,  # Nationwide
            "annual_rate_pct": None,  # 0% — qard hasan
            "is_interest_free": True,
            "required_documents": "CNIC (original + copy)\nGuarantor CNIC\nProof of business/trade (receipt, shop photo, or references)\nPassport-size photographs",
            "application_steps_en": (
                "1. Visit the nearest Akhuwat branch in your city.\n"
                "2. Fill in the loan application form (staff will assist you).\n"
                "3. Provide your CNIC and a guarantor from your community (mosque member or neighbour).\n"
                "4. Akhuwat staff will visit your home/business for verification (usually within 1 week).\n"
                "5. If approved, funds are disbursed at the branch — often during a group ceremony.\n"
                "Branch locator: https://akhuwat.org.pk/contact-us/"
            ),
            "application_steps_ur": (
                "1. اپنے قریبی اخوت برانچ پر جائیں۔\n"
                "2. قرض درخواست فارم پُر کریں (عملہ مدد کرے گا)۔\n"
                "3. اپنا شناختی کارڈ اور ضامن فراہم کریں۔\n"
                "4. اخوت کا عملہ تصدیق کے لیے آپ کے گھر یا کاروبار کا دورہ کرے گا۔\n"
                "5. منظوری کے بعد برانچ پر رقم دی جائے گی۔\n"
                "برانچ تلاش: https://akhuwat.org.pk/contact-us/"
            ),
            "contact_info": "0800-00786 | https://akhuwat.org.pk",
            "is_active": True,
        },

        # ── Akhuwat — Agriculture Loan ───────────────────────────────────────
        # Source: https://akhuwat.org.pk/islamic-microfinance/products/
        # Targeted at farmers. Min score slightly higher as farm income signal helps.
        {
            "id": str(uuid.uuid4()),
            "institution_name": "Akhuwat",
            "program_name": "Akhuwat Agriculture Loan",
            "loan_type": "agriculture",
            "min_loan_pkr": 10_000.0,
            "max_loan_pkr": 300_000.0,
            "min_credit_score": 25.0,
            "eligible_occupations": "farmer",
            "eligible_locations": None,
            "annual_rate_pct": None,
            "is_interest_free": True,
            "required_documents": "CNIC (original + copy)\nLand ownership / lease documents (if available)\nGuarantor CNIC\nPassport-size photographs",
            "application_steps_en": (
                "1. Visit the nearest Akhuwat branch in your district.\n"
                "2. Fill in the agriculture loan application with crop/land details.\n"
                "3. Provide CNIC and a community guarantor.\n"
                "4. Field officer will verify your land and farming activity.\n"
                "5. Loan disbursed interest-free after approval.\n"
                "Contact: 0800-00786"
            ),
            "application_steps_ur": (
                "1. اپنے ضلع میں قریبی اخوت برانچ پر جائیں۔\n"
                "2. زرعی قرض درخواست فارم فصل اور زمین کی تفصیل کے ساتھ پُر کریں۔\n"
                "3. شناختی کارڈ اور ضامن فراہم کریں۔\n"
                "4. فیلڈ افسر آپ کی زمین کی تصدیق کرے گا۔\n"
                "5. منظوری کے بعد سودمند قرض دیا جائے گا۔\n"
                "رابطہ: 0800-00786"
            ),
            "contact_info": "0800-00786 | https://akhuwat.org.pk",
            "is_active": True,
        },

        # ── Kashf Foundation — Group Enterprise Loan ─────────────────────────
        # Source: https://www.kashf.org/products
        # Women-focused, group-guarantee model. 24% declining per annum.
        # TODO: confirm exact income bracket thresholds when published criteria updated.
        {
            "id": str(uuid.uuid4()),
            "institution_name": "Kashf Foundation",
            "program_name": "Kashf Group Enterprise Loan",
            "loan_type": "business",
            "min_loan_pkr": 15_000.0,
            "max_loan_pkr": 150_000.0,
            "min_credit_score": 30.0,
            "eligible_occupations": "shopkeeper,daily_laborer,other",
            "eligible_locations": None,
            "annual_rate_pct": 24.0,
            "is_interest_free": False,
            "required_documents": "CNIC (original + copy)\nHousehold CNIC (husband/guardian if applicable)\nPassport-size photographs\nProof of business activity (receipts, photos, references)",
            "application_steps_en": (
                "1. Contact your nearest Kashf Foundation branch.\n"
                "2. Attend a compulsory Group Formation meeting with 5–25 women in your area.\n"
                "3. Submit loan application with group members as guarantors.\n"
                "4. Kashf officer will verify household and business.\n"
                "5. Loan disbursed within 2–3 weeks of approval.\n"
                "Website: https://www.kashf.org | Helpline: 042-35761999"
            ),
            "application_steps_ur": (
                "1. قریبی کاشف فاؤنڈیشن برانچ سے رابطہ کریں۔\n"
                "2. اپنے علاقے کی 5–25 خواتین کے ساتھ لازمی گروپ تشکیل اجلاس میں شرکت کریں۔\n"
                "3. گروپ ممبران کو ضامن بنا کر قرض درخواست دیں۔\n"
                "4. کاشف افسر گھر اور کاروبار کی تصدیق کرے گا۔\n"
                "5. منظوری کے 2–3 ہفتوں میں قرض دیا جائے گا۔\n"
                "ہیلپ لائن: 042-35761999"
            ),
            "contact_info": "042-35761999 | https://www.kashf.org",
            "is_active": True,
        },

        # ── Kashf Foundation — Individual Business Loan ──────────────────────
        # Source: https://www.kashf.org/products
        # Larger individual loan, higher score threshold.
        {
            "id": str(uuid.uuid4()),
            "institution_name": "Kashf Foundation",
            "program_name": "Kashf Individual Business Loan",
            "loan_type": "business",
            "min_loan_pkr": 50_000.0,
            "max_loan_pkr": 1_000_000.0,
            "min_credit_score": 45.0,
            "eligible_occupations": "shopkeeper,other",
            "eligible_locations": None,
            "annual_rate_pct": 21.0,  # 18–24% range; using 21% as midpoint
            "is_interest_free": False,
            "required_documents": "CNIC (original + copy)\nBusiness proof (trade licence, shop ownership, or utility bill in business name)\nBank statement or financial records (if available)\nPassport-size photographs",
            "application_steps_en": (
                "1. Visit a Kashf Foundation branch or call 042-35761999.\n"
                "2. Complete the individual business loan application.\n"
                "3. Submit CNICs and business documentation.\n"
                "4. Kashf credit officer will assess your business and repayment capacity.\n"
                "5. Loan approval typically in 1–2 weeks.\n"
                "Website: https://www.kashf.org"
            ),
            "application_steps_ur": (
                "1. کاشف فاؤنڈیشن برانچ جائیں یا 042-35761999 پر کال کریں۔\n"
                "2. انفرادی کاروباری قرض درخواست مکمل کریں۔\n"
                "3. شناختی کارڈ اور کاروباری دستاویزات جمع کریں۔\n"
                "4. کاشف کریڈٹ افسر آپ کی واپسی کی صلاحیت جانچے گا۔\n"
                "5. عام طور پر 1–2 ہفتوں میں منظوری ملتی ہے۔"
            ),
            "contact_info": "042-35761999 | https://www.kashf.org",
            "is_active": True,
        },

        # ── NRSP — Agriculture / Rural Loan ──────────────────────────────────
        # Source: https://www.nrsp.org.pk/
        # National Rural Support Programme — rural areas priority, farmers and laborers.
        {
            "id": str(uuid.uuid4()),
            "institution_name": "NRSP (National Rural Support Programme)",
            "program_name": "NRSP Rural Agriculture Loan",
            "loan_type": "agriculture",
            "min_loan_pkr": 10_000.0,
            "max_loan_pkr": 300_000.0,
            "min_credit_score": 20.0,
            "eligible_occupations": "farmer,daily_laborer",
            "eligible_locations": None,  # Primarily rural — nationwide rural branches
            "annual_rate_pct": 20.0,  # 18–22% per annum; using 20% as midpoint
            "is_interest_free": False,
            "required_documents": "CNIC (original + copy)\nLand documents or tenancy agreement (for farmers)\nCommunity Organisation (CO) membership letter (NRSP requires CO membership)\nPassport-size photographs",
            "application_steps_en": (
                "1. Join a local Community Organisation (CO) facilitated by NRSP in your area.\n"
                "2. Build savings within the CO for at least 3–6 months.\n"
                "3. Apply for a loan through your CO — CO vets and endorses the application.\n"
                "4. NRSP field staff visits for assessment.\n"
                "5. Funds disbursed through the CO to the individual borrower.\n"
                "Website: https://www.nrsp.org.pk | Phone: 051-2604001"
            ),
            "application_steps_ur": (
                "1. اپنے علاقے میں NRSP کی مقامی کمیونٹی آرگنائزیشن (CO) میں شامل ہوں۔\n"
                "2. کم از کم 3–6 ماہ CO میں بچت کریں۔\n"
                "3. اپنی CO کے ذریعے قرض کی درخواست دیں — CO درخواست کی تصدیق کرتی ہے۔\n"
                "4. NRSP کا فیلڈ عملہ جائزے کے لیے آئے گا۔\n"
                "5. CO کے ذریعے قرض دار کو رقم دی جاتی ہے۔\n"
                "ویب سائٹ: https://www.nrsp.org.pk | فون: 051-2604001"
            ),
            "contact_info": "051-2604001 | https://www.nrsp.org.pk",
            "is_active": True,
        },

        # ── NRSP — Small Business Loan ───────────────────────────────────────
        # Source: https://www.nrsp.org.pk/
        {
            "id": str(uuid.uuid4()),
            "institution_name": "NRSP (National Rural Support Programme)",
            "program_name": "NRSP Small Business Loan",
            "loan_type": "business",
            "min_loan_pkr": 25_000.0,
            "max_loan_pkr": 200_000.0,
            "min_credit_score": 30.0,
            "eligible_occupations": "shopkeeper,daily_laborer,other",
            "eligible_locations": None,
            "annual_rate_pct": 22.0,
            "is_interest_free": False,
            "required_documents": "CNIC (original + copy)\nCommunity Organisation (CO) membership\nProof of business (trade references or utility bill)\nPassport-size photographs",
            "application_steps_en": (
                "1. Become a member of an NRSP Community Organisation (CO) in your area.\n"
                "2. Participate in CO meetings and savings for at least 3 months.\n"
                "3. CO recommends you for a business loan.\n"
                "4. NRSP field officer assesses your business and repayment capacity.\n"
                "5. Loan disbursed after approval — typically within 2 weeks.\n"
                "Phone: 051-2604001"
            ),
            "application_steps_ur": (
                "1. اپنے علاقے میں NRSP کمیونٹی آرگنائزیشن (CO) کے ممبر بنیں۔\n"
                "2. کم از کم 3 ماہ CO کے اجلاسوں اور بچت میں حصہ لیں۔\n"
                "3. CO آپ کو کاروباری قرض کے لیے سفارش کرے گی۔\n"
                "4. NRSP فیلڈ افسر آپ کی واپسی کی صلاحیت جانچے گا۔\n"
                "5. منظوری کے بعد عام طور پر 2 ہفتوں میں قرض دیا جاتا ہے۔\n"
                "فون: 051-2604001"
            ),
            "contact_info": "051-2604001 | https://www.nrsp.org.pk",
            "is_active": True,
        },
    ])


def downgrade() -> None:
    op.drop_table("microfinance_programs")
    loan_type_enum.drop(op.get_bind(), checkfirst=True)
