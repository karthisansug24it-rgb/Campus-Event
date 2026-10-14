import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  Award, 
  Sparkles,
  ShieldCheck,
  UserCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07080D]/85 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <Link 
            to={isAdmin ? '/admin' : '/events'} 
            className="flex items-center gap-3 group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1px] shadow-glow-cyan transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#090A0F] rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white tracking-tight text-lg leading-tight">
                  FXEC <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">EVENTS</span>
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium font-mono hidden sm:block">
                Francis Xavier Engineering College
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isStudent && (
              <>
                <Link
                  to="/events"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/events')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Browse Events</span>
                  </div>
                </Link>
                <Link
                  to="/my/requests"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/my/requests')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>My Requests</span>
                  </div>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/admin')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link
                  to="/admin/events"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/admin/events')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Events Manager</span>
                  </div>
                </Link>
                <Link
                  to="/admin/requests"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/admin/requests')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Registration Requests</span>
                  </div>
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/events"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/events')
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Browse Events
              </Link>
            )}
          </nav>

          {/* User Profile / Auth Action */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Student badges: Year & Points */}
                {isStudent && (
                  <div className="flex items-center gap-2">
                    {user?.yearOfStudyRoman && (
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                        {user.yearOfStudyRoman}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[11px] font-mono font-bold shadow-glow-amber">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>{user?.total_points || 0} PTS</span>
                    </div>
                  </div>
                )}

                {/* Profile Pill */}
                <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-white/[0.12] text-cyan-300 flex items-center justify-center font-bold text-xs font-mono">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors ml-1 border border-transparent hover:border-rose-500/20"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl shadow-glow-cyan transition-all active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0A0D18]/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2">
          {isAuthenticated ? (
            <div className="p-3.5 bg-white/[0.03] rounded-2xl mb-3 border border-white/[0.08] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{user?.name}</p>
                <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
                {isStudent && user?.yearOfStudyRoman && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                      {user.yearOfStudyRoman}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                      {user?.total_points || 0} PTS
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2.5 text-center font-bold text-xs text-black bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl mb-3"
            >
              Sign In
            </Link>
          )}

          {isStudent && (
            <>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/events') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'text-slate-300'
                }`}
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                Browse Events
              </Link>
              <Link
                to="/my/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/my/requests') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                My Registration Requests
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/admin') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                Dashboard Overview
              </Link>
              <Link
                to="/admin/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/admin/events') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'text-slate-300'
                }`}
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                Manage Events
              </Link>
              <Link
                to="/admin/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/admin/requests') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                Review Requests
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              Browse Events
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
