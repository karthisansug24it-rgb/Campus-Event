import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import RegisterModal from '../../components/RegisterModal';
import { 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  Award,
  Loader2,
  RefreshCw,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { 
  PageHeader, 
  StatCard, 
  Button, 
  Badge, 
  SearchInput, 
  FilterChips, 
  EmptyState,
  AnimatedSection
} from '../../components/ui';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Re-apply modal state
  const [reapplyEvent, setReapplyEvent] = useState(null);

  const fetchMyRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/my/requests');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Could not load your registration requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status counts
  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        req.event_title?.toLowerCase().includes(q) ||
        req.venue?.toLowerCase().includes(q) ||
        req.category?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Registered ✓</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Request Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        <AnimatedSection delay={0.05}>
          <PageHeader
            badge="STUDENT PORTAL"
            title="Applied Events"
            subtitle="Track your campus application approvals, review administrator notes, and confirm your seats."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMyRequests}
                icon={RefreshCw}
                loading={loading}
              >
                Refresh Queue
              </Button>
            }
          />
        </AnimatedSection>

        {/* Real KPI Stat Cards */}
        <AnimatedSection className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={0.15}>
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
            <h4 className="text-2xl font-black font-mono text-slate-900 mt-1">{counts.total}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">All time applications</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600">Pending Review</p>
            <h4 className="text-2xl font-black font-mono text-blue-600 mt-1">{counts.pending}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Awaiting admin review</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">Approved Seats</p>
            <h4 className="text-2xl font-black font-mono text-emerald-600 mt-1">{counts.approved}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Confirmed attendances</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Rejected</p>
            <h4 className="text-2xl font-black font-mono text-slate-600 mt-1">{counts.rejected}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Eligible to re-apply</p>
          </div>
        </AnimatedSection>

        {/* Search & Filter Bar */}
        <AnimatedSection className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4" delay={0.2}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search my applications by event title or venue..."
            className="max-w-md"
          />

          <FilterChips
            options={[
              { value: 'all', label: 'All', count: counts.total },
              { value: 'pending', label: 'In Review', count: counts.pending },
              { value: 'approved', label: 'Approved', count: counts.approved },
              { value: 'rejected', label: 'Rejected', count: counts.rejected },
            ]}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
        </AnimatedSection>

        {/* Content Display */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Retrieving your registration records...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="primary" size="xs" onClick={fetchMyRequests}>
              Retry
            </Button>
          </div>
        ) : filteredRequests.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={Calendar}
            title={requests.length === 0 ? "No Event Requests Yet" : "No Matching Requests"}
            description={
              requests.length === 0 
                ? "You haven't requested registration for any campus events yet. Explore upcoming technical workshops, symposiums, and hackathons."
                : "No registration records match your current status filter or search keywords."
            }
            actionLabel={requests.length === 0 ? "Browse Events Catalogue" : "Reset Filter"}
            onAction={
              requests.length === 0 
                ? () => window.location.href = '/events'
                : () => { setStatusFilter('all'); setSearchQuery(''); }
            }
            actionIcon={ArrowRight}
          />
        ) : (
          /* Structured Requests List */
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div 
                key={req.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-5 items-start"
              >
                {/* Event Poster Thumbnail */}
                <div className="w-full md:w-52 aspect-[16/10] md:h-36 rounded-2xl bg-slate-900 overflow-hidden shrink-0 relative border border-slate-200/80 flex items-center justify-center p-1.5">
                  {req.poster_url ? (
                    <>
                      <img 
                        src={req.poster_url} 
                        alt="" 
                        aria-hidden="true" 
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-125 pointer-events-none" 
                      />
                      <img 
                        src={req.poster_url} 
                        alt={req.event_title} 
                        className="relative z-10 w-auto h-auto max-w-full max-h-full object-contain rounded-xl"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/70 text-blue-900 p-3 text-center">
                      <Calendar className="w-8 h-8 text-blue-600 mb-1" />
                      <span className="text-xs font-bold leading-snug line-clamp-2">{req.event_title}</span>
                    </div>
                  )}
                  <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xs z-20 ${
                    req.event_type === 'internal' ? 'bg-blue-600' : 'bg-slate-900'
                  }`}>
                    {req.event_type === 'internal' ? 'Inside' : 'Outside'}
                  </span>
                </div>

                {/* Main Event & Registration Details */}
                <div className="flex-1 space-y-3.5 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                        {req.category}
                      </span>
                      <h3 className="text-lg font-extrabold font-display text-slate-900 leading-snug mt-0.5">
                        {req.event_title}
                      </h3>
                    </div>
                    <div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Metadata Chips: Date & Venue */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Scheduled: <strong className="text-slate-800">{formatDate(req.event_date)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-slate-800 font-medium">{req.venue}</span>
                    </div>
                  </div>

                  {/* Student Submission Record */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono">
                    <span>Year: <strong className="text-slate-900">Year {req.year_of_study}</strong></span>
                    <span>Department: <strong className="text-slate-900">{req.department_name}</strong></span>
                    <span>Section: <strong className="text-slate-900">{req.section}</strong></span>
                    <span>Reg No: <strong className="text-blue-700 font-bold">{req.register_number}</strong></span>
                    <span className="text-slate-400">· Applied {formatDate(req.requested_at)}</span>
                  </div>

                  {/* Pending Request: Allow update before admin approval */}
                  {req.status === 'pending' && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                        <span className="font-medium">
                          Application under review by administrator. You can update your details before decision.
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        className="border-amber-400 text-amber-900 hover:bg-amber-100 font-bold shrink-0"
                        onClick={() => setReapplyEvent({
                          id: req.event_id,
                          title: req.event_title,
                          event_type: req.event_type,
                          isUpdate: true,
                          user_request_status: 'pending'
                        })}
                      >
                        Update Details
                      </Button>
                    </div>
                  )}

                  {/* Admin Rejection Feedback Box (No Re-registration allowed) */}
                  {req.status === 'rejected' && (
                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-slate-700 text-xs space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold font-mono text-rose-800 uppercase tracking-wide text-[10px]">
                            Administrator Rejection Note:
                          </p>
                          <p className="mt-0.5 text-slate-700 leading-relaxed font-sans">
                            {req.admin_note || 'Registration rejected by administrator.'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] font-mono text-rose-700 font-semibold">
                        <span>Decision Finalized</span>
                        <span>Re-registration is not permitted</span>
                      </div>
                    </div>
                  )}

                  {/* Approved Confirmation Note */}
                  {req.status === 'approved' && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-800">
                          Seat confirmed. Present your official FXEC identity card upon arrival at the venue.
                        </span>
                      </div>
                      {req.reward_points > 0 && (
                        <span className="font-mono font-black text-white bg-blue-600 px-2.5 py-1 rounded-xl text-[10px] shrink-0 shadow-xs">
                          +{req.reward_points} PTS EARNED
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Re-application Modal */}
      {reapplyEvent && (
        <RegisterModal
          event={reapplyEvent}
          onClose={() => setReapplyEvent(null)}
          onSuccess={() => {
            setReapplyEvent(null);
            fetchMyRequests();
          }}
        />
      )}
    </div>
  );
};

export default MyRequests;
