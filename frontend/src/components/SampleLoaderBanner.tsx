import React, { useState } from 'react';
import { Sparkles, Loader2, RotateCcw, CheckCircle2, FileStack, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { useToast } from './ToastContext';

interface SampleLoaderBannerProps {
  isEmpty: boolean;
  onLoaded: () => void;
  contextLabel?: string;
}

export const SampleLoaderBanner: React.FC<SampleLoaderBannerProps> = ({
  isEmpty,
  onLoaded,
  contextLabel = 'Portfolio Intelligence',
}) => {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { showToast } = useToast();

  const handleLoadThreeSamples = async () => {
    try {
      setLoading(true);
      const res = await api.loadThreeSampleContracts();
      showToast(
        'Loaded 3 Pre-Verified Sample Contracts',
        res.message || 'Populated Veridian Cloud MSA, NorthStar AI DPA, and Kestrel v2.0 Redline.',
        'magenta'
      );
      onLoaded();
    } catch (e: any) {
      showToast('Failed to load sample contracts', e?.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleResetZeroState = async () => {
    try {
      setResetting(true);
      await api.resetDemoToZeroState();
      showToast(
        'Workspace Reset to Zero-State',
        'Cleared demo contracts so you can test empty states or reload instant fixtures.',
        'teal'
      );
      onLoaded();
    } catch (e: any) {
      showToast('Failed to reset workspace', e?.message, 'warning');
    } finally {
      setResetting(false);
    }
  };

  if (isEmpty) {
    return (
      <div className="backdrop-blur-md bg-white/85 border-2 border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-editorial-lg relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-br from-pink-500/15 to-rose-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-500/25 text-pink-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-pink-600" />
              <span>Zero-State Workspace • Instant Fixture Loader</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif-editorial text-[#20233A]">
              No Active Agreements in {contextLabel} Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#575B75] leading-relaxed">
              Instantly populate charts, categorized risk scores, obligation timelines, and verbatim source verification tables with{' '}
              <strong className="text-[#20233A]">3 Pre-Verified Enterprise Sample Contracts</strong>{' '}
              (<em>Veridian Cloud MSA v2.4</em>, <em>NorthStar AI DPA &amp; SLA</em>, and{' '}
              <em>Kestrel Global Fulfilment v2.0 Redline</em>), or upload your own PDF/DOCX file.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-[#575B75]">
              <span className="inline-flex items-center gap-1 text-[#0F9D91]">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Source-Verified Clauses
              </span>
              <span>•</span>
              <span>12 Categorized Risk Flags</span>
              <span>•</span>
              <span>11 Tracked Obligations</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={handleLoadThreeSamples}
              className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta flex items-center justify-center gap-2.5 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading 3 Verified Contracts...</span>
                </>
              ) : (
                <>
                  <FileStack className="w-4 h-4" />
                  <span>Load 3 Pre-Verified Sample Contracts</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/75 border border-pink-500/20 rounded-2xl px-4 py-3 shadow-editorial flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 font-bold border border-pink-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-pink-600" />
          <span>Demo Fixtures Active</span>
        </span>
        <span className="text-[#575B75] hidden md:inline">
          Instant sample contracts and 100% verified source excerpts are loaded into {contextLabel}.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleLoadThreeSamples}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-sm transition-all"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>Load 3 Pre-Verified Sample Contracts</span>
        </button>

        <button
          type="button"
          disabled={resetting}
          onClick={handleResetZeroState}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-[#FAF8F3] hover:bg-rose-50 text-[#575B75] hover:text-rose-700 border border-[#E6E1D6] transition-colors"
          title="Clear portfolio to test Zero-State empty view"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Test Zero-State</span>
        </button>
      </div>
    </div>
  );
};

