import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Layers,
  Plus
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Auto-close mobile drawer when route changes
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

  const navItems = [
    { to: '/admin', label: 'Executive Dashboard', icon: LayoutDashboard, end: true, badge: 'Live' },
    { to: '/admin/events', label: 'Events Management', icon: Calendar, end: false },
    { to: '/admin/requests', label: 'Registration Queue', icon: FileText, end: false },
  ];

  const handleLogout = () => {
    logout();
    setMobileDrawerOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row antialiased">
      
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE TOP HEADER (Clean with Left Hamburger Button)
          ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between shadow-xs">
        
        {/* Left: Menu Trigger + Admin Identity */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 -ml-1.5 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Open admin navigation menu"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <img
              src="/fxec-logo.png"
              alt="FXEC Logo"
              className="w-8 h-8 rounded-full object-contain bg-white shadow-xs"
            />
            <div className="leading-tight">
              <span className="font-extrabold font-display text-sm tracking-tight text-slate-900 block">
                FXEC ADMIN
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-bold block leading-none">
                Console
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action to Create Event */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/events?create=true')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create</span>
          </button>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between md:hidden transform transition-transform duration-300 ease-out ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation Drawer"
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <img
                src="/fxec-logo.png"
                alt="FXEC Logo"
                className="w-9 h-9 rounded-full object-contain bg-white shadow-sm shrink-0"
              />
              <div>
                <h2 className="text-sm font-extrabold font-display text-slate-900 tracking-tight leading-none">
                  Admin Console
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <p className="text-[10px] text-blue-700 font-mono font-bold tracking-wider uppercase">
                    FXEC OPS v2.4
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors focus:outline-none"
              aria-label="Close admin menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links in Drawer */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              CORE MODULES
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-extrabold'
                        : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/70'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-md bg-white/20 text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <div className="pt-4 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              PORTALS
            </div>
            <Link
              to="/events"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Student Portal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </nav>
        </div>

        {/* Drawer Footer: Admin Info & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              A
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {user?.email || 'admin@francisxavier.ac.in'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/80 font-bold text-xs transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Console</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DESKTOP ADMIN SIDEBAR (Permanent Left Sidebar)
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-white shrink-0 border-r border-slate-200 flex-col justify-between shadow-xs z-30 sticky top-0 h-screen">
        <div className="flex flex-col flex-1">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src="/fxec-logo.png"
                alt="FXEC Logo"
                className="w-10 h-10 rounded-full object-contain bg-white shadow-sm shrink-0"
              />
              <div>
                <h2 className="text-sm font-extrabold font-display text-slate-900 tracking-tight">
                  Admin Console
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <p className="text-[10px] text-blue-700 font-mono font-bold tracking-wider uppercase">
                    FXEC OPS v2.4
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2 flex-1">
            <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              CORE MODULES
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/90 shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-blue-100/80 text-blue-700 border border-blue-200">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <div className="pt-4 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              PORTALS
            </div>
            <Link
              to="/events"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>Student View</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                A
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Administrator
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  {user?.email || 'admin@francisxavier.ac.in'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              title="Sign out of Admin Console"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN ADMIN CONTENT BODY
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
