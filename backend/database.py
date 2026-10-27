import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

from ingestion import SAMPLE_CONTRACTS, parse_document_sections
from ai_engine import analyze_contract_document
from verification import verify_excerpt_against_source

DB_PATH = os.path.join(os.path.dirname(__file__), "clausepilot.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        counterparty TEXT NOT NULL,
        category TEXT NOT NULL,
        contract_type TEXT NOT NULL,
        status TEXT NOT NULL,
        effective_date TEXT NOT NULL,
        expiration_date TEXT NOT NULL,
        annual_value REAL NOT NULL,
        governing_law TEXT NOT NULL,
        renewal_type TEXT NOT NULL,
        notice_period_days INTEGER NOT NULL,
        risk_score INTEGER NOT NULL,
        page_count INTEGER NOT NULL,
        executive_summary TEXT NOT NULL,
        key_takeaways_json TEXT NOT NULL,
        source_text TEXT NOT NULL,
        sections_json TEXT NOT NULL,
        clauses_json TEXT NOT NULL,
        verification_audit_json TEXT NOT NULL,
        uploaded_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS risks (
        id TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        contract_title TEXT NOT NULL,
        counterparty TEXT NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        rationale TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        evidence_quote TEXT NOT NULL,
        section_ref TEXT NOT NULL,
        status TEXT NOT NULL,
        reviewer_note TEXT DEFAULT '',
        verification_json TEXT NOT NULL,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS obligations (
        id TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        contract_title TEXT NOT NULL,
        counterparty TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        owner TEXT NOT NULL,
        department TEXT NOT NULL,
        due_date TEXT NOT NULL,
        recurrence TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        evidence_quote TEXT NOT NULL,
        section_ref TEXT NOT NULL,
        verification_json TEXT NOT NULL,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS qa_history (
        id TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        supported INTEGER NOT NULL,
        confidence REAL NOT NULL,
        verification_summary TEXT NOT NULL,
        citations_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        contract_id TEXT,
        actor TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    default_settings = {
        "gemini_api_key": os.environ.get("GEMINI_API_KEY", ""),
        "ai_model": "gemini-2.5-flash",
        "verification_strictness": "Strict (Exact + High-Confidence Grounding)",
        "min_grounding_score": "0.72",
        "renewal_notice_window_days": "90",
        "organization_name": "Acme Orbit Technologies Inc.",
        "primary_jurisdiction": "State of Delaware",
        "auto_flag_unverified": "true",
    }
    for k, v in default_settings.items():
        cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()
    conn.close()


def clear_all_portfolio_data() -> None:
    """
    Resets the database to a clean Zero-State so users can test empty-state UI
    and the one-click 'Load 3 Pre-Verified Sample Contracts' fixture loader.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM qa_history")
    cur.execute("DELETE FROM obligations")
    cur.execute("DELETE FROM risks")
    cur.execute("DELETE FROM contracts")
    cur.execute("DELETE FROM activities")
    conn.commit()
    conn.close()


def seed_three_sample_contracts() -> List[Dict[str, Any]]:
    """
    One-click fixture loader that populates 3 flagship Pre-Verified Sample Contracts
    (Veridian Cloud Enterprise MSA v2.4, NorthStar AI Data Processing & SLA, and
    Kestrel Global Fulfilment Agreement v2.0 Redline) along with categorized risks,
    obligations, Q&A citations, and audit logs.
    """
    clear_all_portfolio_data()

    seed_configs = [
        ("cnt-veridian-01", "veridian_msa_v2", "Active Review", "2026-10-22T14:20:00Z"),
        ("cnt-northstar-02", "northstar_dpa_sla", "Active", "2026-10-24T09:45:00Z"),
        ("cnt-kestrel-v2", "kestrel_logistics_v2", "Redline Review", "2026-10-26T16:30:00Z"),
    ]

    for cid, sample_key, status_label, uploaded_at in seed_configs:
        sample = SAMPLE_CONTRACTS[sample_key]
        source_text = sample["content"]
        sections = parse_document_sections(source_text)
        analysis = analyze_contract_document(
            contract_id=cid,
            title=sample["title"],
            source_text=source_text,
            sections=sections,
            api_key=None,
        )
        analysis["counterparty"] = sample["counterparty"]
        analysis["category"] = sample["category"]
        analysis["contract_type"] = sample["contract_type"]
        analysis["effective_date"] = sample["effective_date"]
        analysis["expiration_date"] = sample["expiration_date"]
        analysis["annual_value"] = sample["annual_value"]
        analysis["governing_law"] = sample["governing_law"]

        save_analyzed_contract(
            contract_id=cid,
            title=sample["title"],
            filename=f"{sample_key}.pdf",
            status=status_label,
            page_count=max(2, round(len(source_text) / 1400)),
            source_text=source_text,
            sections=sections,
            analysis=analysis,
            uploaded_at=uploaded_at,
        )

    conn = get_connection()
    cur = conn.cursor()

    # Set realistic varied statuses across obligations and risks
    cur.execute("UPDATE obligations SET status = 'Completed' WHERE id = 'cnt-northstar-02-obl-2'")
    cur.execute("UPDATE obligations SET status = 'Completed' WHERE id = 'cnt-kestrel-v2-obl-2'")
    cur.execute("UPDATE obligations SET status = 'In Progress', due_date = '2026-11-02' WHERE id = 'cnt-veridian-01-obl-1'")
    cur.execute("UPDATE obligations SET status = 'Overdue', due_date = '2026-10-24' WHERE id = 'cnt-veridian-01-obl-2'")
    cur.execute("UPDATE obligations SET status = 'In Progress', due_date = '2026-11-18' WHERE id = 'cnt-kestrel-v2-obl-1'")

    cur.execute("UPDATE risks SET status = 'Under Review' WHERE id = 'cnt-veridian-01-rsk-1'")
    cur.execute("UPDATE risks SET status = 'Mitigated' WHERE id = 'cnt-northstar-02-rsk-1'")

    # Seed verified Q&A history on Veridian
    veridian_text = SAMPLE_CONTRACTS["veridian_msa_v2"]["content"]
    veridian_secs = parse_document_sections(veridian_text)
    q1_quote = "Upon expiration of the Initial Term, this Agreement shall automatically renew for successive twenty-four (24) month Renewal Terms unless either party delivers written notice of non-renewal at least ninety (90) days prior to the end of the then-current term."
    v1 = verify_excerpt_against_source(q1_quote, veridian_text, veridian_secs)
    cit1 = [{
        "citation_id": "cit-1",
        "section_ref": v1.section_title or "Section 2 — Term And Automatic Renewal",
        "quote": v1.matched_excerpt,
        "verification": v1.model_dump(),
    }]
    cur.execute(
        """
        INSERT OR IGNORE INTO qa_history
        (id, contract_id, question, answer, supported, confidence, verification_summary, citations_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "qa-seed-01",
            "cnt-veridian-01",
            "What is the non-renewal notice window and can fees increase upon renewal?",
            "Under Section 2, either party must provide written notice of non-renewal at least 90 days prior to the end of the current term to prevent an automatic 24-month renewal. Upon automatic renewal, Veridian Cloud Systems reserves the right to increase annual platform subscription fees by up to 12% above the prior list rate.",
            1,
            1.0,
            "Verified across 1 exact verbatim source passage (100% grounding confidence).",
            json.dumps(cit1),
            "2026-10-27T10:10:00Z",
        ),
    )

    seed_activities = [
        (
            "act-1",
            "verification",
            "Loaded 3 Pre-Verified Sample Agreements",
            "All clauses, risk flags, and obligations verified against verbatim document character spans (Grade A+, 100% Grounded).",
            "cnt-veridian-01",
            "ClausePilot Verification Engine",
            "2026-10-27T11:30:00Z",
        ),
        (
            "act-2",
            "risk",
            "Critical Liability & Take-or-Pay Risk Flagged",
            "Kestrel v2.0 Redline compressed vendor liability cap to 2 months ($51.6k) and introduced a $310k Take-or-Pay minimum.",
            "cnt-kestrel-v2",
            "Elena Rostova (Legal Ops)",
            "2026-10-27T10:40:00Z",
        ),
        (
            "act-3",
            "obligation",
            "Completed DPIA & Token Telemetry Reconciliation",
            "NorthStar AI Data Processing monthly telemetry statement verified and marked Completed.",
            "cnt-northstar-02",
            "Marcus Vance (Security Ops)",
            "2026-10-26T16:20:00Z",
        ),
        (
            "act-4",
            "upload",
            "Ingested Veridian Cloud Enterprise MSA (v2.4)",
            "Extracted 8 sections, 4 high-priority risk flags (Auto-Renewal, Uncapped Carveouts), and 4 obligations.",
            "cnt-veridian-01",
            "Priya Nair (Procurement Lead)",
            "2026-10-25T14:05:00Z",
        ),
    ]
    for act in seed_activities:
        cur.execute(
            "INSERT OR IGNORE INTO activities (id, event_type, title, detail, contract_id, actor, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            act,
        )

    conn.commit()
    conn.close()
    return get_all_contracts()


def save_analyzed_contract(
    contract_id: str,
    title: str,
    filename: str,
    status: str,
    page_count: int,
    source_text: str,
    sections: list,
    analysis: Dict[str, Any],
    uploaded_at: Optional[str] = None,
) -> Dict[str, Any]:
    now_str = uploaded_at or (datetime.utcnow().isoformat() + "Z")
    conn = get_connection()
    cur = conn.cursor()

    sections_serialized = [s.model_dump() if hasattr(s, "model_dump") else s for s in sections]

    cur.execute(
        """
        INSERT OR REPLACE INTO contracts (
            id, title, filename, counterparty, category, contract_type, status,
            effective_date, expiration_date, annual_value, governing_law,
            renewal_type, notice_period_days, risk_score, page_count,
            executive_summary, key_takeaways_json, source_text,
            sections_json, clauses_json, verification_audit_json, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            contract_id,
            title,
            filename,
            analysis["counterparty"],
            analysis["category"],
            analysis["contract_type"],
            status,
            analysis["effective_date"],
            analysis["expiration_date"],
            analysis["annual_value"],
            analysis["governing_law"],
            analysis["renewal_type"],
            analysis["notice_period_days"],
            analysis["risk_score"],
            page_count,
            analysis["executive_summary"],
            json.dumps(analysis["key_takeaways"]),
            source_text,
            json.dumps(sections_serialized),
            json.dumps(analysis["clauses"]),
            json.dumps(analysis["verification_audit"]),
            now_str,
        ),
    )

    cur.execute("DELETE FROM risks WHERE contract_id = ?", (contract_id,))
    for r in analysis["risks"]:
        cur.execute(
            """
            INSERT INTO risks (
                id, contract_id, contract_title, counterparty, category, severity,
                title, rationale, recommendation, evidence_quote, section_ref,
                status, reviewer_note, verification_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                r["id"],
                contract_id,
                title,
                analysis["counterparty"],
                r["category"],
                r["severity"],
                r["title"],
                r["rationale"],
                r["recommendation"],
                r["evidence_quote"],
                r["section_ref"],
                r.get("status", "Open"),
                "",
                json.dumps(r["verification"]),
            ),
        )

    cur.execute("DELETE FROM obligations WHERE contract_id = ?", (contract_id,))
    for o in analysis["obligations"]:
        cur.execute(
            """
            INSERT INTO obligations (
                id, contract_id, contract_title, counterparty, title, description,
                owner, department, due_date, recurrence, priority, status,
                evidence_quote, section_ref, verification_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                o["id"],
                contract_id,
                title,
                analysis["counterparty"],
                o["title"],
                o["description"],
                o["owner"],
                o["department"],
                o["due_date"],
                o["recurrence"],
                o["priority"],
                o.get("status", "Pending"),
                o["evidence_quote"],
                o["section_ref"],
                json.dumps(o["verification"]),
            ),
        )

    conn.commit()
    conn.close()
    return get_contract_by_id(contract_id)


def get_all_contracts() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM contracts ORDER BY uploaded_at DESC")
    rows = cur.fetchall()

    result = []
    for r in rows:
        cid = r["id"]
        cur.execute("SELECT COUNT(*) as cnt FROM risks WHERE contract_id = ?", (cid,))
        risk_cnt = cur.fetchone()["cnt"]
        cur.execute("SELECT COUNT(*) as cnt FROM obligations WHERE contract_id = ?", (cid,))
        ob_cnt = cur.fetchone()["cnt"]
        audit = json.loads(r["verification_audit_json"])
        result.append({
            "id": cid,
            "title": r["title"],
            "filename": r["filename"],
            "counterparty": r["counterparty"],
            "category": r["category"],
            "contract_type": r["contract_type"],
            "status": r["status"],
            "effective_date": r["effective_date"],
            "expiration_date": r["expiration_date"],
            "annual_value": r["annual_value"],
            "governing_law": r["governing_law"],
            "renewal_type": r["renewal_type"],
            "notice_period_days": r["notice_period_days"],
            "risk_score": r["risk_score"],
            "page_count": r["page_count"],
            "executive_summary": r["executive_summary"],
            "risk_count": risk_cnt,
            "obligation_count": ob_cnt,
            "verification_audit": audit,
            "uploaded_at": r["uploaded_at"],
        })
    conn.close()
    return result


def get_contract_by_id(contract_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    cur.execute("SELECT * FROM risks WHERE contract_id = ?", (contract_id,))
    risk_rows = cur.fetchall()
    risks = []
    for rr in risk_rows:
        risks.append({
            "id": rr["id"],
            "contract_id": rr["contract_id"],
            "contract_title": rr["contract_title"],
            "counterparty": rr["counterparty"],
            "category": rr["category"],
            "severity": rr["severity"],
            "title": rr["title"],
            "rationale": rr["rationale"],
            "recommendation": rr["recommendation"],
            "evidence_quote": rr["evidence_quote"],
            "section_ref": rr["section_ref"],
            "status": rr["status"],
            "reviewer_note": rr["reviewer_note"],
            "verification": json.loads(rr["verification_json"]),
        })

    cur.execute("SELECT * FROM obligations WHERE contract_id = ? ORDER BY due_date ASC", (contract_id,))
    ob_rows = cur.fetchall()
    obligations = []
    for oo in ob_rows:
        obligations.append({
            "id": oo["id"],
            "contract_id": oo["contract_id"],
            "contract_title": oo["contract_title"],
            "counterparty": oo["counterparty"],
            "title": oo["title"],
            "description": oo["description"],
            "owner": oo["owner"],
            "department": oo["department"],
            "due_date": oo["due_date"],
            "recurrence": oo["recurrence"],
            "priority": oo["priority"],
            "status": oo["status"],
            "evidence_quote": oo["evidence_quote"],
            "section_ref": oo["section_ref"],
            "verification": json.loads(oo["verification_json"]),
        })

    cur.execute("SELECT * FROM qa_history WHERE contract_id = ? ORDER BY created_at DESC", (contract_id,))
    qa_rows = cur.fetchall()
    qa_list = []
    for qq in qa_rows:
        qa_list.append({
            "id": qq["id"],
            "contract_id": qq["contract_id"],
            "question": qq["question"],
            "answer": qq["answer"],
            "supported": bool(qq["supported"]),
            "confidence": qq["confidence"],
            "verification_summary": qq["verification_summary"],
            "citations": json.loads(qq["citations_json"]),
            "created_at": qq["created_at"],
        })

    conn.close()
    return {
        "id": row["id"],
        "title": row["title"],
        "filename": row["filename"],
        "counterparty": row["counterparty"],
        "category": row["category"],
        "contract_type": row["contract_type"],
        "status": row["status"],
        "effective_date": row["effective_date"],
        "expiration_date": row["expiration_date"],
        "annual_value": row["annual_value"],
        "governing_law": row["governing_law"],
        "renewal_type": row["renewal_type"],
        "notice_period_days": row["notice_period_days"],
        "risk_score": row["risk_score"],
        "page_count": row["page_count"],
        "executive_summary": row["executive_summary"],
        "key_takeaways": json.loads(row["key_takeaways_json"]),
        "source_text": row["source_text"],
        "sections": json.loads(row["sections_json"]),
        "clauses": json.loads(row["clauses_json"]),
        "risks": risks,
        "obligations": obligations,
        "qa_history": qa_list,
        "verification_audit": json.loads(row["verification_audit_json"]),
        "uploaded_at": row["uploaded_at"],
    }


def get_all_risks() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM risks")
    rows = cur.fetchall()
    conn.close()
    out = []
    for rr in rows:
        out.append({
            "id": rr["id"],
            "contract_id": rr["contract_id"],
            "contract_title": rr["contract_title"],
            "counterparty": rr["counterparty"],
            "category": rr["category"],
            "severity": rr["severity"],
            "title": rr["title"],
            "rationale": rr["rationale"],
            "recommendation": rr["recommendation"],
            "evidence_quote": rr["evidence_quote"],
            "section_ref": rr["section_ref"],
            "status": rr["status"],
            "reviewer_note": rr["reviewer_note"],
            "verification": json.loads(rr["verification_json"]),
        })
    return out


def get_all_obligations() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM obligations ORDER BY due_date ASC")
    rows = cur.fetchall()
    conn.close()
    out = []
    for oo in rows:
        out.append({
            "id": oo["id"],
            "contract_id": oo["contract_id"],
            "contract_title": oo["contract_title"],
            "counterparty": oo["counterparty"],
            "title": oo["title"],
            "description": oo["description"],
            "owner": oo["owner"],
            "department": oo["department"],
            "due_date": oo["due_date"],
            "recurrence": oo["recurrence"],
            "priority": oo["priority"],
            "status": oo["status"],
            "evidence_quote": oo["evidence_quote"],
            "section_ref": oo["section_ref"],
            "verification": json.loads(oo["verification_json"]),
        })
    return out


def get_settings_dict() -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT key, value FROM settings")
    rows = {r["key"]: r["value"] for r in cur.fetchall()}
    conn.close()
    raw_key = rows.get("gemini_api_key", "") or os.environ.get("GEMINI_API_KEY", "")
    masked = ""
    if raw_key and len(raw_key) > 6:
        masked = raw_key[:4] + "•" * 12 + raw_key[-3:]
    return {
        "has_gemini_api_key": bool(raw_key),
        "masked_api_key": masked,
        "gemini_api_key_raw": raw_key,
        "ai_model": rows.get("ai_model", "gemini-2.5-flash"),
        "verification_strictness": rows.get("verification_strictness", "Strict (Exact + High-Confidence Grounding)"),
        "min_grounding_score": float(rows.get("min_grounding_score", "0.72")),
        "renewal_notice_window_days": int(rows.get("renewal_notice_window_days", "90")),
        "organization_name": rows.get("organization_name", "Acme Orbit Technologies Inc."),
        "primary_jurisdiction": rows.get("primary_jurisdiction", "State of Delaware"),
        "auto_flag_unverified": rows.get("auto_flag_unverified", "true").lower() == "true",
    }
