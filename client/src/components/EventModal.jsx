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
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building,
  Sparkles,
  ArrowRight,
  Trophy
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getPosterUrl, handleImageError } from '../utils/imageUrl';
import StructuredEventGuide from './StructuredEventGuide';


const EventModal = ({ eventId, onClose, onOpenRegister }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch event details
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

    // Prevent background scroll while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
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
        <div className="text-center py-3 px-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-medium">
          Administrator Mode. Review student applications in the Admin Requests Queue.
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            onClose();
            window.location.href = '/login';
          }}
          icon={ArrowRight}
          iconPosition="right"
        >
          Sign in with FXEC Email to Register
        </Button>
      );
    }

    if (userStatus === 'ranked') {
      return (
        <div className="w-full py-3.5 px-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between text-amber-900 text-sm font-bold shadow-xs">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-600 fill-amber-500" />
            <span>Rank {event.user_rank_position?.toUpperCase()} Awarded!</span>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 bg-amber-200/80 rounded-xl text-amber-900">
            +{event.user_rank_points_awarded || event.reward_points} PTS Credited
          </span>
        </div>
      );
    }

    if (userStatus === 'participated') {
      return (
        <div className="w-full py-3.5 px-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center gap-2.5 text-purple-900 text-sm font-bold shadow-xs">
          <Clock className="w-5 h-5 text-purple-600 animate-pulse" />
          <span>Certificate Submitted ✓ (Awaiting Admin Verification & Ranking)</span>
        </div>
      );
    }

    if (userStatus === 'registration_approved' || userStatus === 'approved') {
      return (
        <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2.5 text-emerald-900 text-sm font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Registration Approved ✓ (Seat Confirmed - Official Participant)</span>
        </div>
      );
    }

    if (userStatus === 'registered' || userStatus === 'pending') {
      return (
        <div className="space-y-3 w-full">
          <div className="w-full py-3.5 px-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center gap-2.5 text-blue-900 text-sm font-bold shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span>Registered ✓ (Proof Under Admin Review)</span>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
            onClick={() => window.location.href = '/my/requests'}
          >
            Track Status in Applied Events
          </Button>
        </div>
      );
    }

    if (userStatus === 'rejected') {
      return (
        <div className="space-y-3 w-full">
          {event.user_admin_note && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs">
              <span className="font-bold font-mono block mb-1 text-slate-600 uppercase tracking-wider text-[10px]">
                Admin Decision Note:
              </span>
              <span>{event.user_admin_note}</span>
            </div>
          )}
          <div className="w-full py-3 px-4 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-800 text-xs font-mono font-bold">
            Registration Rejected by Administrator (Cannot Register Again)
          </div>
        </div>
      );
    }

    if (isPastDeadline) {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-2xl font-mono font-bold text-xs bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed select-none"
        >
          Registration Closed (Deadline Passed)
        </button>
      );
    }

    if (isSeatsFull) {
      return (
        <button
          disabled
          className="w-full py-3.5 px-4 rounded-2xl font-mono font-bold text-xs bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed select-none"
        >
          Seats Full (Maximum Capacity Reached)
        </button>
      );
    }

    return (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => onOpenRegister(event)}
        icon={ArrowRight}
        iconPosition="right"
      >
        Register for Event
      </Button>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div 
        className="relative bg-white text-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-modal-pop my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 transition-all shadow-md border border-slate-200/80 backdrop-blur-md cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-28 px-6 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Loading Event Specifications...
            </p>
          </div>
        ) : error ? (
          <div className="py-20 px-6 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold font-display text-slate-800">Unable to Load Event</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          </div>
        ) : event ? (
          <>
            {/* Scrollable Content Container */}
            <div className="overflow-y-auto flex-1">
              
              {/* Full Event Poster Display (Uncropped) */}
              {event.poster_url ? (
                <div className="w-full bg-slate-950/5 p-3 sm:p-5 flex flex-col items-center justify-center border-b border-slate-100">
                  <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-white flex items-center justify-center">
                    <img
                      src={getPosterUrl(event.poster_url)}
                      alt={event.title}
                      className="w-full h-auto max-h-[75vh] object-contain block mx-auto"
                      onError={(e) => handleImageError(e, event.poster_url)}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between w-full px-1">
                    <span className="text-[11px] font-mono text-slate-500 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Official Event Poster (Full Uncropped View)</span>
                    </span>
                    <a
                      href={getPosterUrl(event.poster_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Full Size</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-full py-12 px-6 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100/60 text-blue-900 text-center border-b border-slate-100">
                  <Calendar className="w-16 h-16 text-blue-600 mb-2 opacity-80" />
                  <span className="font-display font-extrabold text-lg">{event.title}</span>
                </div>
              )}


              {/* Event Details Body - Positioned At the Bottom of the Full Image */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Badges Row - Cleanly Placed Under Image */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide border shadow-xs ${
                        isInternal
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      {isInternal ? 'Inside College' : 'Outside College'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-xs">
                      {event.category}
                    </span>
                  </div>

                  {event.reward_points > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black bg-blue-600 text-white border border-blue-400 shadow-xs">
                      <Award className="w-3.5 h-3.5 text-white fill-current" />
                      <span>+{event.reward_points} Reward Points</span>
                    </span>
                  )}
                </div>

                {/* Title and Organizer */}
                <div>
                  <h2 
                    id="event-modal-title"
                    className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight leading-tight"
                  >
                    {event.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1.5 uppercase tracking-wider">
                    Organized by <span className="text-blue-700 font-bold">{event.organizer}</span>
                  </p>
                </div>

                {/* Info Grid for Schedule, Venue, Seat Limits & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 border border-blue-200/70">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Event Schedule
                      </p>
                      <p className="font-semibold text-slate-900 text-xs mt-0.5">
                        {formatDateTime(event.event_date)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 border border-blue-200/70">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Campus Venue
                      </p>
                      <p className="font-semibold text-slate-900 text-xs mt-0.5">
                        {event.venue}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 border border-blue-200/70">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Seat Limit & Capacity
                      </p>
                      <p className="font-semibold text-slate-900 text-xs mt-0.5">
                        {event.max_seats ? (
                          <span className={isSeatsFull ? 'text-rose-600 font-bold' : 'text-blue-700 font-bold'}>
                            {isSeatsFull ? 'Seats Full' : `${seatsLeft} of ${event.max_seats} seats remaining`}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Open (Unlimited Seats)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0 border border-amber-200/70">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Registration Deadline
                      </p>
                      <p className="font-semibold text-slate-900 text-xs mt-0.5">
                        {event.registration_deadline ? formatDateTime(event.registration_deadline) : 'Same as event date'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Structured Student Event Guide (Separated Sections) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Student Event Guide & Breakdown</span>
                    </h4>
                    <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Step-by-Step Overview
                    </span>
                  </div>
                  <StructuredEventGuide description={event.description} />
                </div>

                {/* External Link */}
                {event.external_link && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">External Resource Portal</span>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-sm block">
                        {event.external_link}
                      </span>
                    </div>
                    <a
                      href={event.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 shadow-xs transition-colors shrink-0"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Footer */}
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
