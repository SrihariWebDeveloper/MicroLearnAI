import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  LayoutDashboard,
  Compass,
  Map,
  BookOpen,
  Code2,
  CheckSquare,
  TrendingUp,
  Sparkles,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { performanceApi } from '../../api/performance';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [streakDays, setStreakDays] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;
    performanceApi.getPerformance()
      .then((performance) => {
        if (isActive) setStreakDays(performance.streak_days);
      })
      .catch(() => {
        if (isActive) setStreakDays(null);
      });
    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Onboarding', path: '/onboarding', icon: Compass },
    { label: 'Roadmap', path: '/roadmap', icon: Map },
    { label: 'Learning', path: '/learn', icon: BookOpen },
    { label: 'Practice', path: '/practice', icon: Code2 },
    { label: 'Coding Lab', path: '/lab', icon: Code2 },
    { label: 'Assessments', path: '/assessment', icon: CheckSquare },
    { label: 'Performance', path: '/performance', icon: TrendingUp },
    { label: 'Recommendations', path: '/recommendations', icon: Sparkles },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const secondaryNavItems = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    secondaryNavItems.unshift({ label: 'Admin Portal', path: '/admin', icon: Shield });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1">
                MicroLearn <span className="gradient-text">AI</span>
              </span>
              <span className="text-[10px] block text-slate-400 font-mono tracking-wider uppercase">
                Agentic Learning
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Menu */}
          <div>
            <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Learning Suite
            </span>
            <div className="mt-2 space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-linear-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Account / Settings */}
          <div>
            <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              System & Account
            </span>
            <div className="mt-2 space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-slate-800/80 text-indigo-300 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Gamified Streak Widget */}
          <div className="p-3.5 rounded-2xl bg-linear-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/30">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span>{streakDays === null ? 'Streak unavailable' : `${streakDays} Day${streakDays === 1 ? '' : 's'} Streak`}</span>
            </div>
            <p className="text-[11px] text-slate-400">Complete lessons regularly to build a learning streak.</p>
          </div>
        </div>

        {/* User Footer Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 shrink-0">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Learner'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
