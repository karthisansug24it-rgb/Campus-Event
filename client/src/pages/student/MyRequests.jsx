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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Registered ✓ (Approved)</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
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
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-blue-100 shadow-sm shadow-blue-500/5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-600" />
              My Registration Requests
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your event application approvals, review admin notes, and manage your campus registrations.
            </p>
          </div>
          <button
            onClick={fetchMyRequests}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-mono font-bold border border-blue-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 font-mono">Retrieving your requests...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700" />
            <span>{error}</span>
          </div>
        ) : requests.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-50/70 rounded-3xl border border-blue-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Event Requests Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              You haven't requested registration for any campus events. Discover upcoming workshops, symposiums, and hackathons now.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 transition-all"
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
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start"
              >
                {/* Event Poster Thumbnail */}
                <div className="w-full md:w-48 h-32 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative border border-slate-200">
                  {req.poster_url ? (
                    <img 
                      src={req.poster_url} 
                      alt={req.event_title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-900 p-3 text-center">
                      <span className="text-xs font-bold leading-snug">{req.event_title}</span>
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white shadow-md ${
                    req.event_type === 'internal' ? 'bg-blue-600' : 'bg-blue-800'
                  }`}>
                    {req.event_type === 'internal' ? 'Inside' : 'Outside'}
                  </span>
                </div>

                {/* Main Details */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                        {req.category}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-snug mt-0.5">
                        {req.event_title}
                      </h3>
                    </div>
                    <div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Event Date: <strong className="text-slate-800">{formatDate(req.event_date)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate text-slate-800">{req.venue}</span>
                    </div>
                  </div>

                  {/* Student Submission Record */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                    <span>Year: <strong className="text-slate-900">Year {req.year_of_study}</strong></span>
                    <span>Department: <strong className="text-slate-900">{req.department_name}</strong></span>
                    <span>Section: <strong className="text-slate-900">{req.section}</strong></span>
                    <span>Reg No: <strong className="text-blue-700 font-bold">{req.register_number}</strong></span>
                    <span>Applied: <strong className="text-slate-700">{formatDate(req.requested_at)}</strong></span>
                  </div>

                  {/* Admin Rejection Note Box */}
                  {req.status === 'rejected' && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold font-mono text-slate-800">Reason for Rejection from Administrator:</p>
                          <p className="mt-0.5 text-slate-600">
                            {req.admin_note || 'No specific note provided by administrator.'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-end">
                        <button
                          onClick={() => setReapplyEvent({
                            id: req.event_id,
                            title: req.event_title,
                            event_type: req.event_type
                          })}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          Register Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Approved Success Note */}
                  {req.status === 'approved' && (
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-800">Seat reserved. Please present your official FXEC identity card upon arrival at the venue.</span>
                      </div>
                      {req.reward_points > 0 && (
                        <span className="font-mono font-black text-white bg-blue-600 px-2.5 py-1 rounded-lg text-[10px] shrink-0 shadow-sm">
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
