import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trophy,
  XCircle,
  Users,
  MousePointer
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
import { getPosterUrl, handleImageError } from '../../utils/imageUrl';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Conference'];

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

  // Strictly only upcoming events by date, sorted chronologically (soonest first)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .filter(ev => {
        const evDate = new Date(ev.event_date);
        return !isNaN(evDate.getTime()) && evDate >= now;
      })
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }, [events]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sliderContainerRef = useRef(null);

  // Drag / Swipe State
  const [dragStartX, setDragStartX] = useState(null);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef(0);
  const isHorizontalSwipeRef = useRef(null);

  const activeSlideIndex = upcomingEvents.length > 0
    ? (currentSlideIndex % upcomingEvents.length + upcomingEvents.length) % upcomingEvents.length
    : 0;
  const currentUpcomingEvent = upcomingEvents[activeSlideIndex] || null;

  const handlePrevSlide = useCallback((e) => {
    e?.stopPropagation();
    setCurrentSlideIndex(prev => (prev - 1 + upcomingEvents.length) % upcomingEvents.length);
  }, [upcomingEvents.length]);

  const handleNextSlide = useCallback((e) => {
    e?.stopPropagation();
    setCurrentSlideIndex(prev => (prev + 1) % upcomingEvents.length);
  }, [upcomingEvents.length]);

  // Auto slide timer with pause on hover/touch
  useEffect(() => {
    if (upcomingEvents.length <= 1 || isPaused || isDragging) return;
    const interval = setInterval(() => {
      handleNextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [upcomingEvents.length, isPaused, isDragging, handleNextSlide]);

  // Touchpad horizontal scroll listener
  useEffect(() => {
    const el = sliderContainerRef.current;
    if (!el || upcomingEvents.length <= 1) return;

    let isCooldown = false;
    let accumulatedDeltaX = 0;
    let resetTimer = null;

    const handleWheel = (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (absX > absY && absX > 6) {
        e.preventDefault();
        setIsPaused(true);

        if (isCooldown) return;

        accumulatedDeltaX += e.deltaX;

        if (Math.abs(accumulatedDeltaX) >= 25) {
          isCooldown = true;
          if (accumulatedDeltaX > 0) {
            handleNextSlide();
          } else {
            handlePrevSlide();
          }
          accumulatedDeltaX = 0;

          setTimeout(() => {
            isCooldown = false;
          }, 450);
        }

        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          accumulatedDeltaX = 0;
        }, 200);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      clearTimeout(resetTimer);
    };
  }, [upcomingEvents.length, handleNextSlide, handlePrevSlide]);

  // Dedicated Native Touch Handlers for Mobile Phones & Tablets
  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    const touch = e.touches[0];
    setDragStartX(touch.clientX);
    touchStartYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = null;
    setDragDeltaX(0);
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || dragStartX === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const deltaY = touch.clientY - touchStartYRef.current;

    // Determine direction on initial movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      if (e.cancelable) e.preventDefault();
      setDragDeltaX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const swipeThreshold = 30; // Sensitive threshold for rapid phone touch response
    if (dragDeltaX < -swipeThreshold) {
      // Swiped right-to-left -> Next slide
      handleNextSlide();
    } else if (dragDeltaX > swipeThreshold) {
      // Swiped left-to-right -> Previous slide
      handlePrevSlide();
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragDeltaX(0);
    isHorizontalSwipeRef.current = null;
    setTimeout(() => setIsPaused(false), 2500);
  };

  // Pointer drag handlers for mouse on desktop
  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setDragStartX(e.clientX);
    setDragDeltaX(0);
    setIsDragging(true);
    setIsPaused(true);
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    if (!isDragging || dragStartX === null) return;
    setDragDeltaX(e.clientX - dragStartX);
  };

  const handlePointerUp = (e) => {
    if (e.pointerType === 'touch') return;
    if (!isDragging) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    if (Math.abs(dragDeltaX) > 35) {
      if (dragDeltaX < 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragDeltaX(0);
    setTimeout(() => setIsPaused(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      handleNextSlide();
    } else if (e.key === 'ArrowLeft') {
      handlePrevSlide();
    }
  };

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

        {/* 1. Highlight: Upcoming Events Slider ("view it as a slide with smooth animation only upcoming by date") */}
        {currentUpcomingEvent && (
          <AnimatedSection className="relative" delay={0.1}>
            <div 
              ref={sliderContainerRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => {
                if (!isDragging) setIsPaused(false);
              }}
              className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-9 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden transition-all duration-300 border border-blue-400/25 focus:outline-none focus:ring-2 focus:ring-blue-300/40"
            >
              {/* Background ambient glow shapes */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Slider Header Control Bar */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 mb-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-black tracking-wider uppercase shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>UPCOMING EVENTS<span className="hidden sm:inline"> · HAPPENING SOONEST</span></span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-mono font-semibold backdrop-blur-md">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    {getDaysRemainingText(currentUpcomingEvent.event_date)}
                  </span>
                </div>

                {/* Slider Controls (if multiple upcoming events) */}
                {upcomingEvents.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-blue-200/80 bg-white/10 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/15">
                      <MousePointer className="w-3 h-3 text-amber-300" />
                      <span>Scroll touchpad / swipe</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-200/90 bg-white/10 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/15">
                      {activeSlideIndex + 1} / {upcomingEvents.length}
                    </span>
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15 backdrop-blur-sm cursor-pointer"
                      aria-label="Previous upcoming event"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15 backdrop-blur-sm cursor-pointer"
                      aria-label="Next upcoming event"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport with overflow-hidden for genuine horizontal slide animation */}
              <div 
                className={`relative z-10 overflow-hidden w-full select-none touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ touchAction: 'pan-y' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div 
                  className="flex items-start will-change-transform"
                  style={{
                    transform: `translate3d(calc(-${activeSlideIndex * 100}% + ${dragDeltaX}px), 0, 0)`,
                    transition: isDragging ? 'none' : 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {upcomingEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="w-full shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center gap-6 sm:gap-8 px-0.5"
                    >
                      {/* Event Poster / Visual Preview - 100% Uncropped with Ambient Backdrop */}
                      <div 
                        onClick={() => {
                          if (Math.abs(dragDeltaX) < 8) handleSelectEvent(event);
                        }}
                        className="w-full lg:w-auto flex items-center justify-center shrink-0 self-center"
                      >
                        <div className="relative group cursor-pointer rounded-2xl overflow-hidden bg-black/30 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center transition-all duration-300 hover:border-white/40 hover:shadow-blue-950/40 w-full sm:w-[330px] md:w-[370px] max-h-[260px] sm:max-h-[320px] aspect-[16/10] sm:aspect-auto p-1">
                          {event.poster_url ? (
                            <>
                              {/* Ambient blurred backdrop so horizontal and vertical posters have zero dead space */}
                              <div 
                                className="absolute inset-0 bg-cover bg-center blur-lg scale-110 opacity-35 pointer-events-none"
                                style={{ backgroundImage: `url(${getPosterUrl(event.poster_url)})` }}
                              />
                              {/* 100% full uncropped image */}
                              <img
                                src={getPosterUrl(event.poster_url)}
                                alt={event.title}
                                className="relative z-10 w-full h-full max-h-[250px] sm:max-h-[310px] object-contain object-center rounded-xl shadow-md transition-transform duration-500 group-hover:scale-[1.02] block"
                                onError={(e) => handleImageError(e, event.poster_url)}
                              />
                              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl pointer-events-none z-20">
                                <span className="px-3 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-mono font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                  <span>View Full Poster</span>
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-48 sm:h-64 flex flex-col items-center justify-center bg-blue-900/60 rounded-xl text-blue-200">
                              <Calendar className="w-12 h-12 mb-2" />
                              <span className="text-xs font-mono font-medium">No Poster Available</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Event Details Narrative */}
                      <div className="flex-1 space-y-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {event.category && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/80 text-white text-xs font-mono font-bold backdrop-blur-md border border-blue-400/40">
                              {event.category}
                            </span>
                          )}
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/30 text-white text-xs font-mono font-semibold backdrop-blur-md border border-white/15">
                            {event.event_type === 'internal' ? 'Inside College' : 'Outside College'}
                          </span>
                          {event.reward_points > 0 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold">
                              <Award className="w-3.5 h-3.5 text-amber-300" />
                              <span>+{event.reward_points} PTS</span>
                            </span>
                          )}
                        </div>

                        <h2 
                          onClick={() => {
                            if (Math.abs(dragDeltaX) < 8) handleSelectEvent(event);
                          }}
                          className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight leading-snug cursor-pointer hover:text-blue-200 transition-colors"
                        >
                          {event.title}
                        </h2>

                        <p className="text-sm text-blue-100/90 leading-relaxed line-clamp-2">
                          {event.description
                            ? event.description.replace(/^#{2,4}\s*[^\n]+\n*/gm, '').replace(/[-*•]\s*/g, '').replace(/\s+/g, ' ').trim()
                            : ''}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200 pt-1 font-sans">
                          <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <Calendar className="w-4 h-4 text-blue-300" />
                            <strong className="text-white">
                              {new Date(event.event_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </strong>
                          </span>
                          <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <MapPin className="w-4 h-4 text-blue-300" />
                            <span className="text-white truncate max-w-[200px]">{event.venue}</span>
                          </span>
                          {event.max_seats ? (
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                              <Users className="w-4 h-4 text-blue-300" />
                              <span className="text-white">
                                {event.is_seats_full ? 'Seats Full' : `${event.seats_left} seats left`}
                              </span>
                            </span>
                          ) : null}
                        </div>

                        {/* Action Buttons: strictly prevent registering again if already registered */}
                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSelectEvent(event)}
                            className="px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-all flex items-center gap-2 shadow-md shadow-black/10 active:scale-95 cursor-pointer"
                          >
                            <span>View Specifications</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>

                          {/* Registration Status Check */}
                          {event.user_request_status === 'ranked' ? (
                            <span className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm">
                              <Trophy className="w-4 h-4 text-amber-900 fill-amber-800" />
                              <span>Rank {event.user_rank_position?.toUpperCase()} Awarded (+{event.user_rank_points_awarded || event.reward_points} PTS)</span>
                            </span>
                          ) : event.user_request_status === 'participated' ? (
                            <span className="px-5 py-2.5 rounded-xl bg-purple-500/90 text-white font-bold text-xs flex items-center gap-2 border border-purple-300 shadow-md backdrop-blur-md">
                              <Clock className="w-4 h-4 animate-pulse" />
                              <span>Participated (Cert Uploaded)</span>
                            </span>
                          ) : (event.user_request_status === 'registration_approved' || event.user_request_status === 'approved') ? (
                            <div className="flex items-center gap-2">
                              <span className="px-5 py-2.5 rounded-xl bg-emerald-500/95 text-white font-bold text-xs flex items-center gap-2 border border-emerald-300 shadow-md backdrop-blur-md">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                <span>Registered ✓ (Seat Confirmed)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => window.location.href = '/my/requests'}
                                className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1 border border-white/20 backdrop-blur-sm cursor-pointer"
                              >
                                <span>Track Status</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (event.user_request_status === 'registered' || event.user_request_status === 'pending') ? (
                            <div className="flex items-center gap-2">
                              <span className="px-5 py-2.5 rounded-xl bg-blue-500/95 text-white font-bold text-xs flex items-center gap-2 border border-blue-300 shadow-md backdrop-blur-md">
                                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                <span>Registered ✓ (Under Review)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => window.location.href = '/my/requests'}
                                className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1 border border-white/20 backdrop-blur-sm cursor-pointer"
                              >
                                <span>Track Status</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : event.user_request_status === 'rejected' ? (
                            <span className="px-5 py-2.5 rounded-xl bg-rose-500/90 text-white font-bold text-xs flex items-center gap-2 border border-rose-300 shadow-md">
                              <XCircle className="w-4 h-4" />
                              <span>Registration Rejected</span>
                            </span>
                          ) : (
                            /* Not registered yet */
                            event.is_past_deadline ? (
                              <span className="px-5 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 font-bold text-xs border border-white/10">
                                Registration Closed
                              </span>
                            ) : event.is_seats_full ? (
                              <span className="px-5 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 font-bold text-xs border border-white/10">
                                Seats Full
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenRegister(event)}
                                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-950/20 active:scale-95 cursor-pointer"
                              >
                                <span>Register Now</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Dots at Bottom */}
              {upcomingEvents.length > 1 && (
                <div className="relative z-20 flex items-center justify-center gap-2 pt-6 mt-2">
                  {upcomingEvents.map((ev, idx) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlideIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeSlideIndex 
                          ? 'w-8 bg-amber-400 shadow-sm' 
                          : 'w-2.5 bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Go to upcoming event slide ${idx + 1}: ${ev.title}`}
                    />
                  ))}
                </div>
              )}
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
          initialEvent={events.find(e => e.id === selectedEventId) || null}
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
