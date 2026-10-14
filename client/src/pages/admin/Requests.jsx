import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Calendar, 
  MapPin, 
  Building, 
  User, 
  Hash, 
  Loader2, 
  Search,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

const Requests = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [requests, setRequests] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reject Modal state
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Fetch events for filter dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        if (res.data.success) {
          setEventsList(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load events for filter:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch requests based on active tab and event filter
  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { status: activeTab };
      if (selectedEventFilter) {
        params.eventId = selectedEventFilter;
      }
      const res = await api.get('/admin/requests', { params });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Failed to retrieve registration requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab, selectedEventFilter]);

  // Handle Accept
  const handleApprove = async (request) => {
    setProcessingId(request.id);
    try {
      const res = await api.patch(`/admin/requests/${request.id}/approve`);
      if (res.data.success) {
        showToast(`Approved registration for ${request.student_name}. Seat allotted!`, 'success');
        fetchRequests();
      }
    } catch (err) {
      console.error('Approval failed:', err);
      const msg = err.response?.data?.message || 'Failed to approve request.';
      showToast(msg, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Reject Dialog
  const handleOpenReject = (request) => {
    setRejectingRequest(request);
    setRejectNote('');
  };

  // Submit Reject
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setProcessingId(rejectingRequest.id);
    try {
      const res = await api.patch(`/admin/requests/${rejectingRequest.id}/reject`, {
        admin_note: rejectNote.trim()
      });
      if (res.data.success) {
        showToast(`Registration request for ${rejectingRequest.student_name} rejected.`, 'info');
        setRejectingRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Rejection failed:', err);
      showToast(err.response?.data?.message || 'Failed to reject request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Title & Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-college-600" />
            Registration Requests Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review student registration submissions, inspect verified college credentials, and allocate seats.
          </p>
        </div>

        {/* Event Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter Event:</label>
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-college-500"
          >
            <option value="">All Events</option>
            {eventsList.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-300/60">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Approved Registrations</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Rejected Requests</span>
        </button>
      </div>

      {/* Requests Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-college-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No {activeTab} requests found</p>
            <p className="text-xs text-slate-400 mt-1">There are no records matching the selected status or event filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Event Details</th>
                  <th className="py-3.5 px-4">Student Profile</th>
                  <th className="py-3.5 px-4">College Verification</th>
                  <th className="py-3.5 px-4">Requested Time</th>
                  {activeTab === 'rejected' && <th className="py-3.5 px-4">Admin Note</th>}
                  {activeTab === 'approved' && <th className="py-3.5 px-4">Reviewer</th>}
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Event Details */}
                    <td className="py-4 px-4 max-w-[220px]">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          r.event_type === 'internal' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {r.event_type === 'internal' ? 'Inside' : 'Outside'} · {r.event_category}
                        </span>
                        <p className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                          {r.event_title}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatDate(r.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{r.event_venue}</span>
                        </div>
                      </div>
                    </td>

                    {/* Student Profile */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-900 text-sm">{r.student_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono select-all">{r.student_email}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[10px]">
                            Sec {r.section}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700 text-[10px]">
                            {r.register_number}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* College Verification & Mismatch Warning */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-college-100 text-college-800 font-bold text-[10px]">
                          Year {r.year_of_study} (Adm: {r.admission_year})
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs">
                        {r.department_name}
                      </p>

                      {/* Warning Badge if mismatch */}
                      {r.has_mismatch === 1 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Department Mismatch with Email</span>
                        </div>
                      )}
                    </td>

                    {/* Requested Time */}
                    <td className="py-4 px-4 text-slate-500 font-medium">
                      {formatDate(r.requested_at)}
                    </td>

                    {/* Admin Note if Rejected */}
                    {activeTab === 'rejected' && (
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                          {r.admin_note || 'No note provided.'}
                        </p>
                      </td>
                    )}

                    {/* Reviewer if Approved */}
                    {activeTab === 'approved' && (
                      <td className="py-4 px-4 text-slate-500">
                        <p className="font-semibold text-slate-800">{r.reviewer_name || 'Admin'}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(r.reviewed_at)}</p>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      {activeTab === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(r)}
                            disabled={processingId === r.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                          >
                            {processingId === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Accept</span>
                          </button>

                          <button
                            onClick={() => handleOpenReject(r)}
                            disabled={processingId === r.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : activeTab === 'rejected' ? (
                        <button
                          onClick={() => handleApprove(r)}
                          disabled={processingId === r.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Re-approve</span>
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmed</span>
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-modal-pop">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reject Registration Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting application for <strong className="text-slate-800">{rejectingRequest.student_name}</strong> ({rejectingRequest.event_title}).
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Optional Reason / Feedback for Student
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Incomplete registration details or prerequisites not met..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-4 mt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectingRequest.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                {processingId === rejectingRequest.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Requests;
