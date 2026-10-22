import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../Toast';
import { 
  X, 
  Users, 
  Calendar, 
  MapPin, 
  Award, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Loader2, 
  Check, 
  AlertCircle,
  Building,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const EventAttendeesModal = ({ eventId, isOpen, onClose }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventData, setEventData] = useState(null);
  const [attendees, setAttendees] = useState([]);
  
  // Filters within modal
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, approved, pending, rejected
  const [deptFilter, setDeptFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [togglingId, setTogglingId] = useState(null);

  const fetchAttendees = async () => {
    if (!eventId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/events/${eventId}/attendees`);
      if (res.data.success) {
        setEventData(res.data.data.event);
        setAttendees(res.data.data.attendees || []);
      }
    } catch (err) {
      console.error('Failed to load event attendees:', err);
      setError('Failed to load registered students for this event.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      fetchAttendees();
      setSearchQuery('');
      setStatusFilter('all');
      setDeptFilter('all');
      setYearFilter('all');
    }
  }, [isOpen, eventId]);

  // Attendance Toggle
  const handleToggleAttendance = async (studentRequestId) => {
    setTogglingId(studentRequestId);
    try {
      const res = await api.patch(`/admin/requests/${studentRequestId}/attendance`);
      if (res.data.success) {
        setAttendees(prev => prev.map(a => 
          a.id === studentRequestId 
            ? { ...a, attended: res.data.data.attended ? 1 : 0 }
            : a
        ));
        showToast(res.data.message || 'Attendance status updated', 'success');
      }
    } catch (err) {
      console.error('Attendance toggle error:', err);
      showToast('Failed to update attendance.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Unique departments present in the attendees list
  const availableDepts = useMemo(() => {
    const map = new Map();
    attendees.forEach(a => {
      if (a.department_code && a.department_name) {
        map.set(a.department_code, a.department_name);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [attendees]);

  // Filtered attendees
  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      // Status
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      // Department
      if (deptFilter !== 'all' && a.department_code !== deptFilter) return false;
      // Year
      if (yearFilter !== 'all') {
        const yr = String(a.year_of_study || '');
        if (yr !== String(yearFilter)) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = a.name?.toLowerCase().includes(q);
        const emailMatch = a.email?.toLowerCase().includes(q);
        const regMatch = a.register_number?.toLowerCase().includes(q);
        const deptMatch = a.department_name?.toLowerCase().includes(q) || a.department_code?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !regMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [attendees, statusFilter, deptFilter, yearFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = attendees.length;
    const approved = attendees.filter(a => a.status === 'approved').length;
    const pending = attendees.filter(a => a.status === 'pending').length;
    const rejected = attendees.filter(a => a.status === 'rejected').length;
    const attended = attendees.filter(a => a.attended === 1 || a.attended === true).length;
    return { total, approved, pending, rejected, attended };
  }, [attendees]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredAttendees.length) return;
    const headers = ['S.No', 'Student Name', 'College Email', 'Register Number', 'Department', 'Year of Study', 'Section', 'Status', 'Attendance', 'Requested At'];
    const rows = filteredAttendees.map((a, idx) => [
      idx + 1,
      `"${a.name || ''}"`,
      a.email || '',
      a.register_number || '',
      `"${a.department_name || a.department_code || ''}"`,
      `Year ${a.year_of_study || ''}`,
      a.section || '',
      a.status?.toUpperCase() || '',
      a.attended ? 'PRESENT' : 'ABSENT',
      a.created_at ? new Date(a.created_at).toLocaleString() : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const eventNameSlug = (eventData?.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${eventNameSlug}_attendees_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Student attendees CSV exported successfully!', 'success');
  };

  // Print view
  const handlePrint = () => {
    window.print();
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white text-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-modal-pop overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/90 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                eventData?.is_past
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {eventData?.is_past ? 'Completed · Past Event' : 'Upcoming Event'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {eventData?.category} · {eventData?.event_type === 'internal' ? 'Inside College' : 'External'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 tracking-tight">
              {eventData?.title || 'Event Registrations'}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {formatDate(eventData?.event_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {eventData?.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                {eventData?.reward_points} Reward Points
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-white border-b border-slate-200/80 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Requests</span>
            <span className="text-lg font-black text-slate-900 mt-0.5">{stats.total}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Approved Seats</span>
            <span className="text-lg font-black text-emerald-800 mt-0.5">
              {stats.approved} {eventData?.max_seats ? `/ ${eventData.max_seats}` : ''}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-700">Pending Review</span>
            <span className="text-lg font-black text-amber-800 mt-0.5">{stats.pending}</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-rose-700">Rejected</span>
            <span className="text-lg font-black text-rose-800 mt-0.5">{stats.rejected}</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-blue-700">Marked Attended</span>
            <span className="text-lg font-black text-blue-800 mt-0.5">
              {stats.attended} <span className="text-xs font-bold text-blue-600">({stats.approved > 0 ? Math.round((stats.attended / stats.approved) * 100) : 0}%)</span>
            </span>
          </div>
        </div>

        {/* Filters & Export Row */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, reg no..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses ({attendees.length})</option>
              <option value="approved">Approved Only ({stats.approved})</option>
              <option value="pending">Pending Only ({stats.pending})</option>
              <option value="rejected">Rejected Only ({stats.rejected})</option>
            </select>

            {/* Department Dropdown */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {availableDepts.map(d => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code.toUpperCase()})
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year (I Year)</option>
              <option value="2">2nd Year (II Year)</option>
              <option value="3">3rd Year (III Year)</option>
              <option value="4">4th Year (IV Year)</option>
            </select>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredAttendees.length === 0}
              icon={Download}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={filteredAttendees.length === 0}
              icon={Printer}
            >
              Print Sheet
            </Button>
          </div>
        </div>

        {/* Modal Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                Retrieving student records...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600">No registered students found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try adjusting the status, department, or year filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Department & Year</th>
                    <th className="py-3 px-4">Registration Status</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendees.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Student Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                            {a.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{a.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono select-all">{a.email}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                {a.register_number}
                              </span>
                              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                Sec {a.section}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Year */}
                      <td className="py-3 px-4 font-mono space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                            Year {a.year_of_study}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (Adm {a.admission_year})
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {a.department_name}
                        </p>
                      </td>

                      {/* Registration Status */}
                      <td className="py-3 px-4">
                        {a.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        ) : a.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200" title={a.admin_note}>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rejected
                          </span>
                        )}
                        {a.admin_note && (
                          <p className="text-[10px] text-slate-500 mt-1 max-w-xs truncate" title={a.admin_note}>
                            Note: {a.admin_note}
                          </p>
                        )}
                      </td>

                      {/* Attendance Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(a.id)}
                          disabled={togglingId === a.id || a.status !== 'approved'}
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                            a.attended
                              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          } ${a.status !== 'approved' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={a.status !== 'approved' ? 'Only approved registrations can be marked present' : 'Click to toggle attendance'}
                        >
                          {togglingId === a.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : a.attended ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                          )}
                          <span>{a.attended ? 'Present' : 'Absent'}</span>
                        </button>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {formatDate(a.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">
            Showing <strong className="text-slate-800">{filteredAttendees.length}</strong> of {attendees.length} student records
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventAttendeesModal;
