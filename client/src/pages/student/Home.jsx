import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import EventCard from '../../components/EventCard';
import EventModal from '../../components/EventModal';
import RegisterModal from '../../components/RegisterModal';
import { 
  Search, 
  Filter, 
  Calendar, 
  Sparkles, 
  Compass, 
  MapPin, 
  Clock, 
  Layers, 
  AlertCircle,
  Zap
} from 'lucide-react';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Other'];

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'internal', 'external'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  // Modals state
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [registeringEvent, setRegisteringEvent] = useState(null);

  // Fetch events from server
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (upcomingOnly) params.upcoming = true;

      const res = await api.get('/events', { params });
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Unable to load campus events. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCategory, searchQuery, upcomingOnly]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Open detail modal
  const handleSelectEvent = (event) => {
    setSelectedEventId(event.id);
  };

  // Switch to register modal
  const handleOpenRegister = (event) => {
    setSelectedEventId(null);
    setRegisteringEvent(event);
  };

  // On registration request success
  const handleRegistrationSuccess = () => {
    setRegisteringEvent(null);
    // Reload events to reflect "Request Pending" immediately
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section (White and Blue) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 border border-blue-800 p-8 sm:p-12 shadow-xl shadow-blue-900/10 text-white">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-blue-600 to-transparent" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-mono font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>OFFICIAL FXEC EVENT PLATFORM</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Discover & Lead{' '}
              <span className="text-blue-300">
                Campus Innovations
              </span>
            </h1>
            
            <p className="text-blue-100/90 text-sm sm:text-base font-normal leading-relaxed">
              Explore internal hackathons, hands-on technology workshops, and prestigious external symposiums. Register with your verified college credentials to unlock attendance rewards.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls (White Card with Blue Highlights) */}
        <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5 shadow-sm shadow-blue-500/5 space-y-4">
          
          {/* Search bar & Type Toggles */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event title, venue, or organizer..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Inside / Outside Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedType === 'all'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 border border-blue-600'
                    : 'bg-slate-100 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setSelectedType('internal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedType === 'internal'
                    ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                Inside College
              </button>
              <button
                onClick={() => setSelectedType('external')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedType === 'external'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                Outside College
              </button>

              <button
                onClick={() => setUpcomingOnly(!upcomingOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition-all ${
                  upcomingOnly
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Upcoming Only
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              CATEGORY:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/25'
                    : 'bg-slate-100/80 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-blue-700" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadEvents}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse shadow-sm"
              >
                <div className="aspect-[16/10] bg-slate-100 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
                <div className="h-3 bg-slate-100 rounded-md w-full" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-slate-50/60 rounded-3xl border border-blue-100 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Events Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              We couldn't find any events matching your current filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedCategory('All');
                setUpcomingOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Responsive Events Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={handleSelectEvent}
              />
            ))}
          </div>
        )}

      </div>

      {/* Event Details Popup Modal */}
      {selectedEventId && (
        <EventModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onOpenRegister={handleOpenRegister}
        />
      )}

      {/* Center Dimmed Register Modal */}
      {registeringEvent && (
        <RegisterModal
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

    </div>
  );
};

export default Home;
