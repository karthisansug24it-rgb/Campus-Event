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

  // Featured event (first available event)
  const featuredEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Subtle decorative mesh background */}
        <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-50/70 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Narrative Column */}
            <AnimatedSection className="lg:col-span-7 space-y-6" delay={0.1}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-mono font-bold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>FRANCIS XAVIER ENGINEERING COLLEGE · EVENT HUB</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold font-display text-slate-900 tracking-tight leading-[1.08]">
                Find your next <br className="hidden sm:block" />
                <span className="text-blue-600">big moment.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-sans leading-relaxed max-w-xl">
                Explore premier hackathons, hands-on engineering workshops, cultural fests, and prestigious external symposiums. Register with your college credentials to claim official attendance points.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={scrollToDiscovery}
                  icon={ArrowDown}
                  iconPosition="right"
                >
                  Explore All Events
                </Button>
                
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono font-bold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{events.length} Live Opportunities</span>
                </div>
              </div>
            </AnimatedSection>

            {/* Right Featured Card Preview Column */}
            {featuredEvent ? (
              <AnimatedSection className="lg:col-span-5" delay={0.25} yOffset={32}>
                <div 
                  onClick={() => handleSelectEvent(featuredEvent)}
                  className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-blue-600/10 hover:border-blue-300 transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    {featuredEvent.poster_url ? (
                      <img
                        src={featuredEvent.poster_url}
                        alt={featuredEvent.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                        <Calendar className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-600 text-white shadow-sm border border-blue-400">
                        Featured Event
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/95 text-slate-800 backdrop-blur-md">
                        {featuredEvent.category}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs font-mono text-blue-200 font-semibold mb-1">
                        {new Date(featuredEvent.event_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })} · {featuredEvent.venue}
                      </p>
                      <h3 className="font-display font-black text-xl leading-snug line-clamp-2">
                        {featuredEvent.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 flex items-center justify-between text-xs bg-white">
                    <span className="text-slate-500 font-medium">
                      Organized by <strong className="text-slate-800">{featuredEvent.organizer}</strong>
                    </span>
                    <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>View Specifications</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </AnimatedSection>
            ) : null}

          </div>
        </div>
      </section>

      {/* Event Discovery Section */}
      <section 
        id="event-discovery" 
        ref={discoverySectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8"
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
