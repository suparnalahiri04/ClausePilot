import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Building2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { api } from '../api';
import { ContractSummary } from '../types';
import { PageSkeleton } from '../components/Skeleton';
import { SampleLoaderBanner } from '../components/SampleLoaderBanner';

export const ContractsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('All');
  const [riskTier, setRiskTier] = useState('All');

  const navigate = useNavigate();

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.getContracts({
        q: query,
        category,
        risk_tier: riskTier,
      });
      setContracts(res.contracts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [category, riskTier]);

  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContracts();
  };

  if (loading && contracts.length === 0 && !query && category === 'All' && riskTier === 'All') {
    return <PageSkeleton title="Indexing Contract Library..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-pink-600">
            Document Library
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
            Saved Contracts Archive
          </h1>
        </div>
      </div>

      {/* Zero-State & Instant Fixture Loader */}
      <SampleLoaderBanner
        isEmpty={contracts.length === 0}
        onLoaded={fetchContracts}
        contextLabel="your Saved Contracts Archive"
      />

      {/* Filter & View Controls Bar */}
      <div className="backdrop-blur-md bg-white/80 border border-pink-500/15 rounded-2xl p-4 shadow-editorial flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#888CA4] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, partner company, or legal state"
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8F3] border border-pink-500/20 rounded-xl text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-sm transition-all"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#575B75]">
            <Filter className="w-3.5 h-3.5 text-pink-600" />
            <span>Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] font-medium focus:outline-none focus:border-pink-600"
            >
              <option value="All">All Categories</option>
              <option value="SaaS & Cloud Infrastructure">SaaS &amp; Cloud Infrastructure</option>
              <option value="AI & Data Processing">AI &amp; Data Processing</option>
              <option value="Procurement & Supply Chain">Procurement &amp; Supply Chain</option>
              <option value="Real Estate & Facilities">Real Estate &amp; Facilities</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#575B75]">
            <span>Risk Tier:</span>
            <select
              value={riskTier}
              onChange={(e) => setRiskTier(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] font-medium focus:outline-none focus:border-pink-600"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Risk (70+)</option>
              <option value="Medium">Medium Risk (45–69)</option>
              <option value="Low">Low Risk (&lt;45)</option>
            </select>
          </div>

          <div className="inline-flex rounded-xl bg-[#FAF8F3] p-1 border border-pink-500/15">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm font-bold'
                  : 'text-[#575B75]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm font-bold'
                  : 'text-[#575B75]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {contracts.length > 0 &&
        (viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {contracts.map((c) => {
              const isHighRisk = c.risk_score >= 70;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/contracts/${c.id}`)}
                  className="backdrop-blur-md bg-white/80 border border-pink-500/15 hover:border-pink-500/50 rounded-2xl p-6 shadow-editorial hover:shadow-editorial-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-500/20 text-pink-700">
                        {c.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isHighRisk
                            ? 'bg-rose-50 text-rose-600 border border-rose-500/25'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {isHighRisk && <AlertTriangle className="w-3 h-3" />}
                        Risk {c.risk_score}/100
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-serif-editorial text-[#20233A] group-hover:text-pink-600 transition-colors">
                        {c.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#575B75] mt-1">
                        <Building2 className="w-3.5 h-3.5 text-[#888CA4]" />
                        <span>{c.counterparty}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#575B75] line-clamp-3 leading-relaxed">
                      {c.executive_summary}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-pink-500/10">
                    <div className="grid grid-cols-3 gap-2 text-center bg-[#FAF8F3] p-2.5 rounded-xl border border-pink-500/10">
                      <div>
                        <div className="text-[10px] text-[#575B75]">Annual Spend</div>
                        <div className="text-xs font-mono font-bold text-[#20233A]">
                          ${(c.annual_value / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#575B75]">Risk Flags</div>
                        <div className="text-xs font-bold text-rose-600">{c.risk_count}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#575B75]">Obligations</div>
                        <div className="text-xs font-bold text-[#0F9D91]">{c.obligation_count}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F9D91]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{c.verification_audit.trust_grade} Verified Source</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-pink-600">
                        <span>Open Workspace</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="backdrop-blur-md bg-white/80 border border-pink-500/15 rounded-2xl p-6 shadow-editorial overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-pink-500/15 text-[11px] font-bold uppercase tracking-wider text-[#575B75]">
                  <th className="py-3 pr-4">Contract Title</th>
                  <th className="py-3 px-3">Counterparty</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Expiration &amp; Notice</th>
                  <th className="py-3 px-3">Annual Value</th>
                  <th className="py-3 px-3">Risk Score</th>
                  <th className="py-3 pl-3 text-right">Source Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F3] text-xs">
                {contracts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/contracts/${c.id}`)}
                    className="hover:bg-pink-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 pr-4 font-bold text-[#20233A]">{c.title}</td>
                    <td className="py-3.5 px-3 text-[#575B75]">{c.counterparty}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-500/20 text-[11px] font-semibold">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#575B75]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {c.expiration_date} ({c.notice_period_days}d notice)
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#20233A]">
                      ${c.annual_value.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          c.risk_score >= 70
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {c.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#0F9D91] font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        {c.verification_audit.trust_grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
};
