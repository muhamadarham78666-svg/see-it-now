import { useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from '@/lib/rr';
import {
  LayoutDashboard,
  Sparkles,
  Archive,
  Newspaper,
  Calculator,
  BookOpenCheck,
  

  History,
  NotebookPen,
  Settings,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageChip } from '@/components/LanguageChip';
import { useTheme } from '@/context/ThemeContext';
import { Logo } from '@/components/Logo';
import { BoardChip } from '@/components/boards/BoardSelector';


const navItems = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/generate', key: 'nav.generate', icon: Sparkles, end: false },
  { to: '/dashboard/solver', key: 'nav.solver', icon: Calculator, end: false },
  { to: '/dashboard/book-solver', key: 'nav.bookSolver', icon: BookOpenCheck, end: false },
  { to: '/dashboard/bank', key: 'nav.bank', icon: Archive, end: false },
  { to: '/dashboard/papers', key: 'nav.papers', icon: Newspaper, end: false },
  { to: '/dashboard/history', key: 'nav.history', icon: History, end: false },
  { to: '/dashboard/notes', key: 'nav.notes', icon: NotebookPen, end: false },
  { to: '/dashboard/settings', key: 'nav.settings', icon: Settings, end: false },
] as const;

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const baseItems = navItems.map((n) => ({ to: n.to, label: t(n.key), icon: n.icon, end: n.end as boolean }));
  const items = profile?.role === 'admin'
    ? [...baseItems, { to: '/admin', label: t('nav.admin'), icon: ShieldCheck, end: false }]
    : baseItems;

  const currentLabel = items.find((n) => location.pathname === n.to)?.label ?? t('nav.dashboard');

  return (
    <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <NavLink to="/dashboard">
            <Logo size="sm" />
          </NavLink>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {profile?.full_name ?? t('common.user')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile?.role === 'admin' ? t('common.admin') : t('common.user')}
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-1"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? t('common.light') : t('common.dark')}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
          >
            <LogOut size={18} />
            {t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col animate-slide-in-left">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/25'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                  {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {profile?.full_name ?? t('common.user')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {profile?.role === 'admin' ? t('common.admin') : t('common.user')}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 mb-1"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? t('common.light') : t('common.dark')}
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20"
              >
                <LogOut size={18} />
                {t('common.signOut')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 glass border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Menu size={22} />
          </button>
          <Logo size="sm" />
          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Desktop breadcrumb header */}
        <header className="hidden lg:flex sticky top-0 z-20 glass border-b border-slate-200 dark:border-slate-800 px-8 py-4 items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">NSAGPT</span>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageChip />
            <BoardChip />
            <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="lg:hidden mb-4 flex justify-end gap-2">
            <LanguageChip />
            <BoardChip />
          </div>
          <Outlet />
        </main>


        <footer className="py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
          NSAGPT &mdash; AI Question & Paper Generator &middot; Developed by ZK SOLUTIONS
        </footer>
      </div>
    </div>
  );
}
