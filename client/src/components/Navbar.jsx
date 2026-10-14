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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-blue-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <Link 
            to={isAdmin ? '/admin' : '/events'} 
            className="flex items-center gap-3 group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 flex items-center justify-center transition-transform group-hover:scale-105">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight">
                  FXEC <span className="text-blue-600 font-black">EVENTS</span>
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium font-mono hidden sm:block">
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
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
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
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
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        {user.yearOfStudyRoman}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-mono font-bold shadow-sm shadow-blue-600/30">
                      <Award className="w-3.5 h-3.5" />
                      <span>{user?.total_points || 0} PTS</span>
                    </div>
                  </div>
                )}

                {/* Profile Pill */}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs font-mono">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors ml-1 border border-transparent hover:border-blue-100"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/25 transition-all active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-100 bg-white/98 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {isAuthenticated ? (
            <div className="p-3.5 bg-blue-50/60 rounded-2xl mb-3 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                {isStudent && user?.yearOfStudyRoman && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                      {user.yearOfStudyRoman}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      {user?.total_points || 0} PTS
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-xl"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2.5 text-center font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-xl mb-3 shadow-md shadow-blue-600/20"
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
                  isActive('/events') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-700 hover:bg-blue-50/50'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                Browse Events
              </Link>
              <Link
                to="/my/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/my/requests') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-700 hover:bg-blue-50/50'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-600" />
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
                  isActive('/admin') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-700 hover:bg-blue-50/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                Dashboard Overview
              </Link>
              <Link
                to="/admin/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/admin/events') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-700 hover:bg-blue-50/50'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                Manage Events
              </Link>
              <Link
                to="/admin/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive('/admin/requests') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-700 hover:bg-blue-50/50'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Review Requests
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50/50"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              Browse Events
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
