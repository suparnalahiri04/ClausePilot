import io
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Tuple
from models import DocumentSection


def extract_text_from_bytes(filename: str, file_bytes: bytes) -> Tuple[str, int]:
    """
    Extracts plain text and page count from PDF, DOCX, TXT, or MD files.
    Uses PyMuPDF (fitz) for PDF and python-docx (with XML fallback) for DOCX.
    """
    lower_name = (filename or "").lower()

    if lower_name.endswith(".pdf"):
        try:
            try:
                import pymupdf as fitz
            except ImportError:
                import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            pages = []
            for page in doc:
                pages.append(page.get_text("text"))
            page_count = max(len(pages), 1)
            full_text = "\n\n".join(p.strip() for p in pages if p.strip())
            doc.close()
            if full_text.strip():
                return full_text, page_count
        except Exception:
            pass
        # Fallback if PDF is text-encoded or minimal
        decoded = file_bytes.decode("utf-8", errors="ignore")
        return decoded.strip() or "Unable to extract text from PDF binary stream.", 1

    elif lower_name.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            # Also extract any table cells
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        paragraphs.append(row_text)
            full_text = "\n\n".join(paragraphs)
            est_pages = max(1, round(len(full_text) / 2600))
            if full_text.strip():
                return full_text, est_pages
        except Exception:
            pass

        # Native ZIP + XML fallback for .docx
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                xml_content = zf.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            paragraphs = []
            for elem in tree.iter():
                if elem.tag.endswith("}p"):
                    texts = [t.text for t in elem.iter() if t.tag.endswith("}t") and t.text]
                    if texts:
                        paragraphs.append("".join(texts).strip())
            full_text = "\n\n".join(p for p in paragraphs if p)
            est_pages = max(1, round(len(full_text) / 2600))
            return full_text, est_pages
        except Exception:
            pass

    # Default text / markdown
    text = file_bytes.decode("utf-8", errors="replace").replace("\r\n", "\n").strip()
    est_pages = max(1, round(len(text) / 2600))
    return text, est_pages


def parse_document_sections(source_text: str) -> List[DocumentSection]:
    """
    Splits a contract's source text into structured, navigable DocumentSections
    with exact start_char and end_char offsets for highlighting.
    """
    if not source_text.strip():
        return []

    # Match headings like "1. DEFINITIONS", "SECTION 2: TERM AND RENEWAL", "Article 4 - Liability", etc.
    heading_regex = re.compile(
        r"(?m)^(?:SECTION\s+|ARTICLE\s+)?(\d+(?:\.\d+)?)\s*[\.\:\—\-]\s*([A-Z][A-Za-z0-9\s\,\&\-\(\)\/]{2,70})$"
    )
    matches = list(heading_regex.finditer(source_text))

    sections: List[DocumentSection] = []

    if not matches:
        # Fallback: split by double newline into logical clauses/blocks
        blocks = [b for b in re.split(r"\n\s*\n", source_text) if b.strip()]
        cursor = 0
        for idx, block in enumerate(blocks):
            pos = source_text.find(block, cursor)
            if pos == -1:
                pos = cursor
            end_pos = pos + len(block)
            cursor = end_pos
            first_line = block.strip().split("\n")[0][:60]
            sections.append(
                DocumentSection(
                    id=f"sec-{idx + 1}",
                    number=str(idx + 1),
                    heading=first_line if len(first_line) > 4 else f"Clause Block {idx + 1}",
                    content=block.strip(),
                    start_char=pos,
                    end_char=end_pos,
                )
            )
        return sections

    # If preamble exists before first numbered section
    if matches[0].start() > 30:
        preamble_text = source_text[: matches[0].start()].strip()
        sections.append(
            DocumentSection(
                id="sec-preamble",
                number="0",
                heading="Preamble & Recitals",
                content=preamble_text,
                start_char=0,
                end_char=matches[0].start(),
            )
        )

    for idx, match in enumerate(matches):
        sec_num = match.group(1).strip()
        sec_heading = match.group(2).strip().title()
        start_pos = match.start()
        end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(source_text)
        content_slice = source_text[start_pos:end_pos].strip()
        sections.append(
            DocumentSection(
                id=f"sec-{sec_num.replace('.', '-')}",
                number=sec_num,
                heading=sec_heading,
                content=content_slice,
                start_char=start_pos,
                end_char=end_pos,
            )
        )

    return sections


SAMPLE_CONTRACTS: Dict[str, Dict[str, Any]] = {
    "veridian_msa_v2": {
        "key": "veridian_msa_v2",
        "title": "Veridian Cloud Enterprise MSA (v2.4)",
        "counterparty": "Veridian Cloud Systems Inc.",
        "category": "SaaS & Cloud Infrastructure",
        "contract_type": "Master Services Agreement",
        "effective_date": "2026-02-01",
        "expiration_date": "2027-01-31",
        "annual_value": 184000,
        "governing_law": "State of Delaware",
        "description": "Enterprise cloud hosting and AI compute clusters agreement with automatic renewal and uncapped indemnification carvouts.",
        "content": """MASTER SERVICES AGREEMENT (v2.4)

This Master Services Agreement ("Agreement") is entered into as of February 1, 2026 ("Effective Date"), by and between Veridian Cloud Systems Inc., a Delaware corporation ("Provider"), and Acme Orbit Technologies Inc. ("Customer").

1. SCOPE OF CLOUD SERVICES AND UPTIME COMMITMENT
Provider shall provision and maintain dedicated GPU and high-availability compute clusters as specified in Order Form #2026-01. Provider guarantees a Monthly Uptime Percentage of at least 99.95% across all production availability zones. Should Provider fail to meet the 99.95% threshold in any calendar month, Customer shall request service credits in writing within fifteen (15) business days following the end of the affected month, or such right to service credits shall be permanently waived.

2. TERM AND AUTOMATIC RENEWAL
The Initial Term of this Agreement shall commence on the Effective Date and continue for twelve (12) months until January 31, 2027. Upon expiration of the Initial Term, this Agreement shall automatically renew for successive twenty-four (24) month Renewal Terms unless either party delivers written notice of non-renewal at least ninety (90) days prior to the end of the then-current term. Upon any automatic renewal, Provider reserves the right to increase annual platform subscription fees by up to twelve percent (12%) above the prior term's list rate without prior written consent.

3. FEES, INVOICING, AND LATE PAYMENT PENALTIES
Customer shall pay an Annual Platform Commitment of $184,000 USD, billed quarterly in advance in equal installments of $46,000 USD. All undisputed and disputed invoice amounts are due strictly within fifteen (15) calendar days of the invoice date ("Net 15"). Any invoice balance remaining unpaid after fifteen (15) days shall accrue late interest at the rate of two percent (2.0%) per month (24% per annum) and Provider may immediately suspend production API access upon forty-eight (48) hours electronic notice.

4. TERMINATION RIGHTS AND EARLY EXIT FEES
Provider may terminate this Agreement for convenience at any time by providing thirty (30) days written notice to Customer. Customer shall have no right to terminate this Agreement for convenience during the Initial Term or any Renewal Term. If Customer terminates this Agreement prior to expiration for any reason other than Provider's uncured material breach, Customer shall immediately pay an Early Termination Fee equal to one hundred percent (100%) of the remaining committed fees for the balance of the then-current term within ten (10) business days.

5. DATA SECURITY, INCIDENT NOTIFICATION, AND AUDIT DELIVERABLES
Provider shall maintain SOC 2 Type II and ISO/IEC 27001 certifications throughout the Term. Within ten (10) days of the start of each calendar quarter, Customer's Security Operations Lead must submit an updated Authorized IAM Administrator Roster and quarterly penetration test attestation to Provider's Trust Portal. In the event of a confirmed Security Incident affecting Customer Data, Provider shall notify Customer within seventy-two (72) hours of confirmation.

6. LIMITATION OF LIABILITY AND SUPER-CAP CARVEOUTS
EXCEPT FOR EXCLUDED CLAIMS, NEITHER PARTY'S AGGREGATE CUMULATIVE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL EXCEED THE FEES PAID BY CUSTOMER IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY ($46,000 EQUIVALENT). HOWEVER, CUSTOMER'S LIABILITY FOR ANY BREACH OF SECTION 3 (PAYMENT), SECTION 7 (CONFIDENTIALITY), OR THIRD-PARTY INTELLECTUAL PROPERTY INDEMNIFICATION CLAIMS SHALL BE STRICTLY UNCAPPED AND UNLIMITED.

7. CONFIDENTIALITY AND DATA RETURN OBLIGATIONS
Each party shall protect the other party's Confidential Information using at least the same degree of care it uses to protect its own confidential materials of like importance. Within thirty (30) calendar days following termination or expiration of this Agreement, Customer must export all production archives from the platform, after which Provider shall permanently purge and cryptographic-erase all Customer tenants without recovery backup.

8. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, excluding its conflict of law rules. Any dispute arising out of this Agreement shall be resolved by binding arbitration in Wilmington, Delaware."""
    },
    "northstar_dpa_sla": {
        "key": "northstar_dpa_sla",
        "title": "NorthStar AI Data Processing & Enterprise SLA",
        "counterparty": "NorthStar Cognitive Labs Ltd.",
        "category": "AI & Data Processing",
        "contract_type": "Data Processing Addendum",
        "effective_date": "2026-04-15",
        "expiration_date": "2027-04-14",
        "annual_value": 112000,
        "governing_law": "State of New York",
        "description": "Enterprise LLM inference and enterprise data processing agreement governing PII scrubbing, subprocessor changes, and audit schedules.",
        "content": """ENTERPRISE DATA PROCESSING AND SERVICE LEVEL AGREEMENT

This Enterprise Data Processing and Service Level Agreement ("DPA") is effective as of April 15, 2026, between NorthStar Cognitive Labs Ltd. ("Processor") and Acme Orbit Technologies Inc. ("Controller").

1. DATA PROCESSING INSTRUCTIONS AND ZERO-RETENTION GUARANTEE
Processor shall process Personal Data and Customer Prompts solely on documented instructions from Controller. Processor warrants that enterprise API payloads shall not be used to train, fine-tune, or improve foundation models shared with third parties. Ephemeral abuse-monitoring logs shall be retained for a maximum of fourteen (14) days and encrypted at rest using AES-256.

2. TERM, AUTO-RENEWAL, AND NOTICE WINDOW
This DPA is co-terminous with Order Schedule #NS-884 and runs for an initial period of twelve (12) months expiring on April 14, 2027. The Order Schedule automatically renews for additional one (1) year periods unless Controller provides written notice of non-renewal at least sixty (60) days prior to the renewal date (on or before February 13, 2027).

3. SUBPROCESSOR AUTHORIZATION AND OBJECTION TIMELINE
Processor maintains an active list of authorized Subprocessors. Processor shall provide Controller with at least fourteen (14) calendar days prior written notice before engaging any new Subprocessor that handles Customer Personal Data. Controller must lodge any written data-protection objection within ten (10) calendar days of receiving such notice, or the Subprocessor shall be deemed unconditionally approved.

4. COMMERCIAL PAYMENT TERMS AND USAGE OVERAGES
Controller shall pay an Annual Base Subscription of $112,000 USD, payable on Net 30 terms upon receipt of invoice. Token throughput exceeding 500 million tokens per month shall be billed monthly in arrears at $4.50 per million tokens. Controller must reconcile and approve monthly token telemetry statements by the fifth (5th) business day of each month.

5. TERMINATION FOR CAUSE AND TRANSITION ASSISTANCE
Either party may terminate this Agreement for material breach if the breaching party fails to cure such breach within thirty (30) days after receiving written notice. Upon termination, Processor shall provide up to forty-five (45) days of migration assistance at Processor's standard professional services rate of $320 per hour.

6. LIABILITY ALLOCATION AND REGULATORY FINES
EACH PARTY'S TOTAL AGGREGATE LIABILITY UNDER THIS DPA SHALL BE LIMITED TO TWO TIMES (2X) THE ANNUAL FEES PAID UNDER THE APPLICABLE ORDER SCHEDULE ($224,000 USD). NOTWITHSTANDING THE FOREGOING, PROCESSOR DISCLAIMS ALL LIABILITY FOR INDIRECT, CONSEQUENTIAL, OR REGULATORY PENALTY DAMAGES EXCEEDING $100,000 USD ARISING FROM CONTROLLER'S MISCONFIGURATION OF API GUARDRAILS.

7. MANDATORY COMPLIANCE AND PRIVACY IMPACT DELIVERABLES
Controller shall complete and deliver an Annual Data Classification & DPIA Attestation Certificate to Processor's Data Protection Officer no later than November 15, 2026. Furthermore, Controller shall rotate all production API signing keys every ninety (90) days in accordance with Section 7.2 security hygiene requirements."""
    },
    "kestrel_logistics_v1": {
        "key": "kestrel_logistics_v1",
        "title": "Kestrel Global Fulfilment Agreement (v1.0 - Baseline)",
        "counterparty": "Kestrel Supply & Logistics Corp.",
        "category": "Procurement & Supply Chain",
        "contract_type": "Vendor Services Agreement",
        "effective_date": "2026-01-15",
        "expiration_date": "2026-12-31",
        "annual_value": 240000,
        "governing_law": "State of California",
        "description": "Baseline v1.0 hardware assembly and cold-chain logistics agreement with balanced mutual termination and Net 45 payment terms.",
        "content": """STRATEGIC VENDOR FULFILMENT AGREEMENT (VERSION 1.0)

This Strategic Vendor Fulfilment Agreement ("Agreement") is entered into on January 15, 2026, between Kestrel Supply & Logistics Corp. ("Vendor") and Acme Orbit Technologies Inc. ("Buyer").

1. LOGISTICS SERVICES AND DELIVERY SLA
Vendor shall provide regional warehousing, kitting, and express freight fulfilment for Buyer's edge sensor hardware across North American distribution hubs. Vendor commits to a 98.5% On-Time Dispatch SLA for all orders placed prior to 2:00 PM Pacific Time.

2. TERM AND RENEWAL OPTIONS
This Agreement commences on January 15, 2026 and expires on December 31, 2026 ("Initial Term"). This Agreement may be renewed for an additional twelve (12) month term only upon mutual written agreement executed by both parties at least thirty (30) days prior to expiration. Annual rate card increases upon renewal shall be capped at three percent (3%) or CPI, whichever is lower.

3. PRICING, MINIMUM COMMITMENTS, AND PAYMENT TERMS
Buyer agrees to an estimated annual spend of $240,000 USD with no binding minimum volume penalty. Vendor shall issue monthly invoices in arrears, and Buyer shall pay all undisputed invoices within forty-five (45) days of receipt ("Net 45"). Late payments shall accrue interest at 0.5% per month after a fifteen (15) day cure period.

4. TERMINATION FOR CONVENIENCE AND CAUSE
Either party may terminate this Agreement for convenience upon sixty (60) days prior written notice without penalty or early exit fee. Either party may terminate immediately for material breach if such breach remains uncured after thirty (30) days written notice.

5. LIMITATION OF LIABILITY AND INSURANCE
NEITHER PARTY'S AGGREGATE LIABILITY SHALL EXCEED TWELVE (12) MONTHS OF FEES PAID OR PAYABLE UNDER THIS AGREEMENT ($240,000 USD). Vendor shall maintain Commercial General Liability and Cargo Transit Insurance of at least $5,000,000 USD per occurrence and provide Buyer with an updated Certificate of Insurance (COI) by November 30, 2026.

6. QUARTERLY INVENTORY RECONCILIATION
Vendor and Buyer's Supply Chain Manager shall conduct a joint physical and cycle inventory audit within ten (10) business days following the close of each fiscal quarter."""
    },
    "kestrel_logistics_v2": {
        "key": "kestrel_logistics_v2",
        "title": "Kestrel Global Fulfilment Agreement (v2.0 - Counterparty Redline)",
        "counterparty": "Kestrel Supply & Logistics Corp.",
        "category": "Procurement & Supply Chain",
        "contract_type": "Vendor Services Agreement",
        "effective_date": "2026-01-15",
        "expiration_date": "2027-12-31",
        "annual_value": 310000,
        "governing_law": "State of Texas",
        "description": "Counterparty redline v2.0 introducing auto-renewal, Net 15 terms, minimum volume take-or-pay penalties, and a reduced liability cap.",
        "content": """STRATEGIC VENDOR FULFILMENT AGREEMENT (VERSION 2.0 - REDLINE)

This Strategic Vendor Fulfilment Agreement ("Agreement") is entered into on January 15, 2026, between Kestrel Supply & Logistics Corp. ("Vendor") and Acme Orbit Technologies Inc. ("Buyer").

1. LOGISTICS SERVICES AND DELIVERY SLA
Vendor shall provide regional warehousing, kitting, and express freight fulfilment for Buyer's edge sensor hardware across North American distribution hubs. Vendor targets a 95.0% On-Time Dispatch objective on a commercially reasonable efforts basis, without financial service credits.

2. TERM AND AUTOMATIC RENEWAL
This Agreement commences on January 15, 2026 and continues until December 31, 2027 ("Initial Term"). Thereafter, this Agreement shall automatically renew for successive two (2) year terms unless Buyer delivers written notice of non-renewal at least one hundred twenty (120) days prior to expiration. Vendor may adjust unit fulfilment pricing by up to ten percent (10%) at the start of each renewal year.

3. PRICING, TAKE-OR-PAY MINIMUMS, AND PAYMENT TERMS
Buyer commits to a binding Take-or-Pay Annual Minimum Spend of $310,000 USD. Any shortfall below the annual minimum shall be invoiced as a lump-sum deficiency fee on December 15 of each contract year. Vendor shall issue monthly invoices in advance, and Buyer shall pay all invoices strictly within fifteen (15) days of invoice date ("Net 15"). Late payments shall accrue interest at 1.75% per month immediately upon the due date.

4. TERMINATION FOR CONVENIENCE AND CAUSE
Vendor may terminate this Agreement for convenience upon thirty (30) days prior written notice. Buyer may terminate for convenience only by paying an Early Exit Liquidated Damages fee equal to seventy-five percent (75%) of the remaining Take-or-Pay Minimum Commitment. Either party may terminate for material breach if uncured after forty-five (45) days written notice.

5. LIMITATION OF LIABILITY AND INSURANCE
VENDOR'S AGGREGATE CUMULATIVE LIABILITY UNDER THIS AGREEMENT SHALL IN NO EVENT EXCEED TWO (2) MONTHS OF AVERAGE BILLINGS ($51,666 USD). BUYER'S LIABILITY FOR TAKE-OR-PAY SHORTFALLS AND INDEMNIFICATION OBLIGATIONS SHALL BE UNLIMITED. Vendor shall maintain Cargo Transit Insurance of $1,500,000 USD per occurrence and provide Buyer with an updated Certificate of Insurance (COI) by November 30, 2026.

6. QUARTERLY INVENTORY RECONCILIATION AND FORECASTING
Buyer's Supply Chain Manager must submit a binding 90-day rolling demand forecast on the first (1st) business day of every calendar quarter, and conduct a joint cycle inventory audit within ten (10) business days following quarter close."""
    },
    "meridian_workspace_lease": {
        "key": "meridian_workspace_lease",
        "title": "Meridian SOMA Innovation Hub Commercial Lease",
        "counterparty": "Meridian REIT Properties LLC",
        "category": "Real Estate & Facilities",
        "contract_type": "Commercial Sublease",
        "effective_date": "2026-03-01",
        "expiration_date": "2028-02-29",
        "annual_value": 295000,
        "governing_law": "State of California",
        "description": "San Francisco R&D headquarters commercial lease including CAM operating expense reconciliation, letter of credit rules, and holdover rent multipliers.",
        "content": """COMMERCIAL OFFICE LEASE AGREEMENT

This Commercial Office Lease Agreement ("Lease") is made effective March 1, 2026, by and between Meridian REIT Properties LLC ("Landlord") and Acme Orbit Technologies Inc. ("Tenant") for Suite 400 (8,400 rentable sq. ft.) at 550 Howard Street, San Francisco, CA.

1. TERM, OPTION TO EXTEND, AND HOLDOVER PENALTY
The Lease Term shall be twenty-four (24) months commencing March 1, 2026 and expiring February 29, 2028. Tenant shall have one (1) option to extend the Lease for twenty-four (24) months provided Tenant delivers irrevocable written notice to Landlord at least one hundred eighty (180) days prior to Lease expiration (no later than September 2, 2027). If Tenant remains in possession after expiration without executing an extension, Holdover Rent shall automatically escalate to two hundred percent (200%) of the final month's Base Rent.

2. BASE RENT, OPERATING EXPENSES, AND PAYMENT SCHEDULE
Tenant shall pay Annual Base Rent of $295,000 USD ($24,583.33 per month), payable via ACH on or before the first (1st) business day of each calendar month without offset or deduction. Any installment received after the fifth (5th) calendar day of the month shall incur an automatic five percent (5%) administrative late charge. Tenant shall also pay its pro-rata share (14.2%) of annual Common Area Maintenance (CAM) escalations exceeding Base Year 2026 without an annual cap on controllable operating expenses.

3. SECURITY DEPOSIT AND LETTER OF CREDIT RENEWAL
Tenant has delivered an irrevocable Standby Letter of Credit in the amount of $73,750 USD issued by Silicon Commercial Bank. Tenant must renew and deliver confirmation of the Standby Letter of Credit continuation at least forty-five (45) days prior to its annual expiration date of December 15, 2026, or Landlord shall be entitled to draw down the full cash balance immediately.

4. MAINTENANCE, ALTERATIONS, AND ENVIRONMENTAL COMPLIANCE
Tenant shall maintain the interior premises and HVAC supplemental cooling units in good operating order and submit semi-annual HVAC maintenance inspection logs to Landlord's Property Manager on June 30 and December 30 of each year. Upon Lease termination, Tenant shall restore all custom server room partitioning to original shell condition at Tenant's sole expense.

5. INDEMNIFICATION AND CASUALTY LIABILITY
TENANT SHALL INDEMNIFY AND HOLD HARMLESS LANDLORD AGAINST ALL CLAIMS ARISING WITHIN THE PREMISES EXCEPT TO THE EXTENT CAUSED BY LANDLORD'S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT. LANDLORD'S LIABILITY TO TENANT FOR ANY DEFAULT UNDER THIS LEASE SHALL BE LIMITED STRICTLY TO LANDLORD'S EQUITY INTEREST IN THE BUILDING, AND LANDLORD SHALL HAVE NO LIABILITY FOR BUSINESS INTERRUPTION OR LOST RESEARCH DATA."""
    }
}
