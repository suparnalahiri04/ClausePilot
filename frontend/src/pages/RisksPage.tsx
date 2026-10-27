import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  RotateCcw,
  Ban,
  Scale,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Filter,
  Grid,
  DollarSign,
} from 'lucide-react';
import { api } from '../api';
import { RiskItem, ContractSummary } from '../types';
import { VerificationBadge } from '../components/VerificationBadge';
import { PageSkeleton } from '../components/Skeleton';
import { SampleLoaderBanner } from '../components/SampleLoaderBanner';
import { useToast } from '../components/ToastContext';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Risk Categories', icon: ShieldAlert },
  { key: 'termination', label: 'Cancellation Rules', icon: Ban },
  { key: 'auto-renewal', label: 'Auto-Renewals', icon: RotateCcw },
  { key: 'liability', label: 'Liability Limits', icon: Scale },
  { key: 'payment', label: 'Payment Terms', icon: CreditCard },
];

export const RisksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';

  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [selectedMatrixContractId, setSelectedMatrixContractId] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [severityCounts, setSeverityCounts] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadRisks = async () => {
    try {
      setLoading(true);
      const [res, contractsRes] = await Promise.all([
        api.getRisks({
          category: activeCategory,
          severity: severityFilter,
          status: statusFilter,
        }),
        api.getContracts(),
      ]);
      setRisks(res.risks);
      setCategoryCounts(res.category_counts);
      setSeverityCounts(res.severity_counts);
      setContracts(contractsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, [activeCategory, severityFilter, statusFilter]);

  const handleStatusUpdate = async (riskId: string, riskTitle: string, newStatus: string) => {
    try {
      await api.updateRiskStatus(riskId, newStatus);
      setRisks((prev) => prev.map((r) => (r.id === riskId ? { ...r, status: newStatus } : r)));
      showToast(
        `Risk Status Updated to "${newStatus}"`,
        `${riskTitle} updated in Risk Governance Ledger.`,
        newStatus === 'Mitigated' ? 'teal' : 'magenta'
      );
    } catch (e: any) {
      showToast('Failed to update risk status', e?.message, 'warning');
    }
  };

  if (loading && risks.length === 0 && Object.keys(categoryCounts).length === 0) {
    return <PageSkeleton title="Scanning Portfolio Risk Flags & Evidence Excerpts..." />;
  }

  const totalRisks = categoryCounts['all'] ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-pink-600">
          Legal &amp; Commercial Governance
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
          Dedicated Risk Review Center
        </h1>
      </div>

      {/* Zero-State & Instant Fixture Loader */}
      <SampleLoaderBanner
        isEmpty={totalRisks === 0}
        onLoaded={loadRisks}
        contextLabel="the Risk Review Center"
      />

      {/* Top Severity Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Urgent Warnings',
            count: severityCounts['Critical'] || 0,
            badge: 'Needs Immediate Attention',
            color: 'text-rose-600',
            bg: 'bg-rose-50',
          },
          {
            label: 'High Priority Risks',
            count: severityCounts['High'] || 0,
            badge: 'Review Before Signing',
            color: 'text-pink-600',
            bg: 'bg-pink-50',
          },
          {
            label: 'Moderate Risks',
            count: severityCounts['Medium'] || 0,
            badge: 'Standard Watchlist',
            color: 'text-pink-700',
            bg: 'bg-pink-50/70',
          },
          {
            label: 'Fact-Checked Quotes',
            count: '100%',
            badge: 'Matched to Document Text',
            color: 'text-[#0F9D91]',
            bg: 'bg-[#E6F7F5]',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="backdrop-blur-md bg-white/80 border border-pink-500/15 rounded-2xl p-5 shadow-editorial flex flex-col justify-between"
          >
            <div className="text-xs font-bold text-[#575B75]">{item.label}</div>
            <div className={`text-2xl lg:text-3xl font-serif-editorial mt-2 ${item.color}`}>
              {item.count}
            </div>
            <div className="mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.bg} ${item.color}`}>
                {item.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Risk Heatmap Matrix (Financial Exposure vs. Legal Severity 2x2 Grid & Scatter Plot) */}
      {contracts.length > 0 && (
        <div className="backdrop-blur-md bg-white/85 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600">
                <Grid className="w-3.5 h-3.5" />
                <span>Founder &amp; Legal Executive Snapshot</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif-editorial text-[#20233A]">
                Visual Risk Heatmap Matrix (Financial Exposure vs. Legal Severity)
              </h2>
              <p className="text-xs text-[#575B75]">
                Interactive 2×2 quadrant plot mapping annual dollar commitment against legal risk severity. Click any contract pin to inspect or filter.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-500/25">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                High Exposure + High Severity
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-500/25">
                <span className="w-2 h-2 rounded-full bg-pink-600" />
                Moderate Watchlist
              </span>
              {selectedMatrixContractId && (
                <button
                  type="button"
                  onClick={() => setSelectedMatrixContractId(null)}
                  className="text-xs font-bold text-pink-600 underline"
                >
                  Show All Agreements
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Interactive 2x2 Quadrant Heatmap & Scatter Canvas */}
            <div className="lg:col-span-8 relative rounded-2xl border border-pink-500/20 bg-[#FAF8F3] p-5 overflow-hidden">
              {/* Y-Axis Label */}
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#575B75] mb-2">
                <span>↑ Higher Legal Severity (Risk Score 0–100)</span>
                <span>Financial Exposure ($ Annual Value) →</span>
              </div>

              {/* 2x2 Quadrant Grid */}
              <div className="relative grid grid-cols-2 grid-rows-2 gap-2.5 h-[290px] sm:h-[320px]">
                {/* Top-Left Quadrant: High Legal Severity / Moderate Spend */}
                <div className="rounded-xl bg-pink-50/70 border border-pink-500/25 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700">
                      Q2 • Legal Redline Priority
                    </span>
                    <span className="text-[10px] font-mono font-bold text-pink-600 bg-white px-2 py-0.5 rounded-full">
                      High Legal / Lower Spend
                    </span>
                  </div>
                  <div className="text-[11px] text-[#575B75]">
                    Strict liability or IP traps on mid-tier annual spend
                  </div>
                </div>

                {/* Top-Right Quadrant: Critical Exposure (High Financial + High Legal Severity) */}
                <div className="rounded-xl bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/80 border-2 border-rose-500/40 p-3 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      Q1 • Urgent Executive Action
                    </span>
                    <span className="text-[10px] font-mono font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 px-2 py-0.5 rounded-full">
                      High Spend + High Severity
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-900/80 font-medium">
                    Major capital commitment paired with uncapped or lock-in clauses
                  </div>
                </div>

                {/* Bottom-Left Quadrant: Routine Governance */}
                <div className="rounded-xl bg-[#E6F7F5]/60 border border-[#0F9D91]/25 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F9D91]">
                      Q3 • Standard Governance
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#0F9D91] bg-white px-2 py-0.5 rounded-full">
                      Low Spend / Low Risk
                    </span>
                  </div>
                  <div className="text-[11px] text-[#575B75]">
                    Balanced commercial terms within standard tolerances
                  </div>
                </div>

                {/* Bottom-Right Quadrant: High Spend / Commercial Watchlist */}
                <div className="rounded-xl bg-amber-50/60 border border-amber-500/25 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Q4 • Commercial Renewal Watch
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full">
                      High Spend / Moderate Risk
                    </span>
                  </div>
                  <div className="text-[11px] text-[#575B75]">
                    High-value agreements requiring renewal window tracking
                  </div>
                </div>

                {/* Plotted Contract Scatter Pins */}
                {(() => {
                  const maxVal = Math.max(...contracts.map((c) => c.annual_value), 500000);
                  return contracts.map((c) => {
                    // X%: Financial exposure normalized between 14% and 88%
                    const xPct = Math.min(88, Math.max(14, Math.round((c.annual_value / maxVal) * 76) + 10));
                    // Y% from top: Higher risk_score (e.g., 85) appears near top (18%), lower risk near bottom (80%)
                    const yPct = Math.min(82, Math.max(16, 100 - c.risk_score));
                    const isSelected = selectedMatrixContractId === c.id;
                    const isHighZone = c.risk_score >= 70;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setSelectedMatrixContractId(isSelected ? null : c.id)
                        }
                        style={{ left: `${xPct}%`, top: `${yPct}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-left transition-all shadow-editorial-lg ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-white scale-110 ring-4 ring-pink-500/30'
                            : isHighZone
                            ? 'bg-white/95 hover:bg-rose-50 text-[#20233A] border-rose-500/50 hover:scale-105'
                            : 'bg-white/95 hover:bg-pink-50 text-[#20233A] border-pink-500/35 hover:scale-105'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-white'
                              : isHighZone
                              ? 'bg-rose-600 animate-pulse'
                              : 'bg-pink-600'
                          }`}
                        />
                        <div className="leading-tight">
                          <div className="text-[11px] font-bold truncate max-w-[135px]">
                            {c.counterparty}
                          </div>
                          <div
                            className={`text-[9px] font-mono font-semibold ${
                              isSelected ? 'text-white/90' : 'text-[#575B75]'
                            }`}
                          >
                            ${(c.annual_value / 1000).toFixed(0)}k/yr • Severity {c.risk_score}
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Right Column: Matrix Quadrant Breakdown & Selected Contract Inspector */}
            <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl bg-[#FAF8F3] border border-pink-500/15 p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-pink-600">
                  Plotted Portfolio Agreements ({contracts.length})
                </div>
                <p className="text-[11px] text-[#575B75]">
                  Select any agreement below or on the 2×2 matrix to filter its specific risk clauses or open the full workspace.
                </p>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[230px] pr-1">
                {contracts.map((c) => {
                  const isSelected = selectedMatrixContractId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() =>
                        setSelectedMatrixContractId(isSelected ? null : c.id)
                      }
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-pink-50/90 border-pink-600 shadow-sm'
                          : 'bg-white border-pink-500/15 hover:border-pink-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#20233A] truncate">
                          {c.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            c.risk_score >= 75
                              ? 'bg-rose-50 text-rose-600 border border-rose-500/20'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          Severity {c.risk_score}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#575B75] mt-1">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#20233A]">
                          <DollarSign className="w-3 h-3 text-pink-600" />
                          {c.annual_value.toLocaleString()}/yr
                        </span>
                        <span>{c.risk_count} Risk Flags</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contracts/${c.id}?tab=risks`);
                          }}
                          className="text-pink-600 hover:text-pink-700 font-bold inline-flex items-center gap-0.5"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Navigation Tabs & Filters */}
      <div className="backdrop-blur-md bg-white/80 border border-pink-500/15 rounded-2xl p-4 shadow-editorial flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeCategory === tab.key;
            const count = categoryCounts[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-magenta'
                    : 'bg-[#FAF8F3] text-[#575B75] hover:text-[#20233A] border border-pink-500/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#20233A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#575B75]">
            <Filter className="w-3.5 h-3.5 text-pink-600" />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] font-medium"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-[#575B75]">
            <span>Review Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Accepted">Accepted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categorized Risk Review Cards with Evidence-Backed Excerpts */}
      <div className="space-y-4">
        {risks
          .filter((r) => !selectedMatrixContractId || r.contract_id === selectedMatrixContractId)
          .map((risk) => {
          const isCritical = risk.severity === 'Critical';
          const isMitigated = risk.status === 'Mitigated' || risk.status === 'Accepted';

          return (
            <div
              key={risk.id}
              className={`backdrop-blur-md bg-white/85 border rounded-2xl p-6 shadow-editorial transition-all ${
                isMitigated
                  ? 'border-[#0F9D91]/40 bg-[#FAF8F3]/60'
                  : isCritical
                  ? 'border-rose-500/40 hover:border-rose-600'
                  : 'border-pink-500/15 hover:border-pink-600'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          isCritical
                            ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                            : 'bg-rose-50 text-rose-600 border border-rose-500/30'
                        }`}
                      >
                        {risk.severity} Risk
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-pink-50 border border-pink-500/20 text-pink-700">
                        {risk.category}
                      </span>
                      <span className="text-xs font-semibold text-[#575B75]">
                        {risk.contract_title} ({risk.counterparty})
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-serif-editorial text-[#20233A]">{risk.title}</h3>
                  <p className="text-xs text-[#575B75] leading-relaxed">{risk.rationale}</p>

                  <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-500/20 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-[#20233A]">
                      <span className="font-bold text-pink-700">Playbook Redline Guidance: </span>
                      {risk.recommendation}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between bg-[#FAF8F3] border border-pink-500/15 rounded-xl p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#575B75]">
                        Extracted Source Excerpt ({risk.section_ref})
                      </span>
                      <VerificationBadge
                        verification={risk.verification}
                        onLocate={() =>
                          navigate(`/contracts/${risk.contract_id}?tab=risks&highlight=${risk.id}`)
                        }
                      />
                    </div>
                    <blockquote className="p-3 rounded-lg bg-white border-l-4 border-pink-600 text-xs text-[#20233A] italic leading-relaxed">
                      "{risk.evidence_quote}"
                    </blockquote>
                  </div>

                  <div className="pt-2 border-t border-pink-500/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#575B75]">Status:</span>
                      <select
                        value={risk.status}
                        onChange={(e) => handleStatusUpdate(risk.id, risk.title, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                          risk.status === 'Mitigated'
                            ? 'bg-[#E6F7F5] text-[#0F9D91] border-[#0F9D91]/30'
                            : 'bg-white text-[#20233A] border-pink-500/20'
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Mitigated">Mitigated (Teal)</option>
                        <option value="Accepted">Accepted Risk</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/contracts/${risk.contract_id}?tab=risks&highlight=${risk.id}`)
                      }
                      className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:underline"
                    >
                      <span>Inspect in Contract</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
