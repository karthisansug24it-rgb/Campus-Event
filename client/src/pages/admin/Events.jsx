import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink, 
  Clock, 
  X, 
  Upload, 
  AlertCircle, 
  Loader2, 
  Search,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { 
  PageHeader, 
  Button, 
  IconButton, 
  Badge, 
  SearchInput, 
  FilterChips, 
  ConfirmDialog, 
  EmptyState,
  AnimatedSection
} from '../../components/ui';
import { getPosterUrl, handleImageError } from '../../utils/imageUrl';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Other'];

const initialForm = {
  title: '',
  description: '',
  event_type: 'internal',
  category: 'Hackathon',
  venue: '',
  organizer: '',
  event_date: '',
  registration_deadline: '',
  max_seats: '',
  reward_points: '0',
  external_link: ''
};

const Events = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'internal', 'external'
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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

  // Helper to convert ISO/MySQL datetime string to datetime-local input format (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setFormData(initialForm);
    setPosterFile(null);
    setPosterPreview(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || 'internal',
      category: event.category || 'Hackathon',
      venue: event.venue || '',
      organizer: event.organizer || '',
      event_date: toDateTimeLocal(event.event_date),
      registration_deadline: toDateTimeLocal(event.registration_deadline),
      max_seats: event.max_seats !== null ? String(event.max_seats) : '',
      reward_points: String(event.reward_points || 0),
      external_link: event.external_link || ''
    });
    setPosterFile(null);
    setPosterPreview(event.poster_url || null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setFormData(initialForm);
    setPosterFile(null);
    setPosterPreview(null);
    setModalError('');
  };

  const processFile = (file) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setModalError('Only JPG, PNG, and WebP poster images are supported.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setModalError('Poster file exceeds 2 MB limit.');
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
    if (!formData.registration_deadline) {
      setModalError('Registration deadline is required.');
      return;
    }

    if (new Date(formData.registration_deadline) > new Date(formData.event_date)) {
      setModalError('Registration deadline cannot be after the event date.');
      return;
    }

    setModalSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
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
      data.append('registration_deadline', formatLocalToMySQL(formData.registration_deadline));
      
      if (formData.max_seats) {
        data.append('max_seats', formData.max_seats);
      }
      data.append('reward_points', formData.reward_points || 0);

      if (formData.external_link.trim()) {
        data.append('external_link', formData.external_link.trim());
      }

      if (posterFile) {
        data.append('poster', posterFile);
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
          showToast('New event published successfully.', 'success');
          handleCloseModal();
          fetchEvents();
        }
      }
    } catch (err) {
      console.error('Save event failed:', err);
      const msg = err.response?.data?.message || 'Failed to save event. Check fields.';
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

  // Filtered events
  const filteredEvents = events.filter((evt) => {
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
          subtitle="Publish, curate, and configure Francis Xavier Engineering College technical programs, symposia, and capacities."
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateModal}
              icon={Plus}
            >
              Publish New Event
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

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-blue-700 border border-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('internal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedType === 'internal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-blue-700 border border-slate-200'
              }`}
            >
              Inside College
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('external')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedType === 'external'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-blue-700 border border-slate-200'
              }`}
            >
              Outside College
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            FILTER:
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
                  <th className="py-4 px-6">Event & Poster</th>
                  <th className="py-4 px-4">Category / Type</th>
                  <th className="py-4 px-4">Schedule & Venue</th>
                  <th className="py-4 px-4">Seats / Quota</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Poster & Title */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
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
                        <div className="space-y-0.5 max-w-xs">
                          <h4 className="font-extrabold font-display text-slate-900 text-sm line-clamp-1">
                            {evt.title}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            By {evt.organizer}
                          </p>
                          {evt.reward_points > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black text-blue-600">
                              <Award className="w-3 h-3" />
                              <span>+{evt.reward_points} PTS</span>
                            </span>
                          )}
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
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-slate-500 truncate max-w-[180px]">
                          {evt.venue}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          Closes: {new Date(evt.registration_deadline).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Seats Capacity */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5 font-mono text-xs">
                        <p className="font-bold text-slate-800">
                          {evt.max_seats 
                            ? `${evt.seats_left} / ${evt.max_seats}`
                            : 'Unlimited'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {evt.max_seats ? 'Seats Remaining' : 'Open Registration'}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                ))}
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
                  Configure event logistics, student point incentives, and attendance limits.
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

              {/* Poster Upload Zone (Drag & Drop + Click) */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Event Poster Visual (JPG, PNG, WebP · Max 2MB)
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-[16/7] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 text-center ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/80'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                  }`}
                >
                  {posterPreview ? (
                    <>
                      <img
                        src={getPosterUrl(posterPreview)}
                        alt="Poster Preview"
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => handleImageError(e, posterPreview)}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md">
                          Change Poster
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 pointer-events-none">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Drag and drop poster image here, or <span className="text-blue-600 underline">browse</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Recommended aspect ratio 16:9 or 16:10
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

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. FX HackNova 2026: 24-Hour AI Hackathon"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Full Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide complete event details, prerequisites, rules, agenda, and target student branches..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-sans text-slate-800 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Type & Category */}
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
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
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
                    placeholder="e.g. Einstein Hall, FXEC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Organizer Department / Cell <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    placeholder="e.g. Department of IT & IEDC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Dates: Event Date & Registration Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Event Date & Time <span className="text-rose-500">*</span>
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
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Registration Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Seats, Points & External Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Max Seats (Leave empty if unlimited)
                  </label>
                  <input
                    type="number"
                    name="max_seats"
                    min="1"
                    value={formData.max_seats}
                    onChange={handleInputChange}
                    placeholder="Unlimited"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Reward Points
                  </label>
                  <input
                    type="number"
                    name="reward_points"
                    min="0"
                    value={formData.reward_points}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    External Link (Optional)
                  </label>
                  <input
                    type="url"
                    name="external_link"
                    value={formData.external_link}
                    onChange={handleInputChange}
                    placeholder="https://"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={modalSubmitting}
                >
                  {editingEventId ? 'Update Event Specifications' : 'Publish Campus Event'}
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

    </div>
  );
};

export default Events;
