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
  UserCheck
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <Link 
            to={isAdmin ? '/admin' : '/events'} 
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-college-800 to-college-600 flex items-center justify-center text-white shadow-md shadow-college-800/20 group-hover:scale-105 transition-transform duration-200">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight">
                  FXEC <span className="text-college-600">Events</span>
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-college-100 text-college-800 uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Francis Xavier Engineering College
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isStudent && (
              <>
                <Link
                  to="/events"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/events')
                      ? 'bg-college-50 text-college-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Browse Events</span>
                  </div>
                </Link>
                <Link
                  to="/my/requests"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/my/requests')
                      ? 'bg-college-50 text-college-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>My Requests</span>
                  </div>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/admin')
                      ? 'bg-college-50 text-college-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link
                  to="/admin/events"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/admin/events')
                      ? 'bg-college-50 text-college-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Events Manager</span>
                  </div>
                </Link>
                <Link
                  to="/admin/requests"
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/admin/requests')
                      ? 'bg-college-50 text-college-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Registration Requests</span>
                  </div>
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/events"
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive('/events')
                    ? 'bg-college-50 text-college-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-college-50 text-college-700 border border-college-200">
                        {user.yearOfStudyRoman}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{user?.total_points || 0} pts</span>
                    </div>
                  </div>
                )}

                {/* Profile Pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-college-700 hover:bg-college-800 rounded-lg shadow-sm transition-all shadow-college-700/20 active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {isAuthenticated ? (
            <div className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                {isStudent && user?.yearOfStudyRoman && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-college-100 text-college-800">
                      {user.yearOfStudyRoman}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {user?.total_points || 0} Points
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2.5 text-center font-semibold text-sm text-white bg-college-700 rounded-lg mb-3"
            >
              Sign In
            </Link>
          )}

          {isStudent && (
            <>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive('/events') ? 'bg-college-50 text-college-700' : 'text-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4 text-college-600" />
                Browse Events
              </Link>
              <Link
                to="/my/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive('/my/requests') ? 'bg-college-50 text-college-700' : 'text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-college-600" />
                My Registration Requests
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive('/admin') ? 'bg-college-50 text-college-700' : 'text-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-college-600" />
                Dashboard Overview
              </Link>
              <Link
                to="/admin/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive('/admin/events') ? 'bg-college-50 text-college-700' : 'text-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4 text-college-600" />
                Manage Events
              </Link>
              <Link
                to="/admin/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive('/admin/requests') ? 'bg-college-50 text-college-700' : 'text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-college-600" />
                Review Requests
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700"
            >
              <Calendar className="w-4 h-4 text-college-600" />
              Browse Events
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
