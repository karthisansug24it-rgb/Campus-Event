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
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-college-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                Admin Console
              </h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                FXEC Event Operations
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
                      ? 'bg-college-600 text-white shadow-md shadow-college-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick External Link */}
        <div className="p-4 border-t border-slate-800">
          <NavLink
            to="/events"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <span>Live Student Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
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
