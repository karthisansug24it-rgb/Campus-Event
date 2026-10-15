import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Award, 
  Clock, 
  ArrowUpRight,
  Sparkles,
  Users
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { getPosterUrl, handleImageError } from '../utils/imageUrl';

const EventCard = ({ event, onSelect }) => {
  const isInternal = event.event_type === 'internal';
  const eventDate = new Date(event.event_date);
  const deadline = new Date(event.registration_deadline);
  const isPastDeadline = deadline < new Date();
  const seatsLeft = event.seats_left;
  const isSeatsFull = event.max_seats !== null && seatsLeft <= 0;

  // Format date cleanly: e.g. "24 Oct 2026"
  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const posterSrc = getPosterUrl(event.poster_url);

  return (
    <article
      onClick={() => onSelect(event)}
      className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-blue-500"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(event);
        }
      }}
      aria-label={`View details for ${event.title}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={event.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => handleImageError(e, event.poster_url)}
          />
        ) : null}

        {/* Fallback Display if no image or error */}
        <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100/60 ${event.poster_url ? 'hidden' : 'flex'}`}>
          <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-sm mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="font-display font-extrabold text-sm text-slate-800 line-clamp-2 leading-snug">
            {event.title}
          </span>
        </div>

        {/* Ambient Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Badges on Top */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none z-10">
          {/* Inside / Outside College Pill */}
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide shadow-sm backdrop-blur-md border ${
              isInternal
                ? 'bg-blue-600/90 text-white border-blue-500/80'
                : 'bg-white/95 text-slate-900 border-white/80'
            }`}
          >
            {isInternal ? 'Inside College' : 'Outside College'}
          </span>

          {/* Reward Points Badge */}
          {event.reward_points > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-blue-600 text-white border border-blue-400 shadow-sm backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-white fill-current" />
              <span>+{event.reward_points} PTS</span>
            </span>
          )}
        </div>

        {/* Registered status indicator if user has an existing request */}
        {event.user_request_status && (
          <div className="absolute bottom-3.5 left-3.5 z-10">
            {event.user_request_status === 'approved' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-blue-700 border border-blue-200 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Registered ✓</span>
              </span>
            )}
            {event.user_request_status === 'pending' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-blue-800 border border-blue-300 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Request Pending</span>
              </span>
            )}
            {event.user_request_status === 'rejected' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-slate-700 border border-slate-300 backdrop-blur-md">
                Rejected
              </span>
            )}
          </div>
        )}

        {/* Action arrow affordance in top right of card */}
        <div className="absolute bottom-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shadow-md">
          <ArrowUpRight className="w-4 h-4 text-blue-600" />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Category Chip & Date */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[10px] bg-blue-50 text-blue-700 border border-blue-200/80">
              {event.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Title with Space Grotesk / Display font */}
          <h3 className="font-display font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Description snippet */}
          <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed font-sans">
            {event.description}
          </p>
        </div>

        {/* Footer Meta: Venue & Seats info */}
        <div className="pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate text-slate-700 font-medium">{event.venue}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 truncate max-w-[170px]">
              By {event.organizer}
            </span>

            {/* Seat capacity badge */}
            {event.max_seats ? (
              <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                isSeatsFull ? 'text-slate-500' : 'text-blue-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSeatsFull ? 'bg-slate-400' : 'bg-blue-600'}`} />
                {isSeatsFull ? 'Seats Full' : `${seatsLeft} seats left`}
              </span>
            ) : (
              <span className="text-[11px] text-blue-700 font-mono font-bold">Open Seats</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
