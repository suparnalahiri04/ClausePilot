import React from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, ShieldAlert, Crosshair } from 'lucide-react';
import { VerificationResult } from '../types';

interface Props {
  verification: VerificationResult;
  onLocate?: () => void;
  compact?: boolean;
}

export const VerificationBadge: React.FC<Props> = ({ verification, onLocate, compact = false }) => {
  const { status, confidence_score, start_char, end_char, verification_note } = verification;
  const pct = Math.round((confidence_score || 0) * 100);

  let badgeStyle = 'bg-[#E6F7F5] text-[#0F9D91] border-[#0F9D91]/25';
  let label = 'Verified Exact';
  let Icon = ShieldCheck;

  if (status === 'VERIFIED_HIGH_CONFIDENCE') {
    badgeStyle = 'bg-pink-50 text-pink-700 border-pink-500/25';
    label = 'AI Grounded';
    Icon = Sparkles;
  } else if (status === 'PARTIAL_SUPPORT') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300';
    label = 'Partial Match';
    Icon = AlertTriangle;
  } else if (status === 'UNVERIFIED_FLAGGED') {
    badgeStyle = 'bg-rose-50 text-rose-600 border-rose-500/35';
    label = 'Unverified Flag';
    Icon = ShieldAlert;
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        title={`${verification_note}${start_char != null ? ` [Chars ${start_char}–${end_char}]` : ''}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${badgeStyle}`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span>{label}</span>
        {!compact && <span className="font-mono text-[10px] opacity-80">({pct}%)</span>}
      </span>

      {onLocate && start_char != null && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLocate();
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] hover:text-pink-700 border border-[#E6E1D6] hover:border-pink-500/40 transition-all"
          title="Highlight exact source passage in document viewer"
        >
          <Crosshair className="w-3 h-3 text-pink-600" />
          <span>Source [{start_char}–{end_char}]</span>
        </button>
      )}
    </div>
  );
};
