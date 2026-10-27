import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Sparkles,
  Building2,
  Save,
  Database,
  RotateCcw,
  FileStack,
} from 'lucide-react';
import { api } from '../api';
import { AppSettings } from '../types';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastContext';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [dbBusy, setDbBusy] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .getSettings()
      .then((res) => {
        setSettings(res);
        setApiKeyInput(res.masked_api_key || '');
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      const updated = await api.updateSettings({
        ...settings,
        gemini_api_key: apiKeyInput,
      });
      setSettings(updated);
      setApiKeyInput(updated.masked_api_key || '');
      showToast('Settings Saved', 'Updated your AI keys and workspace preferences.', 'magenta');
    } catch (err: any) {
      showToast('Failed to save settings', err?.message, 'warning');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDemoDb = async () => {
    try {
      setDbBusy(true);
      const res = await api.loadThreeSampleContracts();
      showToast('Sample Contracts Loaded', res.message, 'magenta');
    } catch (e: any) {
      showToast('Failed to load sample contracts', e?.message, 'warning');
    } finally {
      setDbBusy(false);
    }
  };

  const handleClearLocalDb = async () => {
    try {
      setDbBusy(true);
      await api.resetDemoToZeroState();
      showToast('Local Database Cleared', 'All demo contracts removed from local storage.', 'teal');
    } catch (e: any) {
      showToast('Failed to clear database', e?.message, 'warning');
    } finally {
      setDbBusy(false);
    }
  };

  if (!settings) {
    return <PageSkeleton title="Loading Settings & AI Keys..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-pink-600">
          Workspace Preferences
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
          Settings &amp; AI Keys
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Settings & AI Keys */}
        <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-500/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif-editorial text-lg text-[#20233A]">
                  Settings &amp; AI Keys
                </h3>
                <p className="text-xs text-[#575B75]">
                  Connect your Google Gemini API key for live AI contract analysis and Q&amp;A (works offline automatically with built-in analysis)
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                settings.has_gemini_api_key
                  ? 'bg-[#E6F7F5] text-[#0F9D91]'
                  : 'bg-pink-50 border border-pink-500/20 text-pink-700'
              }`}
            >
              {settings.has_gemini_api_key ? 'Gemini API Connected' : 'Built-In Engine Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#20233A] mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-pink-600" />
                <span>Gemini API Key</span>
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste your AIza... key here (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-[#20233A] mb-1.5">AI Model</label>
              <select
                value={settings.ai_model}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] font-semibold"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Accurate)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Contract Review)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Local Database Storage */}
        <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-500/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E6F7F5] text-[#0F9D91] flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif-editorial text-lg text-[#20233A]">
                  Local Database Storage
                </h3>
                <p className="text-xs text-[#575B75]">
                  Your contracts, risk reviews, and deadlines are stored privately in a local SQLite database (`clausepilot.db`)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F5] text-[#0F9D91]">
              SQLite Connected
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF8F3] p-4 rounded-xl border border-pink-500/15">
            <div className="text-xs text-[#575B75] max-w-xl">
              Quickly load the <strong className="text-[#20233A]">3 Pre-Verified Sample Contracts</strong> into local storage or clear the database to start fresh.
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={dbBusy}
                onClick={handleLoadDemoDb}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm"
              >
                <FileStack className="w-3.5 h-3.5" />
                <span>Load 3 Sample Contracts</span>
              </button>
              <button
                type="button"
                disabled={dbBusy}
                onClick={handleClearLocalDb}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-[#575B75] hover:text-rose-600 border border-[#E6E1D6]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Local Storage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Fact-Checking & Company Defaults */}
        <div className="backdrop-blur-md bg-white/80 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-4">
          <div className="flex items-center gap-2.5 border-b border-pink-500/10 pb-3">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-editorial text-lg text-[#20233A]">
                Company Profile &amp; Fact-Checking Rules
              </h3>
              <p className="text-xs text-[#575B75]">
                Set your company name, preferred legal state, and renewal reminder window
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#20233A] mb-1.5">Company Name</label>
              <input
                type="text"
                value={settings.organization_name}
                onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#20233A] mb-1.5">Preferred Legal State</label>
              <input
                type="text"
                value={settings.primary_jurisdiction}
                onChange={(e) =>
                  setSettings({ ...settings, primary_jurisdiction: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#20233A] mb-1.5">
                Renewal Reminder Window (Days)
              </label>
              <input
                type="number"
                value={settings.renewal_notice_window_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    renewal_notice_window_days: parseInt(e.target.value || '90', 10),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-[#20233A] pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_flag_unverified}
              onChange={(e) =>
                setSettings({ ...settings, auto_flag_unverified: e.target.checked })
              }
              className="rounded accent-pink-600"
            />
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F9D91]" />
              Always require exact quotes from the document when answering questions
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold shadow-magenta transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
