import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  ListChecks,
  Plus,
  User,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { api } from '../api';
import { ObligationItem, ContractSummary } from '../types';
import { VerificationBadge } from '../components/VerificationBadge';
import { PageSkeleton } from '../components/Skeleton';
import { SampleLoaderBanner } from '../components/SampleLoaderBanner';
import { useToast } from '../components/ToastContext';

export const ObligationsPage: React.FC = () => {
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    overdue: 0,
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newOb, setNewOb] = useState({
    contract_id: '',
    title: '',
    description: '',
    owner: 'Priya Nair (Procurement)',
    department: 'Procurement',
    due_date: '2026-11-30',
    recurrence: 'Quarterly',
    priority: 'High',
    evidence_quote: '',
  });

  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [obRes, cRes] = await Promise.all([
        api.getObligations({ status: statusFilter, department: deptFilter }),
        api.getContracts(),
      ]);
      setObligations(obRes.obligations);
      setSummary(obRes.summary);
      setContracts(cRes.contracts);
      if (cRes.contracts.length > 0 && !newOb.contract_id) {
        setNewOb((prev) => ({ ...prev, contract_id: cRes.contracts[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, deptFilter]);

  const handleStatusChange = async (obId: string, obTitle: string, nextStatus: string) => {
    try {
      await api.updateObligation(obId, { status: nextStatus });
      showToast(
        `Obligation Marked "${nextStatus}"`,
        `${obTitle} status updated.`,
        nextStatus === 'Completed' ? 'teal' : 'magenta'
      );
      loadData();
    } catch (e: any) {
      showToast('Failed to update obligation', e?.message, 'warning');
    }
  };

  const handleCreateObligation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOb.contract_id || !newOb.title) return;
    try {
      await api.createObligation(newOb);
      setShowModal(false);
      showToast(
        'Tracked Obligation Created & Verified',
        `Added "${newOb.title}" with source verification.`,
        'magenta'
      );
      setNewOb((prev) => ({ ...prev, title: '', description: '', evidence_quote: '' }));
      loadData();
    } catch (err: any) {
      showToast('Failed to create obligation', err?.message, 'warning');
    }
  };

  if (loading && obligations.length === 0 && summary.total === 0) {
    return <PageSkeleton title="Loading Obligations Manager & Compliance Timeline..." />;
  }

  const groupedByMonth: Record<string, ObligationItem[]> = {};
  obligations.forEach((ob) => {
    const monthKey = ob.due_date.slice(0, 7);
    if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
    groupedByMonth[monthKey].push(ob);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-pink-600">
          Obligations &amp; Deadlines
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
          Tasks &amp; Deadlines Tracker
        </h1>
      </div>

      {/* Zero-State & Instant Fixture Loader */}
      <SampleLoaderBanner
        isEmpty={summary.total === 0}
        onLoaded={loadData}
        contextLabel="your Tasks & Deadlines Tracker"
      />

      {/* Top Status KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="backdrop-blur-md bg-white/80 border border-pink-500/15 rounded-2xl p-4 shadow-editorial">
          <div className="text-xs font-bold text-[#575B75]">Total Tracked</div>
          <div className="text-2xl font-serif-editorial text-[#20233A] mt-1">{summary.total}</div>
        </div>
        <div className="backdrop-blur-md bg-white/80 border border-[#0F9D91]/30 rounded-2xl p-4 shadow-editorial">
          <div className="text-xs font-bold text-[#0F9D91]">Completed (Teal)</div>
          <div className="text-2xl font-serif-editorial text-[#0F9D91] mt-1">
            {summary.completed}
          </div>
        </div>
        <div className="backdrop-blur-md bg-white/80 border border-pink-500/30 rounded-2xl p-4 shadow-editorial">
          <div className="text-xs font-bold text-pink-600">In Progress</div>
          <div className="text-2xl font-serif-editorial text-pink-600 mt-1">
            {summary.in_progress}
          </div>
        </div>
        <div className="backdrop-blur-md bg-white/80 border border-pink-500/15 rounded-2xl p-4 shadow-editorial">
          <div className="text-xs font-bold text-[#575B75]">Pending Action</div>
          <div className="text-2xl font-serif-editorial text-[#20233A] mt-1">{summary.pending}</div>
        </div>
        <div className="backdrop-blur-md bg-white/80 border border-rose-500/40 rounded-2xl p-4 shadow-editorial">
          <div className="text-xs font-bold text-rose-600">Overdue Alerts</div>
          <div className="text-2xl font-serif-editorial text-rose-600 mt-1">{summary.overdue}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="backdrop-blur-md bg-white/80 border border-pink-500/15 rounded-2xl p-4 shadow-editorial flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Pending', 'In Progress', 'Completed', 'Overdue'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? st === 'Completed'
                    ? 'bg-[#0F9D91] text-white'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                  : 'bg-[#FAF8F3] text-[#575B75] hover:text-[#20233A] border border-pink-500/15'
              }`}
            >
              {st}
            </button>
          ))}

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
          >
            <option value="All">All Departments</option>
            <option value="Procurement">Procurement</option>
            <option value="Security">Security &amp; Compliance</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-[#FAF8F3] p-1 border border-pink-500/15">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                  : 'text-[#575B75]'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                  : 'text-[#575B75]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
          </div>

          {contracts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta"
            >
              <Plus className="w-4 h-4" />
              <span>New Obligation</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode 1: Interactive Obligations Manager List */}
      {viewMode === 'board' ? (
        <div className="space-y-4">
          {obligations.map((ob) => {
            const isCompleted = ob.status === 'Completed';
            const isOverdue = ob.status === 'Overdue';
            return (
              <div
                key={ob.id}
                className={`backdrop-blur-md bg-white/85 border rounded-2xl p-5 shadow-editorial transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isCompleted
                    ? 'border-[#0F9D91]/40 bg-[#E6F7F5]/25'
                    : isOverdue
                    ? 'border-rose-500/45'
                    : 'border-pink-500/15 hover:border-pink-600'
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-[#0F9D91] text-white'
                          : isOverdue
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                          : ob.status === 'In Progress'
                          ? 'bg-pink-50 text-pink-700 border border-pink-500/20'
                          : 'bg-[#FAF8F3] border border-[#E6E1D6] text-[#575B75]'
                      }`}
                    >
                      {ob.status}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-pink-50 border border-pink-500/20 text-pink-700">
                      {ob.department}
                    </span>
                    <span className="text-xs font-semibold text-[#575B75]">
                      {ob.contract_title}
                    </span>
                    <VerificationBadge
                      verification={ob.verification}
                      onLocate={() =>
                        navigate(`/contracts/${ob.contract_id}?tab=obligations&highlight=${ob.id}`)
                      }
                    />
                  </div>

                  <h3
                    className={`text-base sm:text-lg font-serif-editorial ${
                      isCompleted ? 'line-through text-[#575B75]' : 'text-[#20233A]'
                    }`}
                  >
                    {ob.title}
                  </h3>
                  <p className="text-xs text-[#575B75]">{ob.description}</p>

                  <blockquote className="p-2.5 rounded-lg bg-[#FAF8F3] border-l-3 border-pink-600 text-[11px] text-[#20233A] italic">
                    "{ob.evidence_quote}"
                  </blockquote>
                </div>

                <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-pink-500/10">
                  <div className="text-left lg:text-right space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#20233A]">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Due {ob.due_date}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FAF8F3] border border-[#E6E1D6] text-[#575B75]">
                        {ob.recurrence}
                      </span>
                    </div>
                    <div className="text-xs text-[#575B75] flex items-center lg:justify-end gap-1">
                      <User className="w-3 h-3" />
                      <span>{ob.owner}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={ob.status}
                      onChange={(e) => handleStatusChange(ob.id, ob.title, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        isCompleted
                          ? 'bg-[#E6F7F5] text-[#0F9D91] border-[#0F9D91]/30'
                          : 'bg-[#FAF8F3] text-[#20233A] border-pink-500/20'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed (#0F9D91)</option>
                      <option value="Overdue">Overdue</option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/contracts/${ob.contract_id}?tab=obligations&highlight=${ob.id}`)
                      }
                      className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-pink-50 text-pink-600 border border-pink-500/20"
                      title="Open in Contract Workspace"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedByMonth)
            .sort()
            .map((monthKey) => (
              <div
                key={monthKey}
                className="backdrop-blur-md bg-white/85 border border-pink-500/15 rounded-2xl p-6 shadow-editorial space-y-4"
              >
                <div className="flex items-center justify-between border-b border-pink-500/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-pink-600" />
                    <h3 className="font-serif-editorial text-lg text-[#20233A]">
                      Timeline Period: {monthKey}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-500/20 text-pink-700">
                    {groupedByMonth[monthKey].length} Scheduled Milestones
                  </span>
                </div>

                <div className="relative pl-6 border-l-2 border-pink-500/35 space-y-4">
                  {groupedByMonth[monthKey].map((ob) => {
                    const isCompleted = ob.status === 'Completed';
                    return (
                      <div
                        key={ob.id}
                        onClick={() =>
                          navigate(`/contracts/${ob.contract_id}?tab=obligations&highlight=${ob.id}`)
                        }
                        className="relative p-4 rounded-xl bg-[#FAF8F3] hover:bg-white border border-pink-500/15 hover:border-pink-600 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <span
                          className={`w-3 h-3 rounded-full absolute -left-[31px] top-5 ring-4 ring-white ${
                            isCompleted ? 'bg-[#0F9D91]' : 'bg-pink-600'
                          }`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-pink-600">
                              {ob.due_date}
                            </span>
                            <span className="text-xs font-bold text-[#20233A]">{ob.title}</span>
                          </div>
                          <div className="text-xs text-[#575B75]">
                            {ob.contract_title} • Assigned to {ob.owner} ({ob.department})
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <VerificationBadge verification={ob.verification} compact />
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-[#0F9D91] text-white'
                                : 'bg-white border border-[#E6E1D6] text-[#20233A]'
                            }`}
                          >
                            {ob.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Obligation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#20233A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-pink-500/25 rounded-2xl max-w-lg w-full p-6 shadow-editorial-lg space-y-4">
            <div className="flex items-center justify-between border-b border-pink-500/15 pb-3">
              <h3 className="font-serif-editorial text-lg text-[#20233A]">
                Add Tracked Contractual Obligation
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-[#FAF8F3] text-[#575B75]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateObligation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#20233A] mb-1">Source Contract</label>
                <select
                  value={newOb.contract_id}
                  onChange={(e) => setNewOb({ ...newOb, contract_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#20233A] mb-1">Obligation Title</label>
                <input
                  type="text"
                  required
                  value={newOb.title}
                  onChange={(e) => setNewOb({ ...newOb, title: e.target.value })}
                  placeholder="e.g., Deliver 90-Day Non-Renewal Notice"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#20233A] mb-1">Owner</label>
                  <input
                    type="text"
                    required
                    value={newOb.owner}
                    onChange={(e) => setNewOb({ ...newOb, owner: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#20233A] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newOb.due_date}
                    onChange={(e) => setNewOb({ ...newOb, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#20233A] mb-1">
                  Source Evidence Excerpt (Verified against contract text)
                </label>
                <textarea
                  rows={3}
                  required
                  value={newOb.evidence_quote}
                  onChange={(e) => setNewOb({ ...newOb, evidence_quote: e.target.value })}
                  placeholder="Paste verbatim sentence from the contract to verify grounding..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] font-semibold text-[#575B75]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold shadow-magenta"
                >
                  Verify &amp; Save Obligation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
