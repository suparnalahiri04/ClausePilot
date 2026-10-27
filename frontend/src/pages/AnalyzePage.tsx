import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileUp,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Building2,
  Scale,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api';
import { SampleContractInfo, ContractDetail } from '../types';
import { useToast } from '../components/ToastContext';

const PIPELINE_STAGES = [
  {
    id: 1,
    title: 'Reading Text & Layout',
    desc: 'Reading paragraphs, headings, and sections from your PDF or Word file',
  },
  {
    id: 2,
    title: 'Finding Key Clauses',
    desc: 'Identifying partner names, contract value, dates, and main terms',
  },
  {
    id: 3,
    title: 'Checking Risks',
    desc: 'Scanning for cancellation rules, auto-renewals, liability limits, and payment terms',
  },
  {
    id: 4,
    title: 'Tracking Deadlines',
    desc: 'Listing upcoming tasks, renewal notice dates, and team owners',
  },
  {
    id: 5,
    title: 'Fact-Checking Text',
    desc: 'Matching every finding directly to the exact words in your document',
  },
];

export const AnalyzePage: React.FC = () => {
  const [samples, setSamples] = useState<SampleContractInfo[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [analyzedResult, setAnalyzedResult] = useState<ContractDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    api
      .getSamples()
      .then((res) => setSamples(res.samples))
      .catch((e) => console.error(e));
  }, []);

  const runStageAnimation = async () => {
    for (let i = 1; i <= PIPELINE_STAGES.length; i++) {
      setActiveStage(i);
      await new Promise((r) => setTimeout(r, 260));
    }
  };

  const handleFileUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile) return;

    try {
      setErrorMsg(null);
      setIsAnalyzing(true);
      setAnalyzedResult(null);
      const animPromise = runStageAnimation();
      const uploadPromise = api.uploadContract(selectedFile, customTitle || undefined);
      const [, result] = await Promise.all([animPromise, uploadPromise]);
      setAnalyzedResult(result);
      showToast(
        `Analyzed & Verified: ${result.title}`,
        `Extracted ${result.clauses.length} clauses, ${result.risks.length} risks, and ${result.obligations.length} obligations.`,
        'magenta'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to analyze uploaded contract.');
      showToast('Contract Ingestion Failed', err?.message, 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSampleLoad = async (sampleKey: string) => {
    try {
      setErrorMsg(null);
      setIsAnalyzing(true);
      setAnalyzedResult(null);
      const animPromise = runStageAnimation();
      const loadPromise = api.loadSampleContract(sampleKey);
      const [, result] = await Promise.all([animPromise, loadPromise]);
      setAnalyzedResult(result);
      showToast(
        `Sample Contract Verified: ${result.title}`,
        'All clauses, risk flags, and obligations verified against source text.',
        'magenta'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load sample contract.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setSelectedFile(f);
      if (!customTitle) {
        setCustomTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drag-and-Drop PDF/DOCX Upload Zone */}
        <div className="lg:col-span-7 backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial flex flex-col justify-between space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-500/20 text-xs font-bold mb-2">
              <FileUp className="w-3.5 h-3.5 text-pink-600" />
              <span>Upload PDF or Word Documents</span>
            </div>
            <h1 className="text-2xl font-serif-editorial text-[#20233A]">
              Upload PDF or Word Documents
            </h1>
            <p className="text-xs text-[#575B75] mt-1">
              Drop any contract file below. ClausePilot reads the text, finds key clauses, checks for risks and deadlines, and fact-checks every detail against the original wording.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-pink-600 bg-pink-50/60'
                : selectedFile
                ? 'border-[#0F9D91] bg-[#E6F7F5]/30'
                : 'border-pink-500/25 bg-[#FAF8F3]/70 hover:border-pink-600 hover:bg-[#FAF8F3]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const f = e.target.files[0];
                  setSelectedFile(f);
                  if (!customTitle) {
                    setCustomTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
                  }
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-magenta mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#20233A]">{selectedFile.name}</div>
                <div className="text-xs text-[#0F9D91] font-semibold">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for AI + Verification Pipeline
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#20233A]">
                  Drag &amp; drop your PDF or DOCX contract here, or{' '}
                  <span className="text-pink-600 underline">browse files</span>
                </div>
                <div className="text-xs text-[#575B75]">
                  Supports native `.pdf` (via PyMuPDF), `.docx` (via python-docx), and `.txt` agreements
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#20233A] mb-1">
                Agreement Title (Optional Override)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Apex Cloud Enterprise MSA (2026)"
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F3] border border-pink-500/20 rounded-xl text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-500/40 text-xs text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedFile || isAnalyzing}
              onClick={() => handleFileUpload()}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white shadow-magenta flex items-center justify-center gap-2 transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running 5-Stage Intelligence &amp; Verification Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze &amp; Verify Uploaded Agreement</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: 5-Stage Analysis & Verification Pipeline Progress */}
        <div className="lg:col-span-5 backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600">
                <ShieldCheck className="w-4 h-4" />
                <span>Evidence-First Analysis Stages</span>
              </span>
              <span className="text-[11px] font-mono text-[#575B75]">
                {analyzedResult ? '5/5 Complete' : isAnalyzing ? `Stage ${activeStage}/5` : 'Standby'}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {PIPELINE_STAGES.map((stage) => {
                const isDone =
                  analyzedResult !== null ||
                  (!isAnalyzing && activeStage > stage.id) ||
                  (isAnalyzing && activeStage > stage.id);
                const isCurrent = isAnalyzing && activeStage === stage.id;
                return (
                  <div
                    key={stage.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isCurrent
                        ? 'bg-pink-50 border-pink-600'
                        : isDone
                        ? 'bg-[#E6F7F5]/40 border-[#0F9D91]/30'
                        : 'bg-[#FAF8F3] border-pink-500/15'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCurrent ? (
                        <Loader2 className="w-4 h-4 text-pink-600 animate-spin" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0F9D91]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[#888CA4] text-[10px] font-bold flex items-center justify-center text-[#575B75]">
                          {stage.id}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#20233A]">{stage.title}</div>
                      <div className="text-[11px] text-[#575B75] mt-0.5">{stage.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {analyzedResult && (
            <div className="mt-5 p-4 rounded-xl bg-[#E6F7F5] border border-[#0F9D91]/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F9D91] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Verification Audit Passed ({analyzedResult.verification_audit.trust_grade})
                </span>
                <span className="text-[11px] font-mono font-bold text-[#20233A]">
                  {Math.round(analyzedResult.verification_audit.overall_grounding_score * 100)}% Grounded
                </span>
              </div>
              <div className="text-xs text-[#20233A] font-semibold">
                {analyzedResult.title} — {analyzedResult.clauses.length} Clauses,{' '}
                {analyzedResult.risks.length} Risks, {analyzedResult.obligations.length} Obligations Verified.
              </div>
              <button
                type="button"
                onClick={() => navigate(`/contracts/${analyzedResult.id}`)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-magenta transition-all"
              >
                <span>Open in Three-Column Intelligence Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Built-in Sample Contract Loader */}
      <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-serif-editorial text-[#20233A]">
              Built-In Sample Contract Loader
            </h3>
            <p className="text-xs text-[#575B75]">
              Load and inspect curated enterprise agreements with real auto-renewal traps, uncapped liability carveouts, and operational deliverables
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-50 border border-pink-500/20 text-pink-700">
            {samples.length} Pre-Verified Templates Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {samples.map((s) => (
            <div
              key={s.key}
              className="p-5 rounded-xl bg-[#FAF8F3] border border-pink-500/15 hover:border-pink-600 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-pink-500/20 text-pink-700">
                    {s.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#20233A] flex items-center gap-0.5">
                    <DollarSign className="w-3 h-3 text-[#0F9D91]" />
                    {s.annual_value.toLocaleString()}/yr
                  </span>
                </div>
                <h4 className="font-serif-editorial text-base text-[#20233A] group-hover:text-pink-600 transition-colors">
                  {s.title}
                </h4>
                <div className="flex items-center gap-3 text-[11px] text-[#575B75]">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {s.counterparty}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    {s.governing_law}
                  </span>
                </div>
                <p className="text-xs text-[#575B75] leading-relaxed">{s.description}</p>
              </div>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleSampleLoad(s.key)}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-gradient-to-r hover:from-pink-600 hover:to-rose-600 text-[#20233A] hover:text-white border border-pink-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-600 group-hover:text-white" />
                <span>Run Intelligence Pipeline on Sample</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
