import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import RegisterModal from '../../components/RegisterModal';
import { 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  Award,
  Loader2,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
  Upload,
  Image as ImageIcon,
  Eye,
  X,
  Trophy,
  Medal,
  AlertTriangle,
  ExternalLink,
  Check,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  PageHeader, 
  Button, 
  Badge, 
  SearchInput, 
  FilterChips, 
  EmptyState,
  AnimatedSection
} from '../../components/ui';
import { getPosterUrl, handleImageError } from '../../utils/imageUrl';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [alerts, setAlerts] = useState({ missingScreenshots: [], pendingCertificates: [], recentAwards: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  // Re-apply modal state
  const [reapplyEvent, setReapplyEvent] = useState(null);

  // Upload Screenshot Modal State
  const [screenshotModalReq, setScreenshotModalReq] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState('');

  // Upload Certificate Modal State
  const [certModalReq, setCertModalReq] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [certPreview, setCertPreview] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certError, setCertError] = useState('');

  // Lightbox Media Preview
  const [lightboxMedia, setLightboxMedia] = useState(null); // { url, title, type }

  const fetchMyRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, alertsRes] = await Promise.all([
        api.get('/my/requests'),
        api.get('/my/alerts').catch(() => ({ data: { success: false, data: {} } }))
      ]);

      if (reqRes.data.success) {
        setRequests(reqRes.data.data);
      }
      if (alertsRes.data.success && alertsRes.data.data) {
        setAlerts(alertsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Could not load your registration requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

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

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Status counts across the stages
  const counts = useMemo(() => {
    const total = requests.length;
    const registered = requests.filter(r => r.status === 'registered' || r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'registration_approved' || r.status === 'approved').length;
    const participated = requests.filter(r => r.status === 'participated').length;
    const ranked = requests.filter(r => r.status === 'ranked').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    return { total, registered, approved, participated, ranked, rejected };
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      let matchesStatus = true;
      if (statusFilter === 'registered') {
        matchesStatus = req.status === 'registered' || req.status === 'pending';
      } else if (statusFilter === 'approved') {
        matchesStatus = req.status === 'registration_approved' || req.status === 'approved';
      } else if (statusFilter === 'participated') {
        matchesStatus = req.status === 'participated';
      } else if (statusFilter === 'ranked') {
        matchesStatus = req.status === 'ranked';
      } else if (statusFilter === 'rejected') {
        matchesStatus = req.status === 'rejected';
      }

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        req.event_title?.toLowerCase().includes(q) ||
        req.venue?.toLowerCase().includes(q) ||
        req.category?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  // Handle Screenshot Upload Submit
  const handleUploadScreenshotSubmit = async (e) => {
    e.preventDefault();
    if (!screenshotFile) {
      setScreenshotError('Please select a screenshot image file (JPG, PNG, WebP).');
      return;
    }

    setUploadingScreenshot(true);
    setScreenshotError('');

    try {
      const formData = new FormData();
      formData.append('screenshot', screenshotFile);

      const res = await api.post(`/my/requests/${screenshotModalReq.id}/screenshot`, formData);

      if (res.data.success) {
        setScreenshotModalReq(null);
        setScreenshotFile(null);
        setScreenshotPreview(null);
        fetchMyRequests();
      }
    } catch (err) {
      console.error('Upload screenshot error:', err);
      setScreenshotError(err.response?.data?.message || 'Failed to upload registration screenshot.');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  // Handle Certificate Upload Submit
  const handleUploadCertSubmit = async (e) => {
    e.preventDefault();
    if (!certFile) {
      setCertError('Please select a certificate file (JPG, PNG, WebP, or PDF).');
      return;
    }

    setUploadingCert(true);
    setCertError('');

    try {
      const formData = new FormData();
      formData.append('certificate', certFile);

      const res = await api.post(`/my/requests/${certModalReq.id}/certificate`, formData);

      if (res.data.success) {
        setCertModalReq(null);
        setCertFile(null);
        setCertPreview(null);
        fetchMyRequests();
      }
    } catch (err) {
      console.error('Upload cert error:', err);
      setCertError(err.response?.data?.message || 'Failed to upload participation certificate.');
    } finally {
      setUploadingCert(false);
    }
  };

  // Render Status Badge
  const getStatusBadge = (req) => {
    const status = req.status;
    if (status === 'ranked') {
      const rank = req.rank_position;
      if (rank === '1') {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>Rank 1 Winner</span>
          </span>
        );
      }
      if (rank === '2') {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-xs">
            <Medal className="w-3.5 h-3.5 text-slate-600 fill-slate-400" />
            <span>Rank 2 Runner Up</span>
          </span>
        );
      }
      if (rank === '3') {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-400/60 shadow-xs">
            <Medal className="w-3.5 h-3.5 text-amber-700 fill-amber-600" />
            <span>Rank 3 Place</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Participated (Verified)</span>
        </span>
      );
    }

    if (status === 'participated') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-300 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>Certificate Under Review</span>
        </span>
      );
    }

    if (status === 'registration_approved' || status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Registration Approved ✓</span>
        </span>
      );
    }

    if (status === 'registered' || status === 'pending') {
      const hasScreenshot = Boolean(req.registration_screenshot);
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-xs ${
          hasScreenshot 
            ? 'bg-blue-50 text-blue-800 border border-blue-300' 
            : 'bg-amber-50 text-amber-800 border border-amber-300'
        }`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${hasScreenshot ? 'bg-blue-600' : 'bg-amber-500'}`} />
          <span>{hasScreenshot ? 'Proof Submitted (In Review)' : 'Proof Required'}</span>
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Rejected</span>
        </span>
      );
    }

    return null;
  };

  // Determine active step index (1: registered, 2: registration_approved, 3: participated, 4: ranked)
  const getStageStep = (req) => {
    if (req.status === 'ranked') return 4;
    if (req.status === 'participated') return 3;
    if (req.status === 'registration_approved' || req.status === 'approved') return 2;
    if (req.status === 'registered' || req.status === 'pending') return 1;
    return 0; // rejected
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        <AnimatedSection delay={0.05}>
          <PageHeader
            badge="STUDENT EVENT TRACKER"
            title="My Applied Events & Stage Tracking"
            subtitle="Track your progress through all 4 stages: Registered, Registration Approved, Participated, and Admin Certificate Ranking."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMyRequests}
                icon={RefreshCw}
                loading={loading}
              >
                Refresh Queue
              </Button>
            }
          />
        </AnimatedSection>

        {/* Action Deadline Alerts Banner */}
        {((alerts.missingScreenshots && alerts.missingScreenshots.length > 0) || 
          (alerts.pendingCertificates && alerts.pendingCertificates.length > 0) ||
          (alerts.recentAwards && alerts.recentAwards.length > 0)) && (
          <AnimatedSection delay={0.1} className="space-y-3">
            {/* Missing Screenshot Alert */}
            {alerts.missingScreenshots && alerts.missingScreenshots.length > 0 && (
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-300/80 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-700 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-800">
                      Action Required: Registration Screenshot Proof Missing ({alerts.missingScreenshots.length})
                    </h5>
                    <p className="text-xs text-amber-900/90 mt-0.5">
                      Upload your registration screenshot for <strong>{alerts.missingScreenshots[0].event_title}</strong> so admin can verify and confirm your seat before registration deadline.
                    </p>
                  </div>
                </div>
                <Button
                  size="xs"
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-bold"
                  onClick={() => {
                    const targetReq = requests.find(r => r.id === alerts.missingScreenshots[0].id);
                    if (targetReq) setScreenshotModalReq(targetReq);
                  }}
                  icon={Upload}
                >
                  Upload Proof
                </Button>
              </div>
            )}

            {/* Pending Certificate Submission Alert */}
            {alerts.pendingCertificates && alerts.pendingCertificates.length > 0 && (
              <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-300/80 text-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-2xl bg-purple-500/20 text-purple-700 shrink-0 mt-0.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-800">
                      Certificate Submission Ready ({alerts.pendingCertificates.length})
                    </h5>
                    <p className="text-xs text-purple-900/90 mt-0.5">
                      Your registration was approved for <strong>{alerts.pendingCertificates[0].event_title}</strong>. Upload your participation certificate to be ranked and earn reward points!
                    </p>
                  </div>
                </div>
                <Button
                  size="xs"
                  variant="primary"
                  className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 font-bold"
                  onClick={() => {
                    const targetReq = requests.find(r => r.id === alerts.pendingCertificates[0].id);
                    if (targetReq) setCertModalReq(targetReq);
                  }}
                  icon={Upload}
                >
                  Submit Certificate
                </Button>
              </div>
            )}

            {/* Recent Ranking Awards */}
            {alerts.recentAwards && alerts.recentAwards.length > 0 && (
              <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-300/80 text-emerald-900 flex items-center gap-3 shadow-xs">
                <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-700 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-800">
                    Congratulations! Award & Ranking Verified
                  </h5>
                  <p className="text-xs text-emerald-900/90 mt-0.5">
                    You were awarded <strong>Rank {alerts.recentAwards[0].rank_position.toUpperCase()}</strong> in <strong>{alerts.recentAwards[0].event_title}</strong> with <strong>+{alerts.recentAwards[0].rank_points_awarded} reward points</strong> credited to your profile!
                  </p>
                </div>
              </div>
            )}
          </AnimatedSection>
        )}

        {/* Real Stage Telemetry Cards */}
        <AnimatedSection className="grid grid-cols-2 lg:grid-cols-5 gap-3.5" delay={0.15}>
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Applied</p>
            <h4 className="text-2xl font-black font-mono text-slate-900 mt-1">{counts.total}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Campus records</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600">1. Registered</p>
            <h4 className="text-2xl font-black font-mono text-blue-600 mt-1">{counts.registered}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Proof pending review</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">2. Approved</p>
            <h4 className="text-2xl font-black font-mono text-emerald-600 mt-1">{counts.approved}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Seats confirmed</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600">3. Participated</p>
            <h4 className="text-2xl font-black font-mono text-purple-600 mt-1">{counts.participated}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Cert under review</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs col-span-2 lg:col-span-1">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600">4. Ranked</p>
            <h4 className="text-2xl font-black font-mono text-amber-600 mt-1">{counts.ranked}</h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Prizes & points won</p>
          </div>
        </AnimatedSection>

        {/* Search & Filter Bar */}
        <AnimatedSection className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4" delay={0.2}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search by event title, category, or venue..."
            className="max-w-md"
          />

          <FilterChips
            options={[
              { value: 'all', label: 'All', count: counts.total },
              { value: 'registered', label: 'Registered', count: counts.registered },
              { value: 'approved', label: 'Approved', count: counts.approved },
              { value: 'participated', label: 'Participated', count: counts.participated },
              { value: 'ranked', label: 'Ranked', count: counts.ranked },
              { value: 'rejected', label: 'Rejected', count: counts.rejected },
            ]}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
        </AnimatedSection>

        {/* Content Display */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Retrieving your registration records & stage progress...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="primary" size="xs" onClick={fetchMyRequests}>
              Retry
            </Button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={requests.length === 0 ? "No Event Requests Yet" : "No Matching Requests"}
            description={
              requests.length === 0 
                ? "You haven't requested registration for any campus events yet. Explore upcoming hackathons, workshops, and conferences."
                : "No registration records match your current status filter or search keywords."
            }
            actionLabel={requests.length === 0 ? "Browse Events Catalogue" : "Reset Filter"}
            onAction={
              requests.length === 0 
                ? () => window.location.href = '/events'
                : () => { setStatusFilter('all'); setSearchQuery(''); }
            }
            actionIcon={ArrowRight}
          />
        ) : (
          /* Structured Requests List */
          <div className="space-y-6">
            {filteredRequests.map((req) => {
              const currentStep = getStageStep(req);
              const isRejected = req.status === 'rejected';

              return (
                <div 
                  key={req.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-300 flex flex-col space-y-5"
                >
                  {/* Top Header Row: Poster & Event Info */}
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    {/* Poster Thumbnail */}
                    <div className="w-full md:w-52 aspect-[16/10] md:h-36 rounded-2xl bg-slate-900 overflow-hidden shrink-0 relative border border-slate-200/80 flex items-center justify-center p-1.5">
                      {req.poster_url ? (
                        <>
                          <img 
                            src={getPosterUrl(req.poster_url)} 
                            alt="" 
                            aria-hidden="true" 
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-125 pointer-events-none" 
                            onError={(e) => handleImageError(e, req.poster_url)}
                          />
                          <img 
                            src={getPosterUrl(req.poster_url)} 
                            alt={req.event_title} 
                            className="relative z-10 w-auto h-auto max-w-full max-h-full object-contain rounded-xl"
                            onError={(e) => handleImageError(e, req.poster_url)}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/70 text-blue-900 p-3 text-center">
                          <Calendar className="w-8 h-8 text-blue-600 mb-1" />
                          <span className="text-xs font-bold leading-snug line-clamp-2">{req.event_title}</span>
                        </div>
                      )}
                      <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xs z-20 ${
                        req.event_type === 'internal' ? 'bg-blue-600' : 'bg-slate-900'
                      }`}>
                        {req.event_type === 'internal' ? 'Inside FXEC' : 'Outside Campus'}
                      </span>
                    </div>

                    {/* Main Event Info */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                            {req.category}
                          </span>
                          <h3 className="text-lg font-extrabold font-display text-slate-900 leading-snug mt-0.5">
                            {req.event_title}
                          </h3>
                        </div>
                        <div>
                          {getStatusBadge(req)}
                        </div>
                      </div>

                      {/* Metadata Chips: Date, Venue, Deadlines */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Event Date: <strong className="text-slate-800">{formatDate(req.event_date)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate text-slate-800 font-medium">{req.venue}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Reg Deadline: <strong className="text-slate-800">{formatShortDate(req.registration_deadline)}</strong></span>
                        </div>
                        {req.certificate_deadline && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Cert Deadline: <strong className="text-purple-900">{formatShortDate(req.certificate_deadline)}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Student Application Record */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono">
                        <span>Year: <strong className="text-slate-900">Year {req.year_of_study}</strong></span>
                        <span>Dept: <strong className="text-slate-900">{req.department_name}</strong></span>
                        <span>Sec: <strong className="text-slate-900">{req.section}</strong></span>
                        <span>Reg No: <strong className="text-blue-700 font-bold">{req.register_number}</strong></span>
                        <span className="text-slate-400">· Applied {formatDate(req.requested_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Stage Progress Stepper Bar */}
                  {!isRejected && (
                    <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          Stage Progress Tracking
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-700">
                          Stage {currentStep} of 4 Completed
                        </span>
                      </div>

                      {/* Step Bubbles & Connector */}
                      <div className="grid grid-cols-4 gap-2 relative">
                        {/* 1. Registered */}
                        <div className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          currentStep >= 1 ? 'bg-blue-50/70 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                          </div>
                          <span className="text-[11px] font-bold font-mono">1. Registered</span>
                          <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
                            {req.registration_screenshot ? 'Proof uploaded ✓' : 'Proof needed'}
                          </span>
                        </div>

                        {/* 2. Registration Approved */}
                        <div className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          currentStep >= 2 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                          </div>
                          <span className="text-[11px] font-bold font-mono">2. Approved</span>
                          <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
                            {currentStep >= 2 ? 'Seat confirmed ✓' : 'Awaiting approval'}
                          </span>
                        </div>

                        {/* 3. Participated */}
                        <div className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          currentStep >= 3 ? 'bg-purple-50/70 border-purple-300 text-purple-900' : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                          </div>
                          <span className="text-[11px] font-bold font-mono">3. Participated</span>
                          <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
                            {req.certificate_url ? 'Cert submitted ✓' : 'Upload certificate'}
                          </span>
                        </div>

                        {/* 4. Ranked */}
                        <div className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          currentStep >= 4 ? 'bg-amber-50/70 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            currentStep >= 4 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {currentStep >= 4 ? <Trophy className="w-3.5 h-3.5" /> : '4'}
                          </div>
                          <span className="text-[11px] font-bold font-mono">4. Ranked</span>
                          <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
                            {req.status === 'ranked' ? `Rank ${req.rank_position.toUpperCase()}` : 'Awaiting ranking'}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Stage Actions & Proof Management */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80">
                        {/* Stage 1 Proof Status & Button */}
                        <div className="flex items-center gap-2">
                          {req.registration_screenshot ? (
                            <button
                              type="button"
                              onClick={() => setLightboxMedia({ url: req.registration_screenshot, title: `${req.event_title} - Registration Screenshot Proof`, type: 'image' })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100/70 text-blue-800 text-xs font-mono font-bold hover:bg-blue-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Registration Screenshot</span>
                            </button>
                          ) : (
                            <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Registration screenshot proof not yet uploaded
                            </span>
                          )}

                          {/* Allow student to upload or replace screenshot while in registered/pending stage */}
                          {(req.status === 'registered' || req.status === 'pending') && (
                            <Button
                              size="xs"
                              variant="outline"
                              className="font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => setScreenshotModalReq(req)}
                              icon={Upload}
                            >
                              {req.registration_screenshot ? 'Update Screenshot' : 'Upload Screenshot'}
                            </Button>
                          )}
                        </div>

                        {/* Stage 3 & 4 Certificate Management */}
                        <div className="flex items-center gap-2">
                          {req.certificate_url && (
                            <button
                              type="button"
                              onClick={() => {
                                const isPdf = req.certificate_url.toLowerCase().endsWith('.pdf');
                                if (isPdf) {
                                  window.open(req.certificate_url, '_blank');
                                } else {
                                  setLightboxMedia({ url: req.certificate_url, title: `${req.event_title} - Participation Certificate`, type: 'image' });
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100/70 text-purple-800 text-xs font-mono font-bold hover:bg-purple-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Certificate</span>
                            </button>
                          )}

                          {/* Certificate upload button enabled once registration is approved */}
                          {['registration_approved', 'approved', 'participated'].includes(req.status) && (
                            <Button
                              size="xs"
                              variant="primary"
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                              onClick={() => setCertModalReq(req)}
                              icon={Upload}
                            >
                              {req.certificate_url ? 'Replace Certificate' : 'Upload Certificate'}
                            </Button>
                          )}

                          {req.status === 'ranked' && (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-amber-300">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                +{req.rank_points_awarded || req.reward_points} PTS AWARDED
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejected Feedback Note */}
                  {isRejected && (
                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-slate-700 text-xs space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold font-mono text-rose-800 uppercase tracking-wide text-[10px]">
                            Administrator Rejection Note:
                          </p>
                          <p className="mt-0.5 text-slate-700 leading-relaxed font-sans">
                            {req.admin_note || 'Registration rejected by administrator.'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] font-mono text-rose-700 font-semibold">
                        <span>Decision Finalized</span>
                        <span>Re-registration is not permitted</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Upload Registration Screenshot Modal */}
      {screenshotModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">STAGE 1: VERIFICATION</span>
                <h3 className="text-lg font-bold text-slate-900">Upload Registration Screenshot</h3>
              </div>
              <button 
                onClick={() => { setScreenshotModalReq(null); setScreenshotFile(null); setScreenshotPreview(null); }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Event: <strong>{screenshotModalReq.event_title}</strong>. Please upload a clear screenshot of your event registration (e.g., Google form confirmation, payment receipt, or portal registration ticket).
            </p>

            <form onSubmit={handleUploadScreenshotSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setScreenshotFile(file);
                      setScreenshotPreview(URL.createObjectURL(file));
                      setScreenshotError('');
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {screenshotPreview ? (
                  <div className="space-y-2">
                    <img 
                      src={screenshotPreview} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-xl object-contain shadow-xs border border-slate-200" 
                    />
                    <p className="text-xs text-blue-600 font-mono font-bold">Click or drag another image to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      <strong className="text-blue-600">Click to browse</strong> or drag & drop screenshot
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">PNG, JPG, or WebP up to 8 MB</p>
                  </div>
                )}
              </div>

              {screenshotError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{screenshotError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setScreenshotModalReq(null); setScreenshotFile(null); setScreenshotPreview(null); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={uploadingScreenshot}
                  disabled={!screenshotFile}
                  icon={Upload}
                >
                  Submit Screenshot Proof
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Participation Certificate Modal */}
      {certModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">STAGE 3: PARTICIPATION</span>
                <h3 className="text-lg font-bold text-slate-900">Upload Participation Certificate</h3>
              </div>
              <button 
                onClick={() => { setCertModalReq(null); setCertFile(null); setCertPreview(null); }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Event: <strong>{certModalReq.event_title}</strong>. Upload your official certificate of participation or prize/merit award certificate (Image or PDF). Admin will review it and assign your official Rank and Reward Points.
            </p>

            <form onSubmit={handleUploadCertSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCertFile(file);
                      if (file.type.startsWith('image/')) {
                        setCertPreview(URL.createObjectURL(file));
                      } else {
                        setCertPreview('pdf');
                      }
                      setCertError('');
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {certPreview === 'pdf' ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-purple-600" />
                    <p className="text-xs font-bold font-mono text-slate-800">{certFile?.name}</p>
                    <p className="text-[11px] text-purple-600 font-mono">PDF Document Selected</p>
                  </div>
                ) : certPreview ? (
                  <div className="space-y-2">
                    <img 
                      src={certPreview} 
                      alt="Certificate Preview" 
                      className="max-h-48 mx-auto rounded-xl object-contain shadow-xs border border-slate-200" 
                    />
                    <p className="text-xs text-purple-600 font-mono font-bold">Click or drag another file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      <strong className="text-purple-600">Click to browse</strong> or drag & drop certificate
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">JPG, PNG, WebP, or PDF up to 10 MB</p>
                  </div>
                )}
              </div>

              {certError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{certError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setCertModalReq(null); setCertFile(null); setCertPreview(null); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  loading={uploadingCert}
                  disabled={!certFile}
                  icon={Upload}
                >
                  Submit Certificate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Media Modal */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center border border-slate-800 shadow-2xl overflow-hidden">
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-3">
              <h4 className="text-sm font-mono font-bold text-white">{lightboxMedia.title}</h4>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img 
                src={lightboxMedia.url} 
                alt="Document Preview" 
                className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <a 
                href={lightboxMedia.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Re-application Modal */}
      {reapplyEvent && (
        <RegisterModal
          event={reapplyEvent}
          onClose={() => setReapplyEvent(null)}
          onSuccess={() => {
            setReapplyEvent(null);
            fetchMyRequests();
          }}
        />
      )}
    </div>
  );
};

export default MyRequests;
