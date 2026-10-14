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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Page Title & Stats */}
      <div className="bg-[#0D101D] p-6 rounded-3xl border border-white/[0.08] shadow-glass flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Registration Requests Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review student registration submissions, inspect verified college credentials, and allocate seats.
          </p>
        </div>

        {/* Event Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono font-bold text-slate-400 shrink-0 uppercase tracking-wider">EVENT:</label>
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-white/[0.1] bg-[#121628] text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Events</option>
            {eventsList.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#0A0D18] p-1.5 rounded-2xl w-full sm:w-fit border border-white/[0.08] shadow-glass">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'approved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Approved Registrations</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'rejected'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Rejected Requests</span>
        </button>
      </div>

      {/* Requests Content Table */}
      <div className="bg-[#0D101D] rounded-3xl border border-white/[0.08] shadow-glass overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-400">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No {activeTab} requests found</p>
            <p className="text-xs text-slate-500 mt-1">There are no records matching the selected status or event filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
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
              <tbody className="divide-y divide-white/[0.04]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    
                    {/* Event Details with Poster */}
                    <td className="py-4 px-4 max-w-[260px]">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-11 rounded-xl bg-[#07080D] overflow-hidden shrink-0 shadow-xs border border-white/[0.08] mt-0.5">
                          {r.poster_url ? (
                            <img src={r.poster_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-cyan-400 bg-college-900">
                              FX
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 truncate">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                            r.event_type === 'internal' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}>
                            {r.event_type === 'internal' ? 'Inside' : 'Outside'} · {r.event_category}
                          </span>
                          <p className="font-extrabold text-white text-sm leading-snug truncate">
                            {r.event_title}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{formatDate(r.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">{r.event_venue}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Student Profile */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="font-extrabold text-white text-sm">{r.student_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono select-all">{r.student_email}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono font-bold text-slate-300 text-[10px]">
                            Sec {r.section}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono font-bold text-cyan-300 text-[10px]">
                            {r.register_number}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* College Verification & Mismatch Warning */}
                    <td className="py-4 px-4 space-y-1 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-bold text-[10px]">
                          Year {r.year_of_study} (Adm: {r.admission_year})
                        </span>
                      </div>
                      <p className="font-semibold text-slate-200 text-xs">
                        {r.department_name}
                      </p>

                      {/* Warning Badge if mismatch */}
                      {r.has_mismatch === 1 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold shadow-glow-amber">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Department Mismatch with Email</span>
                        </div>
                      )}
                    </td>

                    {/* Requested Time */}
                    <td className="py-4 px-4 text-slate-400 font-mono text-xs">
                      {formatDate(r.requested_at)}
                    </td>

                    {/* Admin Note if Rejected */}
                    {activeTab === 'rejected' && (
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="text-xs text-rose-300 bg-rose-500/10 p-2 rounded-xl border border-rose-500/25">
                          {r.admin_note || 'No note provided.'}
                        </p>
                      </td>
                    )}

                    {/* Reviewer if Approved */}
                    {activeTab === 'approved' && (
                      <td className="py-4 px-4 text-slate-400 font-mono">
                        <p className="font-semibold text-white">{r.reviewer_name || 'Admin'}</p>
                        <p className="text-[10px] text-slate-500">{formatDate(r.reviewed_at)}</p>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      {activeTab === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(r)}
                            disabled={processingId === r.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/40 shadow-glow-emerald transition-all disabled:opacity-50 active:scale-95"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono font-bold text-xs border border-rose-500/30 transition-colors disabled:opacity-50 active:scale-95"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : activeTab === 'rejected' ? (
                        <button
                          onClick={() => handleApprove(r)}
                          disabled={processingId === r.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Re-approve</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-mono font-bold flex items-center justify-end gap-1">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D101D] text-white rounded-3xl max-w-md w-full p-6 shadow-modal border border-white/[0.12] animate-modal-pop">
            <h3 className="text-base font-bold text-white mb-1">
              Reject Registration Request
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting application for <strong className="text-white">{rejectingRequest.student_name}</strong> ({rejectingRequest.event_title}).
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wide">
                Optional Reason / Feedback for Student
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Incomplete registration details or prerequisites not met..."
                rows={3}
                className="w-full p-3.5 rounded-2xl border border-white/[0.1] bg-white/[0.04] text-white text-xs focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="pt-4 mt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
              <button
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl border border-white/[0.1] text-slate-300 text-xs font-mono font-bold hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectingRequest.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5 active:scale-95"
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
