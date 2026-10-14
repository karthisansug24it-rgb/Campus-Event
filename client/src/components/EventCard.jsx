import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Award, 
  Users, 
  ExternalLink,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const EventCard = ({ event, onSelect }) => {
  const isInternal = event.event_type === 'internal';
  const eventDate = new Date(event.event_date);
  const deadline = new Date(event.registration_deadline);
  const isPastDeadline = deadline < new Date();
  const seatsLeft = event.seats_left;
  const isSeatsFull = event.max_seats !== null && seatsLeft <= 0;

  // Format date readable
  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div 
      onClick={() => onSelect(event)}
      className="group relative bg-[#0D101D] rounded-2xl border border-white/[0.08] hover:border-cyan-500/40 hover:shadow-glow-cyan transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1.5"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] bg-[#07080D] overflow-hidden">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#121628] to-[#07080D] text-white p-4 text-center">
            <Calendar className="w-10 h-10 mb-2 text-cyan-400" />
            <span className="font-extrabold text-base leading-snug">{event.title}</span>
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D101D] via-transparent to-black/40 pointer-events-none" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
          {/* Inside / Outside College Badge */}
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide shadow-md backdrop-blur-md border ${
              isInternal
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}
          >
            {isInternal ? 'Inside College' : 'Outside College'}
          </span>

          {/* Reward Points Badge */}
          {event.reward_points > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>+{event.reward_points} PTS</span>
            </span>
          )}
        </div>

        {/* Registered status indicator if student has an existing status */}
        {event.user_request_status && (
          <div className="absolute bottom-3 left-3 z-10">
            {event.user_request_status === 'approved' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-glow-emerald">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Registered ✓
              </span>
            )}
            {event.user_request_status === 'pending' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-glow-amber">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Request Pending
              </span>
            )}
            {event.user_request_status === 'rejected' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md">
                Rejected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Category Chip & Date Badge */}
          <div className="flex items-center justify-between gap-2 text-xs mb-2">
            <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[10px] bg-white/[0.04] text-cyan-300 border border-white/[0.08]">
              {event.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-white text-base group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Description snippet */}
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
            {event.description}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-3.5 border-t border-white/[0.06] space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate text-slate-300">{event.venue}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
              {event.organizer}
            </span>

            {/* Seats status */}
            {event.max_seats ? (
              <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                isSeatsFull ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSeatsFull ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                {isSeatsFull ? 'Seats Full' : `${seatsLeft} seats left`}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">Open Seats</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
