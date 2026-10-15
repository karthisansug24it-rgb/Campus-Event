import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { 
  PageHeader, 
  Button, 
  Badge, 
  SearchInput, 
  EmptyState,
  AnimatedSection
} from '../../components/ui';
import { getPosterUrl, handleImageError } from '../../utils/imageUrl';

const Requests = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [requests, setRequests] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filtered requests by local search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => 
      r.student_name?.toLowerCase().includes(q) ||
      r.student_email?.toLowerCase().includes(q) ||
      r.register_number?.toLowerCase().includes(q) ||
      r.department_name?.toLowerCase().includes(q) ||
      r.event_title?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-800">
      
      {/* Page Header */}
      <AnimatedSection delay={0.05}>
        <PageHeader
          badge="ADMISSIONS & VERIFICATION"
          title="Registration Requests Console"
          subtitle="Audit student registration submissions, verify college academic credentials, and allocate reserved seats."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              icon={RefreshCw}
              loading={loading}
            >
              Refresh Table
            </Button>
          }
        />
      </AnimatedSection>

      {/* Filter, Event Selector & Search Bar */}
      <AnimatedSection className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" delay={0.15}>
        
        {/* Search Input */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search requests by student name, reg number, department..."
          className="max-w-md"
        />

        {/* Event Filter Select */}
        <div className="flex items-center gap-2.5">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0">
            EVENT:
          </label>
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs max-w-xs"
          >
            <option value="">All Events ({eventsList.length})</option>
            {eventsList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

      </AnimatedSection>

      {/* Status Segmented Tabs */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200/80 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Queue</span>
          {activeTab === 'pending' && requests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-white text-[10px]">
              {requests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'approved'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved Registrations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'rejected'
              ? 'bg-slate-900 text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected Requests</span>
        </button>
      </div>

      {/* Requests Content Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Loading requests data...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={`No ${activeTab} requests found`}
            description="There are currently no records matching the selected status or event filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-4 px-5">Target Event</th>
                  <th className="py-4 px-4">Student Profile</th>
                  <th className="py-4 px-4">College Verification</th>
                  <th className="py-4 px-4">Submitted At</th>
                  {activeTab === 'rejected' && <th className="py-4 px-4">Admin Note</th>}
                  {activeTab === 'approved' && <th className="py-4 px-4">Verified By</th>}
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                    
                    {/* Event Details with Poster */}
                    <td className="py-4 px-5 max-w-[260px]">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 shadow-xs border border-slate-200 mt-0.5">
                          {r.poster_url ? (
                            <img
                              src={getPosterUrl(r.poster_url)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => handleImageError(e, r.poster_url)}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold text-blue-700 bg-blue-50 ${r.poster_url ? 'hidden' : 'flex'}`}>
                            FX
                          </div>
                        </div>
                        <div className="space-y-1 truncate">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                            r.event_type === 'internal' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {r.event_type === 'internal' ? 'Inside' : 'Outside'} · {r.event_category}
                          </span>
                          <p className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                            {r.event_title}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                            <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{formatDate(r.event_date)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Student Profile */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-900 text-sm">{r.student_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono select-all">{r.student_email}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700 text-[10px]">
                            Sec {r.section}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono font-bold text-blue-700 text-[10px]">
                            {r.register_number}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* College Verification & Mismatch Warning */}
                    <td className="py-4 px-4 space-y-1 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                          Year {r.year_of_study} (Adm: {r.admission_year})
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs">
                        {r.department_name}
                      </p>

                      {/* Warning Badge if discrepancy detected */}
                      {r.has_mismatch === 1 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Dept Mismatch with Email</span>
                        </div>
                      )}
                    </td>

                    {/* Requested Time */}
                    <td className="py-4 px-4 text-slate-500 font-mono text-xs">
                      {formatDate(r.requested_at)}
                    </td>

                    {/* Admin Note if Rejected */}
                    {activeTab === 'rejected' && (
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          {r.admin_note || 'No note provided.'}
                        </p>
                      </td>
                    )}

                    {/* Reviewer if Approved */}
                    {activeTab === 'approved' && (
                      <td className="py-4 px-4 text-slate-500 font-mono">
                        <p className="font-semibold text-slate-800">{r.reviewer_name || 'Admin'}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(r.reviewed_at)}</p>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      {activeTab === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleApprove(r)}
                            loading={processingId === r.id}
                            icon={CheckCircle2}
                          >
                            Accept
                          </Button>

                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenReject(r)}
                            disabled={processingId === r.id}
                            icon={XCircle}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : activeTab === 'rejected' ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleApprove(r)}
                          loading={processingId === r.id}
                          icon={CheckCircle2}
                        >
                          Re-approve
                        </Button>
                      ) : (
                        <span className="text-emerald-700 font-mono font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Approved ✓</span>
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

      {/* Reject Reason Dialog Modal */}
      {rejectingRequest && (
        <div 
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRejectingRequest(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white text-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-modal-pop space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold font-display text-slate-900">
                Reject Registration Request
              </h3>
              <button
                onClick={() => setRejectingRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Rejecting application for <strong className="text-slate-900">{rejectingRequest.student_name}</strong> for event <strong className="text-blue-700">{rejectingRequest.event_title}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wide">
                Reason / Feedback for Student
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Prerequisites not verified, or section quota full for this department..."
                rows={3}
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 leading-relaxed"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingRequest(null)}
                disabled={processingId === rejectingRequest.id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                loading={processingId === rejectingRequest.id}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Requests;
