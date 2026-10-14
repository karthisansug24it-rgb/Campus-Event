import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Users,
  UserCheck,
  PlusCircle,
  ChevronDown,
  Trash2
} from 'lucide-react';

export default function Navbar() {
  const { user, accounts, switchAccount, logoutAccount, logoutAll, isAuthenticated, isAdmin, isStudent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (targetEmail) => {
    const switchedUser = switchAccount(targetEmail);
    setAccountMenuOpen(false);
    if (switchedUser) {
      navigate(switchedUser.role === 'admin' ? '/admin' : '/events', { replace: true });
    }
  };

  const handleSignoutThis = (email) => {
    logoutAccount(email);
    setAccountMenuOpen(false);
  };

  const handleAddAnother = () => {
    setAccountMenuOpen(false);
    navigate('/login?action=add_account');
  };

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

                {/* Points Badge */}
                {isStudent && user?.totalPoints !== undefined && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-semibold shadow-sm ml-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{user.totalPoints} pts</span>
                  </div>
                )}

                {/* Multi-Account Profile Trigger */}
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-3 pr-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all text-left"
                    aria-label="Account menu"
                  >
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">
                        {isAdmin ? 'Admin' : `${user?.yearLabel || 'Student'} • ${user?.departmentCode}`}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Multi-Account Dropdown Menu */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-modal">
                      <div className="p-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Active Account
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                            {user?.role}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm mt-1">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>

                      {/* Other Accounts on This Device */}
                      <div className="space-y-1 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Device Accounts ({accounts.length})
                        </p>
                        {accounts.map((acc) => {
                          const isCurrent = acc.user.email.toLowerCase() === user?.email.toLowerCase();
                          return (
                            <div
                              key={acc.user.email}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                                isCurrent
                                  ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                                  : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                              }`}
                            >
                              <div
                                onClick={() => !isCurrent && handleSwitch(acc.user.email)}
                                className="flex items-center gap-2.5 flex-1 overflow-hidden"
                              >
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {acc.user.name?.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold truncate max-w-[120px]">{acc.user.name}</p>
                                    <span className="text-[9px] uppercase px-1 rounded bg-slate-100 text-slate-600 font-semibold">
                                      {acc.user.role}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate">{acc.user.email}</p>
                                </div>
                              </div>

                              {isCurrent ? (
                                <span className="text-[10px] text-blue-600 font-bold px-2">Active</span>
                              ) : (
                                <button
                                  onClick={() => handleSwitch(acc.user.email)}
                                  className="px-2 py-1 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg text-[10px] font-bold"
                                >
                                  Switch
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                        <button
                          onClick={handleAddAnother}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-blue-700 hover:bg-blue-50 font-bold transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Add Another Account</span>
                        </button>

                        <button
                          onClick={() => handleSignoutThis(user?.email)}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out of {user?.name}</span>
                        </button>

                        {accounts.length > 1 && (
                          <button
                            onClick={logoutAll}
                            className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Sign Out of All Accounts on This Device</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
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
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-xl animate-modal">
          {isAuthenticated && (
            <>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
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

              {/* Navigation Links */}
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

              {/* Multi-Account Mobile Section */}
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Switch Account</p>
                <div className="space-y-1">
                  {accounts.map((acc) => (
                    <button
                      key={acc.user.email}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSwitch(acc.user.email);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium text-left ${
                        acc.user.email.toLowerCase() === user?.email.toLowerCase()
                          ? 'bg-blue-50 text-blue-800 font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{acc.user.name} ({acc.user.role})</span>
                      {acc.user.email.toLowerCase() === user?.email.toLowerCase() && (
                        <span className="text-[10px] text-blue-600 font-bold">Active</span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleAddAnother();
                    }}
                    className="w-full text-left text-xs text-blue-700 font-bold p-2 flex items-center gap-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Another Account</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logoutAccount(user?.email);
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
