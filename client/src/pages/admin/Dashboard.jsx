import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  AlertCircle,
  Loader2,
  Building,
  GraduationCap,
  MapPin,
  Award,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { 
  PageHeader, 
  StatCard, 
  Button, 
  Badge, 
  EmptyState,
  AnimatedSection 
} from '../../components/ui';
import { getPosterUrl, handleImageError } from '../../utils/imageUrl';

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="py-28 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-xs  font-bold text-slate-500 uppercase tracking-wider">
          Aggregating Campus Operations Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-800">
      
      {/* Top Welcome Header */}
      <AnimatedSection delay={0.05}>
        <PageHeader
          badge="EXECUTIVE DASHBOARD"
          title="Campus Events Overview"
          subtitle="Real-time monitoring of Francis Xavier Engineering College events, capacity quotas, and verification queue."
          actions={
            <div className="flex items-center gap-2.5">
              <Link to="/admin/events?create=true">
                <Button variant="primary" size="sm" icon={Plus} className="font-extrabold shadow-sm">
                  Create Event
                </Button>
              </Link>
              <Link to="/admin/requests">
                <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
                  Review Queue
                </Button>
              </Link>
            </div>
          }
        />
      </AnimatedSection>

      {error && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real KPI 4-Stage Stat Cards */}
      <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" delay={0.15}>
        <Link to="/admin/requests?tab=registered" className="block group">
          <StatCard
            title="1. PROOFS IN REVIEW"
            value={stats?.registeredRequests ?? stats?.pendingRequests ?? 0}
            subtitle="Screenshots awaiting review"
            icon={ShieldCheck}
            colorScheme={stats?.registeredRequests > 0 ? "blue" : "blue"}
          />
        </Link>

        <Link to="/admin/requests?tab=registration_approved" className="block group">
          <StatCard
            title="2. CONFIRMED SEATS"
            value={stats?.approvedRegistrations ?? 0}
            subtitle="Approved registrations"
            icon={CheckCircle2}
            colorScheme="emerald"
          />
        </Link>

        <Link to="/admin/requests?tab=participated" className="block group">
          <StatCard
            title="3. CERTS IN REVIEW"
            value={stats?.participatedRequests ?? 0}
            subtitle="Awaiting admin ranking"
            icon={Award}
            colorScheme={stats?.participatedRequests > 0 ? "purple" : "purple"}
          />
        </Link>

        <Link to="/admin/requests?tab=ranked" className="block group">
          <StatCard
            title="4. RANKED WINNERS"
            value={stats?.rankedRequests ?? 0}
            subtitle="Rank 1, 2, 3 & participant awards"
            icon={Trophy}
            colorScheme="amber"
          />
        </Link>
      </AnimatedSection>

      {/* Two Column Layout: Pending Queue & Recently Created Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Registration Queue */}
        <AnimatedSection className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4" delay={0.2}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                Pending Verification Queue
              </h3>
              <p className="text-xs text-slate-500  mt-0.5">
                Students waiting for registration clearance
              </p>
            </div>
            <Link
              to="/admin/requests"
              className="text-xs  font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
            >
              <span>View All ({stats?.pendingRequests ?? 0})</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold font-display text-slate-800">Queue is Clear</p>
              <p className="text-xs text-slate-500 mt-1">No pending registration requests requiring review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {req.student_name}
                      </span>
                      <span className="text-[10px]  font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800">
                        Sec {req.section}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500  truncate">
                      {req.department_name} · <strong className="text-slate-700">{req.register_number}</strong>
                    </p>
                    <p className="text-xs text-blue-700 font-medium truncate">
                      For: {req.event_title}
                    </p>
                  </div>

                  <Link to="/admin/requests">
                    <Button variant="outline" size="xs" icon={ArrowRight} iconPosition="right">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </AnimatedSection>

        {/* Right Column: Published Events Roster */}
        <AnimatedSection className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4" delay={0.25}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                Published Events
              </h3>
              <p className="text-xs text-slate-500  mt-0.5">
                Active campus programs
              </p>
            </div>
            <Link
              to="/admin/events"
              className="text-xs  font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
            >
              <span>Manage ({events.length})</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {events.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {evt.poster_url ? (
                    <img
                      src={getPosterUrl(evt.poster_url)}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, evt.poster_url)}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 ${evt.poster_url ? 'hidden' : 'flex'}`}>
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-0.5 truncate flex-1">
                  <span className="text-[10px]  font-bold uppercase tracking-wider text-blue-700">
                    {evt.category}
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {evt.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px]  text-slate-500">
                    <span>{formatDate(evt.event_date)}</span>
                    <span>·</span>
                    <span className="text-blue-700 font-bold">
                      {evt.seats_left !== null ? `${evt.seats_left} seats left` : 'Open'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link to="/admin/events" className="w-full block">
              <Button variant="secondary" size="sm" className="w-full" icon={Plus}>
                Create New Campus Event
              </Button>
            </Link>
          </div>
        </AnimatedSection>

      </div>

    </div>
  );
};

export default Dashboard;
