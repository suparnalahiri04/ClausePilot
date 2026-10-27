import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building2,
  Briefcase,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../components/ToastContext';

const ROLES = [
  { id: 'Founder / Executive', label: 'Founder / Executive', desc: 'Portfolio burn & renewal visibility' },
  { id: 'General Counsel / Legal Ops', label: 'General Counsel / Legal Ops', desc: 'Redlines & liability governance' },
  { id: 'Procurement Manager', label: 'Procurement Manager', desc: 'Vendor SLAs & spend negotiations' },
  { id: 'Operations Lead', label: 'Operations Lead', desc: 'Deliverables & compliance milestones' },
];

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  organization: string;
}

export function getStoredUser(): AuthUser {
  try {
    const raw = localStorage.getItem('clausepilot_user');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    name: 'Elena Rostova',
    email: 'elena@acmeorbit.io',
    role: 'General Counsel / Legal Ops',
    organization: 'Acme Orbit Technologies Inc.',
  };
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('elena@acmeorbit.io');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState('General Counsel / Legal Ops');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const userObj: AuthUser = {
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: email.trim(),
      role,
      organization: 'Acme Orbit Technologies Inc.',
    };
    localStorage.setItem('clausepilot_user', JSON.stringify(userObj));
    showToast(
      `Welcome back, ${userObj.name}`,
      `Signed in as ${userObj.role}. Redirecting to Portfolio Command Center.`,
      'magenta'
    );
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#20233A] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="ClausePilot Logo"
            className="h-9 sm:h-10 w-auto object-contain rounded-xl shadow-sm"
          />
          <span className="font-display font-extrabold text-base text-[#20233A]">ClausePilot</span>
        </Link>
        <Link
          to="/signup"
          className="text-xs font-bold text-pink-600 hover:text-rose-600 transition-colors"
        >
          New to ClausePilot? Create an account →
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8 backdrop-blur-md bg-white/85 border border-pink-500/25 rounded-3xl p-6 sm:p-8 shadow-editorial-lg space-y-6">
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Evidence-First Workspace Login</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
            Sign In to ClausePilot
          </h1>
          <p className="text-xs text-[#575B75]">
            Access your verified contract portfolio, redline comparisons, and obligation timeline
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-500/30 text-xs font-semibold text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#20233A] mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#888CA4] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#20233A] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#888CA4] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#20233A] mb-1.5">Active Workspace Role</label>
            <div className="grid grid-cols-1 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    role === r.id
                      ? 'bg-pink-50/90 border-pink-600 text-[#20233A]'
                      : 'bg-[#FAF8F3] border-[#E6E1D6] text-[#575B75] hover:border-pink-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-[#20233A]">{r.label}</div>
                    <div className="text-[11px] text-[#575B75]">{r.desc}</div>
                  </div>
                  {role === r.id && <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta flex items-center justify-center gap-2 transition-all"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-[#E6E1D6] text-center text-xs text-[#575B75]">
          Don’t have an account yet?{' '}
          <Link to="/signup" className="font-bold text-pink-600 hover:underline">
            Get Started Free
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#888CA4]">
        Protected by ClausePilot Deterministic Source Verification Layer
      </div>
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Founder / Executive');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const userObj: AuthUser = {
      name: name.trim(),
      email: email.trim(),
      role,
      organization: organization.trim() || 'Acme Orbit Technologies Inc.',
    };
    localStorage.setItem('clausepilot_user', JSON.stringify(userObj));
    showToast(
      'Workspace Created Successfully',
      `Welcome to ClausePilot, ${userObj.name} (${userObj.role}).`,
      'magenta'
    );
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#20233A] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="ClausePilot Logo"
            className="h-9 sm:h-10 w-auto object-contain rounded-xl shadow-sm"
          />
          <span className="font-display font-extrabold text-base text-[#20233A]">ClausePilot</span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-bold text-pink-600 hover:text-rose-600 transition-colors"
        >
          Already have an account? Sign In →
        </Link>
      </div>

      <div className="max-w-lg w-full mx-auto my-6 backdrop-blur-md bg-white/85 border border-pink-500/25 rounded-3xl p-6 sm:p-8 shadow-editorial-lg space-y-5">
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Get Started with ClausePilot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-editorial text-[#20233A]">
            Create Your Contract Intelligence Workspace
          </h1>
          <p className="text-xs text-[#575B75]">
            Configure your role to tailor risk alerts, renewal windows, and obligation views
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-500/30 text-xs font-semibold text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#20233A] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#888CA4] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Priya Nair"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#20233A] mb-1">Organization</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#888CA4] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Acme Orbit Inc."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#20233A] mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888CA4] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="priya@acmeorbit.io"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#20233A] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888CA4] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="6+ characters"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A] focus:outline-none focus:border-pink-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#20233A] mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-pink-600" />
              <span>Select Your Primary Role</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === r.id
                      ? 'bg-pink-50/90 border-pink-600 text-[#20233A]'
                      : 'bg-[#FAF8F3] border-[#E6E1D6] text-[#575B75] hover:border-pink-400'
                  }`}
                >
                  <div className="font-bold text-xs text-[#20233A] flex items-center justify-between">
                    <span>{r.label}</span>
                    {role === r.id && <CheckCircle2 className="w-3.5 h-3.5 text-pink-600" />}
                  </div>
                  <div className="text-[10px] text-[#575B75] mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta flex items-center justify-center gap-2 transition-all"
          >
            <span>Launch My Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-[#E6E1D6] text-center text-xs text-[#575B75]">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-pink-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#888CA4]">
        ClausePilot Enterprise Contract Intelligence • SOC 2 &amp; Deterministic Source Verification
      </div>
    </div>
  );
};

