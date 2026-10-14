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
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1.5"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 p-4 text-center">
            <Calendar className="w-10 h-10 mb-2 text-blue-600" />
            <span className="font-extrabold text-base leading-snug">{event.title}</span>
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
          {/* Inside / Outside College Badge */}
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide shadow-md backdrop-blur-md border ${
              isInternal
                ? 'bg-blue-600/90 text-white border-blue-500'
                : 'bg-white/95 text-blue-900 border-blue-200'
            }`}
          >
            {isInternal ? 'Inside College' : 'Outside College'}
          </span>

          {/* Reward Points Badge */}
          {event.reward_points > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-blue-600 text-white border border-blue-500 shadow-sm backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-white fill-current" />
              <span>+{event.reward_points} PTS</span>
            </span>
          )}
        </div>

        {/* Registered status indicator if student has an existing status */}
        {event.user_request_status && (
          <div className="absolute bottom-3 left-3 z-10">
            {event.user_request_status === 'approved' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-blue-700 border border-blue-200 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Registered ✓
              </span>
            )}
            {event.user_request_status === 'pending' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-blue-800 border border-blue-300 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Request Pending
              </span>
            )}
            {event.user_request_status === 'rejected' && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-slate-700 border border-slate-300 backdrop-blur-md">
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
            <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
              {event.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Description snippet */}
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed font-sans">
            {event.description}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate text-slate-700">{event.venue}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
              {event.organizer}
            </span>

            {/* Seats status */}
            {event.max_seats ? (
              <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                isSeatsFull ? 'text-slate-500' : 'text-blue-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSeatsFull ? 'bg-slate-400' : 'bg-blue-600'}`} />
                {isSeatsFull ? 'Seats Full' : `${seatsLeft} seats left`}
              </span>
            ) : (
              <span className="text-[11px] text-blue-700 font-mono font-medium">Open Seats</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
