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
        <div className="text-center py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs font-mono font-medium">
          Administrator Mode. View and review student applications in Requests.
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
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-glow-cyan transition-all active:scale-[0.99]"
        >
          Sign in to Register
        </button>
      );
    }

    if (userStatus === 'approved') {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-2 cursor-default shadow-glow-emerald"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Registered ✓ (Confirmed Seat)</span>
        </button>
      );
    }

    if (userStatus === 'pending') {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-2 cursor-default shadow-glow-amber opacity-90"
        >
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Request Pending (In Review)</span>
        </button>
      );
    }

    if (userStatus === 'rejected') {
      return (
        <div className="space-y-3">
          {event.user_admin_note && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <span className="font-bold font-mono block mb-0.5 text-rose-400">Admin Feedback:</span>
              <span>{event.user_admin_note}</span>
            </div>
          )}
          <button
            onClick={() => onOpenRegister(event)}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
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
          className="w-full py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed"
        >
          Registration Closed
        </button>
      );
    }

    if (isSeatsFull) {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed"
        >
          Seats Full
        </button>
      );
    }

    return (
      <button
        onClick={() => onOpenRegister(event)}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-glow-cyan transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span>Register for Event</span>
      </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#0D101D] text-slate-100 rounded-3xl max-w-2xl w-full shadow-modal border border-white/[0.12] overflow-hidden animate-modal-pop my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 transition-colors shadow-md backdrop-blur-md border border-white/[0.1]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
            <p className="text-sm font-semibold text-slate-400 font-mono">Loading event specifications...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Failed to Load Event</h3>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.08] text-slate-200 font-semibold text-sm hover:bg-white/[0.15]"
            >
              Close
            </button>
          </div>
        ) : event ? (
          <>
            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto flex-1">
              
              {/* Event Poster Banner */}
              <div className="relative aspect-[16/9] w-full bg-[#07080D] overflow-hidden">
                {event.poster_url ? (
                  <img
                    src={event.poster_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#13182B] to-[#07080D] text-white p-6">
                    <Calendar className="w-16 h-16 text-cyan-400 opacity-80" />
                  </div>
                )}

                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D101D] via-transparent to-black/30" />

                {/* Overlaid Badges */}
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-10">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide shadow-md backdrop-blur-md border ${
                      isInternal
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}
                  >
                    {isInternal ? 'Inside College' : 'Outside College'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/[0.08] text-cyan-300 shadow-md backdrop-blur-md border border-white/[0.12]">
                    {event.category}
                  </span>
                  {event.reward_points > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber backdrop-blur-md">
                      <Award className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>+{event.reward_points} Reward Points</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Event Body Details */}
              <div className="p-6 sm:p-7 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {event.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">
                    Organized by <span className="text-slate-200">{event.organizer}</span>
                  </p>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-400 uppercase tracking-wider text-[10px]">Event Date & Time</p>
                      <p className="font-semibold text-slate-100 text-xs mt-0.5">{formatDateTime(event.event_date)}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-400 uppercase tracking-wider text-[10px]">Registration Deadline</p>
                      <p className={`font-semibold text-xs mt-0.5 ${isPastDeadline ? 'text-rose-400' : 'text-slate-100'}`}>
                        {formatDateTime(event.registration_deadline)}
                        {isPastDeadline && ' (Passed)'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-400 uppercase tracking-wider text-[10px]">Location / Venue</p>
                      <p className="font-semibold text-slate-100 text-xs mt-0.5">{event.venue}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-slate-400 uppercase tracking-wider text-[10px]">Seat Capacity</p>
                      <p className="font-semibold text-slate-100 text-xs mt-0.5">
                        {event.max_seats 
                          ? `${seatsLeft} available / ${event.max_seats} total`
                          : 'Unlimited Seats'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Event Overview
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06] font-sans">
                    {event.description}
                  </p>
                </div>

                {/* External Link */}
                {event.external_link && (
                  <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-200">Official Event Portal / Resources</span>
                    <a
                      href={event.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Register Action Bar */}
            <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0A0D18]">
              {renderRegisterButton()}
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
};

export default EventModal;
