import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import RejectModal from '../../components/admin/RejectModal';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  MapPin,
  Filter,
  GraduationCap,
  Building2,
  Sparkles,
  Award
} from 'lucide-react';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [selectedEventId, setSelectedEventId] = useState('all');

  // Modals & action states
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { showToast } = useToast();

  // Load events for filter dropdown
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await api.get('/events');
        if (res.data && res.data.success) {
          setEvents(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load events for filter:', err);
      }
    }
    loadEvents();
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusTab !== 'all') params.status = statusTab;
      if (selectedEventId !== 'all') params.eventId = selectedEventId;

      const res = await api.get('/admin/requests', { params });
      if (res.data && res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      showToast('Failed to load student requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusTab, selectedEventId, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Approve
  const handleApprove = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/admin/requests/${requestId}/approve`);
      if (res.data && res.data.success) {
        showToast('Registration approved. Student confirmed.', 'success');
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve request.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Confirmation
  const handleRejectConfirm = async (requestId, note) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/admin/requests/${requestId}/reject`, { note });
      if (res.data && res.data.success) {
        showToast('Registration request rejected.', 'info');
        setRejectingRequest(null);
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Phase 2: Mark Attendance & Award Points
  const handleMarkAttendance = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/admin/requests/${requestId}/attendance`);
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Attendance marked successfully!', 'success');
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark attendance.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Event Registration Requests
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review, accept, or reject student event applications with automated email-credential mismatch verification
        </p>
      </div>

      {/* Tabs & Event Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Requests' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                statusTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter by Event */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Filter Event:
          </span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:border-blue-600 truncate"
          >
            <option value="all">All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading registration requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No registration requests found under "{statusTab}" filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-3">Academic Snapshot</th>
                  <th className="py-3 px-3">Status & Notes</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors align-top">
                      {/* Event Details */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              req.event_type === 'internal'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {req.event_type === 'internal' ? 'Inside College' : 'Outside College'}
                          </span>
                          <p className="font-bold text-slate-900 leading-snug">{req.event_title}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(req.event_date)}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {req.event_venue}
                          </p>
                        </div>
                      </td>

                      {/* Student Details with Email Mismatch Warning Badge */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-slate-900">{req.name}</p>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                              Sec {req.section}
                            </span>
                          </div>

                          <p className="text-slate-600 font-mono text-[11px]">{req.email}</p>
                          <p className="text-slate-500 text-[11px]">
                            Reg: <strong className="font-mono text-slate-700">{req.register_number}</strong>
                          </p>

                          {/* Warning Badge if Entered values do not match email-derived truth */}
                          {req.is_mismatch && (
                            <div className="mt-1 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-0.5">
                              <div className="flex items-center gap-1 font-bold text-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Email Data Mismatch:</span>
                              </div>
                              {req.mismatch_reasons.map((reason, idx) => (
                                <p key={idx} className="text-amber-700 text-[10px]">
                                  • {reason}
                                </p>
                              ))}
                            </div>
                          )}

                          <p className="text-[10px] text-slate-400 pt-1">
                            Applied: {formatDate(req.created_at)}
                          </p>
                        </div>
                      </td>

                      {/* Academic Snapshot (Server-Derived) */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs inline-block">
                            {req.derived_year_label || `Year ${req.year_of_study}`}
                          </span>
                          <p className="text-[11px] font-semibold text-slate-700">
                            {req.derived_department_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Batch of {req.admission_year}
                          </p>
                        </div>
                      </td>

                      {/* Status & Notes */}
                      <td className="py-4 px-3">
                        <div className="space-y-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isPending && <Clock className="w-3.5 h-3.5" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5" />}
                            <span className="capitalize">{req.status}</span>
                          </span>

                          {isRejected && req.admin_note && (
                            <div className="p-2 bg-rose-50 rounded-lg text-rose-700 text-[11px] max-w-xs">
                              <span className="font-bold">Note: </span>
                              {req.admin_note}
                            </div>
                          )}

                          {isApproved && req.attended && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Attended
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-end">
                          {isPending && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoadingId === req.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Accept</span>
                              </button>

                              <button
                                onClick={() => setRejectingRequest(req)}
                                disabled={actionLoadingId === req.id}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}

                          {isApproved && !req.attended && (
                            <button
                              onClick={() => handleMarkAttendance(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Award event reward points"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              <span>Mark Attendance</span>
                            </button>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="text-xs text-slate-500 hover:text-emerald-700 font-semibold"
                            >
                              Re-approve
                            </button>
                          )}
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

      {/* Reject Note Modal */}
      {rejectingRequest && (
        <RejectModal
          request={rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          onConfirm={handleRejectConfirm}
          submitting={actionLoadingId === rejectingRequest.id}
        />
      )}
    </div>
  );
}
