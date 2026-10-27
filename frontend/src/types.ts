export interface VerificationResult {
  status: 'VERIFIED_EXACT' | 'VERIFIED_HIGH_CONFIDENCE' | 'PARTIAL_SUPPORT' | 'UNVERIFIED_FLAGGED';
  confidence_score: number;
  matched_excerpt: string;
  section_id?: string | null;
  section_title?: string | null;
  start_char?: number | null;
  end_char?: number | null;
  verification_note: string;
}

export interface VerificationAudit {
  total_findings: number;
  verified_exact_count: number;
  verified_high_count: number;
  partial_support_count: number;
  unverified_flagged_count: number;
  overall_grounding_score: number;
  trust_grade: string;
  audit_status: string;
}

export interface DocumentSection {
  id: string;
  number: string;
  heading: string;
  content: string;
  start_char: number;
  end_char: number;
}

export interface ClauseItem {
  id: string;
  contract_id: string;
  title: string;
  category: string;
  summary: string;
  extracted_text: string;
  section_ref: string;
  importance: 'High' | 'Medium' | 'Standard' | string;
  verification: VerificationResult;
}

export interface RiskItem {
  id: string;
  contract_id: string;
  contract_title?: string;
  counterparty?: string;
  category: 'termination' | 'auto-renewal' | 'liability' | 'payment' | string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  title: string;
  rationale: string;
  recommendation: string;
  evidence_quote: string;
  section_ref: string;
  status: 'Open' | 'Under Review' | 'Mitigated' | 'Accepted' | string;
  reviewer_note?: string;
  verification: VerificationResult;
}

export interface ObligationItem {
  id: string;
  contract_id: string;
  contract_title?: string;
  counterparty?: string;
  title: string;
  description: string;
  owner: string;
  department: string;
  due_date: string;
  recurrence: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | string;
  evidence_quote: string;
  section_ref: string;
  verification: VerificationResult;
}

export interface QACitation {
  citation_id: string;
  section_ref: string;
  quote: string;
  verification: VerificationResult;
}

export interface QAResponse {
  id: string;
  contract_id: string;
  question: string;
  answer: string;
  supported: boolean;
  confidence: number;
  verification_summary: string;
  citations: QACitation[];
  created_at: string;
}

export interface ContractSummary {
  id: string;
  title: string;
  filename: string;
  counterparty: string;
  category: string;
  contract_type: string;
  status: string;
  effective_date: string;
  expiration_date: string;
  annual_value: number;
  governing_law: string;
  renewal_type: string;
  notice_period_days: number;
  risk_score: number;
  page_count: number;
  executive_summary: string;
  risk_count: number;
  obligation_count: number;
  verification_audit: VerificationAudit;
  uploaded_at: string;
}

export interface ContractDetail extends Omit<ContractSummary, 'risk_count' | 'obligation_count'> {
  key_takeaways: string[];
  source_text: string;
  sections: DocumentSection[];
  clauses: ClauseItem[];
  risks: RiskItem[];
  obligations: ObligationItem[];
  qa_history: QAResponse[];
}

export interface SampleContractInfo {
  key: string;
  title: string;
  counterparty: string;
  category: string;
  contract_type: string;
  annual_value: number;
  governing_law: string;
  description: string;
}

export interface DashboardData {
  metrics: {
    active_contracts: number;
    total_annual_commitment: number;
    avg_risk_score: number;
    open_high_risks: number;
    total_obligations: number;
    completed_obligations: number;
    overdue_obligations: number;
    verification_rate_pct: number;
  };
  risk_chart_data: Array<{
    category: string;
    key: string;
    count: number;
    color: string;
  }>;
  spend_chart_data: Array<{
    category: string;
    spend: number;
    contracts: number;
    avg_risk: number;
  }>;
  upcoming_deadlines: ObligationItem[];
  recent_contracts: ContractSummary[];
  recent_activity: Array<{
    id: string;
    event_type: string;
    title: string;
    detail: string;
    contract_id?: string;
    actor: string;
    created_at: string;
  }>;
}

export interface SectionDiff {
  section_number: string;
  heading: string;
  change_type: 'modified' | 'added' | 'removed' | 'unchanged';
  similarity: number;
  impact_level: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  base_excerpt: string;
  target_excerpt: string;
  word_diff: Array<{ type: 'equal' | 'insert' | 'delete'; text: string }>;
  ai_explanation: string;
  verified_in_both: boolean;
}

export interface CompareResponse {
  base_title: string;
  target_title: string;
  overall_similarity: number;
  summary_metrics: {
    total_sections: number;
    modified_sections: number;
    added_sections: number;
    removed_sections: number;
    unchanged_sections: number;
    critical_risk_shifts: number;
  };
  executive_comparison_summary: string;
  section_diffs: SectionDiff[];
}

export interface AppSettings {
  has_gemini_api_key: boolean;
  masked_api_key: string;
  ai_model: string;
  verification_strictness: string;
  min_grounding_score: number;
  renewal_notice_window_days: number;
  organization_name: string;
  primary_jurisdiction: string;
  auto_flag_unverified: boolean;
}

