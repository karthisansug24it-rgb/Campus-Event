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
  AlertCircle 
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-college-950 via-college-900 to-college-800 text-white p-8 sm:p-12 shadow-xl shadow-college-950/20">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-transparent" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-college-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-4 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              FXEC Campus Events Portal
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Discover & Lead Campus Innovations
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
              Explore official internal symposiums, competitive hackathons, and state-level events. Register with your verified college email to earn points.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
          
          {/* Search bar & Type Toggles */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event title, venue, or organizer..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-college-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Inside / Outside Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedType === 'all'
                    ? 'bg-college-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setSelectedType('internal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedType === 'internal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inside College
              </button>
              <button
                onClick={() => setSelectedType('external')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedType === 'external'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Outside College
              </button>

              <button
                onClick={() => setUpcomingOnly(!upcomingOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  upcomingOnly
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Upcoming Only
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadEvents}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
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
                <div className="aspect-[16/10] bg-slate-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                </div>
                <div className="h-3 bg-slate-100 rounded-md w-full" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-college-50 text-college-600 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Events Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              We couldn't find any events matching your current filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedCategory('All');
                setUpcomingOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-college-700 text-white font-bold text-xs hover:bg-college-800 transition-colors"
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
