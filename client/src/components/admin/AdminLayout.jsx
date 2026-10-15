import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { to: '/admin', label: 'Executive Dashboard', icon: LayoutDashboard, end: true, badge: 'Live' },
    { to: '/admin/events', label: 'Events Management', icon: Calendar, end: false },
    { to: '/admin/requests', label: 'Registration Queue', icon: FileText, end: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Top Header for Admin Drawer */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <img
            src="/fxec-logo.png"
            alt="FXEC Logo"
            className="w-8 h-8 rounded-full object-contain bg-white shadow-xs"
          />
          <div>
            <span className="font-extrabold font-display text-sm tracking-tight text-slate-900">
              FXEC ADMIN
            </span>
            <span className="text-[10px] font-mono text-blue-600 font-bold block leading-none">
              Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigate('/admin/events?create=true');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle admin menu"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Admin Sidebar */}
      <aside
        className={`w-full md:w-64 bg-white shrink-0 border-r border-slate-200 flex flex-col justify-between shadow-xs transition-all z-30 ${
          mobileDrawerOpen ? 'block' : 'hidden md:flex'
        }`}
      >
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
                  onClick={() => setMobileDrawerOpen(false)}
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

        {/* Sidebar Footer: Admin Profile & Sign Out */}
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

      {/* Main Admin Content Body */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
