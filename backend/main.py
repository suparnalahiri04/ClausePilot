import json
import uuid
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    QARequest,
    RiskStatusUpdate,
    ObligationUpdate,
    ObligationCreate,
    CompareRequest,
    SettingsUpdate,
    DocumentSection,
)
from database import (
    init_db,
    get_connection,
    get_all_contracts,
    get_contract_by_id,
    get_all_risks,
    get_all_obligations,
    get_settings_dict,
    save_analyzed_contract,
    seed_three_sample_contracts,
    clear_all_portfolio_data,
)
from ingestion import (
    extract_text_from_bytes,
    parse_document_sections,
    SAMPLE_CONTRACTS,
)
from ai_engine import (
    analyze_contract_document,
    answer_contract_question,
    compare_contract_versions,
)
from verification import verify_excerpt_against_source


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="ClausePilot Enterprise API",
    description="Evidence-First AI Contract Intelligence & Obligation Tracking Platform",
    version="2.5.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _log_activity(event_type: str, title: str, detail: str, contract_id: Optional[str] = None, actor: str = "ClausePilot System"):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO activities (id, event_type, title, detail, contract_id, actor, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            f"act-{uuid.uuid4().hex[:8]}",
            event_type,
            title,
            detail,
            contract_id,
            actor,
            datetime.utcnow().isoformat() + "Z",
        ),
    )
    conn.commit()
    conn.close()


@app.get("/api/health")
def health_check():
    settings = get_settings_dict()
    return {
        "status": "ok",
        "service": "ClausePilot API",
        "gemini_configured": settings["has_gemini_api_key"],
        "verification_layer": "Active",
    }


@app.post("/api/demo/load-samples")
def load_three_preverified_samples():
    contracts = seed_three_sample_contracts()
    return {
        "status": "loaded",
        "loaded_count": len(contracts),
        "contracts": contracts,
        "message": "3 Pre-Verified Sample Contracts loaded with 100% source-grounded risks, obligations, and Q&A fixtures.",
    }


@app.post("/api/demo/reset")
def reset_demo_to_zero_state():
    clear_all_portfolio_data()
    return {
        "status": "cleared",
        "loaded_count": 0,
        "message": "Portfolio reset to Zero-State.",
    }


@app.get("/api/dashboard")
def get_dashboard_overview():
    contracts = get_all_contracts()
    risks = get_all_risks()
    obligations = get_all_obligations()

    total_annual_spend = sum(c["annual_value"] for c in contracts)
    avg_risk_score = round(sum(c["risk_score"] for c in contracts) / max(len(contracts), 1)) if contracts else 0

    critical_high_risks = [r for r in risks if r["severity"] in ("Critical", "High") and r["status"] in ("Open", "Under Review")]
    completed_obligations = [o for o in obligations if o["status"] == "Completed"]
    pending_obligations = [o for o in obligations if o["status"] != "Completed"]
    overdue_obligations = [o for o in obligations if o["status"] == "Overdue"]

    all_grounding_scores = [c["verification_audit"].get("overall_grounding_score", 1.0) for c in contracts]
    portfolio_grounding = round(sum(all_grounding_scores) / max(len(all_grounding_scores), 1) * 100, 1) if contracts else 100.0

    risk_by_cat = {"termination": 0, "auto-renewal": 0, "liability": 0, "payment": 0}
    for r in risks:
        cat = r["category"].lower()
        if cat in risk_by_cat:
            risk_by_cat[cat] += 1

    risk_chart_data = [
        {"category": "Auto-Renewal", "key": "auto-renewal", "count": risk_by_cat["auto-renewal"], "color": "#DB2777"},
        {"category": "Termination", "key": "termination", "count": risk_by_cat["termination"], "color": "#E11D48"},
        {"category": "Liability Caps", "key": "liability", "count": risk_by_cat["liability"], "color": "#F43F5E"},
        {"category": "Payment Terms", "key": "payment", "count": risk_by_cat["payment"], "color": "#0F9D91"},
    ]

    cat_spend = {}
    for c in contracts:
        cat = c["category"]
        if cat not in cat_spend:
            cat_spend[cat] = {"category": cat, "spend": 0, "contracts": 0, "avg_risk": 0}
        cat_spend[cat]["spend"] += c["annual_value"]
        cat_spend[cat]["contracts"] += 1
        cat_spend[cat]["avg_risk"] += c["risk_score"]

    spend_chart_data = []
    for k, v in cat_spend.items():
        v["avg_risk"] = round(v["avg_risk"] / max(v["contracts"], 1))
        spend_chart_data.append(v)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM activities ORDER BY created_at DESC LIMIT 8")
    activities = [dict(r) for r in cur.fetchall()]
    conn.close()

    return {
        "metrics": {
            "active_contracts": len(contracts),
            "total_annual_commitment": total_annual_spend,
            "avg_risk_score": avg_risk_score,
            "open_high_risks": len(critical_high_risks),
            "total_obligations": len(obligations),
            "completed_obligations": len(completed_obligations),
            "overdue_obligations": len(overdue_obligations),
            "verification_rate_pct": portfolio_grounding,
        },
        "risk_chart_data": risk_chart_data,
        "spend_chart_data": spend_chart_data,
        "upcoming_deadlines": pending_obligations[:6],
        "recent_contracts": contracts[:5],
        "recent_activity": activities,
    }


@app.get("/api/samples")
def list_sample_contracts():
    out = []
    for k, v in SAMPLE_CONTRACTS.items():
        out.append({
            "key": k,
            "title": v["title"],
            "counterparty": v["counterparty"],
            "category": v["category"],
            "contract_type": v["contract_type"],
            "annual_value": v["annual_value"],
            "governing_law": v["governing_law"],
            "description": v["description"],
        })
    return {"samples": out}


@app.get("/api/contracts")
def list_contracts(
    q: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    risk_tier: Optional[str] = None,
):
    contracts = get_all_contracts()
    filtered = []
    for c in contracts:
        if q:
            ql = q.lower()
            haystack = f"{c['title']} {c['counterparty']} {c['category']} {c['contract_type']} {c['governing_law']}".lower()
            if ql not in haystack:
                continue
        if category and category != "All" and c["category"] != category:
            continue
        if status and status != "All" and c["status"] != status:
            continue
        if risk_tier and risk_tier != "All":
            if risk_tier == "High" and c["risk_score"] < 70:
                continue
            elif risk_tier == "Medium" and not (45 <= c["risk_score"] < 70):
                continue
            elif risk_tier == "Low" and c["risk_score"] >= 45:
                continue
        filtered.append(c)
    return {"contracts": filtered, "total": len(filtered)}


@app.get("/api/contracts/{contract_id}")
def get_contract_detail(contract_id: str):
    contract = get_contract_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@app.post("/api/contracts/upload")
async def upload_and_analyze_contract(
    file: UploadFile = File(...),
    custom_title: Optional[str] = Form(None),
):
    file_bytes = await file.read()
    filename = file.filename or "uploaded_contract.pdf"
    source_text, page_count = extract_text_from_bytes(filename, file_bytes)

    if len(source_text.strip()) < 25:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file did not contain sufficient readable contract text.",
        )

    title = (custom_title or "").strip()
    if not title:
        title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    contract_id = f"cnt-{uuid.uuid4().hex[:8]}"
    sections = parse_document_sections(source_text)
    settings = get_settings_dict()

    analysis = analyze_contract_document(
        contract_id=contract_id,
        title=title,
        source_text=source_text,
        sections=sections,
        api_key=settings["gemini_api_key_raw"],
        ai_model=settings["ai_model"],
        min_grounding_score=settings["min_grounding_score"],
    )

    saved = save_analyzed_contract(
        contract_id=contract_id,
        title=title,
        filename=filename,
        status="Active Review",
        page_count=page_count,
        source_text=source_text,
        sections=sections,
        analysis=analysis,
    )

    _log_activity(
        event_type="upload",
        title=f"Analyzed & Verified {title}",
        detail=f"Extracted {len(saved['clauses'])} clauses, {len(saved['risks'])} risks, and {len(saved['obligations'])} obligations ({saved['verification_audit']['trust_grade']} Grounding).",
        contract_id=contract_id,
        actor="Document Ingestion Pipeline",
    )

    return saved


@app.post("/api/contracts/sample/{sample_key}")
def load_sample_contract(sample_key: str):
    if sample_key not in SAMPLE_CONTRACTS:
        raise HTTPException(status_code=404, detail="Sample contract key not found")

    sample = SAMPLE_CONTRACTS[sample_key]
    existing = get_all_contracts()
    for c in existing:
        if c["title"] == sample["title"]:
            return get_contract_by_id(c["id"])

    contract_id = f"cnt-{sample_key[:10]}-{uuid.uuid4().hex[:4]}"
    source_text = sample["content"]
    sections = parse_document_sections(source_text)
    settings = get_settings_dict()

    analysis = analyze_contract_document(
        contract_id=contract_id,
        title=sample["title"],
        source_text=source_text,
        sections=sections,
        api_key=settings["gemini_api_key_raw"],
        ai_model=settings["ai_model"],
        min_grounding_score=settings["min_grounding_score"],
    )
    analysis["counterparty"] = sample["counterparty"]
    analysis["category"] = sample["category"]
    analysis["contract_type"] = sample["contract_type"]
    analysis["effective_date"] = sample["effective_date"]
    analysis["expiration_date"] = sample["expiration_date"]
    analysis["annual_value"] = sample["annual_value"]
    analysis["governing_law"] = sample["governing_law"]

    saved = save_analyzed_contract(
        contract_id=contract_id,
        title=sample["title"],
        filename=f"{sample_key}.pdf",
        status="Active Review",
        page_count=max(2, round(len(source_text) / 1400)),
        source_text=source_text,
        sections=sections,
        analysis=analysis,
    )

    _log_activity(
        event_type="upload",
        title=f"Loaded Sample Contract: {sample['title']}",
        detail=f"Verified {len(saved['risks'])} risk flags and {len(saved['obligations'])} obligations.",
        contract_id=contract_id,
    )

    return saved


@app.post("/api/contracts/{contract_id}/ask")
def ask_clausepilot_question(contract_id: str, payload: QARequest):
    contract = get_contract_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    sections = [DocumentSection(**s) for s in contract["sections"]]
    settings = get_settings_dict()

    qa_res = answer_contract_question(
        contract_id=contract_id,
        contract_title=contract["title"],
        source_text=contract["source_text"],
        sections=sections,
        question=payload.question,
        api_key=settings["gemini_api_key_raw"],
        ai_model=settings["ai_model"],
        min_grounding_score=settings["min_grounding_score"],
    )

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO qa_history
        (id, contract_id, question, answer, supported, confidence, verification_summary, citations_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            qa_res.id,
            qa_res.contract_id,
            qa_res.question,
            qa_res.answer,
            1 if qa_res.supported else 0,
            qa_res.confidence,
            qa_res.verification_summary,
            json.dumps([c.model_dump() for c in qa_res.citations]),
            qa_res.created_at,
        ),
    )
    conn.commit()
    conn.close()

    return qa_res.model_dump()


@app.get("/api/risks")
def get_risks_center(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
):
    all_risks = get_all_risks()
    filtered = []
    for r in all_risks:
        if category and category != "all" and r["category"].lower() != category.lower():
            continue
        if severity and severity != "All" and r["severity"] != severity:
            continue
        if status and status != "All" and r["status"] != status:
            continue
        filtered.append(r)

    category_counts = {
        "all": len(all_risks),
        "termination": sum(1 for r in all_risks if r["category"] == "termination"),
        "auto-renewal": sum(1 for r in all_risks if r["category"] == "auto-renewal"),
        "liability": sum(1 for r in all_risks if r["category"] == "liability"),
        "payment": sum(1 for r in all_risks if r["category"] == "payment"),
    }

    severity_counts = {
        "Critical": sum(1 for r in all_risks if r["severity"] == "Critical"),
        "High": sum(1 for r in all_risks if r["severity"] == "High"),
        "Medium": sum(1 for r in all_risks if r["severity"] == "Medium"),
        "Low": sum(1 for r in all_risks if r["severity"] == "Low"),
    }

    return {
        "risks": filtered,
        "category_counts": category_counts,
        "severity_counts": severity_counts,
    }


@app.patch("/api/risks/{risk_id}")
def update_risk_item(risk_id: str, payload: RiskStatusUpdate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM risks WHERE id = ?", (risk_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Risk item not found")

    note = payload.reviewer_note if payload.reviewer_note is not None else row["reviewer_note"]
    cur.execute(
        "UPDATE risks SET status = ?, reviewer_note = ? WHERE id = ?",
        (payload.status, note, risk_id),
    )
    conn.commit()
    conn.close()

    _log_activity(
        event_type="risk",
        title=f"Risk Status Updated to '{payload.status}'",
        detail=f"{row['title']} ({row['contract_title']})",
        contract_id=row["contract_id"],
        actor="Risk Review Board",
    )

    return {"id": risk_id, "status": payload.status, "reviewer_note": note}


@app.get("/api/obligations")
def get_obligations_manager(
    status: Optional[str] = None,
    department: Optional[str] = None,
):
    obligations = get_all_obligations()
    filtered = []
    for o in obligations:
        if status and status != "All" and o["status"] != status:
            continue
        if department and department != "All" and o["department"] != department:
            continue
        filtered.append(o)

    summary = {
        "total": len(obligations),
        "completed": sum(1 for o in obligations if o["status"] == "Completed"),
        "in_progress": sum(1 for o in obligations if o["status"] == "In Progress"),
        "pending": sum(1 for o in obligations if o["status"] == "Pending"),
        "overdue": sum(1 for o in obligations if o["status"] == "Overdue"),
    }

    return {"obligations": filtered, "summary": summary}


@app.patch("/api/obligations/{obligation_id}")
def update_obligation_item(obligation_id: str, payload: ObligationUpdate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM obligations WHERE id = ?", (obligation_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Obligation not found")

    new_status = payload.status if payload.status is not None else row["status"]
    new_owner = payload.owner if payload.owner is not None else row["owner"]
    new_due = payload.due_date if payload.due_date is not None else row["due_date"]
    new_prio = payload.priority if payload.priority is not None else row["priority"]

    cur.execute(
        "UPDATE obligations SET status = ?, owner = ?, due_date = ?, priority = ? WHERE id = ?",
        (new_status, new_owner, new_due, new_prio, obligation_id),
    )
    conn.commit()
    conn.close()

    _log_activity(
        event_type="obligation",
        title=f"Obligation Marked '{new_status}'",
        detail=f"{row['title']} — Assigned to {new_owner} (Due {new_due})",
        contract_id=row["contract_id"],
        actor=new_owner,
    )

    return {
        "id": obligation_id,
        "status": new_status,
        "owner": new_owner,
        "due_date": new_due,
        "priority": new_prio,
    }


@app.post("/api/obligations")
def create_custom_obligation(payload: ObligationCreate):
    contract = get_contract_by_id(payload.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    sections = [DocumentSection(**s) for s in contract["sections"]]
    ver = verify_excerpt_against_source(
        payload.evidence_quote,
        contract["source_text"],
        sections,
    )
    ob_id = f"{payload.contract_id}-obl-{uuid.uuid4().hex[:6]}"

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO obligations (
            id, contract_id, contract_title, counterparty, title, description,
            owner, department, due_date, recurrence, priority, status,
            evidence_quote, section_ref, verification_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ob_id,
            payload.contract_id,
            contract["title"],
            contract["counterparty"],
            payload.title,
            payload.description,
            payload.owner,
            payload.department,
            payload.due_date,
            payload.recurrence,
            payload.priority,
            "Pending",
            ver.matched_excerpt or payload.evidence_quote,
            ver.section_title or payload.section_ref,
            json.dumps(ver.model_dump()),
        ),
    )
    conn.commit()
    conn.close()

    _log_activity(
        event_type="obligation",
        title=f"Added Tracked Obligation: {payload.title}",
        detail=f"Linked to {contract['title']} — Owner: {payload.owner}",
        contract_id=payload.contract_id,
        actor=payload.owner,
    )

    return {"id": ob_id, "verification": ver.model_dump()}


@app.post("/api/compare")
def compare_contracts_endpoint(payload: CompareRequest):
    base_title = payload.base_title or "Baseline Version (v1.0)"
    target_title = payload.target_title or "Redline Version (v2.0)"
    base_text = payload.base_text or ""
    target_text = payload.target_text or ""

    if payload.base_contract_id:
        b_doc = get_contract_by_id(payload.base_contract_id)
        if b_doc:
            base_title = b_doc["title"]
            base_text = b_doc["source_text"]
        elif payload.base_contract_id in SAMPLE_CONTRACTS:
            s = SAMPLE_CONTRACTS[payload.base_contract_id]
            base_title = s["title"]
            base_text = s["content"]

    if payload.target_contract_id:
        t_doc = get_contract_by_id(payload.target_contract_id)
        if t_doc:
            target_title = t_doc["title"]
            target_text = t_doc["source_text"]
        elif payload.target_contract_id in SAMPLE_CONTRACTS:
            s = SAMPLE_CONTRACTS[payload.target_contract_id]
            target_title = s["title"]
            target_text = s["content"]

    # Fallback to built-in Kestrel v1 vs v2 if neither text was found
    if not base_text.strip():
        base_title = SAMPLE_CONTRACTS["kestrel_logistics_v1"]["title"]
        base_text = SAMPLE_CONTRACTS["kestrel_logistics_v1"]["content"]
    if not target_text.strip():
        target_title = SAMPLE_CONTRACTS["kestrel_logistics_v2"]["title"]
        target_text = SAMPLE_CONTRACTS["kestrel_logistics_v2"]["content"]

    settings = get_settings_dict()
    return compare_contract_versions(
        base_title=base_title,
        target_title=target_title,
        base_text=base_text,
        target_text=target_text,
        api_key=settings["gemini_api_key_raw"],
        ai_model=settings["ai_model"],
    )


@app.get("/api/reports")
def get_portfolio_reports():
    contracts = get_all_contracts()
    risks = get_all_risks()
    obligations = get_all_obligations()

    total_annual = sum(c["annual_value"] for c in contracts)
    total_findings = sum(c["verification_audit"].get("total_findings", 0) for c in contracts)
    exact_findings = sum(c["verification_audit"].get("verified_exact_count", 0) for c in contracts)
    high_findings = sum(c["verification_audit"].get("verified_high_count", 0) for c in contracts)
    unverified_findings = sum(c["verification_audit"].get("unverified_flagged_count", 0) for c in contracts)

    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "executive_metrics": {
            "total_contracts": len(contracts),
            "annual_portfolio_value": total_annual,
            "total_risks_identified": len(risks),
            "critical_risks_count": sum(1 for r in risks if r["severity"] == "Critical"),
            "mitigated_risks_count": sum(1 for r in risks if r["status"] in ("Mitigated", "Accepted")),
            "total_obligations": len(obligations),
            "completed_obligations": sum(1 for o in obligations if o["status"] == "Completed"),
            "total_verified_findings": total_findings,
            "exact_verified_findings": exact_findings,
            "high_confidence_findings": high_findings,
            "unverified_flagged_findings": unverified_findings,
        },
        "contracts": contracts,
        "risks": risks,
        "obligations": obligations,
    }


@app.get("/api/settings")
def get_settings():
    s = get_settings_dict()
    return {
        "has_gemini_api_key": s["has_gemini_api_key"],
        "masked_api_key": s["masked_api_key"],
        "ai_model": s["ai_model"],
        "verification_strictness": s["verification_strictness"],
        "min_grounding_score": s["min_grounding_score"],
        "renewal_notice_window_days": s["renewal_notice_window_days"],
        "organization_name": s["organization_name"],
        "primary_jurisdiction": s["primary_jurisdiction"],
        "auto_flag_unverified": s["auto_flag_unverified"],
    }


@app.put("/api/settings")
def update_settings(payload: SettingsUpdate):
    conn = get_connection()
    cur = conn.cursor()

    updates = {}
    if payload.gemini_api_key is not None:
        if "•" not in payload.gemini_api_key:
            updates["gemini_api_key"] = payload.gemini_api_key.strip()
    if payload.ai_model is not None:
        updates["ai_model"] = payload.ai_model
    if payload.verification_strictness is not None:
        updates["verification_strictness"] = payload.verification_strictness
    if payload.min_grounding_score is not None:
        updates["min_grounding_score"] = str(payload.min_grounding_score)
    if payload.renewal_notice_window_days is not None:
        updates["renewal_notice_window_days"] = str(payload.renewal_notice_window_days)
    if payload.organization_name is not None:
        updates["organization_name"] = payload.organization_name
    if payload.primary_jurisdiction is not None:
        updates["primary_jurisdiction"] = payload.primary_jurisdiction
    if payload.auto_flag_unverified is not None:
        updates["auto_flag_unverified"] = "true" if payload.auto_flag_unverified else "false"

    for k, v in updates.items():
        cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()
    conn.close()
    return get_settings()
