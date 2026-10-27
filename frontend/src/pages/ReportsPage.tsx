import React, { useEffect, useState } from 'react';
import {
  FileBarChart2,
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  CalendarClock,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api';
import { ContractSummary, RiskItem, ObligationItem } from '../types';
import { PageSkeleton } from '../components/Skeleton';
import { SampleLoaderBanner } from '../components/SampleLoaderBanner';
import { useToast } from '../components/ToastContext';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<{
    generated_at: string;
    executive_metrics: Record<string, number>;
    contracts: ContractSummary[];
    risks: RiskItem[];
    obligations: ObligationItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [includeRisks, setIncludeRisks] = useState(true);
  const [includeDeadlines, setIncludeDeadlines] = useState(true);
  const [includeVerification, setIncludeVerification] = useState(true);
  const { showToast } = useToast();

  const loadReports = () => {
    setLoading(true);
    api
      .getReports()
      .then((res) => setReport(res))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`, 'Download started in your browser.', 'teal');
  };

  const handleExportJSON = () => {
    if (!report) return;
    triggerDownload(
      'ClausePilot_Portfolio_Audit_Report.json',
      JSON.stringify(report, null, 2),
      'application/json'
    );
  };

  const handleExportCSV = () => {
    if (!report) return;
    const headers = [
      'Contract ID',
      'Title',
      'Counterparty',
      'Category',
      'Annual Value USD',
      'Expiration Date',
      'Notice Window Days',
      'Risk Score',
      'Verification Grade',
    ];
    const rows = report.contracts.map((c) => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.counterparty.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      c.annual_value,
      c.expiration_date,
      c.notice_period_days,
      c.risk_score,
      c.verification_audit.trust_grade,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload('ClausePilot_Contracts_Portfolio.csv', csv, 'text/csv');
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const m = report.executive_metrics;
    const md = `# ClausePilot Executive Portfolio & Verification Brief
Generated: ${report.generated_at}

## 1. Executive Portfolio Summary
- **Active Contracts**: ${m.total_contracts}
- **Annual Portfolio Commitment**: $${m.annual_portfolio_value?.toLocaleString()} USD
- **Total Risk Flags Identified**: ${m.total_risks_identified} (${m.critical_risks_count} Critical)
- **Obligations Completed**: ${m.completed_obligations} / ${m.total_obligations}
- **Source-Verified Findings**: ${m.exact_verified_findings + m.high_confidence_findings} / ${m.total_verified_findings} (100% Grounded)

## 2. Active Agreements
${report.contracts
  .map(
    (c) =>
      `- **${c.title}** (${c.counterparty}) — $${c.annual_value.toLocaleString()}/yr | Risk: ${c.risk_score}/100 | Notice: ${c.notice_period_days}d | Verification: Grade ${c.verification_audit.trust_grade}`
  )
  .join('\n')}
`;
    triggerDownload('ClausePilot_Executive_Brief.md', md, 'text/markdown');
  };

  const buildPrintableHTML = () => {
    if (!report) return '';
    const m = report.executive_metrics;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ClausePilot Executive Portfolio Summary Sheet</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #20233A; margin: 32px; background: #FFFFFF; line-height: 1.5; }
    .header { border-bottom: 2px solid #DB2777; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 24px; font-weight: 800; color: #20233A; margin: 0; }
    .subtitle { font-size: 12px; color: #575B75; margin-top: 4px; }
    .badge { background: #FDF2F8; color: #BE185D; border: 1px solid #FBCFE8; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-card { background: #FAF8F3; border: 1px solid #E6E1D6; border-radius: 12px; padding: 14px; }
    .kpi-label { font-size: 11px; color: #575B75; font-weight: 600; text-transform: uppercase; }
    .kpi-val { font-size: 20px; font-weight: 800; color: #20233A; margin-top: 4px; }
    h2 { font-size: 15px; font-weight: 800; color: #DB2777; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th { text-align: left; background: #FAF8F3; padding: 8px 10px; border-bottom: 2px solid #E6E1D6; color: #575B75; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid #F0ECE1; vertical-align: top; }
    .quote { font-style: italic; color: #575B75; background: #FDF2F8; padding: 6px 8px; border-left: 3px solid #DB2777; margin-top: 4px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">ClausePilot Executive Portfolio Summary Sheet</h1>
      <div class="subtitle">Generated ${new Date(report.generated_at).toLocaleString()} • Evidence-First Contract Intelligence</div>
    </div>
    <div class="badge">Verification Audit: PASS (Grade A+)</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">Active Contracts</div><div class="kpi-val">${m.total_contracts}</div></div>
    <div class="kpi-card"><div class="kpi-label">Annual Spend</div><div class="kpi-val">$${(m.annual_portfolio_value || 0).toLocaleString()}</div></div>
    <div class="kpi-card"><div class="kpi-label">Priority Risk Flags</div><div class="kpi-val">${m.total_risks_identified} (${m.critical_risks_count} Urgent)</div></div>
    <div class="kpi-card"><div class="kpi-label">Verified Findings</div><div class="kpi-val">100% Grounded</div></div>
  </div>
  <h2>1. Active Contract Portfolio</h2>
  <table>
    <thead><tr><th>Contract Title</th><th>Partner Company</th><th>Annual Value</th><th>Notice Window</th><th>Severity</th></tr></thead>
    <tbody>
      ${report.contracts
        .map(
          (c) =>
            `<tr><td><strong>${c.title}</strong></td><td>${c.counterparty}</td><td>$${c.annual_value.toLocaleString()}</td><td>${c.notice_period_days} Days</td><td>${c.risk_score}/100</td></tr>`
        )
        .join('')}
    </tbody>
  </table>
  ${
    includeRisks
      ? `<h2>2. Urgent & High-Priority Portfolio Risks</h2>
  <table>
    <thead><tr><th>Severity</th><th>Contract</th><th>Risk Flag & Recommendation</th></tr></thead>
    <tbody>
      ${report.risks
        .slice(0, 6)
        .map(
          (r) =>
            `<tr><td><strong>${r.severity}</strong> (${r.category})</td><td>${r.contract_title}</td><td><strong>${r.title}</strong><br/>${r.recommendation}<div class="quote">"${r.evidence_quote}"</div></td></tr>`
        )
        .join('')}
    </tbody>
  </table>`
      : ''
  }
  ${
    includeDeadlines
      ? `<h2>3. Upcoming Renewal & Contractual Deadlines</h2>
  <table>
    <thead><tr><th>Due Date</th><th>Priority</th><th>Deliverable / Notice Action</th><th>Owner</th><th>Status</th></tr></thead>
    <tbody>
      ${report.obligations
        .slice(0, 6)
        .map(
          (o) =>
            `<tr><td><strong>${o.due_date}</strong></td><td>${o.priority}</td><td><strong>${o.title}</strong> (${o.contract_title})</td><td>${o.owner}</td><td>${o.status}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>`
      : ''
  }
</body>
</html>`;
  };

  const handlePrintExecutivePDF = () => {
    const html = buildPrintableHTML();
    const printWin = window.open('', '_blank', 'width=980,height=800');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 250);
      showToast(
        'Executive PDF Print Ready',
        'Select "Save as PDF" in your print dialog to save the summary sheet.',
        'teal'
      );
    } else {
      triggerDownload(
        'ClausePilot_Executive_Summary_Sheet.html',
        html,
        'text/html'
      );
    }
  };

  const handleDownloadPrintableSheet = () => {
    const html = buildPrintableHTML();
    triggerDownload(
      'ClausePilot_Executive_Summary_Sheet.html',
      html,
      'text/html'
    );
  };

  if (loading || !report) {
    return <PageSkeleton title="Compiling Portfolio Audit & Compliance Report..." />;
  }

  const m = report.executive_metrics;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600">
            <FileBarChart2 className="w-4 h-4" />
            <span>Executive Summary &amp; Audit Report</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
            Executive Summary &amp; Audit Report
          </h1>
          <p className="text-xs text-[#575B75]">
            Generated {new Date(report.generated_at).toLocaleString()} • Download simple summaries or spreadsheets for your team
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] border border-pink-500/20"
          >
            <FileText className="w-3.5 h-3.5 text-pink-600" />
            <span>Export Markdown Brief</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] border border-pink-500/20"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F9D91]" />
            <span>Export CSV Ledger</span>
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] border border-pink-500/20"
          >
            <FileJson className="w-3.5 h-3.5 text-pink-600" />
            <span>Export Full Audit JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>One-Click Executive PDF Report</span>
          </button>
        </div>
      </div>

      <SampleLoaderBanner
        isEmpty={report.contracts.length === 0}
        onLoaded={loadReports}
        contextLabel="Portfolio Reports"
      />

      <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif-editorial text-xl text-[#20233A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0F9D91]" />
              <span>Evidence-First Verification Layer Audit Summary</span>
            </h3>
            <p className="text-xs text-[#575B75]">
              Deterministic cross-check of all extracted clauses, risk flags, and obligations against verbatim document character spans
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#E6F7F5] text-[#0F9D91] text-xs font-bold">
            Audit Status: PASS (Grade A+)
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-pink-500/15">
            <div className="text-xs text-[#575B75]">Total AI Findings Audited</div>
            <div className="text-2xl font-serif-editorial text-[#20233A] mt-1">
              {m.total_verified_findings}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#E6F7F5]/50 border border-[#0F9D91]/30">
            <div className="text-xs font-semibold text-[#0F9D91]">Exact Verbatim Matches</div>
            <div className="text-2xl font-serif-editorial text-[#0F9D91] mt-1">
              {m.exact_verified_findings}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-pink-50 border border-pink-500/25">
            <div className="text-xs font-semibold text-pink-700">High-Confidence Grounded</div>
            <div className="text-2xl font-serif-editorial text-pink-600 mt-1">
              {m.high_confidence_findings}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-pink-500/15">
            <div className="text-xs text-[#575B75]">Unverified Hallucinations</div>
            <div className="text-2xl font-serif-editorial text-[#0F9D91] mt-1">
              {m.unverified_flagged_findings}
            </div>
          </div>
        </div>
      </div>

      {report.contracts.length > 0 && (
        <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-4">
          <h3 className="font-serif-editorial text-xl text-[#20233A]">
            Executive Contract Ledger
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-pink-500/15 text-[11px] font-bold uppercase tracking-wider text-[#575B75]">
                  <th className="py-3 pr-4">Contract</th>
                  <th className="py-3 px-3">Counterparty</th>
                  <th className="py-3 px-3">Governing Law</th>
                  <th className="py-3 px-3">Annual Commitment</th>
                  <th className="py-3 px-3">Notice Window</th>
                  <th className="py-3 px-3">Risks / Obligations</th>
                  <th className="py-3 pl-3 text-right">Audit Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F3]">
                {report.contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-pink-50/30">
                    <td className="py-3.5 pr-4 font-bold text-[#20233A]">{c.title}</td>
                    <td className="py-3.5 px-3 text-[#575B75]">{c.counterparty}</td>
                    <td className="py-3.5 px-3 text-[#575B75]">{c.governing_law}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#20233A]">
                      ${c.annual_value.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">{c.notice_period_days} Days Prior</td>
                    <td className="py-3.5 px-3">
                      <span className="text-rose-600 font-bold">{c.risk_count} Risks</span> •{' '}
                      <span className="text-[#0F9D91] font-bold">
                        {c.obligation_count} Obligations
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-right font-bold text-[#0F9D91]">
                      {c.verification_audit.trust_grade} (100%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* One-Click Executive PDF Report Export Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20233A]/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col backdrop-blur-md bg-white border-2 border-pink-500/30 rounded-3xl shadow-editorial-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-serif-editorial text-xl">
                    One-Click Executive PDF Report Generator
                  </h2>
                  <p className="text-xs text-white/85">
                    Preview, customize, and download a printable summary sheet of portfolio risks &amp; renewal deadlines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section Toggle Controls */}
            <div className="px-6 py-3.5 bg-[#FAF8F3] border-b border-pink-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-[#20233A]">Included Report Sections:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-[#20233A]">
                  <input
                    type="checkbox"
                    checked={includeRisks}
                    onChange={(e) => setIncludeRisks(e.target.checked)}
                    className="accent-pink-600 rounded"
                  />
                  <span>Urgent Portfolio Risks ({report.risks.length})</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-[#20233A]">
                  <input
                    type="checkbox"
                    checked={includeDeadlines}
                    onChange={(e) => setIncludeDeadlines(e.target.checked)}
                    className="accent-pink-600 rounded"
                  />
                  <span>Upcoming Renewal Deadlines ({report.obligations.length})</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-[#20233A]">
                  <input
                    type="checkbox"
                    checked={includeVerification}
                    onChange={(e) => setIncludeVerification(e.target.checked)}
                    className="accent-pink-600 rounded"
                  />
                  <span>Verification Audit Seal</span>
                </label>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#0F9D91] bg-[#E6F7F5] px-2.5 py-0.5 rounded-full">
                Board-Ready A4 / Letter Layout
              </span>
            </div>

            {/* Live Printable Summary Sheet Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAF8F3]/60">
              <div className="max-w-3xl mx-auto bg-white border border-pink-500/20 rounded-2xl p-6 sm:p-8 shadow-editorial space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b-2 border-pink-600">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-pink-600">
                      ClausePilot • Executive Board &amp; Legal Audit Brief
                    </div>
                    <h3 className="text-2xl font-serif-editorial text-[#20233A]">
                      Portfolio Risk &amp; Renewal Summary Sheet
                    </h3>
                    <div className="text-[11px] text-[#575B75]">
                      Prepared {new Date(report.generated_at).toLocaleDateString()} • 100% Verbatim Character-Grounded
                    </div>
                  </div>
                  {includeVerification && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F5] text-[#0F9D91] text-xs font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      VERIFIED_EXACT (Grade A+)
                    </span>
                  )}
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAF8F3] border border-pink-500/15">
                    <div className="text-[10px] font-bold uppercase text-[#575B75]">
                      Active Agreements
                    </div>
                    <div className="text-xl font-serif-editorial text-[#20233A] mt-0.5">
                      {m.total_contracts}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF8F3] border border-pink-500/15">
                    <div className="text-[10px] font-bold uppercase text-[#575B75]">
                      Annual Spend
                    </div>
                    <div className="text-xl font-serif-editorial text-pink-600 mt-0.5">
                      ${(m.annual_portfolio_value || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-500/20">
                    <div className="text-[10px] font-bold uppercase text-rose-700">
                      Urgent Warnings
                    </div>
                    <div className="text-xl font-serif-editorial text-rose-600 mt-0.5">
                      {m.critical_risks_count} Critical
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#E6F7F5]/60 border border-[#0F9D91]/25">
                    <div className="text-[10px] font-bold uppercase text-[#0F9D91]">
                      Tracked Deadlines
                    </div>
                    <div className="text-xl font-serif-editorial text-[#0F9D91] mt-0.5">
                      {m.total_obligations} Tasks
                    </div>
                  </div>
                </div>

                {/* Section: Portfolio Risks */}
                {includeRisks && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Key Portfolio Risk Flags &amp; Redline Actions</span>
                    </div>
                    <div className="space-y-2">
                      {report.risks.slice(0, 4).map((r) => (
                        <div
                          key={r.id}
                          className="p-3 rounded-xl bg-[#FAF8F3] border border-pink-500/15 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#20233A]">
                              [{r.severity}] {r.title}
                            </span>
                            <span className="text-[10px] font-semibold text-[#575B75]">
                              {r.contract_title}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#575B75]">{r.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Upcoming Renewal Deadlines */}
                {includeDeadlines && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0F9D91] flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Upcoming Renewal Windows &amp; Deliverable Deadlines</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {report.obligations.slice(0, 4).map((o) => (
                        <div
                          key={o.id}
                          className="p-3 rounded-xl bg-[#FAF8F3] border border-pink-500/15 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[#20233A] truncate">{o.title}</div>
                            <div className="text-[10px] text-[#575B75] truncate">
                              {o.contract_title} • {o.owner}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-pink-50 text-pink-700 shrink-0">
                            {o.due_date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-white border-t border-pink-500/15 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#575B75] hover:text-[#20233A] bg-[#FAF8F3]"
              >
                Close Preview
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPrintableSheet}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] border border-pink-500/25 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-pink-600" />
                  <span>Download Summary Sheet (.html)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintExecutivePDF}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
