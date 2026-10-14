import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Lock, CheckCircle, AlertCircle, Loader2, Sparkles, GraduationCap } from 'lucide-react';

export default function RegisterModal({ event, onClose, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.departmentName || user?.departmentCode?.toUpperCase() || '',
    departmentCode: user?.departmentCode || '',
    yearLabel: user?.yearLabel || '',
    section: user?.section || 'A',
    registerNumber: user?.registerNumber || ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Validate form fields inline
  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!value || value.trim().length === 0) {
        error = 'Full name is required.';
      } else if (value.trim().length < 2) {
        error = 'Name must be at least 2 characters.';
      }
    } else if (name === 'section') {
      if (!['A', 'B', 'C', 'D'].includes(value)) {
        error = 'Please select a valid section (A, B, C, or D).';
      }
    } else if (name === 'registerNumber') {
      if (!value || value.trim().length === 0) {
        error = 'Register number is required.';
      } else if (!/^[A-Za-z0-9]{8,15}$/.test(value.trim())) {
        error = 'Register number must be 8 to 15 alphanumeric characters.';
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate all fields
    const newErrors = {};
    const nameErr = validateField('name', formData.name);
    if (nameErr) newErrors.name = nameErr;

    const secErr = validateField('section', formData.section);
    if (secErr) newErrors.section = secErr;

    const regErr = validateField('registerNumber', formData.registerNumber);
    if (regErr) newErrors.registerNumber = regErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/events/${event.id}/requests`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        section: formData.section,
        registerNumber: formData.registerNumber.trim()
      });

      if (res.data && res.data.success) {
        // Show required top toast banner
        showToast('Request sent to admin', 'success', 3000);
        onSuccess();
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit registration request.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close register modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Event Registration Request</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Register for {event?.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review and submit your student credentials to register. Requests are reviewed by college administrators.
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span className="flex-1 text-xs font-medium">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-Only College Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              College Email <span className="text-slate-400 font-normal">(Read-only)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 text-sm font-medium cursor-not-allowed pr-10 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Verified FXEC domain (@francisxavier.ac.in)
            </p>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Karthisan S"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
              }`}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">Auto-filled from email, editable if required.</p>
            )}
          </div>

          {/* Department & Year of Study (Derived & Read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department <span className="text-slate-400 font-normal">(Read-only)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  readOnly
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 text-sm font-medium cursor-not-allowed pr-9 focus:outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Year of Study
              </label>
              <div className="h-[42px] px-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900 text-sm font-bold">
                <span>{formData.yearLabel || 'Active Student'}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-200/80 text-blue-800">
                  Derived
                </span>
              </div>
            </div>
          </div>

          {/* Section & Register Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Section <span className="text-rose-500">*</span>
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              {errors.section && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.section}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Register Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
                placeholder="e.g. 950724104042"
                maxLength={15}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.registerNumber
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                }`}
              />
              {errors.registerNumber && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.registerNumber}</p>
              )}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-700/25 transition-all flex items-center gap-2 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
