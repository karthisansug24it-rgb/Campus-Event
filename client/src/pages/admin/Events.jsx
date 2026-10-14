import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import EventFormModal from '../../components/admin/EventFormModal';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states
  const [editingEvent, setEditingEvent] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { showToast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      if (res.data && res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      showToast('Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(eventId);
      const res = await api.delete(`/events/${eventId}`);
      if (res.data && res.data.success) {
        showToast('Event deleted successfully.', 'success');
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete event.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchSearch =
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.organizer.toLowerCase().includes(search.toLowerCase()) ||
      ev.venue.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || ev.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish, edit, and organize internal workshops, hackathons, and symposiums
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-700/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, organizer, venue..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Categories</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-3">Type & Category</th>
                  <th className="py-3 px-3">Event Date</th>
                  <th className="py-3 px-3">Deadline</th>
                  <th className="py-3 px-3">Seats</th>
                  <th className="py-3 px-3">Points</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((ev) => {
                  const isInside = ev.event_type === 'internal' || ev.event_type === 'Inside College';
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Event Title + Poster */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={ev.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                            alt={ev.title}
                            className="w-12 h-10 object-cover rounded-lg bg-slate-100 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-900 truncate">{ev.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">{ev.venue}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isInside ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isInside ? 'Inside' : 'Outside'}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium">
                            {ev.category}
                          </span>
                        </div>
                      </td>

                      {/* Event Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                        {formatDate(ev.event_date)}
                      </td>

                      {/* Registration Deadline */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            ev.is_registration_closed ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {formatDate(ev.registration_deadline)}
                          {ev.is_registration_closed && ' (Closed)'}
                        </span>
                      </td>

                      {/* Seats */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {ev.max_seats === null ? (
                          <span className="text-slate-500">Unlimited</span>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {ev.approved_count || 0} / {ev.max_seats}
                          </span>
                        )}
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <Sparkles className="w-3 h-3 fill-amber-500" />
                          <span>{ev.reward_points}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setEditingEvent(ev)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id, ev.title)}
                            disabled={deletingId === ev.id}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Event Modal */}
      {(isCreateOpen || editingEvent) && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
