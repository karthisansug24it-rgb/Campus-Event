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
  RefreshCw
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Registered ✓ (Approved)</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Request Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-college-600" />
              My Registration Requests
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your event application approvals, review admin notes, and manage your campus registrations.
            </p>
          </div>
          <button
            onClick={fetchMyRequests}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-college-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Retrieving your requests...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>{error}</span>
          </div>
        ) : requests.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-college-50 text-college-600 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Event Requests Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              You haven't requested registration for any campus events. Discover upcoming workshops, symposiums, and hackathons now.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-college-700 hover:bg-college-800 text-white font-bold text-xs shadow-md transition-all shadow-college-700/20"
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
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 items-start"
              >
                {/* Event Poster Thumbnail */}
                <div className="w-full md:w-44 h-32 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                  {req.poster_url ? (
                    <img 
                      src={req.poster_url} 
                      alt={req.event_title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-college-900 text-white p-3 text-center">
                      <span className="text-xs font-bold leading-snug">{req.event_title}</span>
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    req.event_type === 'internal' ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}>
                    {req.event_type === 'internal' ? 'Inside' : 'Outside'}
                  </span>
                </div>

                {/* Main Details */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {req.category}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                        {req.event_title}
                      </h3>
                    </div>
                    <div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-college-600" />
                      <span>Event Date: <strong>{formatDate(req.event_date)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate">{req.venue}</span>
                    </div>
                  </div>

                  {/* Student Submission Record */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Year: <strong className="text-slate-900">Year {req.year_of_study}</strong></span>
                    <span>Department: <strong className="text-slate-900">{req.department_name}</strong></span>
                    <span>Section: <strong className="text-slate-900">{req.section}</strong></span>
                    <span>Reg No: <strong className="text-slate-900 font-mono">{req.register_number}</strong></span>
                    <span>Applied: <strong>{formatDate(req.requested_at)}</strong></span>
                  </div>

                  {/* Admin Rejection Note Box */}
                  {req.status === 'rejected' && (
                    <div className="p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-900 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Reason for Rejection from Admin:</p>
                          <p className="mt-0.5 text-rose-800">
                            {req.admin_note || 'No specific note provided by administrator.'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-rose-200/60 flex justify-end">
                        <button
                          onClick={() => setReapplyEvent({
                            id: req.event_id,
                            title: req.event_title,
                            event_type: req.event_type
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                        >
                          Register Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Approved Success Note */}
                  {req.status === 'approved' && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">Your seat has been reserved. Please carry your college ID card to the venue.</span>
                      </div>
                      {req.reward_points > 0 && (
                        <span className="font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[11px] shrink-0">
                          +{req.reward_points} pts on attendance
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
