import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Award,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = ['Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Other'];

export default function EventFormModal({ event, onClose, onSuccess }) {
  const isEditing = !!event;
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'internal',
    category: 'Workshop',
    venue: '',
    organizer: '',
    event_date: '',
    registration_deadline: '',
    max_seats: '',
    reward_points: 0,
    external_link: '',
    poster_url: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Format date helper for input type="datetime-local" (YYYY-MM-DDTHH:mm)
  const toLocalISO = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'internal',
        category: event.category || 'Workshop',
        venue: event.venue || '',
        organizer: event.organizer || '',
        event_date: toLocalISO(event.event_date),
        registration_deadline: toLocalISO(event.registration_deadline),
        max_seats: event.max_seats !== null ? event.max_seats : '',
        reward_points: event.reward_points || 0,
        external_link: event.external_link || '',
        poster_url: event.poster_url || ''
      });
      if (event.poster_url) {
        setPreviewUrl(event.poster_url);
      }
    }
  }, [event]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size <= 2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 2 MB limit. Please select a smaller poster.');
      return;
    }

    // Check type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Only JPG, PNG, or WebP image formats are accepted.');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title || !formData.description || !formData.venue || !formData.organizer) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    if (!formData.event_date || !formData.registration_deadline) {
      setErrorMsg('Please specify both event date and registration deadline.');
      return;
    }

    if (new Date(formData.registration_deadline) > new Date(formData.event_date)) {
      setErrorMsg('Registration deadline cannot be after the event date.');
      return;
    }

    try {
      setSubmitting(true);

      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('event_type', formData.event_type);
      data.append('category', formData.category);
      data.append('venue', formData.venue.trim());
      data.append('organizer', formData.organizer.trim());
      data.append('event_date', formData.event_date);
      data.append('registration_deadline', formData.registration_deadline);
      data.append('max_seats', formData.max_seats !== '' ? formData.max_seats : '');
      data.append('reward_points', formData.reward_points || 0);
      data.append('external_link', formData.external_link ? formData.external_link.trim() : '');

      if (selectedFile) {
        data.append('poster', selectedFile);
      } else if (formData.poster_url) {
        data.append('poster_url', formData.poster_url.trim());
      }

      let res;
      if (isEditing) {
        res = await api.put(`/events/${event.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/events', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data && res.data.success) {
        showToast(
          isEditing ? 'Event updated successfully.' : 'New event published!',
          'success',
          3000
        );
        onSuccess();
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 animate-modal flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Campus Event' : 'Create New Event'}
            </h3>
            <p className="text-xs text-slate-500">
              Publish an event for Francis Xavier Engineering College students
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. HackFX 2026: 24-Hour National Hackathon"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          {/* Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              >
                <option value="internal">Inside College (Internal Event)</option>
                <option value="external">Outside College (External Event)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Poster Upload (jpg/png/webp, max 2MB) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Event Poster Image <span className="text-slate-400 font-normal">(Max 2 MB, JPG/PNG/WebP)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {previewUrl && (
                <div className="w-32 aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <input
                  type="url"
                  placeholder="Or paste external poster image URL"
                  value={formData.poster_url}
                  onChange={(e) => {
                    setFormData({ ...formData, poster_url: e.target.value });
                    if (!selectedFile) setPreviewUrl(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Organizer & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Organizer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="e.g. Department of IT & IIC"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Venue <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. Central Auditorium & Lab 3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Event Date & Registration Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registration Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registration_deadline}
                onChange={(e) =>
                  setFormData({ ...formData, registration_deadline: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Max Seats & Reward Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Seats <span className="text-slate-400 font-normal">(Leave empty for unlimited)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_seats}
                onChange={(e) => setFormData({ ...formData, max_seats: e.target.value })}
                placeholder="e.g. 100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reward Points
              </label>
              <input
                type="number"
                min="0"
                value={formData.reward_points}
                onChange={(e) => setFormData({ ...formData, reward_points: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Event Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide event overview, schedule, rules, eligibility, and benefits..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              External Link <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              value={formData.external_link}
              onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
              placeholder="https://francisxavier.ac.in/event-handbook"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-700/25 transition-all flex items-center gap-2 hover:scale-[1.01] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Publish Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
