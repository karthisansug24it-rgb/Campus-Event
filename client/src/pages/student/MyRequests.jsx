import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Registered ✓ (Approved)</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Request Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#07080D] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0D101D] p-6 rounded-3xl border border-white/[0.08] shadow-glass">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-cyan-400" />
              My Registration Requests
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track your event application approvals, review admin notes, and manage your campus registrations.
            </p>
          </div>
          <button
            onClick={fetchMyRequests}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-cyan-300 text-xs font-mono font-bold border border-white/[0.08] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400 font-mono">Retrieving your requests...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : requests.length === 0 ? (
          /* Empty State */
          <div className="bg-[#0D101D] rounded-3xl border border-white/[0.08] p-12 text-center shadow-glass">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Event Requests Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              You haven't requested registration for any campus events. Discover upcoming workshops, symposiums, and hackathons now.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs shadow-glow-cyan transition-all hover:from-cyan-300 hover:to-blue-400"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Requests List */
          <div className="space-y-4">
            {requests.map((req) => (
              <div 
                key={req.id}
                className="bg-[#0D101D] rounded-3xl border border-white/[0.08] p-5 sm:p-6 shadow-card hover:border-cyan-500/30 transition-all flex flex-col md:flex-row gap-5 items-start"
              >
                {/* Event Poster Thumbnail */}
                <div className="w-full md:w-48 h-32 rounded-2xl bg-[#07080D] overflow-hidden shrink-0 relative border border-white/[0.06]">
                  {req.poster_url ? (
                    <img 
                      src={req.poster_url} 
                      alt={req.event_title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#121628] to-[#07080D] text-white p-3 text-center">
                      <span className="text-xs font-bold leading-snug">{req.event_title}</span>
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white shadow-md ${
                    req.event_type === 'internal' ? 'bg-emerald-600/90' : 'bg-purple-600/90'
                  }`}>
                    {req.event_type === 'internal' ? 'Inside' : 'Outside'}
                  </span>
                </div>

                {/* Main Details */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        {req.category}
                      </span>
                      <h3 className="text-lg font-black text-white leading-snug mt-0.5">
                        {req.event_title}
                      </h3>
                    </div>
                    <div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Event Date: <strong className="text-slate-200">{formatDate(req.event_date)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span className="truncate text-slate-200">{req.venue}</span>
                    </div>
                  </div>

                  {/* Student Submission Record */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                    <span>Year: <strong className="text-white">Year {req.year_of_study}</strong></span>
                    <span>Department: <strong className="text-white">{req.department_name}</strong></span>
                    <span>Section: <strong className="text-white">{req.section}</strong></span>
                    <span>Reg No: <strong className="text-cyan-300">{req.register_number}</strong></span>
                    <span>Applied: <strong className="text-slate-300">{formatDate(req.requested_at)}</strong></span>
                  </div>

                  {/* Admin Rejection Note Box */}
                  {req.status === 'rejected' && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold font-mono text-rose-300">Reason for Rejection from Administrator:</p>
                          <p className="mt-0.5 text-slate-300">
                            {req.admin_note || 'No specific note provided by administrator.'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-rose-500/20 flex justify-end">
                        <button
                          onClick={() => setReapplyEvent({
                            id: req.event_id,
                            title: req.event_title,
                            event_type: req.event_type
                          })}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          Register Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Approved Success Note */}
                  {req.status === 'approved' && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-glow-emerald">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-slate-200">Seat reserved. Please present your official FXEC identity card upon arrival at the venue.</span>
                      </div>
                      {req.reward_points > 0 && (
                        <span className="font-mono font-black text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-lg text-[10px] shrink-0 border border-amber-500/30 shadow-glow-amber">
                          +{req.reward_points} PTS UPON ATTENDANCE
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
