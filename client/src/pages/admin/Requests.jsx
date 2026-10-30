import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
  Layers,
  Trophy,
  Medal,
  Award,
  Eye,
  ExternalLink,
  Upload,
  Check,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  PageHeader, 
  Button, 
  Badge, 
  SearchInput, 
  EmptyState, 
  AnimatedSection 
} from '../../components/ui';
import { getPosterUrl, getUploadUrl, handleImageError } from '../../utils/imageUrl';

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
  const location = useLocation();
  const searchTab = new URLSearchParams(location.search).get('tab');
  // Stages: 'registered', 'registration_approved', 'participated', 'ranked', 'rejected', 'all'
  const [activeTab, setActiveTab] = useState(searchTab || 'registered'); 

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam && ['registered', 'registration_approved', 'participated', 'ranked', 'rejected', 'all'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  const [requests, setRequests] = useState([]);
  const [alerts, setAlerts] = useState({ pendingScreenshots: 0, pendingCertificates: 0, closingSoon: [], certClosingSoon: [] });
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

  // Proof Lightbox Modal
  const [inspectingProof, setInspectingProof] = useState(null); // request object

  // Certificate Verification & Ranking Modal
  const [rankingRequest, setRankingRequest] = useState(null); // request object
  const [selectedRank, setSelectedRank] = useState('1'); // '1', '2', '3', 'participated'
  const [customPoints, setCustomPoints] = useState('');
  const [rankNote, setRankNote] = useState('');
  const [isSubmittingRank, setIsSubmittingRank] = useState(false);

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
        const [eventsRes, deptsRes, alertsRes] = await Promise.all([
          api.get('/events'),
          api.get('/admin/departments').catch(() => ({ data: { success: false } })),
          api.get('/admin/alerts').catch(() => ({ data: { success: false } }))
        ]);
        if (eventsRes.data.success) {
          setEventsList(eventsRes.data.data);
        }
        if (deptsRes.data.success && deptsRes.data.data?.length > 0) {
          setDepartments(deptsRes.data.data);
        }
        if (alertsRes.data.success && alertsRes.data.data) {
          setAlerts(alertsRes.data.data);
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

      const [res, alertsRes] = await Promise.all([
        api.get('/admin/requests', { params }),
        api.get('/admin/alerts').catch(() => ({ data: { success: false } }))
      ]);

      if (res.data.success) {
        setRequests(res.data.data);
        setSelectedIds(new Set());
      }
      if (alertsRes.data.success && alertsRes.data.data) {
        setAlerts(alertsRes.data.data);
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
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const hasActiveFilters = Boolean(
    selectedEventFilter || 
    selectedDeptFilter || 
    selectedYearFilter || 
    selectedTimelineFilter !== 'all' || 
    searchQuery.trim()
  );

  const handleResetFilters = () => {
    setSelectedEventFilter('');
    setSelectedDeptFilter('');
    setSelectedYearFilter('');
    setSelectedTimelineFilter('all');
    setSearchQuery('');
  };

  // Single Approve Registration & Screenshot
  const handleApprove = async (request) => {
    setProcessingId(request.id);
    try {
      const res = await api.patch(`/admin/requests/${request.id}/approve`);
      if (res.data.success) {
        showToast(res.data.message || 'Registration screenshot verified & approved!', 'success');
        if (inspectingProof?.id === request.id) setInspectingProof(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Approve error:', err);
      showToast(err.response?.data?.message || 'Failed to approve request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Single Reject Handler
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
        showToast('Registration request rejected.', 'info');
        setRejectingRequest(null);
        if (inspectingProof?.id === rejectingRequest.id) setInspectingProof(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Reject error:', err);
      showToast(err.response?.data?.message || 'Failed to reject request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Ranking Modal for a request
  const handleOpenRankModal = (request) => {
    setRankingRequest(request);
    const existingRank = request.rank_position && request.rank_position !== 'none' ? request.rank_position : '1';
    setSelectedRank(existingRank);
    const base = Number(request.reward_points || 0);
    const bonus = existingRank === '1' ? 50 : existingRank === '2' ? 30 : existingRank === '3' ? 20 : 0;
    setCustomPoints(request.rank_points_awarded || (base + bonus));
    setRankNote(request.admin_note || '');
  };

  // Calculate default points when selectedRank changes
  const handleRankSelect = (rank) => {
    setSelectedRank(rank);
    if (rankingRequest) {
      const base = Number(rankingRequest.reward_points || 0);
      const bonus = rank === '1' ? 50 : rank === '2' ? 30 : rank === '3' ? 20 : 0;
      setCustomPoints(base + bonus);
    }
  };

  // Submit Rank & Verify Certificate
  const handleConfirmRank = async (e) => {
    e.preventDefault();
    if (!rankingRequest) return;

    setIsSubmittingRank(true);
    try {
      const res = await api.patch(`/admin/requests/${rankingRequest.id}/rank`, {
        rank_position: selectedRank,
        custom_points: parseInt(customPoints, 10),
        note: rankNote.trim()
      });

      if (res.data.success) {
        showToast(res.data.message || `Rank ${selectedRank.toUpperCase()} awarded successfully!`, 'success');
        setRankingRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Rank submission error:', err);
      showToast(err.response?.data?.message || 'Failed to verify and rank certificate.', 'error');
    } finally {
      setIsSubmittingRank(false);
    }
  };

  // Bulk Actions
  const getTargetBulkIds = () => {
    if (selectedIds.size > 0) {
      return Array.from(selectedIds);
    }
    return filteredRequests.map(r => r.id);
  };

  const handleOpenBulkApprove = () => {
    const ids = getTargetBulkIds();
    if (ids.length === 0) {
      showToast('No requests available to approve.', 'info');
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
        showToast(res.data.message || `Successfully approved ${res.data.data.approvedCount} registrations!`, 'success');
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
      showToast('No requests available to reject.', 'info');
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
          badge="ADMISSIONS & RANKING CONSOLE"
          title="Registration Approvals & Certificate Ranking"
          subtitle="Verify student registration screenshots, approve seats, inspect uploaded participation certificates, and award official Ranks 1, 2, 3 with reward points."
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

      {/* Admin Action Alerts & Deadlines Notification Bar */}
      {(alerts.pendingScreenshots > 0 || alerts.pendingCertificates > 0 || alerts.closingSoon?.length > 0) && (
        <AnimatedSection delay={0.08} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Screenshot Verification Alert Card */}
            {alerts.pendingScreenshots > 0 && (
              <div 
                onClick={() => setActiveTab('registered')}
                className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 cursor-pointer hover:bg-blue-100/80 transition-all flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700">Proof Approvals Pending</p>
                    <p className="text-xs font-bold truncate"><strong>{alerts.pendingScreenshots}</strong> registration screenshot(s) awaiting approval</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
              </div>
            )}

            {/* Certificate Verification Alert Card */}
            {alerts.pendingCertificates > 0 && (
              <div 
                onClick={() => setActiveTab('participated')}
                className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 cursor-pointer hover:bg-purple-100/80 transition-all flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700">Certificates Awaiting Ranking</p>
                    <p className="text-xs font-bold truncate"><strong>{alerts.pendingCertificates}</strong> certificate(s) ready to verify & rank</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-600 shrink-0 ml-2" />
              </div>
            )}

            {/* Closing Soon Alert Card */}
            {alerts.closingSoon?.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-2xs">
                <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700">Registration Deadlines Approaching</p>
                  <p className="text-xs font-bold truncate">{alerts.closingSoon.length} event(s) closing within 48 hours</p>
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>
      )}

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
              <option value="">All Events (All)</option>
              {groupedEvents.upcoming.length > 0 && (
                <optgroup label="Upcoming Events">
                  {groupedEvents.upcoming.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({new Date(e.event_date).toLocaleDateString()})
                    </option>
                  ))}
                </optgroup>
              )}
              {groupedEvents.past.length > 0 && (
                <optgroup label="Past Events">
                  {groupedEvents.past.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({new Date(e.event_date).toLocaleDateString()})
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
      </AnimatedSection>

      {/* Tabs & Bulk Action Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Status Stages Tabs */}
        <div className="flex bg-slate-100/90 p-1.5 rounded-2xl w-full md:w-fit border border-slate-200/90 gap-1 overflow-x-auto">
          {/* 1. Screenshot Verification */}
          <button
            type="button"
            onClick={() => setActiveTab('registered')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'registered'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. Screenshot Verification</span>
            {alerts.pendingScreenshots > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/30 text-white text-[10px]">
                {alerts.pendingScreenshots}
              </span>
            )}
          </button>

          {/* 2. Approved Attendees */}
          <button
            type="button"
            onClick={() => setActiveTab('registration_approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'registration_approved'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Approved Attendees</span>
          </button>

          {/* 3. Certificate Verification & Ranking */}
          <button
            type="button"
            onClick={() => setActiveTab('participated')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'participated'
                ? 'bg-purple-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-purple-700 hover:bg-white/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. Certificate Ranking</span>
            {alerts.pendingCertificates > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/30 text-white text-[10px]">
                {alerts.pendingCertificates}
              </span>
            )}
          </button>

          {/* 4. Ranked */}
          <button
            type="button"
            onClick={() => setActiveTab('ranked')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'ranked'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>4. Ranked & Completed</span>
          </button>

          {/* Rejected */}
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'rejected'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>

          {/* All */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All</span>
          </button>
        </div>

        {/* Bulk Action Buttons */}
        {(activeTab === 'registered' || activeTab === 'all') && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenBulkApprove}
              disabled={filteredRequests.length === 0}
              icon={CheckCircle2}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
            >
              Accept All Visible ({selectedIds.size > 0 ? selectedIds.size : filteredRequests.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenBulkReject}
              disabled={filteredRequests.length === 0}
              icon={XCircle}
              className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
            >
              Reject All Visible
            </Button>
          </div>
        )}
      </div>

      {/* Floating Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-modal-pop border border-slate-700">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {selectedIds.size}
            </span>
            <span>Student(s) Selected</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
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
            title={`No ${activeTab} records found`}
            description="There are currently no records matching the selected department, year, event, or stage filters."
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
                  <th className="py-4 px-4">Stage & Proof</th>
                  <th className="py-4 px-4">Submitted At</th>
                  {activeTab === 'ranked' && <th className="py-4 px-4">Award & Rank</th>}
                  {activeTab === 'rejected' && <th className="py-4 px-4">Admin Note</th>}
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  const isPendingReview = r.status === 'registered' || r.status === 'pending';
                  const isParticipated = r.status === 'participated';
                  const isRanked = r.status === 'ranked';

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
                      <td className="py-4 px-4 max-w-[240px]">
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
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-600">
                              Yr {r.year_of_study} ({r.department_code?.toUpperCase()})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stage & Proofs (Screenshot / Certificate) */}
                      <td className="py-4 px-4 space-y-1.5 font-mono">
                        {/* Status Stage Pill */}
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'ranked' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            r.status === 'participated' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            r.status === 'registration_approved' || r.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            r.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>
                              {r.status === 'ranked' ? `Rank ${r.rank_position.toUpperCase()}` :
                               r.status === 'participated' ? 'Cert Submitted' :
                               r.status === 'registration_approved' || r.status === 'approved' ? 'Seat Approved' :
                               r.status === 'rejected' ? 'Rejected' : 'Proof In Review'}
                            </span>
                          </span>
                        </div>

                        {/* Registration Screenshot Proof Button */}
                        {r.registration_screenshot ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => setInspectingProof(r)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect Screenshot Proof</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-600 font-medium">No screenshot uploaded</p>
                        )}

                        {/* Participation Certificate Proof Button */}
                        {r.certificate_url && (
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenRankModal(r)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-colors"
                            >
                              <Award className="w-3 h-3" />
                              <span>Inspect Certificate</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Submitted Time */}
                      <td className="py-4 px-4 text-slate-500 font-mono text-xs">
                        {formatDate(r.requested_at)}
                      </td>

                      {/* Ranked info column */}
                      {activeTab === 'ranked' && (
                        <td className="py-4 px-4 font-mono">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-black text-xs">
                              <Trophy className="w-3.5 h-3.5 text-amber-600" />
                              <span>Rank {r.rank_position.toUpperCase()}</span>
                            </span>
                            <p className="text-[11px] text-amber-700 font-bold">+{r.rank_points_awarded} PTS CREDITED</p>
                            <p className="text-[10px] text-slate-400">By {r.ranked_by_name || 'Admin'} on {formatDate(r.ranked_at)}</p>
                          </div>
                        </td>
                      )}

                      {/* Admin Note if Rejected */}
                      {activeTab === 'rejected' && (
                        <td className="py-4 px-4 max-w-[200px]">
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            {r.admin_note || 'No note provided.'}
                          </p>
                        </td>
                      )}

                      {/* Actions Column */}
                      <td className="py-4 px-5 text-right">
                        {isPendingReview ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleApprove(r)}
                              loading={processingId === r.id}
                              icon={CheckCircle2}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                              Approve Proof
                            </Button>

                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenReject(r)}
                              disabled={processingId === r.id}
                              icon={XCircle}
                              className="text-rose-600 hover:bg-rose-50 border-rose-200 font-bold"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : isParticipated ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleOpenRankModal(r)}
                              icon={Trophy}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                            >
                              Verify & Rank
                            </Button>
                          </div>
                        ) : isRanked ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenRankModal(r)}
                              icon={Trophy}
                              className="border-amber-300 text-amber-900 hover:bg-amber-50 font-bold"
                            >
                              Edit Rank
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
                          <span className="text-slate-400 font-mono text-xs">Seat Confirmed ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Lightbox Inspector Modal */}
      {inspectingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col animate-modal-pop">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">REGISTRATION PROOF VERIFICATION</span>
                <h3 className="text-lg font-bold text-slate-900">{inspectingProof.student_name} ({inspectingProof.register_number})</h3>
                <p className="text-xs text-slate-500 font-mono">{inspectingProof.event_title}</p>
              </div>
              <button 
                onClick={() => setInspectingProof(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proof Image Box */}
            <div className="flex-1 overflow-auto bg-slate-900 rounded-2xl p-3 flex items-center justify-center min-h-[300px]">
              <img 
                src={getUploadUrl(inspectingProof.registration_screenshot)} 
                alt="Registration proof screenshot" 
                className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Student & Event Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono p-3 rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
              <div>
                <span className="text-slate-400 text-[10px]">DEPARTMENT:</span>
                <p className="font-bold text-slate-800">{inspectingProof.department_name}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">SECTION:</span>
                <p className="font-bold text-slate-800">Section {inspectingProof.section}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">YEAR:</span>
                <p className="font-bold text-slate-800">Year {inspectingProof.year_of_study}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">EMAIL:</span>
                <p className="font-bold text-slate-800 truncate">{inspectingProof.student_email}</p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <a 
                href={getUploadUrl(inspectingProof.registration_screenshot)} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-mono text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Original Image</span>
              </a>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReject(inspectingProof)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  icon={XCircle}
                >
                  Reject Proof
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(inspectingProof)}
                  loading={processingId === inspectingProof.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  icon={CheckCircle2}
                >
                  Approve Proof & Confirm Seat
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Verification & Ranking Modal */}
      {rankingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[94vh] flex flex-col animate-modal-pop">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">STAGE 4: VERIFY & AWARD RANK</span>
                <h3 className="text-lg font-bold text-slate-900">{rankingRequest.student_name} · {rankingRequest.event_title}</h3>
                <p className="text-xs text-slate-500 font-mono">Roll: {rankingRequest.register_number} · Dept: {rankingRequest.department_name}</p>
              </div>
              <button 
                onClick={() => setRankingRequest(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Preview */}
            <div className="flex-1 overflow-auto bg-slate-900 rounded-2xl p-3 flex items-center justify-center min-h-[220px]">
              {rankingRequest.certificate_url?.toLowerCase().endsWith('.pdf') ? (
                <div className="text-center text-white space-y-2 p-6">
                  <FileText className="w-16 h-16 mx-auto text-purple-400" />
                  <p className="font-bold text-sm">PDF Participation Certificate Uploaded</p>
                  <a 
                    href={getUploadUrl(rankingRequest.certificate_url)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Certificate PDF in New Window</span>
                  </a>
                </div>
              ) : (
                <img 
                  src={getUploadUrl(rankingRequest.certificate_url)} 
                  alt="Student Certificate" 
                  className="max-h-[38vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              )}
            </div>

            {/* Ranking Position Cards Selector */}
            <form onSubmit={handleConfirmRank} className="space-y-4 shrink-0">
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                  Select Award Rank & Certificate Level:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Rank 1 */}
                  <div
                    onClick={() => handleRankSelect('1')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1 ${
                      selectedRank === '1'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-xs'
                        : 'border-slate-200 hover:border-amber-300 bg-white text-slate-700'
                    }`}
                  >
                    <Trophy className="w-6 h-6 text-amber-600 fill-amber-500" />
                    <span className="text-xs font-black font-mono">Rank 1</span>
                    <span className="text-[10px] text-amber-700 font-bold uppercase">1st Prize / Winner</span>
                    <span className="text-[10px] text-slate-500 font-mono">+50 Bonus PTS</span>
                  </div>

                  {/* Rank 2 */}
                  <div
                    onClick={() => handleRankSelect('2')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1 ${
                      selectedRank === '2'
                        ? 'border-slate-500 bg-slate-100 text-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-400 bg-white text-slate-700'
                    }`}
                  >
                    <Medal className="w-6 h-6 text-slate-600 fill-slate-400" />
                    <span className="text-xs font-black font-mono">Rank 2</span>
                    <span className="text-[10px] text-slate-700 font-bold uppercase">2nd Runner Up</span>
                    <span className="text-[10px] text-slate-500 font-mono">+30 Bonus PTS</span>
                  </div>

                  {/* Rank 3 */}
                  <div
                    onClick={() => handleRankSelect('3')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1 ${
                      selectedRank === '3'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs'
                        : 'border-slate-200 hover:border-amber-400 bg-white text-slate-700'
                    }`}
                  >
                    <Medal className="w-6 h-6 text-amber-700 fill-amber-600" />
                    <span className="text-xs font-black font-mono">Rank 3</span>
                    <span className="text-[10px] text-amber-800 font-bold uppercase">3rd Place</span>
                    <span className="text-[10px] text-slate-500 font-mono">+20 Bonus PTS</span>
                  </div>

                  {/* Participated */}
                  <div
                    onClick={() => handleRankSelect('participated')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1 ${
                      selectedRank === 'participated'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-xs'
                        : 'border-slate-200 hover:border-emerald-300 bg-white text-slate-700'
                    }`}
                  >
                    <Award className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-black font-mono">Participated</span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">Participant</span>
                    <span className="text-[10px] text-slate-500 font-mono">Base Event PTS</span>
                  </div>
                </div>
              </div>

              {/* Points Adjustment & Feedback Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Total Reward Points Credited:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    required
                  />
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Event Base: {rankingRequest.reward_points} PTS. Points will be automatically credited to student wallet.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Admin Note / Congratulatory Remark:
                  </label>
                  <input
                    type="text"
                    value={rankNote}
                    onChange={(e) => setRankNote(e.target.value)}
                    placeholder="e.g. Excellent project pitch and prototype!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRankingRequest(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmittingRank}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  icon={Trophy}
                >
                  Confirm Verification & Award Rank
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Reject Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-pop">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reject Registration Request</h3>
              <button 
                onClick={() => setRejectingRequest(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to reject <strong>{rejectingRequest.student_name}</strong> for event <strong>{rejectingRequest.event_title}</strong>?
            </p>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                Rejection Reason (Visible to Student):
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Invalid registration screenshot proof or eligibility criteria not met."
                rows="3"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-sans text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingRequest(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                loading={processingId === rejectingRequest.id}
                icon={XCircle}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Confirmation Modal */}
      {isBulkApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-pop">
            <h3 className="text-base font-bold text-slate-900">Confirm Bulk Approval</h3>
            <p className="text-xs text-slate-600">
              You are about to approve <strong>{getTargetBulkIds().length}</strong> student registration(s). Each student will receive a confirmed seat status.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                icon={CheckCircle2}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Confirm Batch Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Confirmation Modal */}
      {isBulkRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-pop">
            <h3 className="text-base font-bold text-slate-900">Confirm Bulk Rejection</h3>
            <p className="text-xs text-slate-600">
              You are about to reject <strong>{getTargetBulkIds().length}</strong> registration request(s).
            </p>
            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase tracking-wide">
                Rejection Reason (Applied to all):
              </label>
              <textarea
                value={bulkRejectNote}
                onChange={(e) => setBulkRejectNote(e.target.value)}
                placeholder="e.g. Quota full or eligibility requirements not met."
                rows="3"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-sans text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                icon={XCircle}
              >
                Confirm Batch Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Requests;
