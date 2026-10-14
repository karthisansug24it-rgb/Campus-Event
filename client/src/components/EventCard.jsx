import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Award, 
  Users, 
  ExternalLink,
  Clock,
  Sparkles
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

  const formattedTime = eventDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      onClick={() => onSelect(event)}
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-xl hover:shadow-college-900/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-college-900 to-college-700 text-white p-4 text-center">
            <Calendar className="w-10 h-10 mb-2 opacity-80" />
            <span className="font-extrabold text-base leading-snug">{event.title}</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Inside / Outside College Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-md backdrop-blur-md ${
              isInternal
                ? 'bg-emerald-600/90 text-white'
                : 'bg-indigo-600/90 text-white'
            }`}
          >
            {isInternal ? 'Inside College' : 'Outside College'}
          </span>

          {/* Reward Points Badge */}
          {event.reward_points > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-md">
              <Award className="w-3.5 h-3.5 fill-current" />
              <span>+{event.reward_points} pts</span>
            </span>
          )}
        </div>

        {/* Registered status indicator if student has an existing status */}
        {event.user_request_status && (
          <div className="absolute bottom-3 left-3">
            {event.user_request_status === 'approved' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-md">
                Registered ✓
              </span>
            )}
            {event.user_request_status === 'pending' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                Request Pending
              </span>
            )}
            {event.user_request_status === 'rejected' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-md">
                Rejected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chip & Date Badge */}
          <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
            <span className="px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
              {event.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Clock className="w-3.5 h-3.5 text-college-600" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-college-600 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Description snippet */}
          <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          <div className="flex items-center justify-between pt-1 font-medium">
            <span className="text-[11px] text-slate-400 truncate max-w-[170px]">
              {event.organizer}
            </span>

            {/* Seats status */}
            {event.max_seats ? (
              <span className={`text-[11px] font-bold ${isSeatsFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                {isSeatsFull ? 'Seats Full' : `${seatsLeft} seats left`}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">Open Seats</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
