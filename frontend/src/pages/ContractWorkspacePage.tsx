import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ShieldAlert,
  CalendarCheck2,
  Sparkles,
  ShieldCheck,
  Send,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Scale,
  DollarSign,
  X,
  MessageSquareQuote,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api';
import { ContractDetail, QAResponse } from '../types';
import { VerificationBadge } from '../components/VerificationBadge';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastContext';

type IntelligenceTab = 'summary' | 'clauses' | 'risks' | 'obligations' | 'ask';

interface ActiveHighlight {
  quote: string;
  label: string;
  type: 'clause' | 'risk' | 'obligation' | 'qa';
  sectionId?: string | null;
  startChar?: number | null;
  endChar?: number | null;
}

export const ContractWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('summary');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<ActiveHighlight | null>(null);

  const [questionInput, setQuestionInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAResponse[]>([]);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightedSpanRef = useRef<HTMLElement | null>(null);

  const loadContract = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getContractDetail(id);
      setContract(data);
      setQaHistory(data.qa_history || []);
      if (data.sections.length > 0 && !activeSectionId) {
        setActiveSectionId(data.sections[0].id);
      }

      const tabParam = searchParams.get('tab') as IntelligenceTab | null;
      if (tabParam && ['summary', 'clauses', 'risks', 'obligations', 'ask'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const highlightId = searchParams.get('highlight');
      if (highlightId) {
        const matchedRisk = data.risks.find((r) => r.id === highlightId);
        if (matchedRisk) {
          triggerHighlight({
            quote: matchedRisk.verification.matched_excerpt || matchedRisk.evidence_quote,
            label: `Risk: ${matchedRisk.title}`,
            type: 'risk',
            sectionId: matchedRisk.verification.section_id,
            startChar: matchedRisk.verification.start_char,
            endChar: matchedRisk.verification.end_char,
          });
        }
        const matchedOb = data.obligations.find((o) => o.id === highlightId);
        if (matchedOb) {
          triggerHighlight({
            quote: matchedOb.verification.matched_excerpt || matchedOb.evidence_quote,
            label: `Obligation: ${matchedOb.title}`,
            type: 'obligation',
            sectionId: matchedOb.verification.section_id,
            startChar: matchedOb.verification.start_char,
            endChar: matchedOb.verification.end_char,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [id]);

  const triggerHighlight = (hl: ActiveHighlight) => {
    setHighlight(hl);
    if (hl.sectionId) {
      setActiveSectionId(hl.sectionId);
    }
    setTimeout(() => {
      if (highlightedSpanRef.current) {
        highlightedSpanRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (hl.sectionId && sectionRefs.current[hl.sectionId]) {
        sectionRefs.current[hl.sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const scrollToSection = (secId: string) => {
    setActiveSectionId(secId);
    sectionRefs.current[secId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRiskStatusChange = async (riskId: string, riskTitle: string, newStatus: string) => {
    try {
      await api.updateRiskStatus(riskId, newStatus);
      if (contract) {
        setContract({
          ...contract,
          risks: contract.risks.map((r) => (r.id === riskId ? { ...r, status: newStatus } : r)),
        });
      }
      showToast(
        `Risk Status Updated to "${newStatus}"`,
        riskTitle,
        newStatus === 'Mitigated' ? 'teal' : 'magenta'
      );
    } catch (e: any) {
      showToast('Failed to update risk', e?.message, 'warning');
    }
  };

  const handleObligationStatusToggle = async (
    obId: string,
    obTitle: string,
    currentStatus: string
  ) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      await api.updateObligation(obId, { status: nextStatus });
      if (contract) {
        setContract({
          ...contract,
          obligations: contract.obligations.map((o) =>
            o.id === obId ? { ...o, status: nextStatus } : o
          ),
        });
      }
      showToast(
        `Obligation Marked "${nextStatus}"`,
        obTitle,
        nextStatus === 'Completed' ? 'teal' : 'magenta'
      );
    } catch (e: any) {
      showToast('Failed to update obligation', e?.message, 'warning');
    }
  };

  const handleAskQuestion = async (qText?: string) => {
    const q = (qText ?? questionInput).trim();
    if (!q || !contract || asking) return;
    try {
      setAsking(true);
      if (!qText) setQuestionInput('');
      const res = await api.askQuestion(contract.id, q);
      setQaHistory((prev) => [res, ...prev]);
      if (res.supported && res.citations.length > 0) {
        const firstCit = res.citations[0];
        triggerHighlight({
          quote: firstCit.verification.matched_excerpt || firstCit.quote,
          label: `Q&A Evidence: ${firstCit.section_ref}`,
          type: 'qa',
          sectionId: firstCit.verification.section_id,
          startChar: firstCit.verification.start_char,
          endChar: firstCit.verification.end_char,
        });
        showToast(
          'Grounded Answer Verified',
          `Matched ${res.citations.length} verbatim source passage(s).`,
          'magenta'
        );
      } else {
        showToast(
          'Graceful Evidence Fallback Triggered',
          'No supporting clause exists in this contract for that query.',
          'warning'
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAsking(false);
    }
  };

  const renderSectionTextWithHighlight = (content: string) => {
    if (!highlight || !highlight.quote) {
      return <span>{content}</span>;
    }

    const q = highlight.quote.trim();
    const idx = content.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) {
      return <span>{content}</span>;
    }

    const before = content.slice(0, idx);
    const match = content.slice(idx, idx + q.length);
    const after = content.slice(idx + q.length);

    return (
      <>
        <span>{before}</span>
        <mark
          ref={(el) => {
            highlightedSpanRef.current = el;
          }}
          className="bg-pink-100/90 text-[#20233A] border-b-2 border-pink-600 px-1 py-0.5 rounded font-medium highlight-active-passage"
        >
          {match}
        </mark>
        <span>{after}</span>
      </>
    );
  };

  if (loading || !contract) {
    return <PageSkeleton title="Opening Three-Column Document Intelligence Workspace..." />;
  }

  const SUGGESTED_QUESTIONS = [
    'What is the non-renewal notice window and automatic renewal term?',
    'What is the aggregate liability cap and which claims are uncapped?',
    'What are the payment terms and late payment interest penalties?',
    'Can we terminate this agreement for convenience without penalty?',
    'Does this contract grant sovereign patent royalties in Antarctica?',
  ];

  return (
    <div className="flex flex-col lg:h-[calc(100vh-4rem)] lg:overflow-hidden bg-[#FAF8F3]">
      {/* Workspace Subheader Bar */}
      <div className="backdrop-blur-md bg-white/85 border-b border-pink-500/15 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/contracts')}
            className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] border border-pink-500/20 transition-colors"
            title="Back to Document Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif-editorial text-base sm:text-xl text-[#20233A] truncate">
                {contract.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 border border-pink-500/20 text-pink-700">
                {contract.contract_type}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  contract.risk_score >= 70
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                    : 'bg-pink-50 text-pink-700'
                }`}
              >
                Risk Score: {contract.risk_score}/100
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#575B75] mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {contract.counterparty}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Scale className="w-3 h-3" />
                {contract.governing_law}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#20233A]">
                <DollarSign className="w-3 h-3 text-[#0F9D91]" />
                {contract.annual_value.toLocaleString()}/yr
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-[#E6F7F5] border border-[#0F9D91]/30 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F9D91]" />
            <div className="text-left">
              <div className="text-[11px] font-bold text-[#0F9D91] leading-none">
                Verification Layer: Grade {contract.verification_audit.trust_grade}
              </div>
              <div className="text-[10px] text-[#20233A] font-mono mt-0.5">
                {contract.verification_audit.verified_exact_count +
                  contract.verification_audit.verified_high_count}
                /{contract.verification_audit.total_findings} findings source-verified
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Three-Column Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:overflow-hidden">
        {/* COLUMN 1 (Left): Document Navigation & Metadata Outline */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-pink-500/15 bg-[#FAF8F3] flex flex-col justify-between lg:overflow-y-auto p-4 space-y-5">
          <div className="space-y-4">
            <div className="backdrop-blur-md bg-white/85 border border-pink-500/15 rounded-xl p-3.5 shadow-editorial">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#575B75] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-pink-600" />
                  <span>Document Sections ({contract.sections.length})</span>
                </span>
              </div>
              <div className="space-y-1">
                {contract.sections.map((sec) => {
                  const isCurrent = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start gap-2 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold shadow-sm'
                          : 'text-[#20233A] hover:bg-pink-50/70'
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          isCurrent ? 'bg-white/20 text-white' : 'bg-[#FAF8F3] text-pink-600'
                        }`}
                      >
                        §{sec.number}
                      </span>
                      <span className="truncate">{sec.heading}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/85 border border-pink-500/15 rounded-xl p-4 shadow-editorial space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#575B75]">
                Key Commercial Terms
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-pink-500/10">
                  <div className="text-[10px] text-[#575B75]">Effective Date</div>
                  <div className="font-mono font-semibold text-[#20233A] mt-0.5">
                    {contract.effective_date}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-pink-500/10">
                  <div className="text-[10px] text-[#575B75]">Expiration Date</div>
                  <div className="font-mono font-semibold text-[#20233A] mt-0.5">
                    {contract.expiration_date}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-pink-500/10">
                  <div className="text-[10px] text-[#575B75]">Renewal Structure</div>
                  <div className="font-semibold text-[#20233A] mt-0.5">{contract.renewal_type}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-500/25">
                  <div className="text-[10px] text-rose-600 font-bold">Notice Window</div>
                  <div className="font-mono font-bold text-rose-600 mt-0.5">
                    {contract.notice_period_days} Days Prior
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/85 border border-pink-500/15 rounded-xl p-4 shadow-editorial space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F9D91] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Evidence Audit Trail
              </span>
              <span className="text-xs font-mono font-bold text-[#20233A]">
                {Math.round(contract.verification_audit.overall_grounding_score * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#FAF8F3] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-600 to-rose-600 rounded-full"
                style={{
                  width: `${Math.round(contract.verification_audit.overall_grounding_score * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* COLUMN 2 (Center): Pure White Readable Document Preview with Source Highlighting */}
        <div className="lg:col-span-5 bg-[#FAF8F3] p-4 lg:p-6 lg:overflow-y-auto flex flex-col items-center">
          {highlight && (
            <div className="w-full max-w-3xl mb-4 p-3 rounded-xl bg-white border-2 border-pink-600 shadow-editorial-md flex items-center justify-between gap-3 sticky top-0 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                  <Crosshair className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#20233A] truncate">{highlight.label}</div>
                  <div className="text-[11px] text-[#575B75] font-mono">
                    Verified Source Span{' '}
                    {highlight.startChar != null
                      ? `[Chars ${highlight.startChar}–${highlight.endChar}]`
                      : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHighlight(null)}
                className="p-1.5 rounded-lg hover:bg-pink-50 text-[#575B75] hover:text-[#20233A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pure White Editorial Document Sheet (#FFFFFF) */}
          <div className="w-full max-w-3xl bg-white border border-pink-500/20 rounded-2xl shadow-editorial-md p-6 sm:p-10 space-y-6">
            <div className="border-b border-pink-500/15 pb-5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#888CA4]">
                <span>SOURCE DOCUMENT PREVIEW • {contract.filename.toUpperCase()}</span>
                <span>{contract.page_count} PAGES INDEXED</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif-editorial text-[#20233A]">
                {contract.title}
              </h3>
              <p className="text-xs text-[#575B75]">
                Executed between{' '}
                <span className="font-semibold text-[#20233A]">{contract.counterparty}</span> and{' '}
                <span className="font-semibold text-[#20233A]">Acme Orbit Technologies Inc.</span>
              </p>
            </div>

            <div className="space-y-6">
              {contract.sections.map((sec) => {
                const isSelectedSec = activeSectionId === sec.id;
                return (
                  <div
                    key={sec.id}
                    ref={(el) => {
                      sectionRefs.current[sec.id] = el;
                    }}
                    className={`p-4 rounded-xl transition-all border ${
                      isSelectedSec
                        ? 'bg-[#FAF8F3]/80 border-pink-500/40'
                        : 'bg-white border-transparent hover:border-pink-500/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-display font-bold uppercase tracking-wider text-pink-600">
                        {sec.number === '0' ? 'Preamble' : `Section ${sec.number} — ${sec.heading}`}
                      </span>
                      <span className="text-[10px] font-mono text-[#888CA4]">
                        [{sec.start_char}–{sec.end_char}]
                      </span>
                    </div>
                    <div className="text-[13.5px] leading-[1.75] text-[#20233A] whitespace-pre-line font-normal">
                      {renderSectionTextWithHighlight(sec.content)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 3 (Right): Intelligence Tab Panel */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-pink-500/15 bg-white flex flex-col min-h-0 lg:overflow-hidden">
          <div className="border-b border-pink-500/15 px-3 pt-2.5 flex items-center gap-1 overflow-x-auto shrink-0 bg-[#FAF8F3]/70">
            {[
              { key: 'summary', label: 'Summary', count: null },
              { key: 'clauses', label: 'Clauses', count: contract.clauses.length },
              { key: 'risks', label: 'Risks', count: contract.risks.length },
              { key: 'obligations', label: 'Obligations', count: contract.obligations.length },
              { key: 'ask', label: 'Ask ClausePilot', count: 'AI' },
            ].map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as IntelligenceTab)}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? 'bg-white text-pink-600 border-pink-600 shadow-sm'
                      : 'text-[#575B75] border-transparent hover:text-[#20233A]'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.count !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                          : 'bg-pink-50 text-pink-700'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 lg:overflow-y-auto p-5 space-y-4">
            {activeTab === 'summary' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#FAF8F3] border border-pink-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Executive Synthesis
                    </span>
                    <span className="text-[11px] font-semibold text-[#0F9D91]">
                      100% Source-Grounded
                    </span>
                  </div>
                  <p className="text-xs text-[#20233A] leading-relaxed">
                    {contract.executive_summary}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#575B75]">
                    Key Contractual Takeaways
                  </h4>
                  {contract.key_takeaways.map((kt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-pink-500/15 flex items-start gap-2.5 text-xs text-[#20233A]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#0F9D91] shrink-0 mt-0.5" />
                      <span>{kt}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('risks')}
                    className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-500/30 hover:border-rose-600 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span className="text-lg font-serif-editorial text-rose-600">
                        {contract.risks.length}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#20233A] mt-1">Verified Risk Flags</div>
                    <div className="text-[11px] text-[#575B75]">Inspect source quotes →</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('obligations')}
                    className="p-3.5 rounded-xl bg-[#E6F7F5]/60 border border-[#0F9D91]/30 hover:border-[#0F9D91] text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <CalendarCheck2 className="w-4 h-4 text-[#0F9D91]" />
                      <span className="text-lg font-serif-editorial text-[#0F9D91]">
                        {contract.obligations.length}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#20233A] mt-1">Tracked Obligations</div>
                    <div className="text-[11px] text-[#575B75]">Manage deadlines →</div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'clauses' && (
              <div className="space-y-3.5">
                <div className="text-xs text-[#575B75]">
                  Click any extracted clause below to highlight its exact verbatim passage in the document preview.
                </div>
                {contract.clauses.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() =>
                      triggerHighlight({
                        quote: cls.verification.matched_excerpt || cls.extracted_text,
                        label: `Clause: ${cls.title}`,
                        type: 'clause',
                        sectionId: cls.verification.section_id,
                        startChar: cls.verification.start_char,
                        endChar: cls.verification.end_char,
                      })
                    }
                    className="p-4 rounded-xl bg-[#FAF8F3] hover:bg-white border border-pink-500/15 hover:border-pink-600 transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-pink-50 border border-pink-500/20 text-pink-700">
                        {cls.category}
                      </span>
                      <span className="text-[11px] font-mono text-[#575B75]">{cls.section_ref}</span>
                    </div>
                    <div className="text-xs font-bold text-[#20233A]">{cls.title}</div>
                    <p className="text-xs text-[#575B75] leading-relaxed">{cls.summary}</p>
                    <blockquote className="p-2.5 rounded-lg bg-white border-l-3 border-pink-600 text-[11px] text-[#20233A] italic">
                      "{cls.extracted_text}"
                    </blockquote>
                    <VerificationBadge
                      verification={cls.verification}
                      onLocate={() =>
                        triggerHighlight({
                          quote: cls.verification.matched_excerpt || cls.extracted_text,
                          label: `Clause: ${cls.title}`,
                          type: 'clause',
                          sectionId: cls.verification.section_id,
                          startChar: cls.verification.start_char,
                          endChar: cls.verification.end_char,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="space-y-4">
                <div className="text-xs text-[#575B75]">
                  Categorized risk flags backed by verbatim source quotes. Click any risk card to locate and highlight the clause.
                </div>
                {contract.risks.map((r) => (
                  <div
                    key={r.id}
                    onClick={() =>
                      triggerHighlight({
                        quote: r.verification.matched_excerpt || r.evidence_quote,
                        label: `Risk Flag: ${r.title}`,
                        type: 'risk',
                        sectionId: r.verification.section_id,
                        startChar: r.verification.start_char,
                        endChar: r.verification.end_char,
                      })
                    }
                    className="p-4 rounded-xl bg-white border border-pink-500/20 hover:border-rose-600 shadow-editorial transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r from-pink-600 to-rose-600 text-white">
                        {r.severity} • {r.category}
                      </span>
                      <select
                        value={r.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleRiskStatusChange(r.id, r.title, e.target.value)}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
                      >
                        <option value="Open">Open</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Mitigated">Mitigated</option>
                        <option value="Accepted">Accepted</option>
                      </select>
                    </div>

                    <div className="text-xs font-bold text-[#20233A]">{r.title}</div>
                    <p className="text-xs text-[#575B75] leading-relaxed">{r.rationale}</p>

                    <div className="p-2.5 rounded-lg bg-[#FAF8F3] border-l-3 border-rose-600 text-[11px] text-[#20233A] italic">
                      "{r.evidence_quote}"
                    </div>

                    <div className="p-2.5 rounded-lg bg-pink-50/70 border border-pink-500/20 text-[11px] text-[#20233A]">
                      <span className="font-bold text-pink-700">Recommended Redline: </span>
                      {r.recommendation}
                    </div>

                    <VerificationBadge
                      verification={r.verification}
                      onLocate={() =>
                        triggerHighlight({
                          quote: r.verification.matched_excerpt || r.evidence_quote,
                          label: `Risk Flag: ${r.title}`,
                          type: 'risk',
                          sectionId: r.verification.section_id,
                          startChar: r.verification.start_char,
                          endChar: r.verification.end_char,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'obligations' && (
              <div className="space-y-4">
                <div className="text-xs text-[#575B75]">
                  Actionable operational covenants extracted from this agreement. Toggle status or click to inspect source evidence.
                </div>
                {contract.obligations.map((ob) => {
                  const isDone = ob.status === 'Completed';
                  return (
                    <div
                      key={ob.id}
                      onClick={() =>
                        triggerHighlight({
                          quote: ob.verification.matched_excerpt || ob.evidence_quote,
                          label: `Obligation: ${ob.title}`,
                          type: 'obligation',
                          sectionId: ob.verification.section_id,
                          startChar: ob.verification.start_char,
                          endChar: ob.verification.end_char,
                        })
                      }
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isDone
                          ? 'bg-[#E6F7F5]/35 border-[#0F9D91]/40'
                          : 'bg-white border-pink-500/20 hover:border-pink-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isDone
                              ? 'bg-[#0F9D91] text-white'
                              : ob.status === 'Overdue'
                              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                              : 'bg-[#FAF8F3] border border-[#E6E1D6] text-[#20233A]'
                          }`}
                        >
                          {ob.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleObligationStatusToggle(ob.id, ob.title, ob.status);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            isDone
                              ? 'bg-white border border-[#E6E1D6] text-[#575B75]'
                              : 'bg-[#0F9D91] text-white hover:bg-[#0c857a]'
                          }`}
                        >
                          {isDone ? 'Reopen' : 'Mark Completed'}
                        </button>
                      </div>

                      <div className="text-xs font-bold text-[#20233A]">{ob.title}</div>
                      <p className="text-xs text-[#575B75]">{ob.description}</p>

                      <div className="flex items-center justify-between text-[11px] text-[#575B75] pt-1">
                        <span>
                          Owner: <strong className="text-[#20233A]">{ob.owner}</strong>
                        </span>
                        <span className="font-mono font-semibold text-[#20233A]">
                          Due: {ob.due_date} ({ob.recurrence})
                        </span>
                      </div>

                      <VerificationBadge
                        verification={ob.verification}
                        onLocate={() =>
                          triggerHighlight({
                            quote: ob.verification.matched_excerpt || ob.evidence_quote,
                            label: `Obligation: ${ob.title}`,
                            type: 'obligation',
                            sectionId: ob.verification.section_id,
                            startChar: ob.verification.start_char,
                            endChar: ob.verification.end_char,
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'ask' && (
              <div className="space-y-4 flex flex-col h-full">
                <div className="p-3.5 rounded-xl bg-pink-50 border border-pink-500/25 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700">
                    <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                    <span>Evidence-First Contextual Q&amp;A</span>
                  </div>
                  <p className="text-[11px] text-[#575B75] leading-relaxed">
                    Answers are strictly grounded in extracted source passages. Click any citation pill to highlight the exact sentence in the document. If information is missing from the contract, ClausePilot falls back gracefully.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#888CA4]">
                    Suggested Contract Queries
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS.map((sq, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={asking}
                        onClick={() => handleAskQuestion(sq)}
                        className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] hover:text-pink-700 border border-pink-500/15 transition-colors"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask about termination, fees, SLAs, liability..."
                    className="flex-1 px-3.5 py-2 text-xs bg-[#FAF8F3] border border-pink-500/20 rounded-xl text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={asking || !questionInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {qaHistory.map((qa) => (
                    <div
                      key={qa.id}
                      className={`p-4 rounded-xl border space-y-3 ${
                        qa.supported
                          ? 'bg-white border-pink-500/20 shadow-editorial'
                          : 'bg-rose-50/60 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-[#20233A] flex items-start gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-pink-600 shrink-0 mt-0.5" />
                          <span>{qa.question}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            qa.supported
                              ? 'bg-[#E6F7F5] text-[#0F9D91]'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {qa.supported
                            ? `${Math.round(qa.confidence * 100)}% Grounded`
                            : 'Missing in Text'}
                        </span>
                      </div>

                      <p className="text-xs text-[#20233A] leading-relaxed">{qa.answer}</p>

                      {qa.citations && qa.citations.length > 0 ? (
                        <div className="space-y-2 pt-1 border-t border-pink-500/10">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1">
                            <MessageSquareQuote className="w-3 h-3" />
                            <span>Clickable Reference Evidence ({qa.citations.length})</span>
                          </div>
                          {qa.citations.map((cit) => (
                            <div
                              key={cit.citation_id}
                              onClick={() =>
                                triggerHighlight({
                                  quote: cit.verification.matched_excerpt || cit.quote,
                                  label: `Q&A Citation: ${cit.section_ref}`,
                                  type: 'qa',
                                  sectionId: cit.verification.section_id,
                                  startChar: cit.verification.start_char,
                                  endChar: cit.verification.end_char,
                                })
                              }
                              className="p-2.5 rounded-lg bg-[#FAF8F3] hover:bg-pink-50 border border-pink-500/20 hover:border-pink-600 cursor-pointer transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-pink-700">
                                  {cit.section_ref}
                                </span>
                                <span className="text-[10px] font-mono text-pink-600 font-bold">
                                  Click to highlight passage →
                                </span>
                              </div>
                              <div className="text-[11px] text-[#20233A] italic">"{cit.quote}"</div>
                              <VerificationBadge verification={cit.verification} compact />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{qa.verification_summary}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
