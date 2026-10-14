import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Award, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building,
  UserCheck,
  Sparkles
} from 'lucide-react';

const EventModal = ({ eventId, onClose, onOpenRegister }) => {
  const { isAuthenticated, isStudent, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch full event details including seats left and user request status
  useEffect(() => {
    let isMounted = true;
    const fetchEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/events/${eventId}`);
        if (isMounted && res.data.success) {
          setEvent(res.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load event details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvent();

    // Close on Escape key press
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

  const now = new Date();
  const isInternal = event?.event_type === 'internal';
  const deadline = event?.registration_deadline ? new Date(event.registration_deadline) : null;
  const isPastDeadline = deadline ? deadline < now : false;
  const seatsLeft = event?.seats_left;
  const isSeatsFull = event?.max_seats !== null && seatsLeft <= 0;
  const userStatus = event?.user_request_status;

  // Format Date & Times
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine button state and label
  const renderRegisterButton = () => {
    if (isAdmin) {
      return (
        <div className="text-center py-2.5 px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-medium">
          Administrator Mode. Review student applications in Requests.
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <button
          onClick={() => {
            onClose();
            window.location.href = '/login';
          }}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all active:scale-[0.99]"
        >
          Sign in to Register
        </button>
      );
    }

    if (userStatus === 'approved') {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center gap-2 cursor-default shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span>Registered ✓ (Confirmed Seat)</span>
        </button>
      );
    }

    if (userStatus === 'pending') {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center gap-2 cursor-default shadow-sm opacity-90"
        >
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Request Pending (In Review)</span>
        </button>
      );
    }

    if (userStatus === 'rejected') {
      return (
        <div className="space-y-3">
          {event.user_admin_note && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-300 text-blue-900 text-xs">
              <span className="font-bold font-mono block mb-0.5 text-blue-800">Admin Feedback:</span>
              <span>{event.user_admin_note}</span>
            </div>
          )}
          <button
            onClick={() => onOpenRegister(event)}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Register Again</span>
          </button>
        </div>
      );
    }

    if (isPastDeadline) {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
        >
          Registration Closed
        </button>
      );
    }

    if (isSeatsFull) {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
        >
          Seats Full
        </button>
      );
    }

    return (
      <button
        onClick={() => onOpenRegister(event)}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span>Register for Event</span>
      </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        className="relative bg-white text-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl shadow-blue-900/20 border border-blue-100 overflow-hidden animate-modal-pop my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 text-slate-600 hover:text-slate-900 hover:bg-white transition-colors shadow-md border border-slate-200"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold text-slate-500 font-mono">Loading event specifications...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to Load Event</h3>
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        ) : event ? (
          <>
            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto flex-1">
              
              {/* Event Poster Banner */}
              <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                {event.poster_url ? (
                  <img
                    src={event.poster_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 p-6">
                    <Calendar className="w-16 h-16 text-blue-600 opacity-80" />
                  </div>
                )}

                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                {/* Overlaid Badges */}
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-10">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide shadow-md backdrop-blur-md border ${
                      isInternal
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white/95 text-blue-900 border-blue-200'
                    }`}
                  >
                    {isInternal ? 'Inside College' : 'Outside College'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/95 text-blue-800 shadow-md backdrop-blur-md border border-blue-200">
                    {event.category}
                  </span>
                  {event.reward_points > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black bg-blue-600 text-white border border-blue-500 shadow-sm backdrop-blur-md">
                      <Award className="w-3.5 h-3.5 text-white fill-current" />
                      <span>+{event.reward_points} Reward Points</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Event Body Details */}
              <div className="p-6 sm:p-7 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {event.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">
                    Organized by <span className="text-blue-700 font-semibold">{event.organizer}</span>
                  </p>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">Event Date & Time</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">{formatDateTime(event.event_date)}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">Registration Deadline</p>
                      <p className={`font-semibold text-xs mt-0.5 ${isPastDeadline ? 'text-slate-500' : 'text-slate-800'}`}>
                        {formatDateTime(event.registration_deadline)}
                        {isPastDeadline && ' (Passed)'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">Location / Venue</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">{event.venue}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">Seat Capacity</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">
                        {event.max_seats 
                          ? `${seatsLeft} available / ${event.max_seats} total`
                          : 'Unlimited Seats'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Event Overview
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-sans">
                    {event.description}
                  </p>
                </div>

                {/* External Link */}
                {event.external_link && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-900">Official Event Portal / Resources</span>
                    <a
                      href={event.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 underline font-mono"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Register Action Bar */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
              {renderRegisterButton()}
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
};

export default EventModal;
