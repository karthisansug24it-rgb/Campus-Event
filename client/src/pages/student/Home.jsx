import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import EventCard from '../../components/EventCard';
import EventModal from '../../components/EventModal';
import RegisterModal from '../../components/RegisterModal';
import { 
  Search, 
  Calendar, 
  Sparkles, 
  ArrowDown, 
  ArrowRight,
  MapPin, 
  Clock, 
  Layers, 
  AlertCircle,
  Award,
  Compass,
  Filter,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  SectionHeading, 
  SearchInput, 
  FilterChips, 
  LoadingSkeleton, 
  EmptyState,
  AnimatedSection
} from '../../components/ui';

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

  const discoverySectionRef = useRef(null);

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
        const rawEvents = res.data.data || [];
        // Ensure upcoming events are sorted chronologically: soonest upcoming event first
        const now = new Date();
        const sorted = [...rawEvents].sort((a, b) => {
          const dateA = new Date(a.event_date);
          const dateB = new Date(b.event_date);
          const aUpcoming = dateA >= now;
          const bUpcoming = dateB >= now;

          if (aUpcoming && !bUpcoming) return -1;
          if (!aUpcoming && bUpcoming) return 1;
          return aUpcoming ? dateA - dateB : dateB - dateA;
        });

        setEvents(sorted);
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

    // Auto-refresh when tab gains focus so admin uploads appear immediately
    const handleFocus = () => loadEvents();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadEvents]);

  // Smooth scroll to event discovery section
  const scrollToDiscovery = () => {
    discoverySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    // Reload events to reflect status
    loadEvents();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('All');
    setUpcomingOnly(false);
  };

  // Soonest upcoming event (first in sorted events)
  const soonestEvent = events.length > 0 ? events[0] : null;

  const getDaysRemainingText = (eventDateStr) => {
    if (!eventDateStr) return '';
    const diff = new Date(eventDateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Concluded';
    if (days === 0) return 'Happening Today!';
    if (days === 1) return 'Happening Tomorrow!';
    return `Happening in ${days} days`;
  };

  return (
    <div className="w-full text-slate-800">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">

        {/* 1. Highlight: Soonest Upcoming Event ("Recent ah nadakapora event") */}
        {soonestEvent && (
          <AnimatedSection className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/15 relative overflow-hidden" delay={0.1}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center gap-6 sm:gap-8">
              {/* Event Poster / Visual Preview */}
              <div 
                onClick={() => handleSelectEvent(soonestEvent)}
                className="w-full lg:w-auto flex items-center justify-center shrink-0 self-center"
              >
                <div className="relative group cursor-pointer rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-1.5 flex items-center justify-center transition-all duration-300 hover:border-white/40 hover:shadow-blue-950/40 max-w-full">
                  {soonestEvent.poster_url ? (
                    <>
                      <img
                        src={soonestEvent.poster_url}
                        alt={soonestEvent.title}
                        className="w-auto h-auto max-h-[280px] sm:max-h-[340px] max-w-full sm:max-w-xs md:max-w-sm object-contain rounded-xl shadow-md transition-transform duration-300 group-hover:scale-[1.02] block"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl pointer-events-none">
                        <span className="px-3 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-mono font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Full Poster</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center bg-blue-900/60 rounded-xl text-blue-200">
                      <Calendar className="w-12 h-12 mb-2" />
                      <span className="text-xs font-mono font-medium">No Poster Available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details Narrative */}
              <div className="flex-1 space-y-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-black tracking-wider uppercase shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>NEXT UPCOMING EVENT · HAPPENING SOONEST</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-mono font-semibold backdrop-blur-md">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    {getDaysRemainingText(soonestEvent.event_date)}
                  </span>
                  {soonestEvent.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/80 text-white text-xs font-mono font-bold backdrop-blur-md border border-blue-400/40">
                      {soonestEvent.category}
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/30 text-white text-xs font-mono font-semibold backdrop-blur-md border border-white/15">
                    {soonestEvent.event_type === 'internal' ? 'Inside College' : 'Outside College'}
                  </span>
                </div>

                <h2 
                  onClick={() => handleSelectEvent(soonestEvent)}
                  className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight leading-snug cursor-pointer hover:text-blue-200 transition-colors"
                >
                  {soonestEvent.title}
                </h2>

                <p className="text-sm text-blue-100/90 leading-relaxed line-clamp-2">
                  {soonestEvent.description
                    ? soonestEvent.description.replace(/^#{2,4}\s*[^\n]+\n*/gm, '').replace(/[-*•]\s*/g, '').replace(/\s+/g, ' ').trim()
                    : ''}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200 pt-1 font-sans">
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <Calendar className="w-4 h-4 text-blue-300" />
                    <strong className="text-white">
                      {new Date(soonestEvent.event_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <MapPin className="w-4 h-4 text-blue-300" />
                    <span className="text-white truncate max-w-[200px]">{soonestEvent.venue}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span className="text-amber-300 font-bold">+{soonestEvent.reward_points} Points</span>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectEvent(soonestEvent)}
                    className="px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-all flex items-center gap-2 shadow-md shadow-black/10"
                  >
                    <span>View Specifications</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {soonestEvent.user_request_status === 'approved' ? (
                    <span className="px-5 py-2.5 rounded-xl bg-emerald-500/90 text-white font-bold text-xs flex items-center gap-2 border border-emerald-400 backdrop-blur-md">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registered ✓</span>
                    </span>
                  ) : soonestEvent.user_request_status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenRegister(soonestEvent)}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Pending (Update Details)</span>
                    </button>
                  ) : soonestEvent.user_request_status === 'rejected' ? (
                    <span className="px-5 py-2.5 rounded-xl bg-rose-500/80 text-white font-mono font-bold text-xs flex items-center gap-2 border border-rose-400">
                      <span>Registration Rejected</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenRegister(soonestEvent)}
                      className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs transition-all flex items-center gap-2 border border-blue-400"
                    >
                      <span>Register Now</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* 2. Event Discovery Filter Bar */}
        <section 
          id="event-discovery" 
          ref={discoverySectionRef}
          className="space-y-6"
        >
        
        {/* Discovery Filter Controls Bar */}
        <AnimatedSection className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5" delay={0.1}>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search events by title, organizer, or venue..."
              className="max-w-xl"
            />

            {/* Inside / Outside / Upcoming Type Toggles */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all select-none ${
                  selectedType === 'all'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 border border-blue-600'
                    : 'bg-slate-50 hover:bg-blue-50/60 text-slate-600 hover:text-blue-700 border border-slate-200'
                }`}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('internal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all select-none ${
                  selectedType === 'internal'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 border border-blue-600'
                    : 'bg-slate-50 hover:bg-blue-50/60 text-slate-600 hover:text-blue-700 border border-slate-200'
                }`}
              >
                Inside College
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('external')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all select-none ${
                  selectedType === 'external'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 border border-blue-600'
                    : 'bg-slate-50 hover:bg-blue-50/60 text-slate-600 hover:text-blue-700 border border-slate-200'
                }`}
              >
                Outside College
              </button>
              <button
                type="button"
                onClick={() => setUpcomingOnly(!upcomingOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition-all select-none ${
                  upcomingOnly
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50/60 hover:text-blue-700'
                }`}
              >
                Upcoming Only
              </button>
            </div>
          </div>

          {/* Category Filter Chips Row */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              CATEGORY:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all select-none ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-slate-100/70 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </AnimatedSection>

        {/* Section Heading & Counter */}
        <div className="flex items-center justify-between gap-4">
          <SectionHeading
            eyebrow="EXPLORE DISCOVERIES"
            title="Campus Events Catalogue"
            count={events.length}
            subtitle="Verified technical symposiums, workshops, and student initiatives"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={loadEvents}
              loading={loading}
            >
              Refresh
            </Button>
            {(searchQuery || selectedType !== 'all' || selectedCategory !== 'All' || upcomingOnly) && (
              <Button
                variant="outline"
                size="xs"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Server Error State */}
        {error && (
          <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="primary"
              size="xs"
              onClick={loadEvents}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <LoadingSkeleton count={6} />
        ) : events.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={Calendar}
            title="No Events Found"
            description="We couldn't find any events matching your selected search query or category filters."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          /* Responsive Events Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={handleSelectEvent}
              />
            ))}
          </div>
        )}

      </section>

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
