import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ChevronUp,
  PlusCircle,
  Users,
  Check
} from 'lucide-react';

export default function AdminLayout() {
  const { user, accounts, switchAccount, logoutAccount, logoutAll } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAccount(user?.email);
    navigate('/login');
  };

  const handleSwitch = (email) => {
    const switched = switchAccount(email);
    setAccountMenuOpen(false);
    if (switched) {
      navigate(switched.role === 'admin' ? '/admin' : '/events', { replace: true });
    }
  };

  const handleAddAccount = () => {
    setAccountMenuOpen(false);
    navigate('/login?action=add_account');
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/events', label: 'Manage Events', icon: Calendar },
    { to: '/admin/requests', label: 'Student Requests', icon: ClipboardList }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white">FXEC Admin</h2>
              <p className="text-[11px] text-slate-400">Campus Events Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer with Multi-Account Switcher */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 relative" ref={menuRef}>
          {accountMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-3 z-50 text-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Switch Device Account ({accounts.length})
              </p>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {accounts.map((acc) => {
                  const isCurrent = acc.user.email.toLowerCase() === user?.email.toLowerCase();
                  return (
                    <button
                      key={acc.user.email}
                      onClick={() => handleSwitch(acc.user.email)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/30 text-white font-bold border border-blue-500/40'
                          : 'text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate font-semibold">{acc.user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{acc.user.role.toUpperCase()} • {acc.user.email}</p>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-700 space-y-1">
                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center gap-2 p-1.5 text-blue-400 hover:text-blue-300 font-bold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Another Account</span>
                </button>
              </div>
            </div>
          )}

          <div
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="pt-2 mt-2 flex items-center justify-between border-t border-slate-800/80">
            <NavLink
              to="/events"
              className="text-xs text-slate-400 hover:text-blue-400 font-medium flex items-center gap-1"
            >
              <span>Student View</span>
              <ExternalLink className="w-3 h-3" />
            </NavLink>

            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
