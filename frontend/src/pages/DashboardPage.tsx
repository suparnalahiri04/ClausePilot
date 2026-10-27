import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Calendar,
  Activity,
  GitCompareArrows,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { api } from '../api';
import { DashboardData } from '../types';
import { PageSkeleton } from '../components/Skeleton';
import { VerificationBadge } from '../components/VerificationBadge';
import { SampleLoaderBanner } from '../components/SampleLoaderBanner';
import { useToast } from '../components/ToastContext';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCompleteObligation = async (obId: string, obTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateObligation(obId, { status: 'Completed' });
      showToast('Obligation Marked Completed', `${obTitle} updated to Completed.`, 'teal');
      loadDashboard();
    } catch (err: any) {
      showToast('Failed to update obligation', err?.message, 'warning');
    }
  };

  if (loading || !data) {
    return <PageSkeleton title="Synthesizing Portfolio Intelligence & Verification Telemetry..." />;
  }

  const {
    metrics,
    risk_chart_data,
    upcoming_deadlines,
    recent_contracts,
    recent_activity,
  } = data;

  const isEmpty = metrics.active_contracts === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Dashboard Hero Banner with Custom /banner.png Container & Ombre Magenta Border Glow */}
      <div className="backdrop-blur-md bg-white/80 border border-pink-500/25 rounded-3xl p-5 sm:p-6 shadow-editorial-md grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-500/25 text-pink-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>Evidence-First Contract Intelligence Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-editorial text-[#20233A]">
            Portfolio Command &amp; Obligation Center
          </h1>
          <p className="text-xs sm:text-sm text-[#575B75] leading-relaxed">
            Monitoring{' '}
            <span className="font-bold text-[#20233A]">{metrics.active_contracts} active agreements</span>{' '}
            representing{' '}
            <span className="font-bold text-pink-600">
              ${metrics.total_annual_commitment.toLocaleString()}
            </span>{' '}
            in annual commitment. Every extracted clause, risk flag, and Q&amp;A citation is cross-verified at{' '}
            <span className="font-bold text-[#0F9D91]">
              {metrics.verification_rate_pct}% source grounding accuracy
            </span>
            .
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Upload &amp; Analyze Contract</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/compare')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] hover:text-pink-700 border border-pink-500/20 transition-all"
            >
              <GitCompareArrows className="w-4 h-4 text-pink-600" />
              <span>Compare Redlines</span>
            </button>
          </div>
        </div>

        {/* Dedicated Custom Banner Image Container loading /banner.png */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border-2 border-pink-500/35 banner-glow bg-white p-1.5">
            <div className="relative h-44 sm:h-48 rounded-xl overflow-hidden">
              <img
                src="/banner.png"
                alt="ClausePilot Portfolio Intelligence Banner"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#20233A]/75 via-transparent to-transparent flex items-end p-4">
                <div className="text-white space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-pink-300">
                    Deterministic Verification Layer
                  </div>
                  <div className="text-xs sm:text-sm font-serif-editorial">
                    100% Verbatim Character-Offset Grounding
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zero-State & Instant Fixture Loader Banner */}
      <SampleLoaderBanner
        isEmpty={isEmpty}
        onLoaded={loadDashboard}
        contextLabel="the Portfolio Dashboard"
      />

      {/* 4 Primary Portfolio KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/contracts')}
          className="backdrop-blur-md bg-white/75 border border-pink-500/15 hover:border-pink-500/50 rounded-2xl p-5 shadow-editorial hover:shadow-editorial-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#575B75]">
              Annual Portfolio Spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-serif-editorial text-[#20233A]">
              ${(metrics.total_annual_commitment / 1000).toFixed(0)}k
            </span>
            <span className="text-xs font-medium text-[#575B75]">
              across {metrics.active_contracts} contracts
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between text-xs text-pink-600 font-bold">
            <span>Explore Document Library</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/risks')}
          className="backdrop-blur-md bg-white/75 border border-pink-500/15 hover:border-rose-500/50 rounded-2xl p-5 shadow-editorial hover:shadow-editorial-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#575B75]">
              Active Risk Exposure
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl lg:text-3xl font-serif-editorial text-rose-600">
              {metrics.open_high_risks}
            </span>
            <span className="text-xs font-medium text-[#575B75]">
              Critical/High flags (Avg: {metrics.avg_risk_score}/100)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between text-xs text-rose-600 font-bold">
            <span>Open Risk Review Center</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/obligations')}
          className="backdrop-blur-md bg-white/75 border border-pink-500/15 hover:border-[#0F9D91]/50 rounded-2xl p-5 shadow-editorial hover:shadow-editorial-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#575B75]">
              Obligation Execution
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E6F7F5] text-[#0F9D91] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl lg:text-3xl font-serif-editorial text-[#0F9D91]">
              {metrics.completed_obligations}/{metrics.total_obligations}
            </span>
            <span className="text-xs font-medium text-[#575B75]">
              completed ({metrics.overdue_obligations} overdue)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between text-xs text-[#0F9D91] font-bold">
            <span>Manage Deadlines &amp; Owners</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/reports')}
          className="backdrop-blur-md bg-white/75 border border-pink-500/15 hover:border-pink-500/50 rounded-2xl p-5 shadow-editorial hover:shadow-editorial-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#575B75]">
              Evidence Grounding Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-serif-editorial text-[#20233A]">
              {metrics.verification_rate_pct}%
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#0F9D91]">
              Grade A+
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-pink-500/10 flex items-center justify-between text-xs text-pink-600 font-bold">
            <span>View Verification Audit Report</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {!isEmpty && (
        <>
          {/* Analytics Row: Risk Breakdown & Upcoming Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 backdrop-blur-md bg-white/75 border border-pink-500/15 rounded-2xl p-6 shadow-editorial flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-serif-editorial text-lg text-[#20233A]">
                    Risk Flags by Contractual Category
                  </h3>
                  <span className="text-[11px] font-bold text-pink-700 bg-pink-50 border border-pink-500/20 px-2.5 py-0.5 rounded-full">
                    Evidence-Backed
                  </span>
                </div>
                <p className="text-xs text-[#575B75] mb-4">
                  Click any bar or visit Risk Review to inspect verbatim source excerpts
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={risk_chart_data}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3EFE6" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#575B75' }} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={105}
                      tick={{ fontSize: 12, fill: '#20233A', fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#FAF8F3' }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#F472B6',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 8, 8, 0]}
                      barSize={24}
                      onClick={(entry) => {
                        if (entry?.key) navigate(`/risks?category=${entry.key}`);
                      }}
                      className="cursor-pointer"
                    >
                      {risk_chart_data.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-pink-500/15 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {risk_chart_data.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(`/risks?category=${item.key}`)}
                    className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-pink-50/70 text-left transition-colors border border-pink-500/10"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-medium text-[#575B75] truncate">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#20233A] mt-0.5">{item.count} flags</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 backdrop-blur-md bg-white/75 border border-pink-500/15 rounded-2xl p-6 shadow-editorial flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif-editorial text-lg text-[#20233A] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-pink-600" />
                      <span>Upcoming Deadlines &amp; Renewal Notice Timeline</span>
                    </h3>
                    <p className="text-xs text-[#575B75]">
                      Operational deliverables and non-renewal election windows anchored to contract clauses
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/obligations')}
                    className="text-xs font-bold text-pink-600 hover:underline shrink-0"
                  >
                    View All ({metrics.total_obligations}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {upcoming_deadlines.map((ob) => {
                    const isOverdue = ob.status === 'Overdue';
                    return (
                      <div
                        key={ob.id}
                        onClick={() =>
                          navigate(`/contracts/${ob.contract_id}?tab=obligations&highlight=${ob.id}`)
                        }
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isOverdue
                            ? 'bg-rose-50/70 border-rose-500/40 hover:border-rose-600'
                            : 'bg-[#FAF8F3]/80 border-pink-500/15 hover:border-pink-500/50 hover:bg-white'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isOverdue
                                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                                  : ob.status === 'In Progress'
                                  ? 'bg-pink-50 text-pink-700 border border-pink-500/20'
                                  : 'bg-white border border-[#E6E1D6] text-[#575B75]'
                              }`}
                            >
                              {ob.status}
                            </span>
                            <span className="text-xs font-bold text-[#20233A] truncate">
                              {ob.title}
                            </span>
                            <VerificationBadge verification={ob.verification} compact />
                          </div>
                          <div className="text-xs text-[#575B75] truncate">
                            <span className="font-semibold text-[#20233A]">{ob.contract_title}</span> •{' '}
                            Owner: {ob.owner} ({ob.department})
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#20233A]">
                              <Clock className="w-3 h-3 text-rose-600" />
                              <span>{ob.due_date}</span>
                            </div>
                            <div className="text-[10px] text-[#575B75]">{ob.recurrence}</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleCompleteObligation(ob.id, ob.title, e)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#E6F7F5] hover:bg-[#0F9D91] text-[#0F9D91] hover:text-white border border-[#0F9D91]/25 transition-colors"
                          >
                            Complete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Active Contract Intelligence Table & Recent Verification Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 backdrop-blur-md bg-white/75 border border-pink-500/15 rounded-2xl p-6 shadow-editorial">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif-editorial text-lg text-[#20233A]">
                    Active Contract Portfolio
                  </h3>
                  <p className="text-xs text-[#575B75]">
                    Select any agreement to open the Three-Column Document Intelligence Workspace
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/contracts')}
                  className="text-xs font-bold text-pink-600 hover:underline"
                >
                  Open Full Library →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-pink-500/15 text-[11px] font-bold uppercase tracking-wider text-[#575B75]">
                      <th className="py-3 pr-4">Agreement &amp; Counterparty</th>
                      <th className="py-3 px-3">Annual Value</th>
                      <th className="py-3 px-3">Renewal Notice</th>
                      <th className="py-3 px-3">Risk Index</th>
                      <th className="py-3 pl-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF8F3] text-xs">
                    {recent_contracts.map((c) => {
                      const highRisk = c.risk_score >= 70;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          className="hover:bg-pink-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 pr-4">
                            <div className="font-bold text-[#20233A] group-hover:text-pink-600 transition-colors">
                              {c.title}
                            </div>
                            <div className="text-[11px] text-[#575B75]">
                              {c.counterparty} • {c.category}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-semibold text-[#20233A]">
                            ${c.annual_value.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E6E1D6] text-[#20233A] font-medium">
                              {c.renewal_type} ({c.notice_period_days}d)
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                                highRisk
                                  ? 'bg-rose-50 text-rose-600 border border-rose-500/25'
                                  : 'bg-pink-50 text-pink-700'
                              }`}
                            >
                              {highRisk && <AlertTriangle className="w-3 h-3" />}
                              {c.risk_score}/100
                            </span>
                          </td>
                          <td className="py-3.5 pl-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#0F9D91] font-semibold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              {c.verification_audit.trust_grade} (
                              {Math.round(c.verification_audit.overall_grounding_score * 100)}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 backdrop-blur-md bg-white/75 border border-pink-500/15 rounded-2xl p-6 shadow-editorial">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-pink-600" />
                <h3 className="font-serif-editorial text-lg text-[#20233A]">
                  Recent Intelligence Activity
                </h3>
              </div>

              <div className="space-y-3.5">
                {recent_activity.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => act.contract_id && navigate(`/contracts/${act.contract_id}`)}
                    className={`p-3 rounded-xl bg-[#FAF8F3] border border-pink-500/15 space-y-1 ${
                      act.contract_id
                        ? 'cursor-pointer hover:border-pink-500/50 transition-colors'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">
                        {act.event_type}
                      </span>
                      <span className="text-[10px] text-[#888CA4] font-mono">
                        {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#20233A]">{act.title}</div>
                    <p className="text-[11px] text-[#575B75] leading-relaxed">{act.detail}</p>
                    <div className="text-[10px] font-medium text-[#888CA4]">By {act.actor}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
