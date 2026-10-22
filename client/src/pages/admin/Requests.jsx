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
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles,
  RotateCcw,
  GraduationCap,
  History,
  Layers
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

const DEFAULT_DEPARTMENTS = [
  { code: 'it', name: 'Information Technology' },
  { code: 'cse', name: 'Computer Science & Engineering' },
  { code: 'ece', name: 'Electronics & Communication Engg' },
  { code: 'eee', name: 'Electrical & Electronics Engg' },
  { code: 'mech', name: 'Mechanical Engineering' },
  { code: 'civil', name: 'Civil Engineering' },
  { code: 'aids', name: 'Artificial Intelligence & Data Science' },
  { code: 'bme', name: 'Biomedical Engineering' }
];

const Requests = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [requests, setRequests] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  
  // Filter states
  const [selectedEventFilter, setSelectedEventFilter] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  const [selectedTimelineFilter, setSelectedTimelineFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Single Reject Modal state
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  // Bulk Action Confirmation Modals
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);
  const [bulkRejectNote, setBulkRejectNote] = useState('');
  
  // Processing state
  const [processingId, setProcessingId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Fetch events & departments for filters
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [eventsRes, deptsRes] = await Promise.all([
          api.get('/events'),
          api.get('/admin/departments').catch(() => ({ data: { success: false } }))
        ]);
        if (eventsRes.data.success) {
          setEventsList(eventsRes.data.data);
        }
        if (deptsRes.data.success && deptsRes.data.data?.length > 0) {
          setDepartments(deptsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch requests based on filters
  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      if (selectedEventFilter) {
        params.eventId = selectedEventFilter;
      }
      if (selectedDeptFilter) {
        params.department = selectedDeptFilter;
      }
      if (selectedYearFilter) {
        params.year = selectedYearFilter;
      }
      if (selectedTimelineFilter !== 'all') {
        params.timeline = selectedTimelineFilter;
      }

      const res = await api.get('/admin/requests', { params });
      if (res.data.success) {
        setRequests(res.data.data);
        // Clean up selections that might not be in the newly fetched requests
        setSelectedIds(new Set());
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
  }, [activeTab, selectedEventFilter, selectedDeptFilter, selectedYearFilter, selectedTimelineFilter]);

  // Client-side search filtering
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => 
      r.student_name?.toLowerCase().includes(q) ||
      r.student_email?.toLowerCase().includes(q) ||
      r.register_number?.toLowerCase().includes(q) ||
      r.department_name?.toLowerCase().includes(q) ||
      r.department_code?.toLowerCase().includes(q) ||
      r.event_title?.toLowerCase().includes(q) ||
      r.section?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  // Selection helpers
  const pendingFilteredRequests = useMemo(() => {
    return filteredRequests.filter(r => r.status === 'pending');
  }, [filteredRequests]);

  const areAllSelected = useMemo(() => {
    if (filteredRequests.length === 0) return false;
    return filteredRequests.every(r => selectedIds.has(r.id));
  }, [filteredRequests, selectedIds]);

  const areSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && !areAllSelected;
  }, [selectedIds, areAllSelected]);

  const toggleSelectAll = () => {
    if (areAllSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(filteredRequests.map(r => r.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSelectedEventFilter('');
    setSelectedDeptFilter('');
    setSelectedYearFilter('');
    setSelectedTimelineFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(
    selectedEventFilter || 
    selectedDeptFilter || 
    selectedYearFilter || 
    selectedTimelineFilter !== 'all' || 
    searchQuery.trim()
  );

  // Single Request Actions
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

  const handleOpenReject = (request) => {
    setRejectingRequest(request);
    setRejectNote('');
  };

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

  // Bulk Actions
  const getTargetBulkIds = () => {
    if (selectedIds.size > 0) {
      return Array.from(selectedIds);
    }
    // If none selected individually, target all currently filtered pending requests
    return pendingFilteredRequests.map(r => r.id);
  };

  const handleOpenBulkApprove = () => {
    const ids = getTargetBulkIds();
    if (ids.length === 0) {
      showToast('No pending requests available to approve.', 'info');
      return;
    }
    setIsBulkApproveModalOpen(true);
  };

  const handleConfirmBulkApprove = async () => {
    const ids = getTargetBulkIds();
    if (ids.length === 0) return;

    setBulkProcessing(true);
    try {
      const res = await api.patch('/admin/requests/bulk-approve', { requestIds: ids });
      if (res.data.success) {
        showToast(res.data.message || `Successfully approved ${res.data.data.approvedCount} students!`, 'success');
        setIsBulkApproveModalOpen(false);
        setSelectedIds(new Set());
        fetchRequests();
      }
    } catch (err) {
      console.error('Bulk approve error:', err);
      showToast(err.response?.data?.message || 'Bulk approval encountered an error.', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleOpenBulkReject = () => {
    const ids = getTargetBulkIds();
    if (ids.length === 0) {
      showToast('No pending requests available to reject.', 'info');
      return;
    }
    setBulkRejectNote('');
    setIsBulkRejectModalOpen(true);
  };

  const handleConfirmBulkReject = async () => {
    const ids = getTargetBulkIds();
    if (ids.length === 0) return;

    setBulkProcessing(true);
    try {
      const res = await api.patch('/admin/requests/bulk-reject', { 
        requestIds: ids,
        admin_note: bulkRejectNote.trim()
      });
      if (res.data.success) {
        showToast(res.data.message || `Rejected ${res.data.data.rejectedCount} students.`, 'info');
        setIsBulkRejectModalOpen(false);
        setSelectedIds(new Set());
        fetchRequests();
      }
    } catch (err) {
      console.error('Bulk reject error:', err);
      showToast(err.response?.data?.message || 'Bulk rejection encountered an error.', 'error');
    } finally {
      setBulkProcessing(false);
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

  // Group events by Upcoming and Past for dropdown
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    eventsList.forEach(e => {
      const isPast = new Date(e.event_date) < now;
      if (isPast) {
        past.push(e);
      } else {
        upcoming.push(e);
      }
    });
    return { upcoming, past };
  }, [eventsList]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 pb-16">
      
      {/* Page Header */}
      <AnimatedSection delay={0.05}>
        <PageHeader
          badge="ADMISSIONS & VERIFICATION CONSOLE"
          title="Registration Requests & Quota Manager"
          subtitle="Audit student registration submissions, filter by Year & Department, and perform one-click batch approvals or rejections."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              icon={RefreshCw}
              loading={loading}
            >
              Refresh Data
            </Button>
          }
        />
      </AnimatedSection>

      {/* Advanced Filter Section */}
      <AnimatedSection className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4" delay={0.1}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
              Filter Students By Academic Cohort & Event
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-mono font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* 1. Department Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>DEPARTMENT:</span>
            </label>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="">All Departments (All)</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Year of Study Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>YEAR OF STUDY:</span>
            </label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="">All Years of Study</option>
              <option value="1">1st Year (I Year - Adm 2026)</option>
              <option value="2">2nd Year (II Year - Adm 2025)</option>
              <option value="3">3rd Year (III Year - Adm 2024)</option>
              <option value="4">4th Year (IV Year - Adm 2023)</option>
            </select>
          </div>

          {/* 3. Event Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>TARGET EVENT:</span>
            </label>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs truncate"
            >
              <option value="">All Events ({eventsList.length})</option>
              {groupedEvents.upcoming.length > 0 && (
                <optgroup label="Upcoming Events">
                  {groupedEvents.upcoming.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {groupedEvents.past.length > 0 && (
                <optgroup label="Past Events">
                  {groupedEvents.past.map((e) => (
                    <option key={e.id} value={e.id}>
                      [Past] {e.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 4. Event Timeline Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>TIMELINE:</span>
            </label>
            <select
              value={selectedTimelineFilter}
              onChange={(e) => setSelectedTimelineFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            >
              <option value="all">All Events (Upcoming & Past)</option>
              <option value="upcoming">Upcoming Events Only</option>
              <option value="past">Past Events Only</option>
            </select>
          </div>

        </div>

        {/* Live Search Bar */}
        <div className="pt-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search students by name, register number, department, section, email, or event title..."
            className="w-full"
          />
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-mono text-[11px] uppercase">Active Filters:</span>
            {selectedDeptFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold font-mono text-[11px]">
                Dept: {selectedDeptFilter.toUpperCase()}
                <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedDeptFilter('')} />
              </span>
            )}
            {selectedYearFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold font-mono text-[11px]">
                Year {selectedYearFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedYearFilter('')} />
              </span>
            )}
            {selectedEventFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold font-mono text-[11px] max-w-xs truncate">
                Event ID: {selectedEventFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedEventFilter('')} />
              </span>
            )}
            {selectedTimelineFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold font-mono text-[11px]">
                Timeline: {selectedTimelineFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedTimelineFilter('all')} />
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                "{searchQuery}"
                <X className="w-3 h-3 cursor-pointer hover:text-slate-900" onClick={() => setSearchQuery('')} />
              </span>
            )}
          </div>
        )}
      </AnimatedSection>

      {/* Tabs & Bulk Action Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Status Tabs */}
        <div className="flex bg-slate-100/90 p-1.5 rounded-2xl w-full md:w-fit border border-slate-200/90 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Queue</span>
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/25 text-white text-[10px]">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'approved'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'rejected'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Records</span>
          </button>
        </div>

        {/* BULK ACTION BUTTONS: Accept All & Reject All */}
        {activeTab === 'pending' && pendingFilteredRequests.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-mono font-bold text-slate-500 px-2 hidden sm:inline">
              {selectedIds.size > 0 ? `${selectedIds.size} Selected` : `All ${pendingFilteredRequests.length} Filtered`}:
            </span>

            {/* Accept All */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenBulkApprove}
              loading={bulkProcessing}
              icon={CheckCircle2}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <span>Accept All ({selectedIds.size > 0 ? selectedIds.size : pendingFilteredRequests.length})</span>
            </Button>

            {/* Reject All */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenBulkReject}
              disabled={bulkProcessing}
              icon={XCircle}
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              <span>Reject All ({selectedIds.size > 0 ? selectedIds.size : pendingFilteredRequests.length})</span>
            </Button>
          </div>
        )}
      </div>

      {/* Floating Bulk Selection Action Bar when items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-20 z-40 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-modal-pop border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wide">
              <strong>{selectedIds.size}</strong> student request{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 transition-colors"
            >
              Deselect All
            </button>
            <Button
              variant="primary"
              size="xs"
              onClick={handleOpenBulkApprove}
              loading={bulkProcessing}
              icon={CheckCircle2}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Accept Selected ({selectedIds.size})
            </Button>
            <Button
              variant="danger"
              size="xs"
              onClick={handleOpenBulkReject}
              disabled={bulkProcessing}
              icon={XCircle}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Reject Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

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
            description="There are currently no records matching the selected department, year, event, or status filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="py-4 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                      title={areAllSelected ? 'Deselect all' : 'Select all visible'}
                    >
                      {areAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : areSomeSelected ? (
                        <MinusSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4">Target Event</th>
                  <th className="py-4 px-4">Student Profile</th>
                  <th className="py-4 px-4">College Verification</th>
                  <th className="py-4 px-4">Submitted At</th>
                  {activeTab === 'rejected' && <th className="py-4 px-4">Admin Note</th>}
                  {activeTab === 'approved' && <th className="py-4 px-4">Verified By</th>}
                  {activeTab === 'all' && <th className="py-4 px-4">Status</th>}
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  return (
                    <tr 
                      key={r.id} 
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(r.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Event Details with Poster */}
                      <td className="py-4 px-4 max-w-[260px]">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 shadow-2xs border border-slate-200 mt-0.5">
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

                      {/* College Verification & Department / Year */}
                      <td className="py-4 px-4 space-y-1 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                            Year {r.year_of_study} (Adm: {r.admission_year})
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 text-xs">
                          {r.department_name} ({r.department_code?.toUpperCase()})
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

                      {/* Status Column in 'all' view */}
                      {activeTab === 'all' && (
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            r.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleApprove(r)}
                              loading={processingId === r.id}
                              icon={CheckCircle2}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Accept
                            </Button>

                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenReject(r)}
                              disabled={processingId === r.id}
                              icon={XCircle}
                              className="text-rose-600 hover:bg-rose-50 border-rose-200"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : r.status === 'rejected' ? (
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info strip */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredRequests.length}</strong> of {requests.length} requests
          </span>
          {activeTab === 'pending' && pendingFilteredRequests.length > 0 && (
            <span className="text-slate-600">
              💡 Tip: Use <strong>Accept All</strong> or <strong>Reject All</strong> above to process matching cohorts.
            </span>
          )}
        </div>
      </div>

      {/* SINGLE REJECT DIALOG MODAL */}
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

      {/* BULK ACCEPT ALL CONFIRMATION MODAL */}
      {isBulkApproveModalOpen && (
        <div 
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsBulkApproveModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white text-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-modal-pop space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold font-display text-slate-900">
                  Bulk Approve Registration Requests
                </h3>
              </div>
              <button
                onClick={() => setIsBulkApproveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
              <p className="font-bold text-emerald-900 text-sm">
                You are about to approve {getTargetBulkIds().length} student registration(s).
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Approved students will receive confirmed seat allocations in their designated events. The system verifies maximum seat capacities safely using database transaction locks.
              </p>
            </div>

            {hasActiveFilters && (
              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                <p className="font-bold text-slate-700 uppercase text-[10px]">Filtered Cohort Criteria:</p>
                <p>• Department: {selectedDeptFilter ? selectedDeptFilter.toUpperCase() : 'All'}</p>
                <p>• Year: {selectedYearFilter ? `Year ${selectedYearFilter}` : 'All'}</p>
                <p>• Event: {selectedEventFilter ? `Event ID ${selectedEventFilter}` : 'All Events'}</p>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkApproveModalOpen(false)}
                disabled={bulkProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmBulkApprove}
                loading={bulkProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Confirm Accept All ({getTargetBulkIds().length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BULK REJECT ALL MODAL */}
      {isBulkRejectModalOpen && (
        <div 
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsBulkRejectModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white text-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-modal-pop space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold font-display text-slate-900">
                  Bulk Reject Registration Requests
                </h3>
              </div>
              <button
                onClick={() => setIsBulkRejectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-2">
              <p className="font-bold text-rose-900 text-sm">
                You are about to reject {getTargetBulkIds().length} student registration(s).
              </p>
              <p className="text-rose-800 leading-relaxed">
                This will update their application status to rejected and allow them to view your administrative note.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wide">
                Common Rejection Note / Reason for All Students
              </label>
              <textarea
                value={bulkRejectNote}
                onChange={(e) => setBulkRejectNote(e.target.value)}
                placeholder="e.g. Quota full for this department/year, prerequisites incomplete, or event cancelled..."
                rows={3}
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 leading-relaxed"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkRejectModalOpen(false)}
                disabled={bulkProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmBulkReject}
                loading={bulkProcessing}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Reject All ({getTargetBulkIds().length})
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Requests;
