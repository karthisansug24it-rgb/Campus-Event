import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Award,
  Sparkles,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to={isAdmin ? '/admin' : '/events'}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 bg-clip-text text-transparent">
                  FXEC
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 tracking-wide">
                  EVENTS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight hidden sm:block">
                Francis Xavier Engineering College (Autonomous)
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {isStudent && (
                  <>
                    <Link
                      to="/events"
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive('/events')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Browse Events
                    </Link>
                    <Link
                      to="/my-requests"
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive('/my-requests')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      My Requests
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive('/admin')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/events"
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive('/admin/events')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Manage Events
                    </Link>
                    <Link
                      to="/admin/requests"
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                        isActive('/admin/requests')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      Student Requests
                    </Link>
                  </>
                )}

                {/* User Info & Points */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
                  {isStudent && user?.totalPoints !== undefined && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-semibold shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{user.totalPoints} pts</span>
                    </div>
                  )}

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isAdmin ? (
                        <span className="text-blue-700 font-semibold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span>{user?.yearLabel || 'Student'} • {user?.departmentCode?.toUpperCase()}</span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/events"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
                >
                  Browse Events
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all shadow-blue-700/20"
                >
                  Sign In
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && isStudent && user?.totalPoints !== undefined && (
              <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{user.totalPoints}</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-blue-700 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-xl animate-modal">
          {isAuthenticated ? (
            <>
              <div className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-200">
                <p className="font-bold text-sm text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-100 text-blue-800 uppercase">
                    {user?.role}
                  </span>
                  {isStudent && user?.yearLabel && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-200 text-slate-700">
                      {user.yearLabel}
                    </span>
                  )}
                </div>
              </div>

              {isStudent && (
                <>
                  <Link
                    to="/events"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Browse Events
                  </Link>
                  <Link
                    to="/my-requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    My Requests
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/events"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Manage Events
                  </Link>
                  <Link
                    to="/admin/requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Student Requests
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Browse Events
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
