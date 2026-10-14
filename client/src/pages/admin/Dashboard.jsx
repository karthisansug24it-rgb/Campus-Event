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
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500 font-mono">Aggregating campus event metrics...</p>
      </div>
    );
  }

  // Get featured event
  const featuredEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-800">
      
      {/* Top Welcome & Quick Action Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm shadow-blue-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            EXECUTIVE CONTROL CENTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time visual monitoring of official FXEC campus events, registration pipelines, and attendance capacities.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/admin/events"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Publish Event</span>
          </Link>
          <Link
            to="/admin/requests"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-mono font-bold border border-blue-200 transition-all active:scale-95"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-700" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Events */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">TOTAL EVENTS</p>
            <h3 className="text-3xl font-black font-mono text-slate-900 mt-1">
              {stats?.totalEvents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {stats?.internalEvents ?? 0} Inside · {stats?.externalEvents ?? 0} Outside
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">PENDING QUEUE</p>
            <h3 className="text-3xl font-black font-mono text-blue-700 mt-1">
              {stats?.pendingRequests ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Awaiting verification</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Registrations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">CONFIRMED SEATS</p>
            <h3 className="text-3xl font-black font-mono text-blue-900 mt-1">
              {stats?.approvedRegistrations ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Active participants</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">STUDENT USERS</p>
            <h3 className="text-3xl font-black font-mono text-slate-900 mt-1">
              {stats?.totalStudents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Registered FXEC accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Featured Event Visual Spotlight Banner */}
      {featuredEvent && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 border border-blue-800 shadow-lg text-white">
          <div className="absolute inset-0">
            {featuredEvent.poster_url && (
              <img
                src={featuredEvent.poster_url}
                alt={featuredEvent.title}
                className="w-full h-full object-cover opacity-25 filter blur-xs scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/90 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-white text-blue-900 shadow-sm">
                  ★ SPOTLIGHT EVENT
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                  {featuredEvent.category}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {featuredEvent.title}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 line-clamp-2 leading-relaxed">
                {featuredEvent.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-blue-200 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-300" />
                  <span>{new Date(featuredEvent.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-300" />
                  <span>{featuredEvent.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-300" />
                  <span>{featuredEvent.approved_count || 0} / {featuredEvent.max_seats || 'Unlimited'} Seats</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/admin/events"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs border border-white/20 transition-all active:scale-95"
              >
                Manage in Events
              </Link>
              <Link
                to={`/admin/requests?eventId=${featuredEvent.id}`}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-xs shadow-md transition-all active:scale-95"
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
              <Sparkles className="w-5 h-5 text-blue-600" />
              Campus Events & Visual Posters
            </h2>
            <p className="text-xs text-slate-500">
              Live events published on the student portal with real-time capacity meters.
            </p>
          </div>
          <Link
            to="/admin/events"
            className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                className="group bg-white rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Poster Image Container */}
                <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                  {ev.poster_url ? (
                    <img
                      src={ev.poster_url}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-900">
                      <Calendar className="w-10 h-10 text-blue-600 opacity-70" />
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-md backdrop-blur-md border ${
                      ev.event_type === 'internal'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white/95 text-blue-900 border-blue-200'
                    }`}>
                      {ev.event_type === 'internal' ? 'Inside' : 'Outside'}
                    </span>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/95 text-blue-900 border border-blue-200 backdrop-blur-md">
                      {ev.category}
                    </span>
                  </div>

                  {ev.reward_points > 0 && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-blue-600 text-white border border-blue-500 shadow-sm backdrop-blur-md">
                        <Award className="w-3.5 h-3.5 fill-current text-white" />
                        <span>+{ev.reward_points} PTS</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  {/* Date & Venue Meta */}
                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-slate-700">
                        {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-slate-700">{ev.venue}</span>
                    </div>
                  </div>

                  {/* Seat Capacity Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="text-slate-500">SEATS ALLOTTED:</span>
                      <span className={pct >= 100 ? 'text-slate-700' : 'text-blue-700'}>
                        {approved} / {max || '∞'} ({max ? `${pct}%` : 'Open'})
                      </span>
                    </div>
                    {max && (
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Action Links */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <Link
                      to={`/admin/requests?eventId=${ev.id}`}
                      className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono"
                    >
                      <span>Review Requests</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      to="/admin/events"
                      className="font-semibold text-slate-500 hover:text-slate-900"
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
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
            className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All ({stats?.pendingRequests ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Queue is all caught up!</p>
            <p className="text-xs text-slate-500 mt-0.5">No pending registration requests require review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Event & Poster</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Year & Dept</th>
                  <th className="py-3.5 px-4">Sec / Reg No</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((r) => {
                  const ev = events.find(e => e.id === r.event_id);
                  const posterUrl = ev ? ev.poster_url : null;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 shadow-xs border border-slate-200">
                            {posterUrl ? (
                              <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-blue-700 bg-blue-50">
                                FX
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <p className="font-extrabold text-slate-900 truncate leading-snug">
                              {r.event_title}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              {r.event_category || 'Event'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{r.student_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{r.student_email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">Year {r.year_of_study}</span>
                        <span className="text-slate-400"> · </span>
                        <span className="text-slate-600">{r.department_name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 font-mono">Sec {r.section}</span>
                        <p className="text-[10px] text-blue-700 font-mono">{r.register_number}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/admin/requests"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all"
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
