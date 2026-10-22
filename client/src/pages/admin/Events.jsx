import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Clock, 
  X, 
  Upload, 
  AlertCircle, 
  Loader2, 
  Search,
  FileText,
  Check,
  PlusCircle,
  Tag,
  History,
  UserCheck
} from 'lucide-react';
import { 
  PageHeader, 
  Button, 
  IconButton, 
  Badge, 
  SearchInput, 
  ConfirmDialog, 
  EmptyState,
  AnimatedSection
} from '../../components/ui';
import { getPosterUrl, handleImageError } from '../../utils/imageUrl';
import EventAttendeesModal from '../../components/admin/EventAttendeesModal';

const CATEGORIES = [
  'All', 
  'Hackathon', 
  'Symposium', 
  'Job Fair', 
  'Workshop', 
  'Conference', 
  'Seminar', 
  'Cultural', 
  'Sports', 
  'Other'
];



const initialForm = {
  title: '',
  description: '',
  event_type: 'internal',
  category: '',
  venue: '',
  organizer: '',
  event_date: '',
  registration_deadline: '',
  max_seats: '',
  reward_points: '' // Strictly provided by Admin only
};

const Events = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'internal', 'external'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTimeline, setSelectedTimeline] = useState('all'); // 'all', 'upcoming', 'past'

  // Registered Students Viewer Modal state
  const [viewingAttendeesEvent, setViewingAttendeesEvent] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [posterOrientation, setPosterOrientation] = useState('landscape'); // 'vertical' or 'landscape'

  // Dynamic Topic Cards
  const [topicCards, setTopicCards] = useState([]);

  // Delete confirmation dialog state
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Auto-open modal if URL has ?create=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      handleOpenCreateModal();
      navigate('/admin/events', { replace: true });
    }
  }, [location.search]);

  // Helper to convert ISO/MySQL datetime string to datetime-local input format (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalHeight > naturalWidth) {
      setPosterOrientation('vertical');
    } else {
      setPosterOrientation('landscape');
    }
  };

  const parseDescriptionForEdit = (rawDescription = '') => {
    if (!rawDescription) return { mainDesc: '', cards: [] };

    const sections = rawDescription.split(/(?=^###\s+)/m);
    let mainDesc = '';
    const cards = [];

    sections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (trimmed.startsWith('### ')) {
        const firstLineEnd = trimmed.indexOf('\n');
        if (firstLineEnd !== -1) {
          const title = trimmed.slice(4, firstLineEnd).trim().replace(/^[^\w\s]+\s*/, '');
          const content = trimmed.slice(firstLineEnd + 1).trim();
          cards.push({
            id: Date.now() + Math.random() + idx,
            name: title,
            details: content
          });
        } else {
          const title = trimmed.slice(4).trim().replace(/^[^\w\s]+\s*/, '');
          cards.push({
            id: Date.now() + Math.random() + idx,
            name: title,
            details: ''
          });
        }
      } else {
        if (mainDesc) {
          mainDesc += '\n\n' + trimmed;
        } else {
          mainDesc = trimmed;
        }
      }
    });

    return { mainDesc, cards };
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setFormData(initialForm);
    setTopicCards([]);
    setPosterFile(null);
    setPosterPreview(null);
    setPosterOrientation('landscape');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEventId(event.id);
    const { mainDesc, cards } = parseDescriptionForEdit(event.description);
    setFormData({
      title: event.title || '',
      description: mainDesc,
      event_type: event.event_type || 'internal',
      category: event.category || '',
      venue: event.venue || '',
      organizer: event.organizer || '',
      event_date: toDateTimeLocal(event.event_date),
      registration_deadline: toDateTimeLocal(event.registration_deadline || event.event_date),
      max_seats: event.max_seats !== undefined && event.max_seats !== null ? String(event.max_seats) : '',
      reward_points: event.reward_points !== undefined && event.reward_points !== null ? String(event.reward_points) : ''
    });
    setTopicCards(cards);
    setPosterFile(null);
    setPosterPreview(event.poster_url || null);
    setPosterOrientation('landscape');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setFormData(initialForm);
    setTopicCards([]);
    setPosterFile(null);
    setPosterPreview(null);
    setPosterOrientation('landscape');
    setModalError('');
  };

  const processFile = (file) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setModalError('Only JPG, PNG, and WebP poster images are supported.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setModalError('Poster file exceeds 8 MB limit.');
      return;
    }

    setModalError('');
    setPosterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTopicCard = () => {
    setTopicCards((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name: '', details: '' }
    ]);
  };

  const handleRemoveTopicCard = (id) => {
    setTopicCards((prev) => prev.filter((card) => card.id !== id));
  };

  const handleTopicCardChange = (id, field, value) => {
    setTopicCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    // Validations
    if (!formData.title.trim()) {
      setModalError('Event title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setModalError('Description is required.');
      return;
    }
    if (!formData.category.trim()) {
      setModalError('Category is required.');
      return;
    }
    if (!formData.venue.trim()) {
      setModalError('Venue / location is required.');
      return;
    }
    if (!formData.organizer.trim()) {
      setModalError('Organizer name or department is required.');
      return;
    }
    if (!formData.event_date) {
      setModalError('Event date and time is required.');
      return;
    }
    if (formData.reward_points === '' || formData.reward_points === null || formData.reward_points === undefined) {
      setModalError('Please provide Reward Points for students (Admin specified).');
      return;
    }

    setModalSubmitting(true);
    try {
      let finalDescription = formData.description.trim();
      if (topicCards.length > 0) {
        topicCards.forEach((card) => {
          if (card.name.trim() && card.details.trim()) {
            finalDescription += `\n\n### ${card.name.trim()}\n${card.details.trim()}`;
          }
        });
      }

      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', finalDescription);
      data.append('event_type', formData.event_type);
      data.append('category', formData.category);
      data.append('venue', formData.venue.trim());
      data.append('organizer', formData.organizer.trim());
      // Send datetime in YYYY-MM-DD HH:mm:ss format
      const formatLocalToMySQL = (val) => {
        if (!val) return '';
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      data.append('event_date', formatLocalToMySQL(formData.event_date));
      data.append('registration_deadline', formatLocalToMySQL(formData.registration_deadline || formData.event_date));
      
      data.append('max_seats', formData.max_seats ? formData.max_seats : '');

      data.append('reward_points', formData.reward_points || 0);

      if (posterFile) {
        data.append('poster', posterFile);
      } else if (posterPreview && !posterPreview.startsWith('data:')) {
        data.append('poster_url', posterPreview);
      }

      if (editingEventId) {
        // Update existing event
        const res = await api.put(`/events/${editingEventId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showToast('Event updated successfully.', 'success');
          handleCloseModal();
          fetchEvents();
        }
      } else {
        // Create new event
        const res = await api.post('/events', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showToast('New campus event published successfully.', 'success');
          handleCloseModal();
          fetchEvents();
        }
      }
    } catch (err) {
      console.error('Save event failed:', err);
      const msg = err.response?.data?.message || 'Failed to save event. Check required fields.';
      setModalError(msg);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/events/${deletingEvent.id}`);
      if (res.data.success) {
        showToast(`Event "${deletingEvent.title}" removed.`, 'info');
        setDeletingEvent(null);
        fetchEvents();
      }
    } catch (err) {
      console.error('Delete event error:', err);
      const msg = err.response?.data?.message || 'Failed to delete event.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Timeline counts
  const timelineCounts = React.useMemo(() => {
    const now = new Date();
    let upcoming = 0;
    let past = 0;
    events.forEach((e) => {
      const isPast = e.is_past_event !== undefined 
        ? e.is_past_event 
        : new Date(e.event_date) < now;
      if (isPast) past++;
      else upcoming++;
    });
    return { all: events.length, upcoming, past };
  }, [events]);

  // Filtered events
  const filteredEvents = events.filter((evt) => {
    const now = new Date();
    const isPast = evt.is_past_event !== undefined 
      ? evt.is_past_event 
      : new Date(evt.event_date) < now;

    if (selectedTimeline === 'upcoming' && isPast) return false;
    if (selectedTimeline === 'past' && !isPast) return false;

    const matchesType = selectedType === 'all' || evt.event_type === selectedType;
    const matchesCat = selectedCategory === 'All' || evt.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q || 
      evt.title.toLowerCase().includes(q) ||
      evt.venue.toLowerCase().includes(q) ||
      evt.organizer.toLowerCase().includes(q);
    return matchesType && matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-800">
      
      {/* Top Header */}
      <AnimatedSection delay={0.05}>
        <PageHeader
          badge="EVENTS REPOSITORY"
          title="Campus Events Manager"
          subtitle="Publish, curate, and configure Francis Xavier Engineering College technical programs, symposia, and opportunities."
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateModal}
              icon={Plus}
              className="font-extrabold shadow-md shadow-blue-600/25"
            >
              Create Event
            </Button>
          }
        />
      </AnimatedSection>

      {/* Filter and Search Bar */}
      <AnimatedSection className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4" delay={0.15}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search events by title, organizer, or venue..."
            className="max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeline Filter: All / Upcoming / Past */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedTimeline('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedTimeline === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                All ({timelineCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTimeline('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedTimeline === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                Upcoming ({timelineCounts.upcoming})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTimeline('past')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedTimeline === 'past'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                <History className="w-3 h-3" />
                <span>Past Events ({timelineCounts.past})</span>
              </button>
            </div>

            {/* Type Filter: All / Inside / Outside */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedType === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                All Types
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('internal')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedType === 'internal'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Inside
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('external')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedType === 'external'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Outside
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            CATEGORY:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'bg-slate-100/70 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </AnimatedSection>

      {/* Events Table Container */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Loading Events Directory...
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="primary" size="xs" onClick={fetchEvents}>
            Retry
          </Button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Events Found"
          description={
            events.length === 0
              ? "You haven't created any campus events yet. Publish your first technical event or symposium."
              : "No events match your current search keywords or category filters."
          }
          actionLabel={events.length === 0 ? "Publish First Event" : "Clear Filters"}
          onAction={
            events.length === 0
              ? handleOpenCreateModal
              : () => { setSearchQuery(''); setSelectedType('all'); setSelectedCategory('All'); }
          }
          actionIcon={Plus}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-4 px-6">Event & Timeline</th>
                  <th className="py-4 px-4">Category / Type</th>
                  <th className="py-4 px-4">Schedule & Venue</th>
                  <th className="py-4 px-4">Registered Students</th>
                  <th className="py-4 px-4">Reward Points</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => {
                  const isPast = evt.is_past_event !== undefined 
                    ? evt.is_past_event 
                    : new Date(evt.event_date) < new Date();

                  return (
                    <tr key={evt.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Poster & Title with Past/Upcoming Badge */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                            {evt.poster_url ? (
                              <img
                                src={getPosterUrl(evt.poster_url)}
                                alt={evt.title}
                                className="w-full h-full object-cover"
                                onError={(e) => handleImageError(e, evt.poster_url)}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 ${evt.poster_url ? 'hidden' : 'flex'}`}>
                              <Calendar className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="space-y-1 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              {isPast ? (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Completed · Past Event
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Upcoming Event
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold font-display text-slate-900 text-sm line-clamp-1">
                              {evt.title}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">
                              By {evt.organizer}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Type */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <Badge variant="blue" size="xs">
                            {evt.category}
                          </Badge>
                          <p className="text-[11px] font-mono text-slate-500 font-medium">
                            {evt.event_type === 'internal' ? 'Inside College' : 'Outside College'}
                          </p>
                        </div>
                      </td>

                      {/* Schedule & Venue */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-semibold text-slate-800">
                            {new Date(evt.event_date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-slate-500 truncate max-w-[200px]">
                            {evt.venue}
                          </p>
                        </div>
                      </td>

                      {/* Registered Students Quota */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-slate-900">
                              {evt.approved_count || 0}
                            </span>
                            <span className="text-slate-400">
                              / {evt.max_seats ? `${evt.max_seats} seats` : 'Unlimited'}
                            </span>
                          </div>
                          {evt.pending_count > 0 && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold">
                              {evt.pending_count} pending review
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reward Points */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Award className="w-3.5 h-3.5 text-blue-600" />
                          <span>+{evt.reward_points || 0} Pts</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Dedicated View Registered Students Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setViewingAttendeesEvent(evt)}
                            icon={Users}
                            className="text-blue-700 border-blue-200 hover:bg-blue-50 font-bold"
                          >
                            <span>Students ({evt.approved_count || 0})</span>
                          </Button>

                          <IconButton
                            icon={Edit3}
                            variant="outline"
                            size="sm"
                            label="Edit event"
                            onClick={() => handleOpenEditModal(evt)}
                          />
                          <IconButton
                            icon={Trash2}
                            variant="danger"
                            size="sm"
                            label="Delete event"
                            onClick={() => setDeletingEvent(evt)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Editor Modal (Create / Edit) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={!modalSubmitting ? handleCloseModal : undefined}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative bg-white text-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-modal-pop my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                  {editingEventId ? 'Edit Campus Event' : 'Publish New Campus Event'}
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Upload an event poster and enter all event details manually.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={modalSubmitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-7 space-y-5 flex-1">
              
              {modalError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Event Poster Upload Zone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Event Poster Image</span>
                  </label>
                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    JPG, PNG, WebP (Max 8MB)
                  </span>
                </div>
                
                {/* Poster Dropzone */}
                {/* Poster Dropzone - Adapts dynamically to Vertical or Horizontal poster */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-3 text-center bg-slate-50/60 hover:bg-blue-50/30 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/80'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {posterPreview ? (
                    <div className="relative group w-full flex items-center justify-center">
                      <img
                        src={getPosterUrl(posterPreview)}
                        alt="Poster Preview"
                        onLoad={handleImageLoad}
                        className={`w-auto max-w-full rounded-xl object-contain shadow-xs transition-all ${
                          posterOrientation === 'vertical'
                            ? 'max-h-[580px]'
                            : 'max-h-[380px]'
                        }`}
                        onError={(e) => handleImageError(e, posterPreview)}

                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Change Poster Image</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 space-y-2 pointer-events-none">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-md shadow-blue-600/20">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Drop event poster here, or <span className="text-blue-600 underline">browse</span>
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Description <span className="text-rose-500">*</span></span>
                </label>

                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Dynamic Topic Cards Added by clicking Add */}
              {topicCards.length > 0 && (
                <div className="space-y-3 pt-1">
                  {topicCards.map((topic, index) => (
                    <div
                      key={topic.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group transition-all animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          Topic #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopicCard(topic.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                            Topic Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={topic.name}
                            onChange={(e) => handleTopicCardChange(topic.id, 'name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                            Details <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={topic.details}
                            onChange={(e) => handleTopicCardChange(topic.id, 'details', e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Event Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Event Type
                  </label>
                  <select
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="internal">Inside College (Internal FXEC)</option>
                    <option value="external">Outside College (External Opportunity)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Venue & Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Venue / Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Event Date & Registration Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Event Date & Time <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="datetime-local"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Registration Deadline</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    Defaults to event date if left blank.
                  </p>
                </div>
              </div>

              {/* Seat Limiting Quota & Reward Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Seat Limit / Max Capacity</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">Optional</span>
                  </div>
                  <input
                    type="number"
                    name="max_seats"
                    min="1"
                    placeholder="e.g. 50, 100, 250 (Empty = Unlimited)"
                    value={formData.max_seats}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Limits maximum student approvals. Leave empty for unlimited seats.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reward Points <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    name="reward_points"
                    min="0"
                    placeholder="e.g. 50, 100"
                    value={formData.reward_points}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    Activity points credited to student upon attendance.
                  </p>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                >
                  Cancel
                </Button>

                <button
                  type="button"
                  onClick={handleAddTopicCard}
                  className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={modalSubmitting}
                >
                  {editingEventId ? 'Update Event' : 'Publish Event'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Campus Event"
        description={`Are you sure you want to delete "${deletingEvent?.title}"? All existing registration requests associated with this event will also be removed. This operation is permanent.`}
        confirmText="Confirm Delete"
        loading={isDeleting}
      />

      {/* Registered Students Modal (Upcoming & Past Events) */}
      <EventAttendeesModal
        eventId={viewingAttendeesEvent?.id}
        isOpen={Boolean(viewingAttendeesEvent)}
        onClose={() => setViewingAttendeesEvent(null)}
      />

    </div>
  );
};

export default Events;
