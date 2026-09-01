"""007_gov_scheme_schema

Revision ID: 007_gov_scheme_schema
Revises: 9f848c77be8d
Create Date: 2026-09-01

"""
import uuid
from datetime import datetime, timezone
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_gov_scheme_schema'
down_revision = '6a8899b703ef'
branch_labels = None

depends_on = None


def upgrade() -> None:
    # 1. Create gov_schemes table
    op.create_table(
        'gov_schemes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('title_ur', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('description_ur', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('provider', sa.String(length=100), nullable=False),
        sa.Column('benefit_summary', sa.String(length=255), nullable=False),
        sa.Column('benefit_summary_ur', sa.String(length=255), nullable=False),
        sa.Column('criteria_json', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('application_steps', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('application_steps_ur', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('official_portal_url', sa.String(length=255), nullable=True),
        sa.Column('sms_service_code', sa.String(length=20), nullable=True),
        sa.Column('source_citation', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_gov_schemes_code'), 'gov_schemes', ['code'], unique=True)
    op.create_index(op.f('ix_gov_schemes_category'), 'gov_schemes', ['category'], unique=False)

    # 2. Seed initial government scheme data with cited criteria
    gov_schemes_table = sa.table(
        'gov_schemes',
        sa.column('id', postgresql.UUID(as_uuid=True)),
        sa.column('code', sa.String),
        sa.column('title', sa.String),
        sa.column('title_ur', sa.String),
        sa.column('description', sa.Text),
        sa.column('description_ur', sa.Text),
        sa.column('category', sa.String),
        sa.column('provider', sa.String),
        sa.column('benefit_summary', sa.String),
        sa.column('benefit_summary_ur', sa.String),
        sa.column('criteria_json', postgresql.JSON),
        sa.column('application_steps', postgresql.JSON),
        sa.column('application_steps_ur', postgresql.JSON),
        sa.column('official_portal_url', sa.String),
        sa.column('sms_service_code', sa.String),
        sa.column('source_citation', sa.Text),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime(timezone=True)),
        sa.column('updated_at', sa.DateTime(timezone=True)),
    )

    now = datetime.now(timezone.utc)

    op.bulk_insert(
        gov_schemes_table,
        [
            # 1. Punjab Kissan Card
            {
                'id': str(uuid.uuid4()),
                'code': 'kissan_card',
                'title': 'Punjab Kissan Card',
                'title_ur': 'پنجاب کسان کارڈ',
                'description': 'Interest-free production loans up to Rs. 150,000 for small farmers in Punjab to buy seeds, fertilizers, and crop protection inputs.',
                'description_ur': 'پنجاب کے چھوٹے کسانوں کے لیے بیج، کھاد اور ادویات کی خریداری کے لیے 1,50,000 روپے تک بلا سود زراعت قرضہ۔',
                'category': 'agriculture',
                'provider': 'Government of Punjab / Bank of Punjab (BOP)',
                'benefit_summary': 'Interest-free crop loan up to Rs. 150,000 (Rs. 30,000/acre) + direct fertilizer/seed subsidies.',
                'benefit_summary_ur': '150,000 روپے تک بلا سود قرضہ اور کھاد/بیج پر براہ راست سبسڈیاں۔',
                'criteria_json': {
                    'required_occupation': 'farmer',  # Primary: agripunjab.gov.pk
                    'required_province': 'punjab',   # Primary: agripunjab.gov.pk
                    'min_land_acres': 1.0,           # Primary: agripunjab.gov.pk (1.0–12.5 acres PLRA record)
                    'max_land_acres': 12.5,          # Primary: agripunjab.gov.pk
                    'max_financing_limit_pkr': 150000, # Primary: agripunjab.gov.pk & bop.com.pk (Rs 30k/acre capped at 5 acres)
                    'disqualifications': ['loan_defaulter'] # Primary: eCIB check via BOP
                },
                'application_steps': [
                    'Send your 13-digit CNIC (without dashes) via SMS to 8070 to verify land record status.',
                    'Visit your local Tehsil Agriculture Office / PLRA center for land ownership confirmation.',
                    'Open a Kissan Card account at the nearest Bank of Punjab (BOP) branch to receive funds.'
                ],
                'application_steps_ur': [
                    'زمین کے ریکارڈ کی تصدیق کے لیے اپنا 13 ہندسوں کا قومی شناختی کارڈ بغیر ڈیش کے 8070 پر ایس ایم ایس کریں۔',
                    'ملکیت کی تصدیق کے لیے قریبی تحصیل زراعت کے دفتر یا PLRA سنٹر پر تشریف لے جائیں۔',
                    'قرضے کی رقم حاصل کرنے کے لیے بینک آف پنجاب (BOP) کی قریبی برانچ میں کسان کارڈ اکاؤنٹ کھلواؤ۔'
                ],
                'official_portal_url': 'https://agripunjab.gov.pk',
                'sms_service_code': '8070',
                'source_citation': 'Primary Source: Government of the Punjab Agriculture Department (agripunjab.gov.pk) & Bank of Punjab (bop.com.pk). Verified SMS service: 8070 (Checked Sep 2026).',
                'is_active': True,
                'created_at': now,
                'updated_at': now,
            },
            # 2. BISP Benazir Kafaalat
            {
                'id': str(uuid.uuid4()),
                'code': 'bisp_kafaalat',
                'title': 'BISP / Benazir Kafaalat Program',
                'title_ur': 'بینظیر کفالت پروگرام',
                'description': 'Federal social safety cash transfer program providing quarterly financial grants to female heads of vulnerable households.',
                'description_ur': 'مستحق خاندانوں کی خواتین سربراہان کے لیے وفاقی حکومت کا سہ ماہی مالی امدادی کیش پروگرام۔',
                'category': 'social_welfare',
                'provider': 'Benazir Income Support Programme (Federal Govt)',
                'benefit_summary': 'Quarterly cash grant transfer of Rs. 13,500 via biometric ATMs / partner bank outlets.',
                'benefit_summary_ur': 'بایومیٹرک اے ٹی ایم سے 13,500 روپے سہ ماہی نقد رقم۔',
                'criteria_json': {
                    'quarterly_grant_pkr': 13500,     # Primary: bisp.gov.pk / 8171.bisp.gov.pk Jan 2025 release
                    'max_pmt_score': 32,             # Primary: bisp.gov.pk (NSER PMT poverty cutoff <= 32)
                    'max_monthly_income_pkr': 25000, # TODO: verify — unconfirmed criterion (Proxy indicator from secondary guides; not explicit on bisp.gov.pk home)
                    'disqualifications': ['govt_employee', 'tax_filer', 'car_owner', 'international_travel'] # Primary: bisp.gov.pk official exclusion rules
                },
                'application_steps': [
                    'Send your 13-digit CNIC via SMS to 8171 or verify status online at 8171.bisp.gov.pk.',
                    'Visit the nearest BISP Dynamic Registration Centre at your Tehsil office if unrecorded in NSER survey.',
                    'Complete biometric household assessment and receive quarterly stipend (Rs. 13,500) via biometric ATM.'
                ],
                'application_steps_ur': [
                    'اپنا شناختی کارڈ نمبر 8171 پر ایس ایم ایس کریں یا 8171.bisp.gov.pk پر چیک کریں۔',
                    'اگر ڈیٹا درج نہیں تو اپنے قریبی BISP ڈائنامک رجسٹریشن سنٹر پر تشریف لے جائیں۔',
                    'بایومیٹرک NSER سروے مکمل کروائیں اور اے ٹی ایم سے 13,500 روپے سہ ماہی رقم وصول کریں۔'
                ],
                'official_portal_url': 'https://8171.bisp.gov.pk',
                'sms_service_code': '8171',
                'source_citation': 'Primary Source: Benazir Income Support Programme (bisp.gov.pk & 8171.bisp.gov.pk, Jan 2025 official stipend increase to Rs 13,500). Verified SMS service: 8171 (Checked Sep 2026).',
                'is_active': True,
                'created_at': now,
                'updated_at': now,
            },
            # 3. Prime Minister Youth Business & Agriculture Loan
            {
                'id': str(uuid.uuid4()),
                'code': 'pm_youth_loan',
                'title': "PM's Youth Business & Agri Loan (Tier 1)",
                'title_ur': 'وزیراعظم یوتھ بزنس اینڈ ایگریکلچر لون اسکیم',
                'description': 'Subsidized loan program offering interest-free loans up to Rs. 500,000 for young entrepreneurs, farmers, and small business owners.',
                'description_ur': 'نوجوان تاجروں اور کسانوں کے لیے 500,000 روپے تک بلا سود زرعی اور کاروباری قرضہ۔',
                'category': 'youth_loan',
                'provider': 'Prime Minister Youth Programme / SBP / Participating Banks',
                'benefit_summary': 'Tier-1 interest-free loan up to Rs. 500,000 with 0% mark-up rate and easy repayment terms.',
                'benefit_summary_ur': '500,000 روپے تک 0 فیصد مارک اپ پر آسان اقساط کے ساتھ قرضہ۔',
                'criteria_json': {
                    'min_age': 18,                     # Primary: pmyp.gov.pk
                    'max_age': 45,                     # Primary: pmyp.gov.pk
                    'citizenship': 'pakistani',         # Primary: pmyp.gov.pk
                    'loan_tier_1_max_pkr': 500000,    # Primary: pmyp.gov.pk
                    'tier_1_interest_rate_pct': 0.0   # Primary: pmyp.gov.pk
                },
                'application_steps': [
                    'Visit the official Prime Minister Youth Programme portal (pmyp.gov.pk).',
                    'Fill out the online application form with valid CNIC and business/agri expansion plan.',
                    'Select a participating commercial bank (NBP, BOP, HBL) for credit evaluation.'
                ],
                'application_steps_ur': [
                    'وزیراعظم یوتھ پروگرام کی آفیشل پورٹل (pmyp.gov.pk) پر جائیں۔',
                    'اپنے قومی شناختی کارڈ اور کاروباری پلان کے ساتھ آن لائن درخواست فارم پر کریں۔',
                    'کریڈٹ جانچ کے لیے کسی نامزد بینک کا انتخاب کریں۔'
                ],
                'official_portal_url': 'https://pmyp.gov.pk',
                'sms_service_code': None,
                'source_citation': 'Primary Source: Prime Minister Youth Programme (pmyp.gov.pk) & State Bank of Pakistan Guidelines (Checked Sep 2026).',
                'is_active': True,
                'created_at': now,
                'updated_at': now,
            }
        ]
    )



def downgrade() -> None:
    op.drop_index(op.f('ix_gov_schemes_category'), table_name='gov_schemes')
    op.drop_index(op.f('ix_gov_schemes_code'), table_name='gov_schemes')
    op.drop_table('gov_schemes')
