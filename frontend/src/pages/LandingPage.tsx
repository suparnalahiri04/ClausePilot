import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  GitCompareArrows,
  ShieldAlert,
  CalendarCheck2,
  FileSearch,
  Lock,
  Building2,
  Briefcase,
  Cpu,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#20233A] flex flex-col selection:bg-pink-600/20">
      {/* Sticky Frosted Glassmorphic Public Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-pink-500/15">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="ClausePilot Logo"
              className="h-9 sm:h-10 w-auto object-contain rounded-xl shadow-sm shrink-0"
            />
            <div>
              <div className="font-display font-extrabold text-base tracking-tight text-[#20233A] flex items-center gap-1.5">
                <span>ClausePilot</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-500/20">
                  Editorial AI
                </span>
              </div>
              <div className="text-[10px] text-[#575B75] hidden sm:block">
                Evidence-First Contract Intelligence
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#575B75]">
            <a href="#features" className="hover:text-pink-600 transition-colors">
              Platform Features
            </a>
            <a href="#solutions" className="hover:text-pink-600 transition-colors">
              For Founders &amp; Legal
            </a>
            <a href="#verification" className="hover:text-pink-600 transition-colors">
              Verification Layer
            </a>
            <a href="#about" className="hover:text-pink-600 transition-colors">
              About ClausePilot
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#20233A] hover:text-pink-600 bg-white/80 hover:bg-pink-50/70 border border-pink-500/20 transition-all"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta flex items-center gap-1.5 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-8">
        <div className="max-w-[1380px] mx-auto space-y-12">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/85 border border-pink-500/30 shadow-editorial text-xs font-bold text-pink-700">
              <img
                src="/logo.png"
                alt="ClausePilot Emblem"
                className="h-5 w-auto object-contain rounded"
              />
              <span>Evidence-First Contract Intelligence &amp; Obligation Tracking</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-editorial text-[#20233A] leading-[1.12]">
              Every Clause, Risk Flag, and Renewal Deadline—
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {' '}Verified to the Character.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#575B75] max-w-2xl mx-auto leading-relaxed">
              Built for high-velocity startups, procurement leaders, and legal operations teams. ClausePilot ingests complex PDFs and DOCX redlines, flags commercial traps, and proves every AI insight against verbatim document passages.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta flex items-center gap-2 transition-all"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold backdrop-blur-md bg-white/85 hover:bg-white text-[#20233A] border border-pink-500/25 shadow-editorial transition-all"
              >
                Sign In to Workspace
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-5 py-3.5 rounded-2xl text-xs font-bold text-pink-700 hover:bg-pink-50/80 transition-all"
              >
                Explore Live Demo →
              </button>
            </div>
          </div>

          {/* Dedicated Custom Banner Image Container loading /banner.png with Anchored Inner Cards */}
          <div className="relative max-w-6xl mx-auto pt-4">
            <div className="rounded-3xl overflow-hidden border-2 border-pink-500/35 banner-glow bg-white p-2">
              <div className="relative rounded-2xl overflow-hidden min-h-[380px] sm:min-h-[420px] lg:h-[440px] flex flex-col justify-end">
                <img
                  src="/banner.png"
                  alt="ClausePilot Editorial Contract Intelligence Showcase"
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
                <div className="relative z-10 inset-0 bg-gradient-to-t from-[#20233A]/85 via-[#20233A]/30 to-transparent flex flex-col lg:flex-row lg:items-end justify-between gap-6 p-6 sm:p-8 h-full">
                  {/* Left Hero Banner Copy & CTA */}
                  <div className="space-y-1.5 text-white max-w-xl lg:max-w-lg mt-auto">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-white">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Deterministic Verification Layer Active
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif-editorial">
                      Three-Column Document Intelligence &amp; Redline Comparison
                    </h2>
                    <p className="text-xs text-white/85">
                      Click any extracted risk, obligation, or Q&amp;A citation to highlight the exact sentence in the contract source.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#20233A] hover:bg-pink-50 shadow-sm"
                      >
                        Launch Interactive Command Center →
                      </button>
                    </div>
                  </div>

                  {/* Right Inner-Anchored Cards (Completely Inside Main Banner Container) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col lg:justify-between lg:h-full gap-3 lg:w-[305px] shrink-0">
                    {/* Inner Top-Right Card: Contract Summary Page */}
                    <div
                      onClick={() => navigate('/dashboard')}
                      className="backdrop-blur-md bg-white/90 border border-pink-500/35 rounded-2xl p-3.5 shadow-editorial-lg cursor-pointer hover:border-pink-600 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-500/20">
                          Contract Summary Page
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#0F9D91] bg-[#E6F7F5] px-2 py-0.5 rounded-full">
                          Grade A+
                        </span>
                      </div>
                      <div className="font-serif-editorial text-sm text-[#20233A]">
                        Veridian Cloud Enterprise MSA (v2.4)
                      </div>
                      <div className="text-[11px] text-[#575B75] mt-0.5">
                        $184,000/yr • 90-Day Auto-Renewal Notice
                      </div>
                      {/* Miniature editorial page lines */}
                      <div className="mt-2.5 p-2 rounded-xl bg-[#FAF8F3]/90 border border-pink-500/15 space-y-1.5">
                        <div className="h-1.5 w-3/4 rounded-full bg-pink-600/30" />
                        <div className="h-1.5 w-full rounded-full bg-[#20233A]/15" />
                        <div className="h-1.5 w-5/6 rounded-full bg-[#20233A]/15" />
                      </div>
                    </div>

                    {/* Inner Bottom-Right Card: Source Verification & Obligation Badge */}
                    <div
                      onClick={() => navigate('/obligations')}
                      className="backdrop-blur-md bg-white/90 border border-pink-500/35 rounded-2xl p-3.5 shadow-editorial-lg cursor-pointer hover:border-[#0F9D91] transition-colors lg:mt-auto"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-white flex items-center justify-center shadow-magenta shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#20233A]">VERIFIED_EXACT</span>
                            <span className="text-[10px] font-mono font-bold text-[#0F9D91] bg-[#E6F7F5] px-1.5 py-0.2 rounded">
                              100% Match
                            </span>
                          </div>
                          <div className="text-[11px] text-[#575B75] truncate">
                            14 Clauses &amp; 11 Obligations Grounded
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section id="features" className="py-16 px-4 sm:px-8 max-w-[1380px] mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-pink-600">
            Enterprise-Grade Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif-editorial text-[#20233A]">
            Designed for Precision Legal &amp; Commercial Review
          </h2>
          <p className="text-xs sm:text-sm text-[#575B75]">
            Replace scattered spreadsheets and unverified AI summaries with an auditable system of record.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: 'Evidence-First Verification Layer',
              desc: 'Every extracted clause, risk flag, and Q&A citation is deterministically checked against verbatim character offsets in your source PDF/DOCX.',
              badge: '100% Grounded',
            },
            {
              icon: ShieldAlert,
              title: 'Categorized Risk Review Center',
              desc: 'Automatically isolate Termination asymmetries, Auto-Renewal lock-ins, Uncapped Liability carveouts, and Net 15 Take-or-Pay traps.',
              badge: '4 Core Pillars',
            },
            {
              icon: FileSearch,
              title: 'Three-Column Document Workspace',
              desc: 'Navigate structured sections on the left, read the pure-white contract sheet in the center, and inspect clickable AI intelligence on the right.',
              badge: 'Interactive',
            },
            {
              icon: GitCompareArrows,
              title: 'Deterministic Version Compare',
              desc: 'Run word-level redline diffs and side-by-side comparisons between v1 baselines and counterparty v2 drafts with AI risk shift explanations.',
              badge: 'Redline Diff',
            },
            {
              icon: CalendarCheck2,
              title: 'Obligations & Renewal Timeline',
              desc: 'Never miss a 90-day non-renewal window, quarterly SOC 2 attestation, or Standby Letter of Credit continuation deadline.',
              badge: 'Live Calendar',
            },
            {
              icon: Cpu,
              title: 'Ask ClausePilot Grounded Q&A',
              desc: 'Ask complex commercial questions and receive clickable passage citations—with graceful fallback whenever information is absent from the text.',
              badge: 'Zero Hallucination',
            },
          ].map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="backdrop-blur-md bg-white/75 border border-pink-500/15 hover:border-pink-500/40 rounded-2xl p-6 shadow-editorial hover:shadow-editorial-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-white flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-500/20">
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-[#20233A]">{f.title}</h3>
                <p className="text-xs text-[#575B75] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Value Propositions for Founders, Legal, and Procurement */}
      <section id="solutions" className="py-16 px-4 sm:px-8 bg-white/60 border-y border-pink-500/15">
        <div className="max-w-[1380px] mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-pink-600">
              Tailored Value Propositions
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif-editorial text-[#20233A]">
              Built for Every Stakeholder in the Contract Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                role: 'For Startup Founders & CFOs',
                icon: Building2,
                headline: 'Eliminate Surprise Auto-Renewals & Uncapped Burn',
                points: [
                  'Instant visibility into total annual SaaS, cloud, and lease commitments.',
                  'Early alerts 90–120 days before automatic multi-year renewal lock-ins.',
                  'Board-ready CSV, JSON, and Markdown executive portfolio summaries.',
                ],
              },
              {
                role: 'For General Counsel & Legal Teams',
                icon: Scale,
                headline: 'Accelerate Redline Turnaround with Verbatim Proof',
                points: [
                  'Every AI risk rationale is paired with a playbook redline recommendation.',
                  'Deterministic v1 vs. v2 redline comparison highlights liability cap drops.',
                  'Explicit Verification Layer blocks unsupported claims before review.',
                ],
              },
              {
                role: 'For Procurement & Operations Managers',
                icon: Briefcase,
                headline: 'Turn Static PDFs into Actionable Team Checklists',
                points: [
                  'Assign contractual deliverables across Security, Finance, and Operations.',
                  'Track SLA credit claim windows, COI renewals, and quarterly audits.',
                  'One-click sample contract loader for rapid vendor benchmarking.',
                ],
              },
            ].map((vp, idx) => {
              const Icon = vp.icon;
              return (
                <div
                  key={idx}
                  className="backdrop-blur-md bg-white/85 border border-pink-500/20 rounded-2xl p-6 shadow-editorial space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{vp.role}</span>
                    </div>
                    <h3 className="text-lg font-serif-editorial text-[#20233A]">{vp.headline}</h3>
                    <ul className="space-y-2.5 pt-1">
                      {vp.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#575B75]">
                          <CheckCircle2 className="w-4 h-4 text-[#0F9D91] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#FAF8F3] hover:bg-pink-50 text-[#20233A] hover:text-pink-700 border border-pink-500/20 transition-all"
                  >
                    Start as {vp.role.replace('For ', '')} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About & Verification Architecture Section */}
      <section id="about" className="py-16 px-4 sm:px-8 max-w-[1380px] mx-auto">
        <div
          id="verification"
          className="backdrop-blur-md bg-white/85 border border-pink-500/25 rounded-3xl p-8 lg:p-12 shadow-editorial-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F5] text-[#0F9D91] text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>About ClausePilot’s Evidence-First Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
              Why Legal &amp; Procurement Teams Trust ClausePilot Over Generic AI Chatbots
            </h2>
            <p className="text-xs sm:text-sm text-[#575B75] leading-relaxed">
              Generic LLMs summarize contracts without proving where a claim originates. ClausePilot combines Google Gemini contextual intelligence with a deterministic Python verification engine (`verification.py`) that maps every extracted clause, risk flag, and Q&amp;A answer back to exact character offsets (`start_char`–`end_char`) in the document.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-pink-500/15">
                <div className="text-xl font-display font-extrabold text-pink-600">100%</div>
                <div className="text-[11px] text-[#575B75] font-medium">
                  Character-Offset Source Grounding
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-pink-500/15">
                <div className="text-xl font-display font-extrabold text-[#0F9D91]">5-Stage</div>
                <div className="text-[11px] text-[#575B75] font-medium">
                  PDF/DOCX Ingestion &amp; Audit Pipeline
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-pink-500/15">
                <div className="text-xl font-display font-extrabold text-[#20233A]">Graceful</div>
                <div className="text-[11px] text-[#575B75] font-medium">
                  Missing-Evidence Q&amp;A Fallback
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FAF8F3] border border-pink-500/20 rounded-2xl p-6 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Ready to Inspect Your Contracts?</span>
            </div>
            <p className="text-xs text-[#575B75] leading-relaxed">
              Create your workspace account in seconds or jump directly into the interactive demo with 3 pre-verified sample agreements.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta transition-all"
              >
                Create Free ClausePilot Account
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-white hover:bg-pink-50 text-[#20233A] border border-pink-500/20 transition-all"
              >
                Sign In to Existing Workspace
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-pink-500/15 bg-white/70 py-8 px-4 sm:px-8">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#575B75]">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="ClausePilot Logo"
              className="h-8 w-auto object-contain rounded-lg shadow-sm"
            />
            <span className="font-bold text-[#20233A]">ClausePilot</span>
            <span>— Modern Editorial Contract Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-5 font-semibold">
            <Link to="/login" className="hover:text-pink-600">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-pink-600">
              Get Started
            </Link>
            <Link to="/dashboard" className="hover:text-pink-600">
              Dashboard
            </Link>
            <Link to="/analyze" className="hover:text-pink-600">
              Analyze
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

