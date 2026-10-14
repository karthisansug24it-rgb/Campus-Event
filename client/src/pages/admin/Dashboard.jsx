import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ArrowRight, 
  Plus, 
  AlertCircle,
  Loader2,
  Building,
  GraduationCap
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, requestsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/requests?status=pending')
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (requestsRes.data.success) {
          setRecentRequests(requestsRes.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setError('Failed to retrieve administrative statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-college-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Aggregating campus metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Welcome & Quick Action Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-college-700 bg-college-50 px-2.5 py-1 rounded-md border border-college-100">
            Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of live campus events, student registration queues, and attendance capacities.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/admin/events"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-college-700 hover:bg-college-800 text-white text-xs font-bold shadow-md shadow-college-700/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Event</span>
          </Link>
          <Link
            to="/admin/requests"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Events */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {stats?.totalEvents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats?.internalEvents ?? 0} Inside · {stats?.externalEvents ?? 0} Outside
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">
              {stats?.pendingRequests ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting your approval</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Registrations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Seats</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">
              {stats?.approvedRegistrations ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed participants</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Student Users</p>
            <h3 className="text-3xl font-black text-indigo-600 mt-1">
              {stats?.totalStudents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Registered FXEC students</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Pending Queue Quick Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Immediate Attention: Pending Registration Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Earliest student applications waiting for seat allotment.
            </p>
          </div>
          <Link
            to="/admin/requests"
            className="text-xs font-bold text-college-700 hover:text-college-800 flex items-center gap-1"
          >
            <span>View All ({stats?.pendingRequests ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">Queue is all caught up!</p>
            <p className="text-xs text-slate-400 mt-0.5">No pending registration requests require review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Year & Dept</th>
                  <th className="py-3 px-4">Sec / Reg No</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[200px] truncate">
                      {r.event_title}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{r.student_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{r.student_email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">Year {r.year_of_study}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-600">{r.department_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-700">Sec {r.section}</span>
                      <p className="text-[10px] text-slate-400 font-mono">{r.register_number}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/admin/requests"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-college-50 hover:bg-college-100 text-college-700 font-bold text-xs transition-colors"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
