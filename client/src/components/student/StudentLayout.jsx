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
  Bell
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';

const StudentLayout = () => {
  const { user, isStudent, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [appliedCount, setAppliedCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/events',
      label: 'Browse Events',
      icon: Calendar,
      badge: null
    },
    {
      to: '/my/requests',
      label: 'Applied Events',
      icon: FileText,
      badge: appliedCount > 0 ? `${appliedCount}` : null,
      badgeVariant: 'amber'
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifCount > 0 ? `${unreadNotifCount}` : null,
      badgeVariant: 'blue'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased">
      
      {/* Mobile Top Header (Small Screens Only) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <Link to="/events" className="flex items-center gap-2.5 select-none">
          <img
            src="/fxec-logo.png"
            alt="FXEC Logo"
            className="w-8 h-8 rounded-full object-contain bg-white shadow-xs"
          />
          <span className="font-extrabold font-display text-slate-900 tracking-tight text-sm">
            FXEC <span className="text-blue-600">EVENTS</span>
          </span>
        </Link>

        {/* Mobile Navigation Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to === '/my/requests' && location.pathname === '/applied');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                    isActive ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Mobile Bell & Logout / Login */}
        <div className="flex items-center gap-1">
          {isAuthenticated && <NotificationBell isMobile={true} />}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50"
            >
              Log In
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Left Sidebar: ChatGPT Style Full Height */}
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

          {/* Left Navigation: Browse Events, Applied Events & Notifications */}
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

        {/* ChatGPT Style Account Profile Card in Left Bottom Corner */}
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

      {/* Main Content Area (No Top Navbar, Clean ChatGPT Style) */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC]">
        
        {/* CENTER TITLE: Welcome to FXEC Events */}
        <section className="bg-white border-b border-slate-200/90 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-36 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-mono font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>FRANCIS XAVIER ENGINEERING COLLEGE (AUTONOMOUS)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-slate-900 tracking-tight leading-tight">
              Welcome to <span className="text-blue-600">FXEC Events</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-sans max-w-xl mx-auto leading-relaxed">
              Explore upcoming campus hackathons, workshops, symposiums, and track your verified registrations in real-time.
            </p>
          </div>
        </section>

        {/* Dynamic Nested Content */}
        <div className="flex-1">
          <Outlet />
        </div>

      </main>

    </div>
  );
};

export default StudentLayout;
