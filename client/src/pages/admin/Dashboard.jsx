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
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400 font-mono">Aggregating campus event metrics...</p>
      </div>
    );
  }

  // Get featured event
  const featuredEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      
      {/* Top Welcome & Quick Action Header */}
      <div className="bg-[#0D101D] p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/25">
            EXECUTIVE CONTROL CENTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2.5">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time visual monitoring of official FXEC campus events, registration pipelines, and attendance capacities.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/admin/events"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-extrabold shadow-glow-cyan transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Publish Event</span>
          </Link>
          <Link
            to="/admin/requests"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-mono font-bold border border-white/[0.08] transition-all active:scale-95"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Events */}
        <div className="bg-[#0D101D] p-6 rounded-3xl border border-white/[0.08] shadow-card hover:border-cyan-500/30 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">TOTAL EVENTS</p>
            <h3 className="text-3xl font-black font-mono text-white mt-1">
              {stats?.totalEvents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {stats?.internalEvents ?? 0} Inside · {stats?.externalEvents ?? 0} Outside
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center shadow-glow-cyan">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-[#0D101D] p-6 rounded-3xl border border-white/[0.08] shadow-card hover:border-amber-500/30 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">PENDING QUEUE</p>
            <h3 className="text-3xl font-black font-mono text-amber-400 mt-1">
              {stats?.pendingRequests ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Awaiting verification</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shadow-glow-amber">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Registrations */}
        <div className="bg-[#0D101D] p-6 rounded-3xl border border-white/[0.08] shadow-card hover:border-emerald-500/30 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">CONFIRMED SEATS</p>
            <h3 className="text-3xl font-black font-mono text-emerald-400 mt-1">
              {stats?.approvedRegistrations ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Active participants</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-glow-emerald">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-[#0D101D] p-6 rounded-3xl border border-white/[0.08] shadow-card hover:border-purple-500/30 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">STUDENT USERS</p>
            <h3 className="text-3xl font-black font-mono text-purple-400 mt-1">
              {stats?.totalStudents ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Registered FXEC accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shadow-glow-purple">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Featured Event Visual Spotlight Banner */}
      {featuredEvent && (
        <div className="relative rounded-3xl overflow-hidden bg-[#0A0D18] border border-white/[0.08] shadow-glass text-white">
          <div className="absolute inset-0">
            {featuredEvent.poster_url && (
              <img
                src={featuredEvent.poster_url}
                alt={featuredEvent.title}
                className="w-full h-full object-cover opacity-25 filter blur-xs scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080D] via-[#0A0D18]/90 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber">
                  ★ SPOTLIGHT EVENT
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white/[0.06] text-slate-300 border border-white/[0.1] backdrop-blur-md">
                  {featuredEvent.category}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {featuredEvent.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                {featuredEvent.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
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
                className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-mono font-bold text-xs border border-white/[0.12] transition-all active:scale-95"
              >
                Manage in Events
              </Link>
              <Link
                to={`/admin/requests?eventId=${featuredEvent.id}`}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs shadow-glow-cyan transition-all active:scale-95"
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
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Campus Events & Visual Posters
            </h2>
            <p className="text-xs text-slate-400">
              Live events published on the student portal with real-time capacity meters.
            </p>
          </div>
          <Link
            to="/admin/events"
            className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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
                className="group bg-[#0D101D] rounded-3xl border border-white/[0.08] hover:border-cyan-500/40 hover:shadow-glow-cyan transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Poster Image Container */}
                <div className="relative aspect-[16/9] w-full bg-[#07080D] overflow-hidden">
                  {ev.poster_url ? (
                    <img
                      src={ev.poster_url}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#121628] to-[#07080D] text-white">
                      <Calendar className="w-10 h-10 text-cyan-400 opacity-70" />
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-md backdrop-blur-md border ${
                      ev.event_type === 'internal'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}>
                      {ev.event_type === 'internal' ? 'Inside' : 'Outside'}
                    </span>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/60 text-cyan-300 border border-white/[0.1] backdrop-blur-md">
                      {ev.category}
                    </span>
                  </div>

                  {ev.reward_points > 0 && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber backdrop-blur-md">
                        <Award className="w-3.5 h-3.5 fill-current text-amber-400" />
                        <span>+{ev.reward_points} PTS</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  {/* Date & Venue Meta */}
                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-white/[0.06] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-300">
                        {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate text-slate-300">{ev.venue}</span>
                    </div>
                  </div>

                  {/* Seat Capacity Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="text-slate-400">SEATS ALLOTTED:</span>
                      <span className={pct >= 100 ? 'text-rose-400' : 'text-slate-300'}>
                        {approved} / {max || '∞'} ({max ? `${pct}%` : 'Open'})
                      </span>
                    </div>
                    {max && (
                      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 100 
                              ? 'bg-rose-500 shadow-glow-rose' 
                              : pct > 75 
                              ? 'bg-amber-400 shadow-glow-amber' 
                              : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-glow-cyan'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Action Links */}
                  <div className="pt-2 flex items-center justify-between border-t border-white/[0.06] text-xs">
                    <Link
                      to={`/admin/requests?eventId=${ev.id}`}
                      className="font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                    >
                      <span>Review Requests</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      to="/admin/events"
                      className="font-semibold text-slate-400 hover:text-white"
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
      <div className="bg-[#0D101D] rounded-3xl border border-white/[0.08] shadow-glass overflow-hidden">
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Immediate Attention: Pending Registration Requests
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Earliest student applications waiting for seat allotment with event context.
            </p>
          </div>
          <Link
            to="/admin/requests"
            className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All ({stats?.pendingRequests ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Queue is all caught up!</p>
            <p className="text-xs text-slate-500 mt-0.5">No pending registration requests require review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">Event & Poster</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Year & Dept</th>
                  <th className="py-3.5 px-4">Sec / Reg No</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentRequests.map((r) => {
                  const ev = events.find(e => e.id === r.event_id);
                  const posterUrl = ev ? ev.poster_url : null;

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-xl bg-[#07080D] overflow-hidden shrink-0 shadow-xs border border-white/[0.08]">
                            {posterUrl ? (
                              <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-cyan-400 bg-college-900">
                                FX
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <p className="font-extrabold text-white truncate leading-snug">
                              {r.event_title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {r.event_category || 'Event'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{r.student_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{r.student_email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">Year {r.year_of_study}</span>
                        <span className="text-slate-500"> · </span>
                        <span className="text-slate-400">{r.department_name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-300 font-mono">Sec {r.section}</span>
                        <p className="text-[10px] text-cyan-400 font-mono">{r.register_number}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/admin/requests"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/25 shadow-glow-cyan transition-all"
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
