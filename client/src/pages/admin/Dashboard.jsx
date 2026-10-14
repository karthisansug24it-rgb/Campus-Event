import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';
import EventFormModal from '../../components/admin/EventFormModal';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of events, student requests, and registration statistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-700/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Events */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? '...' : stats?.total_events || 0}
            </p>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Requests</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">
              {loading ? '...' : stats?.pending_requests || 0}
            </p>
          </div>
        </div>

        {/* Approved Registrations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Registrations</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {loading ? '...' : stats?.approved_registrations || 0}
            </p>
          </div>
        </div>

        {/* Total Points Awarded */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Points Distributed</p>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">
              {loading ? '...' : stats?.total_points_awarded || 0} pts
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Recent Student Requests</h3>
              <p className="text-xs text-slate-500">Latest event applications awaiting attention</p>
            </div>
            <Link
              to="/admin/requests"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recent_requests?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_requests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{req.name}</p>
                    <p className="text-slate-500">{req.email} • {req.event_title}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No recent requests recorded.</p>
          )}
        </div>

        {/* Quick Tools & Shortcuts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Admin Shortcuts</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all flex items-center justify-between text-xs group"
            >
              <div>
                <p className="font-bold text-slate-800 group-hover:text-blue-700">Publish New Event</p>
                <p className="text-slate-500">Internal workshops, hackathons, symposiums</p>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <Link
              to="/admin/requests?status=pending"
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition-all flex items-center justify-between text-xs group block"
            >
              <div>
                <p className="font-bold text-slate-800 group-hover:text-amber-700">Review Pending Requests</p>
                <p className="text-slate-500">{stats?.pending_requests || 0} requests awaiting decision</p>
              </div>
              <Clock className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
            </Link>

            <Link
              to="/admin/events"
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between text-xs group block"
            >
              <div>
                <p className="font-bold text-slate-800 group-hover:text-indigo-700">Manage Event Roster</p>
                <p className="text-slate-500">Update event deadlines, venues, and posters</p>
              </div>
              <Calendar className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <EventFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
