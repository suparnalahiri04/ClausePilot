import React, { useEffect, useState } from 'react';
import {
  GitCompareArrows,
  Sparkles,
  ShieldCheck,
  Columns,
  FileDiff,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api';
import { CompareResponse, ContractSummary } from '../types';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastContext';

const BUILTIN_COMPARE_OPTIONS = [
  { id: 'kestrel_logistics_v1', title: 'Kestrel Global Fulfilment Agreement (v1.0 - Baseline)' },
  { id: 'kestrel_logistics_v2', title: 'Kestrel Global Fulfilment Agreement (v2.0 - Counterparty Redline)' },
  { id: 'veridian_msa_v2', title: 'Veridian Cloud Enterprise MSA (v2.4)' },
  { id: 'northstar_dpa_sla', title: 'NorthStar AI Data Processing & Enterprise SLA' },
];

export const ComparePage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [baseId, setBaseId] = useState('kestrel_logistics_v1');
  const [targetId, setTargetId] = useState('kestrel_logistics_v2');
  const [diffMode, setDiffMode] = useState<'inline' | 'side-by-side'>('inline');
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const cRes = await api.getContracts();
        setContracts(cRes.contracts);

        const cmp = await api.compareContracts({
          base_contract_id: 'kestrel_logistics_v1',
          target_contract_id: 'kestrel_logistics_v2',
        });
        setComparison(cmp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRunCompare = async () => {
    if (!baseId || !targetId) return;
    try {
      setLoading(true);
      const cmp = await api.compareContracts({
        base_contract_id: baseId,
        target_contract_id: targetId,
      });
      setComparison(cmp);
      showToast(
        'Redline Comparison Complete',
        `Analyzed ${cmp.summary_metrics.total_sections} sections and identified ${cmp.summary_metrics.critical_risk_shifts} risk shifts.`,
        'magenta'
      );
    } catch (e: any) {
      showToast('Comparison Failed', e?.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !comparison) {
    return <PageSkeleton title="Computing Deterministic Section & Word Redline Diffs..." />;
  }

  const allOptions = [
    ...BUILTIN_COMPARE_OPTIONS,
    ...contracts
      .filter((c) => !BUILTIN_COMPARE_OPTIONS.some((b) => b.title === c.title))
      .map((c) => ({ id: c.id, title: `${c.title} (${c.counterparty})` })),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-pink-600">
          Redline Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
          Contract Version Comparison &amp; Redline Diff
        </h1>
      </div>

      {/* Version Selector Bar */}
      <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-5 shadow-editorial flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#575B75] mb-1.5">
              Original Agreement (Version 1)
            </label>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
            >
              {allOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-pink-600 mb-1.5">
              New Draft (Version 2)
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#FAF8F3] border border-pink-500/40 text-[#20233A]"
            >
              {allOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex rounded-xl bg-[#FAF8F3] p-1 border border-pink-500/15">
            <button
              type="button"
              onClick={() => setDiffMode('inline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                diffMode === 'inline'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                  : 'text-[#575B75]'
              }`}
            >
              <FileDiff className="w-3.5 h-3.5" />
              <span>Inline Word Redline</span>
            </button>
            <button
              type="button"
              onClick={() => setDiffMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                diffMode === 'side-by-side'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                  : 'text-[#575B75]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRunCompare}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-magenta transition-all"
          >
            <GitCompareArrows className="w-4 h-4" />
            <span>Compare Versions</span>
          </button>
        </div>
      </div>

      {comparison && (
        <>
          <div className="backdrop-blur-md bg-white/85 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600">
                  <Sparkles className="w-4 h-4" />
                  <span>Deterministic Diff + AI-Grounded Risk Shift Analysis</span>
                </div>
                <h2 className="text-xl font-serif-editorial text-[#20233A]">
                  {comparison.base_title} <span className="text-[#888CA4] mx-1">vs.</span>{' '}
                  {comparison.target_title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-500/30">
                  {comparison.summary_metrics.critical_risk_shifts} High-Impact Risk Shifts
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F7F5] text-[#0F9D91]">
                  {Math.round(comparison.overall_similarity * 100)}% Lexical Similarity
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#575B75] leading-relaxed">
              {comparison.executive_comparison_summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-pink-500/10 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-50 border border-rose-500" />
                <span className="text-[#575B75]">Deleted from Baseline (Rose Strikethrough)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#E6F7F5] border border-[#0F9D91]" />
                <span className="text-[#575B75]">Inserted in Target Redline (Teal Highlight)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 ml-auto text-[#0F9D91] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>All Diffs Deterministically Anchored to Source Versions</span>
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {comparison.section_diffs.map((sec) => {
              const isCrit = sec.impact_level === 'Critical' || sec.impact_level === 'High';
              return (
                <div
                  key={sec.section_number}
                  className={`backdrop-blur-md bg-white/85 border rounded-2xl p-6 shadow-editorial space-y-4 ${
                    isCrit ? 'border-rose-500/40' : 'border-pink-500/15'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-500/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white">
                        Section {sec.section_number}
                      </span>
                      <h3 className="font-serif-editorial text-lg text-[#20233A]">
                        {sec.heading}
                      </h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-pink-50 border border-pink-500/20 text-pink-700">
                        {sec.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          sec.impact_level === 'Critical'
                            ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {sec.impact_level} Impact ({sec.change_type})
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F9D91] bg-[#E6F7F5] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Diff
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-500/25 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-[#20233A] leading-relaxed">
                      <span className="font-bold text-pink-700">
                        AI-Grounded Change Explanation:{' '}
                      </span>
                      {sec.ai_explanation}
                    </div>
                  </div>

                  {diffMode === 'inline' ? (
                    <div className="p-4 rounded-xl bg-[#FAF8F3] border border-pink-500/15 text-[13px] leading-[1.8] text-[#20233A] font-normal">
                      {sec.word_diff.map((tok, i) => {
                        if (tok.type === 'delete') {
                          return (
                            <del
                              key={i}
                              className="bg-rose-100/80 text-rose-700 line-through px-1 rounded mx-0.5 font-medium"
                            >
                              {tok.text}
                            </del>
                          );
                        }
                        if (tok.type === 'insert') {
                          return (
                            <ins
                              key={i}
                              className="bg-[#E6F7F5] text-[#0F9D91] no-underline border-b-2 border-[#0F9D91] px-1 rounded mx-0.5 font-semibold"
                            >
                              {tok.text}
                            </ins>
                          );
                        }
                        return <span key={i}>{tok.text}</span>;
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-500/25 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                          Baseline Text ({comparison.base_title})
                        </div>
                        <div className="text-xs text-[#20233A] leading-relaxed whitespace-pre-line">
                          {sec.base_excerpt || 'Section not present in baseline.'}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-[#E6F7F5]/35 border border-[#0F9D91]/25 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#0F9D91]">
                          Target Redline Text ({comparison.target_title})
                        </div>
                        <div className="text-xs text-[#20233A] leading-relaxed whitespace-pre-line">
                          {sec.target_excerpt || 'Section removed in target redline.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
