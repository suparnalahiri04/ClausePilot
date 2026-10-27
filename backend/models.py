from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class VerificationResult(BaseModel):
    status: str = Field(..., description="VERIFIED_EXACT | VERIFIED_HIGH_CONFIDENCE | PARTIAL_SUPPORT | UNVERIFIED_FLAGGED")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    matched_excerpt: str
    section_id: Optional[str] = None
    section_title: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    verification_note: str


class ClauseItem(BaseModel):
    id: str
    contract_id: str
    title: str
    category: str
    summary: str
    extracted_text: str
    section_ref: str
    importance: str  # High, Medium, Standard
    verification: VerificationResult


class RiskItem(BaseModel):
    id: str
    contract_id: str
    contract_title: Optional[str] = None
    counterparty: Optional[str] = None
    category: str  # termination | auto-renewal | liability | payment
    severity: str  # Critical, High, Medium, Low
    title: str
    rationale: str
    recommendation: str
    evidence_quote: str
    section_ref: str
    status: str = "Open"  # Open, Under Review, Mitigated, Accepted
    verification: VerificationResult


class ObligationItem(BaseModel):
    id: str
    contract_id: str
    contract_title: Optional[str] = None
    counterparty: Optional[str] = None
    title: str
    description: str
    owner: str
    department: str
    due_date: str
    recurrence: str  # One-time, Monthly, Quarterly, Annual, On-Trigger
    priority: str  # High, Medium, Low
    status: str  # Pending, In Progress, Completed, Overdue
    evidence_quote: str
    section_ref: str
    verification: VerificationResult


class DocumentSection(BaseModel):
    id: str
    number: str
    heading: str
    content: str
    start_char: int
    end_char: int


class QACitation(BaseModel):
    citation_id: str
    section_ref: str
    quote: str
    verification: VerificationResult


class QARequest(BaseModel):
    question: str


class QAResponse(BaseModel):
    id: str
    contract_id: str
    question: str
    answer: str
    supported: bool
    confidence: float
    verification_summary: str
    citations: List[QACitation]
    created_at: str


class RiskStatusUpdate(BaseModel):
    status: str
    reviewer_note: Optional[str] = None


class ObligationUpdate(BaseModel):
    status: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None


class ObligationCreate(BaseModel):
    contract_id: str
    title: str
    description: str
    owner: str
    department: str = "Operations"
    due_date: str
    recurrence: str = "One-time"
    priority: str = "Medium"
    evidence_quote: str
    section_ref: str = "Custom / Manual"


class CompareRequest(BaseModel):
    base_contract_id: Optional[str] = None
    target_contract_id: Optional[str] = None
    base_title: Optional[str] = None
    target_title: Optional[str] = None
    base_text: Optional[str] = None
    target_text: Optional[str] = None


class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    ai_model: Optional[str] = None
    verification_strictness: Optional[str] = None
    min_grounding_score: Optional[float] = None
    renewal_notice_window_days: Optional[int] = None
    organization_name: Optional[str] = None
    primary_jurisdiction: Optional[str] = None
    auto_flag_unverified: Optional[bool] = None

