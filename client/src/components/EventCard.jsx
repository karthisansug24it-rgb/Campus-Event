import React from 'react';
import { Calendar, MapPin, Users, Award, Sparkles, ExternalLink } from 'lucide-react';

export default function EventCard({ event, onClick }) {
  const isInside = event.event_type === 'internal' || event.event_type === 'Inside College';

  // Format date nicely
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const posterSrc = event.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        <img
          src={posterSrc}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {/* Inside / Outside College Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-md backdrop-blur-md ${
              isInside
                ? 'bg-blue-600/90 text-white border border-blue-400/40'
                : 'bg-purple-600/90 text-white border border-purple-400/40'
            }`}
          >
            {isInside ? 'Inside College' : 'Outside College'}
          </span>

          {/* Category Badge */}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-900/80 text-slate-200 border border-white/10 backdrop-blur-md">
            {event.category}
          </span>
        </div>

        {/* Reward Points Badge */}
        {event.reward_points > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-amber-500/90 text-white font-bold text-xs rounded-full shadow-md backdrop-blur-md border border-amber-300/40">
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span>+{event.reward_points} pts</span>
          </div>
        )}

        {/* Date Overlay at bottom of poster */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{formattedDate} • {formattedTime}</span>
          </div>
          {event.seats_left !== null && (
            <span
              className={`px-2 py-1 rounded-lg font-semibold backdrop-blur-md ${
                event.seats_left <= 0
                  ? 'bg-rose-500/90 text-white'
                  : event.seats_left < 15
                  ? 'bg-amber-500/90 text-white'
                  : 'bg-emerald-600/90 text-white'
              }`}
            >
              {event.seats_left <= 0 ? 'Full' : `${event.seats_left} seats left`}
            </span>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
            {event.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1 truncate max-w-[170px]" title={event.venue}>
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          {/* Quick status pill */}
          {event.button_state && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                event.button_state === 'Registered ✓'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : event.button_state === 'Request Pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : event.button_state === 'Seats Full' || event.button_state === 'Registration Closed'
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-blue-50 text-blue-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors'
              }`}
            >
              {event.button_state}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
