import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Bell, Sparkles, User, LogOut, Search, Cpu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common/Badge';

interface TopNavProps {
  onToggleMobileSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Helper to format breadcrumb
  const getBreadcrumbTitle = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    switch (path) {
      case 'dashboard':
        return 'Dashboard Shell';
      case 'onboarding':
        return 'Learner Onboarding';
      case 'roadmap':
        return 'Personalized Roadmap';
      case 'learn':
        return 'AI Learning Workspace';
      case 'practice':
        return 'Targeted Practice';
      case 'lab':
        return 'Interactive Coding Lab';
      case 'assessment':
        return 'Subtopic Assessment';
      case 'results':
        return 'Assessment Results';
      case 'performance':
        return 'Performance Analytics';
      case 'recommendations':
        return 'Recommendations';
      case 'notifications':
        return 'Notifications';
      case 'profile':
        return 'User Profile';
      case 'settings':
        return 'Settings';
      case 'admin':
        return 'Admin Dashboard';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 md:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-indigo-400 hidden sm:inline-block">MicroLearn</span>
          <span className="text-xs text-slate-400 hidden sm:inline-block">/</span>
          <h1 className="text-base font-semibold text-slate-100">{getBreadcrumbTitle()}</h1>
        </div>
      </div>

      {/* Center: Quick Search / AI Status Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
        <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Agent Orchestration: <strong className="text-slate-200 font-medium">Active (OpenRouter Free Model)</strong></span>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-3">
        {/* Recommendations Shortcut */}
        <NavLink
          to="/recommendations"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 text-indigo-300 text-xs font-medium transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Insights</span>
        </NavLink>

        {/* Notifications Icon */}
        <NavLink
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
        </NavLink>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-900 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {userDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setUserDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-slate-100">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <Badge variant="indigo" size="sm" className="mt-1">
                    {user?.role || 'Learner'}
                  </Badge>
                </div>

                <NavLink
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Your Profile</span>
                </NavLink>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
