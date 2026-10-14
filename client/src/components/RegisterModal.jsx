import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import api from '../api/axios';
import { 
  X, 
  GraduationCap, 
  Building, 
  User, 
  Mail, 
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Calendar
} from 'lucide-react';

const RegisterModal = ({ event, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department_name || '',
    departmentCode: user?.department_code || '',
    yearOfStudyRoman: user?.yearOfStudyRoman || '',
    section: user?.section || 'A',
    registerNumber: user?.register_number || ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        department: user.department_name || prev.department,
        departmentCode: user.department_code || prev.departmentCode,
        yearOfStudyRoman: user.yearOfStudyRoman || prev.yearOfStudyRoman,
        section: user.section || prev.section || 'A',
        registerNumber: user.register_number || prev.registerNumber || ''
      }));
    }
  }, [user]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setGeneralError('');
  };

  const validate = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'College email is required';
    } else if (!formData.email.toLowerCase().endsWith('@francisxavier.ac.in')) {
      errors.email = 'Must end with @francisxavier.ac.in';
    }

    if (!['A', 'B', 'C', 'D'].includes(formData.section)) {
      errors.section = 'Section must be A, B, C, or D';
    }

    const reg = (formData.registerNumber || '').trim();
    if (!reg) {
      errors.registerNumber = 'Register number is required';
    } else if (!/^[A-Za-z0-9]{8,15}$/.test(reg)) {
      errors.registerNumber = 'Must be 8 to 15 alphanumeric characters (e.g. 953624104001)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/events/${event.id}/requests`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        section: formData.section,
        register_number: formData.registerNumber.trim().toUpperCase()
      });

      if (res.data.success) {
        // Show required Toast banner at the TOP of the screen (auto-hides after 3 seconds)
        showToast('Request sent to admin', 'success', 3000);
        onSuccess();
      }
    } catch (err) {
      console.error('Registration submission error:', err);
      const msg = err.response?.data?.message || 'Failed to submit registration request.';
      setGeneralError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-2xl max-w-lg w-full shadow-modal border border-slate-200 overflow-hidden animate-modal-pop my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-college-900 to-college-800 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-college-300" />
              <h3 className="font-extrabold text-base tracking-tight">Event Registration Request</h3>
            </div>
            <p className="text-xs text-college-200 mt-0.5 truncate max-w-sm">
              {event?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-college-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {generalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Read-Only College Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                College Email (Read-only)
              </label>
              <span className="text-[10px] text-college-600 font-bold bg-college-50 px-2 py-0.5 rounded-full border border-college-200">
                Verified Account
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={formData.email}
                readOnly
                disabled
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm font-medium cursor-not-allowed select-none"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Student Full Name (Auto-filled, editable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Student Full Name
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Auto-filled</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your official full name"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.name
                    ? 'border-rose-300 ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:border-college-500 focus:ring-college-500 bg-white'
                }`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Department & Year of Study (Read-only Chip) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.department || (formData.departmentCode ? formData.departmentCode.toUpperCase() : 'FXEC')}
                  readOnly
                  disabled
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-xs font-semibold cursor-not-allowed truncate"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Year of Study
              </label>
              <div className="h-10 px-3.5 rounded-xl border border-college-200 bg-college-50 flex items-center justify-between">
                <span className="text-xs font-bold text-college-900">
                  {formData.yearOfStudyRoman || 'Undergraduate'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-college-200/80 text-college-800 uppercase">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Section & Register Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Section (A - D)
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-college-500 focus:border-college-500"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              {fieldErrors.section && (
                <p className="text-[11px] font-medium text-rose-600 mt-1">
                  {fieldErrors.section}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Register Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="registerNumber"
                  value={formData.registerNumber}
                  onChange={handleChange}
                  placeholder="953624104001"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold uppercase placeholder:normal-case focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.registerNumber
                      ? 'border-rose-300 ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:border-college-500 focus:ring-college-500 bg-white'
                  }`}
                />
              </div>
              {fieldErrors.registerNumber && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.registerNumber}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl bg-college-700 hover:bg-college-800 text-white font-bold text-sm shadow-lg shadow-college-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default RegisterModal;
