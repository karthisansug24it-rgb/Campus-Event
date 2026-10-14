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
    <div className="min-h-screen bg-slate-50/40 text-slate-800 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white text-slate-800 shrink-0 border-r border-slate-200 flex flex-col shadow-xs">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-wide">
                Admin Console
              </h2>
              <p className="text-[10px] text-blue-600 font-mono font-bold uppercase tracking-wider">
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/50'
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
        <div className="p-4 border-t border-slate-100">
          <NavLink
            to="/events"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-mono font-medium border border-slate-200 transition-colors"
          >
            <span>Live Student Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
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
