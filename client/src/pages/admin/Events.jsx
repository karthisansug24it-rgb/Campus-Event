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
  Sparkles
} from 'lucide-react';

const CATEGORIES = ['Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Other'];

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
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete confirmation modal state
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype || file.type)) {
      setModalError('Only JPG, PNG, and WebP poster images are supported.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setModalError('Poster file exceeds 2 MB.');
      return;
    }

    setModalError('');
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.venue.trim()) {
      setModalError('Please fill out all required fields.');
      return;
    }

    if (!formData.event_date || !formData.registration_deadline) {
      setModalError('Event date and registration deadline are required.');
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
      data.append('event_date', formData.event_date);
      data.append('registration_deadline', formData.registration_deadline);
      if (formData.max_seats) {
        data.append('max_seats', formData.max_seats);
      }
      data.append('reward_points', formData.reward_points || '0');
      if (formData.external_link.trim()) {
        data.append('external_link', formData.external_link.trim());
      }
      if (posterFile) {
        data.append('poster', posterFile);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (editingEventId) {
        await api.put(`/events/${editingEventId}`, data, config);
        showToast('Event updated successfully!', 'success');
      } else {
        await api.post('/events', data, config);
        showToast('Event published successfully!', 'success');
      }

      handleCloseModal();
      fetchEvents();
    } catch (err) {
      console.error('Failed to save event:', err);
      setModalError(err.response?.data?.message || 'Error saving event.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await api.delete(`/events/${deletingEvent.id}`);
      showToast(`Event "${deletingEvent.title}" removed.`, 'success');
      setDeletingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
      showToast(err.response?.data?.message || 'Failed to delete event.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm shadow-blue-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Events Management Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, and manage official Francis Xavier Engineering College events and quotas.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add New Event</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter events by title, category, or venue..."
          className="w-full text-xs font-mono font-medium focus:outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {/* Events Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-500">Loading events database...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-blue-700 text-xs font-semibold">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No events found</p>
            <p className="text-xs text-slate-500 mt-1">Try refining your search query or add a new event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Type / Category</th>
                  <th className="py-3.5 px-4">Date & Venue</th>
                  <th className="py-3.5 px-4">Seats & Points</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {ev.poster_url ? (
                            <img src={ev.poster_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-700 text-[10px] font-bold">FX</div>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm leading-tight">{ev.title}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]">{ev.organizer}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        ev.event_type === 'internal'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}>
                        {ev.event_type === 'internal' ? 'Inside College' : 'Outside College'}
                      </span>
                      <p className="text-[11px] font-mono font-semibold text-blue-700 uppercase">{ev.category}</p>
                    </td>

                    <td className="py-4 px-4 space-y-0.5">
                      <p className="font-mono font-bold text-slate-800">
                        {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{ev.venue}</p>
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {ev.approved_count || 0} / {ev.max_seats || '∞'} seats
                        </span>
                      </div>
                      {ev.reward_points > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600 text-white">
                          <Award className="w-3 h-3 text-white" />
                          +{ev.reward_points} PTS
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit event"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingEvent(ev)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-900 hover:bg-slate-100 transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={handleCloseModal}
        >
          <div 
            className="relative bg-white text-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl shadow-blue-900/20 border border-blue-100 overflow-hidden animate-modal-pop my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingEventId ? 'Edit Event Details' : 'Publish New Campus Event'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEvent} className="p-6 overflow-y-auto space-y-4">
              
              {modalError && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-700" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g. AI & Robotics National Symposium 2026"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Poster Upload (JPG/PNG/WebP, max 2 MB) */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                  Event Poster (JPG, PNG, WebP · Max 2 MB)
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-blue-50/30"
                  >
                    <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-800">Click to upload poster image</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Recommended 16:9 ratio</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                  </div>

                  {posterPreview && (
                    <div className="w-24 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
                      <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Event Type *
                  </label>
                  <select
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="internal">Inside College (Internal)</option>
                    <option value="external">Outside College (External)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Venue & Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Venue / Location *
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleFormChange}
                    placeholder="e.g. Campus Auditorium / Lab 3"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Organizer *
                  </label>
                  <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleFormChange}
                    placeholder="e.g. Department of IT & CSI"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Event Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-mono font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-mono font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Seats, Points, External Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Max Seats (Optional)
                  </label>
                  <input
                    type="number"
                    name="max_seats"
                    value={formData.max_seats}
                    onChange={handleFormChange}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-mono font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    Reward Points
                  </label>
                  <input
                    type="number"
                    name="reward_points"
                    value={formData.reward_points}
                    onChange={handleFormChange}
                    min="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-mono font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                    External Link
                  </label>
                  <input
                    type="url"
                    name="external_link"
                    value={formData.external_link}
                    onChange={handleFormChange}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-mono font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Provide comprehensive details about speakers, rounds, agenda, and guidelines..."
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-mono font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-60 active:scale-95"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingEventId ? 'Save Changes' : 'Publish Event'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-modal-pop">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Event?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to delete <strong className="text-slate-900">"{deletingEvent.title}"</strong>? All student registration requests for this event will also be removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingEvent(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-mono font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-md flex items-center gap-2 active:scale-95"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Events;
