import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Users, 
  ExternalLink 
} from 'lucide-react';

const AdminLayout = () => {
  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/events', label: 'Events Manager', icon: Calendar, end: false },
    { to: '/admin/requests', label: 'Registration Requests', icon: FileText, end: false },
  ];

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#0A0D18] text-white shrink-0 border-r border-white/[0.08] flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1px] shadow-glow-cyan">
              <div className="w-full h-full bg-[#090A0F] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">
                Admin Console
              </h2>
              <p className="text-[10px] text-cyan-400 font-mono font-semibold uppercase tracking-wider">
                FXEC OPERATIONS
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Student Portal Link */}
        <div className="p-4 border-t border-white/[0.08]">
          <NavLink
            to="/events"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white text-xs font-mono font-medium border border-white/[0.06] transition-colors"
          >
            <span>Live Student Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </NavLink>
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
