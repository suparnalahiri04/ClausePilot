import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileUp,
  FolderKanban,
  ShieldAlert,
  CalendarCheck2,
  GitCompareArrows,
  FileBarChart2,
  Settings,
  Scale,
  ShieldCheck,
  PlusCircle,
  LogOut,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import { getStoredUser } from '../pages/AuthPages';
import { useToast } from './ToastContext';
import { AskClausePilotWidget } from './AskClausePilotWidget';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Portfolio Overview', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze Contract', icon: FileUp },
  { to: '/contracts', label: 'Document Library', icon: FolderKanban },
  { to: '/risks', label: 'Risk Review', icon: ShieldAlert },
  { to: '/obligations', label: 'Obligations', icon: CalendarCheck2 },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = getStoredUser();

  const isContractWorkspace =
    location.pathname.startsWith('/contracts/') && location.pathname !== '/contracts';

  const handleSignOut = () => {
    localStorage.removeItem('clausepilot_user');
    showToast('Signed out of ClausePilot', 'Redirected to public landing page.', 'teal');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#20233A]">
      {/* Sleek Sticky Top Horizontal Frosted Glassmorphic Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-pink-500/15 shadow-editorial">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="ClausePilot Logo"
                className="h-9 sm:h-10 w-auto object-contain rounded-xl shadow-sm shrink-0"
              />
              <div className="leading-tight">
                <div className="font-display font-extrabold text-[15px] tracking-tight text-[#20233A] flex items-center gap-1.5">
                  <span>ClausePilot</span>
                  <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-500/20">
                    <ShieldCheck className="w-2.5 h-2.5 text-pink-600" />
                    Verified
                  </span>
                </div>
                <div className="text-[10px] text-[#575B75] hidden xl:block">
                  Editorial Contract Intelligence
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Horizontal Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#FAF8F3]/90 p-1 rounded-2xl border border-pink-500/15 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === '/contracts' && isContractWorkspace);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                      : 'text-[#575B75] hover:text-[#20233A] hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-pink-600'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right: User Profile & Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/analyze')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-magenta transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>

            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-pink-500/15">
              <div className="text-right leading-tight">
                <div className="text-xs font-bold text-[#20233A] flex items-center justify-end gap-1">
                  <UserCheck className="w-3 h-3 text-pink-600" />
                  <span className="truncate max-w-[110px]">{user.name}</span>
                </div>
                <div className="text-[10px] text-[#575B75] truncate max-w-[130px]">{user.role}</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-rose-50 text-[#575B75] hover:text-rose-600 border border-[#E6E1D6] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile/Tablet Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#FAF8F3] border border-pink-500/20 text-[#20233A]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Horizontal / Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-pink-500/15 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.to ||
                  (item.to === '/contracts' && isContractWorkspace);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                        : 'bg-[#FAF8F3] text-[#20233A]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            <div className="pt-2 border-t border-[#E6E1D6] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#20233A]">{user.name}</span>{' '}
                <span className="text-[#575B75]">({user.role})</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-rose-600 font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 min-w-0 pb-16">{children}</main>

      {/* Floating Glassmorphic AI Contract Copilot Drawer */}
      <AskClausePilotWidget />
    </div>
  );
};
