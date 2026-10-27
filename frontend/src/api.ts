import {
  DashboardData,
  ContractSummary,
  ContractDetail,
  SampleContractInfo,
  RiskItem,
  ObligationItem,
  QAResponse,
  CompareResponse,
  AppSettings,
} from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    let errText = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) errText = data.detail;
    } catch {
      // ignore
    }
    throw new Error(errText);
  }
  return res.json();
}

export const api = {
  getDashboard: () => request<DashboardData>('/dashboard'),

  loadThreeSampleContracts: () =>
    request<{ status: string; loaded_count: number; message: string }>('/demo/load-samples', {
      method: 'POST',
    }),

  resetDemoToZeroState: () =>
    request<{ status: string; loaded_count: number; message: string }>('/demo/reset', {
      method: 'POST',
    }),

  getSamples: () => request<{ samples: SampleContractInfo[] }>('/samples'),

  getContracts: (params?: { q?: string; category?: string; status?: string; risk_tier?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.category && params.category !== 'All') search.set('category', params.category);
    if (params?.status && params.status !== 'All') search.set('status', params.status);
    if (params?.risk_tier && params.risk_tier !== 'All') search.set('risk_tier', params.risk_tier);
    const qs = search.toString();
    return request<{ contracts: ContractSummary[]; total: number }>(`/contracts${qs ? `?${qs}` : ''}`);
  },

  getContractDetail: (id: string) => request<ContractDetail>(`/contracts/${id}`),

  uploadContract: (file: File, customTitle?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (customTitle) formData.append('custom_title', customTitle);
    return request<ContractDetail>('/contracts/upload', {
      method: 'POST',
      body: formData,
    });
  },

  loadSampleContract: (sampleKey: string) =>
    request<ContractDetail>(`/contracts/sample/${sampleKey}`, {
      method: 'POST',
    }),

  askQuestion: (contractId: string, question: string) =>
    request<QAResponse>(`/contracts/${contractId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  getRisks: (params?: { category?: string; severity?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.category && params.category !== 'all') search.set('category', params.category);
    if (params?.severity && params.severity !== 'All') search.set('severity', params.severity);
    if (params?.status && params.status !== 'All') search.set('status', params.status);
    const qs = search.toString();
    return request<{
      risks: RiskItem[];
      category_counts: Record<string, number>;
      severity_counts: Record<string, number>;
    }>(`/risks${qs ? `?${qs}` : ''}`);
  },

  updateRiskStatus: (riskId: string, status: string, reviewer_note?: string) =>
    request<{ id: string; status: string }>(`/risks/${riskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewer_note }),
    }),

  getObligations: (params?: { status?: string; department?: string }) => {
    const search = new URLSearchParams();
    if (params?.status && params.status !== 'All') search.set('status', params.status);
    if (params?.department && params.department !== 'All') search.set('department', params.department);
    const qs = search.toString();
    return request<{
      obligations: ObligationItem[];
      summary: {
        total: number;
        completed: number;
        in_progress: number;
        pending: number;
        overdue: number;
      };
    }>(`/obligations${qs ? `?${qs}` : ''}`);
  },

  updateObligation: (
    obligationId: string,
    payload: { status?: string; owner?: string; due_date?: string; priority?: string }
  ) =>
    request<{ id: string; status: string }>(`/obligations/${obligationId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  createObligation: (payload: {
    contract_id: string;
    title: string;
    description: string;
    owner: string;
    department: string;
    due_date: string;
    recurrence: string;
    priority: string;
    evidence_quote: string;
    section_ref?: string;
  }) =>
    request<{ id: string }>('/obligations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  compareContracts: (payload: {
    base_contract_id?: string;
    target_contract_id?: string;
    base_title?: string;
    target_title?: string;
    base_text?: string;
    target_text?: string;
  }) =>
    request<CompareResponse>('/compare', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getReports: () =>
    request<{
      generated_at: string;
      executive_metrics: Record<string, number>;
      contracts: ContractSummary[];
      risks: RiskItem[];
      obligations: ObligationItem[];
    }>('/reports'),

  getSettings: () => request<AppSettings>('/settings'),

  updateSettings: (payload: Partial<AppSettings> & { gemini_api_key?: string }) =>
    request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

