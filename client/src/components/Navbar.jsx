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
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

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
    <header className="sticky top-0 z-50 glass-nav transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & College Identity */}
          <Link 
            to={isAdmin ? '/admin' : '/events'} 
            className="flex items-center gap-3.5 group select-none"
          >
            <img 
              src="/fxec-logo.png" 
              alt="FXEC Logo" 
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-contain bg-white shadow-sm transition-all duration-300 group-hover:scale-105 shrink-0" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold font-display text-slate-900 tracking-tight text-lg sm:text-xl leading-none">
                  FXEC <span className="text-blue-600 font-black">EVENTS</span>
                </span>
                {isAdmin ? (
                  <Badge variant="midnight" size="xs">
                    ADMIN
                  </Badge>
                ) : (
                  <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-1 hidden sm:block">
                Francis Xavier Engineering College
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Admin Only - Student has dedicated left sidebar) */}
          {isAdmin && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/80">
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </div>
              </Link>
              <Link
                to="/admin/events"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive('/admin/events')
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Events Manager</span>
                </div>
              </Link>
              <Link
                to="/admin/requests"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive('/admin/requests')
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Requests Queue</span>
                </div>
              </Link>
            </nav>
          )}

          {/* User Profile / Auth Actions - Hidden for students because student details are in the left bottom corner like ChatGPT */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs font-mono shadow-xs">
                    A
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-slate-900 leading-tight">
                      Admin
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-1 border border-transparent hover:border-rose-100"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl border border-slate-200 transition-all shadow-xs"
                >
                  Log In
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/25 transition-all active:scale-95"
                >
                  Register
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 shadow-xl">
          {isAuthenticated ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                {isStudent && user?.yearOfStudyRoman && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                      {user.yearOfStudyRoman} Year
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-600 text-white">
                      {user?.total_points || 0} PTS
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1 pb-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-center font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                Log In
              </Link>
              <Link
                to="/login?mode=signup"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-blue-600 text-center font-bold text-xs text-white shadow-md shadow-blue-600/25"
              >
                Student Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Nav Links */}
          <div className="space-y-1">
            {isStudent && (
              <>
                <Link
                  to="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    isActive('/events')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Browse Events</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  to="/my/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    isActive('/my/requests')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Applied Events</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    isActive('/admin')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    <span>Admin Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  to="/admin/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    isActive('/admin/events')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Events Manager</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  to="/admin/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    isActive('/admin/requests')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Registration Requests</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
