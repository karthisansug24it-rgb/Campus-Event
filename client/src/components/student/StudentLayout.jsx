import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  Calendar, 
  FileText, 
  Sparkles, 
  Award, 
  LogOut, 
  GraduationCap,
  Bell,
  Menu,
  X,
  Shield,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';

const StudentLayout = () => {
  const { user, isStudent, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [appliedCount, setAppliedCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch count of applied events and unread notifications if logged in as student
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && isStudent) {
      api.get('/my/requests')
        .then((res) => {
          if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
            setAppliedCount(res.data.data.length);
          }
        })
        .catch(() => {});

      api.get('/notifications/unread-count')
        .then((res) => {
          if (isMounted && res.data?.success) {
            setUnreadNotifCount(res.data.data.unreadCount || 0);
          }
        })
        .catch(() => {});
    } else {
      setAppliedCount(0);
      setUnreadNotifCount(0);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isStudent, location.pathname]);

  // Close drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const handleLogout = () => {
    logout();
    setMobileDrawerOpen(false);
    navigate('/login');
  };

  const navItems = [
    {
      to: '/events',
      label: 'Browse Events',
      shortLabel: 'Events',
      icon: Calendar,
      badge: null
    },
    {
      to: '/my/requests',
      label: 'Applied Events',
      shortLabel: 'Applied',
      icon: FileText,
      badge: appliedCount > 0 ? `${appliedCount}` : null,
      badgeVariant: 'amber'
    },
    {
      to: '/notifications',
      label: 'Notifications',
      shortLabel: 'Alerts',
      icon: Bell,
      badge: unreadNotifCount > 0 ? `${unreadNotifCount}` : null,
      badgeVariant: 'blue'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased">
      
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE TOP HEADER (Clean with Left Menu Trigger)
          ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between shadow-xs">
        
        {/* Left: Hamburger Menu Button + Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 -ml-1.5 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/events" className="flex items-center gap-2 select-none group">
            <img
              src="/fxec-logo.png"
              alt="FXEC Logo"
              className="w-8 h-8 rounded-full object-contain bg-white shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="leading-tight">
              <span className="font-extrabold font-display text-slate-900 tracking-tight text-sm">
                FXEC <span className="text-blue-600">EVENTS</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block ml-1" />
            </div>
          </Link>
        </div>

        {/* Right: Quick Notification Bell + User Points / Login Action */}
        <div className="flex items-center gap-1.5">
          {isAuthenticated && (
            <div className="mr-0.5">
              <NotificationBell isMobile={true} />
            </div>
          )}

          {isAuthenticated && user ? (
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-800 text-xs font-bold transition-all border border-slate-200"
              aria-label="View user profile"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              {user.total_points !== undefined && (
                <span className="font-mono text-[11px] text-blue-700 font-extrabold">
                  {user.total_points}p
                </span>
              )}
            </button>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-xs transition-all"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SLIDE-IN MOBILE LEFT DRAWER (Modern Sidebar on the Left)
          ───────────────────────────────────────────────────────────── */}
      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 ${
          mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between md:hidden transform transition-transform duration-300 ease-out ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Drawer"
      >
        {/* Top of Left Drawer: Header & Identity */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Header Row */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <Link 
              to="/events" 
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-3 select-none min-w-0"
            >
              <img
                src="/fxec-logo.png"
                alt="FXEC Logo"
                className="w-10 h-10 rounded-full object-contain bg-white shadow-sm shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold font-display text-slate-900 tracking-tight text-base leading-none">
                    FXEC <span className="text-blue-600 font-black">EVENTS</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-1 truncate">
                  Campus Event Portal
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors focus:outline-none"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile Card (Inside Drawer) */}
          {isAuthenticated && user ? (
            <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border border-blue-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-black text-slate-900 truncate leading-snug">
                    {user.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Status & Academic Badges */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-blue-100 flex-wrap">
                {user.yearOfStudyRoman && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                    {user.yearOfStudyRoman}
                  </span>
                )}
                {user.department && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-[130px]">
                    {user.department}
                  </span>
                )}
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-200 ml-auto">
                  <Award className="w-3 h-3 text-amber-600" />
                  <span>{user.total_points || 0} pts</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 m-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-center space-y-2">
              <p className="text-xs text-blue-900 font-medium">
                Sign in with your official FXEC account to register for events.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="py-2 px-3 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 text-center"
                >
                  Log In
                </Link>
                <Link
                  to="/login?mode=signup"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="py-2 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs text-center shadow-xs"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* Left Navigation Links List */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              NAVIGATION
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || (item.to === '/my/requests' && location.pathname === '/applied');
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                        : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm tracking-tight">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : item.badgeVariant === 'blue'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Portal Role Switcher Section */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                PORTALS
              </div>
              <Link
                to="/admin"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span>Faculty / Admin Console</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer Footer: Logout or Sign In */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/80 font-bold text-xs transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
            >
              Sign In to FXEC
            </Link>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DESKTOP LEFT SIDEBAR (Permanent ChatGPT-Style Sidebar)
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-white shrink-0 border-r border-slate-200/90 flex-col justify-between sticky top-0 h-screen z-30 shadow-xs">
        
        {/* Top of Sidebar: Brand Logo & Notification Bell */}
        <div className="flex flex-col flex-1">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/events" className="flex items-center gap-3 select-none group min-w-0">
              <img
                src="/fxec-logo.png"
                alt="FXEC Logo"
                className="w-10 h-10 rounded-full object-contain bg-white shadow-sm shrink-0 transition-transform group-hover:scale-105"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold font-display text-slate-900 tracking-tight text-base leading-none">
                    FXEC <span className="text-blue-600 font-black">EVENTS</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
                <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase mt-1 leading-none truncate">
                  Francis Xavier Engg College
                </p>
              </div>
            </Link>

            {isAuthenticated && (
              <div className="shrink-0 pl-1">
                <NotificationBell isMobile={false} />
              </div>
            )}
          </div>

          {/* Left Navigation Menu */}
          <div className="p-4 space-y-2">
            <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              STUDENT MENU
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || (item.to === '/my/requests' && location.pathname === '/applied');
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`group flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20 font-black'
                        : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 border border-transparent hover:border-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm tracking-tight">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : item.badgeVariant === 'blue'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Desktop Profile Card in Left Bottom Corner */}
        {isAuthenticated && user ? (
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 m-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate leading-normal">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.yearOfStudyRoman && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-700">
                        {user.yearOfStudyRoman}
                      </span>
                    )}
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5 text-amber-600" />
                      {user.total_points || 0} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
            >
              Sign In
            </Link>
          </div>
        )}
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CONTENT AREA
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC] pb-20 md:pb-6">
        
        {/* Responsive College Header Banner */}
        <section className="bg-white border-b border-slate-200/90 py-5 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-36 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] sm:text-xs font-mono font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>FRANCIS XAVIER ENGINEERING COLLEGE</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display text-slate-900 tracking-tight leading-tight">
              Welcome to <span className="text-blue-600">FXEC Events</span>
            </h1>

            <p className="text-xs sm:text-base text-slate-600 font-sans max-w-xl mx-auto leading-relaxed">
              Explore upcoming campus hackathons, workshops, symposiums, and track your verified registrations in real-time.
            </p>
          </div>
        </section>

        {/* Dynamic Nested Content */}
        <div className="flex-1">
          <Outlet />
        </div>

      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. PHONE VIEW BOTTOM NAVIGATION BAR (Thumb-friendly UX)
          ───────────────────────────────────────────────────────────── */}
      <nav 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to === '/my/requests' && location.pathname === '/applied');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-bold transition-all relative ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-blue-600 text-white ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 tracking-tight">{item.shortLabel || item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />
              )}
            </NavLink>
          );
        })}

        {/* Menu Toggle Pill in Bottom Bar */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all"
          aria-label="Open full menu"
        >
          <Menu className="w-5 h-5 stroke-[1.75]" />
          <span className="mt-1 tracking-tight">Menu</span>
        </button>
      </nav>

    </div>
  );
};

export default StudentLayout;
