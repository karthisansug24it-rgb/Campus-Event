import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import RegisterModal from '../../components/RegisterModal';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  MapPin,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reapplyEvent, setReapplyEvent] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/my/requests');
      if (res.data && res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch student requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
              <ClipboardList className="w-4 h-4" />
              <span>Student Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              My Event Registrations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your pending approval requests, confirmed seat registrations, and administrator notes.
            </p>
          </div>

          <Link
            to="/events"
            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
          >
            + Browse More Events
          </Link>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Registration Requests Yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              You haven't requested to participate in any events yet. Explore upcoming campus hackathons and workshops!
            </p>
            <Link
              to="/events"
              className="mt-5 inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              Browse Campus Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isApproved = req.status === 'approved';
              const isPending = req.status === 'pending';
              const isRejected = req.status === 'rejected';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5"
                >
                  {/* Poster Thumbnail */}
                  <div className="w-full md:w-44 aspect-[16/10] md:aspect-auto md:h-32 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative">
                    <img
                      src={req.event_poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                      alt={req.event_title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-white backdrop-blur-md">
                        {req.event_category}
                      </span>
                    </div>
                  </div>

                  {/* Request & Event Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {isPending && <Clock className="w-4 h-4 text-amber-600" />}
                          {isRejected && <XCircle className="w-4 h-4 text-rose-600" />}
                          <span>
                            {isApproved ? 'Registered ✓' : isPending ? 'Request Pending' : 'Request Rejected'}
                          </span>
                        </span>

                        <span className="text-xs text-slate-400">
                          Requested on {formatDate(req.created_at)}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {req.event_title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {formatDate(req.event_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {req.event_venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {req.event_organizer}
                        </span>
                        {req.reward_points > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 fill-amber-500" />
                            {req.reward_points} pts
                          </span>
                        )}
                      </div>

                      {/* Admin Note if Rejected */}
                      {isRejected && req.admin_note && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                          <span className="font-bold text-rose-800 block mb-0.5">Admin Feedback:</span>
                          <p className="text-rose-700">{req.admin_note}</p>
                        </div>
                      )}

                      {/* Attendance Confirmation in Phase 2 */}
                      {req.attended && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Attendance Verified (+{req.reward_points} Points Credited)
                        </div>
                      )}
                    </div>

                    {/* Re-apply Action if Rejected */}
                    {isRejected && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          You may update your section or details and submit again.
                        </span>
                        <button
                          onClick={() =>
                            setReapplyEvent({
                              id: req.event_id,
                              title: req.event_title
                            })
                          }
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Register Again</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Centered Register Modal for re-applying */}
      {reapplyEvent && (
        <RegisterModal
          event={reapplyEvent}
          onClose={() => setReapplyEvent(null)}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
