import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Award,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function EventModal({ eventId, onClose, onOpenRegister }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, isStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchEventDetails() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/events/${eventId}`);
        if (isMounted && res.data && res.data.success) {
          setEvent(res.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load event details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (eventId) {
      fetchEventDetails();
    }

    // Keyboard Esc handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [eventId, onClose]);

  if (!eventId) return null;

  const isInside = event?.event_type === 'internal' || event?.event_type === 'Inside College';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isStudent) {
      alert('Only student accounts can register for events.');
      return;
    }
    onOpenRegister(event);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-modal border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-24 px-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium text-sm">Loading event details...</p>
          </div>
        ) : error ? (
          <div className="py-20 px-8 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-800 mb-1">Error Loading Event</h4>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        ) : event ? (
          <div className="overflow-y-auto flex-1 flex flex-col">
            {/* Top Poster Image */}
            <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full bg-slate-900 shrink-0">
              <img
                src={event.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                      isInside
                        ? 'bg-blue-600/90 text-white border border-blue-400/40'
                        : 'bg-purple-600/90 text-white border border-purple-400/40'
                    }`}
                  >
                    {isInside ? 'Inside College' : 'Outside College'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
                    {event.category}
                  </span>
                </div>

                {event.reward_points > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white font-extrabold text-xs rounded-full shadow-lg backdrop-blur-md">
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>+{event.reward_points} Reward Points</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Info Body */}
            <div className="p-6 sm:p-8 flex-1 space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {event.title}
                </h2>
                <p className="mt-2 text-sm text-slate-500 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Organized by <strong className="text-slate-700">{event.organizer}</strong></span>
                </p>
              </div>

              {/* Event Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</p>
                    <p className="font-bold text-slate-800">{formatDateTime(event.event_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Venue</p>
                    <p className="font-bold text-slate-800">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registration Deadline</p>
                    <p className={`font-bold ${event.is_registration_closed ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatDateTime(event.registration_deadline)}
                      {event.is_registration_closed && ' (Closed)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Seats Availability</p>
                    <p className="font-bold text-slate-800">
                      {event.max_seats === null ? (
                        'Open for all'
                      ) : (
                        <span>
                          <strong className={event.seats_left <= 0 ? 'text-rose-600' : 'text-emerald-700'}>
                            {event.seats_left} seats left
                          </strong>{' '}
                          <span className="text-slate-400 font-normal">/ {event.max_seats} total</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">About This Event</h4>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-white rounded-xl">
                  {event.description}
                </div>
              </div>

              {/* External Link */}
              {event.external_link && (
                <div className="pt-2">
                  <a
                    href={event.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Official Event / Problem Statement Link
                  </a>
                </div>
              )}

              {/* Status Note if rejected */}
              {event.student_request?.status === 'rejected' && event.student_request?.admin_note && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm">
                  <p className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Previous Request Rejected:
                  </p>
                  <p className="mt-1 text-rose-700">{event.student_request.admin_note}</p>
                  <p className="mt-2 text-xs text-rose-500">You may update your details and register again.</p>
                </div>
              )}

              {/* Modal Footer / Action Button */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  {event.button_state === 'Registered ✓' ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" /> Your registration has been approved!
                    </span>
                  ) : event.button_state === 'Request Pending' ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-sm">
                      <Hourglass className="w-4 h-4" /> Waiting for admin review
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    disabled={event.button_disabled}
                    onClick={handleRegisterClick}
                    className={`flex-1 sm:flex-none px-7 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                      event.button_state === 'Registered ✓'
                        ? 'bg-emerald-600 text-white cursor-default shadow-emerald-600/20'
                        : event.button_state === 'Request Pending'
                        ? 'bg-amber-500 text-white opacity-80 cursor-not-allowed shadow-amber-500/20'
                        : event.button_state === 'Registration Closed' || event.button_state === 'Seats Full'
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : event.button_state === 'Register Again'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:scale-[1.02]'
                    }`}
                  >
                    {event.button_state}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
