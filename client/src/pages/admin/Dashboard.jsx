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
  GraduationCap,
  MapPin,
  Award,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, requestsRes, eventsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/requests?status=pending'),
          api.get('/events')
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (requestsRes.data.success) {
          setRecentRequests(requestsRes.data.data.slice(0, 5));
        }
        if (eventsRes.data.success) {
          setEvents(eventsRes.data.data);
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
        <p className="text-sm font-semibold text-slate-500">Aggregating campus event metrics...</p>
      </div>
    );
  }

  // Get featured event (e.g. event with highest seats or first upcoming event)
  const featuredEvent = events.length > 0 ? events[0] : null;

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
            Real-time visual monitoring of official FXEC campus events, registration pipelines, and attendance capacities.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/admin/events"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-college-700 hover:bg-college-800 text-white text-xs font-bold shadow-md shadow-college-700/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Event</span>
          </Link>
          <Link
            to="/admin/requests"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-95"
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {stats?.totalEvents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats?.internalEvents ?? 0} Inside · {stats?.externalEvents ?? 0} Outside
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">
              {stats?.pendingRequests ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting verification</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Registrations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Seats</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">
              {stats?.approvedRegistrations ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed participants</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Student Users</p>
            <h3 className="text-3xl font-black text-indigo-600 mt-1">
              {stats?.totalStudents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Active FXEC students</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Featured Event Visual Spotlight Banner */}
      {featuredEvent && (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl text-white">
          <div className="absolute inset-0">
            {featuredEvent.poster_url && (
              <img
                src={featuredEvent.poster_url}
                alt={featuredEvent.title}
                className="w-full h-full object-cover opacity-35 filter blur-xs scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                  ★ Highlighted Event
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white backdrop-blur-md">
                  {featuredEvent.category}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {featuredEvent.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {featuredEvent.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-college-400" />
                  <span>{new Date(featuredEvent.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>{featuredEvent.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{featuredEvent.approved_count || 0} / {featuredEvent.max_seats || 'Unlimited'} Seats</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/admin/events"
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Manage in Events
              </Link>
              <Link
                to={`/admin/requests?eventId=${featuredEvent.id}`}
                className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all"
              >
                View Requests
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Events Image Showcase Gallery Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-college-600" />
              Campus Events & Visual Posters
            </h2>
            <p className="text-xs text-slate-500">
              Live events published on the student portal with real-time capacity meters.
            </p>
          </div>
          <Link
            to="/admin/events"
            className="text-xs font-bold text-college-700 hover:text-college-800 flex items-center gap-1"
          >
            <span>All Events ({events.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const approved = Number(ev.approved_count || 0);
            const max = ev.max_seats ? Number(ev.max_seats) : null;
            const pct = max ? Math.min(100, Math.round((approved / max) * 100)) : 0;

            return (
              <div 
                key={ev.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Poster Image Container */}
                <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                  {ev.poster_url ? (
                    <img
                      src={ev.poster_url}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-college-900 text-white">
                      <Calendar className="w-10 h-10 opacity-70" />
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md backdrop-blur-md ${
                      ev.event_type === 'internal'
                        ? 'bg-emerald-600/90 text-white'
                        : 'bg-indigo-600/90 text-white'
                    }`}>
                      {ev.event_type === 'internal' ? 'Inside' : 'Outside'}
                    </span>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/70 text-white backdrop-blur-md">
                      {ev.category}
                    </span>
                  </div>

                  {ev.reward_points > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 shadow-md">
                        <Award className="w-3.5 h-3.5 fill-current" />
                        <span>+{ev.reward_points} pts</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-college-600 transition-colors line-clamp-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  {/* Date & Venue Meta */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-college-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                  </div>

                  {/* Seat Capacity Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Seats Allotted:</span>
                      <span className={pct >= 100 ? 'text-rose-600' : 'text-slate-800'}>
                        {approved} / {max || '∞'} ({max ? `${pct}%` : 'Open'})
                      </span>
                    </div>
                    {max && (
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 100 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Action Links */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <Link
                      to={`/admin/requests?eventId=${ev.id}`}
                      className="font-bold text-college-700 hover:text-college-800 flex items-center gap-1"
                    >
                      <span>Review Requests</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      to="/admin/events"
                      className="font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Queue Quick Action Table with Event Images */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Immediate Attention: Pending Registration Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Earliest student applications waiting for seat allotment with event context.
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
                  <th className="py-3 px-4">Event & Poster</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Year & Dept</th>
                  <th className="py-3 px-4">Sec / Reg No</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((r) => {
                  // Find event to get its poster
                  const ev = events.find(e => e.id === r.event_id);
                  const posterUrl = ev ? ev.poster_url : null;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-lg bg-slate-900 overflow-hidden shrink-0 shadow-xs border border-slate-200">
                            {posterUrl ? (
                              <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white bg-college-900">
                                FX
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <p className="font-extrabold text-slate-900 truncate leading-snug">
                              {r.event_title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {r.event_category || 'Event'}
                            </p>
                          </div>
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
