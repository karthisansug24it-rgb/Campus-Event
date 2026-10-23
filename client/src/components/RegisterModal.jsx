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
  Sparkles,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { Button } from './ui/Button';

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
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Sync state with auth user profile
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

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, submitting]);

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

  const isUpdate = event?.user_request_status === 'pending' || event?.isUpdate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim());
      payload.append('section', formData.section);
      payload.append('register_number', formData.registerNumber.trim().toUpperCase());
      if (screenshotFile) {
        payload.append('screenshot', screenshotFile);
      }

      const res = await api.post(`/events/${event.id}/requests`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast(
          isUpdate ? 'Registration details updated successfully!' : 'Registration submitted! Screenshot proof sent for admin approval.', 
          'success', 
          3500
        );
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
      onClick={!submitting ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-dialog-title"
    >
      <div 
        className="relative bg-white text-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-modal-pop my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="register-dialog-title" className="font-display font-extrabold text-base tracking-tight text-slate-900">
                {isUpdate ? 'Update Registration Details' : 'Event Registration Request'}
              </h3>
              <p className="text-xs text-blue-700 font-mono font-semibold truncate max-w-xs mt-0.5">
                {event?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {generalError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Verified Read-Only College Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wide">
                College Email (Read-only)
              </label>
              <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
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
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs sm:text-sm font-mono cursor-not-allowed select-none"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Student Full Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wide">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Official FXEC Name</span>
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
                placeholder="Official student name"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none transition-all ${
                  fieldErrors.name
                    ? 'border-rose-300 bg-rose-50/40 text-rose-900 ring-1 ring-rose-300'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800'
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

          {/* Department & Year of Study (Verified Academic Chips) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold cursor-not-allowed truncate"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                Year of Study
              </label>
              <div className="h-10 px-3.5 rounded-xl border border-blue-200/90 bg-blue-50/70 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-900">
                  {formData.yearOfStudyRoman ? `${formData.yearOfStudyRoman} Year` : 'Undergraduate'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase border border-blue-200">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Section & Register Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                Section (A - D) <span className="text-rose-500">*</span>
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                Register Number <span className="text-rose-500">*</span>
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
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono font-semibold uppercase placeholder:normal-case focus:outline-none transition-all ${
                    fieldErrors.registerNumber
                      ? 'border-rose-300 bg-rose-50/40 text-rose-900 ring-1 ring-rose-300'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-800'
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

          {/* Optional Registration Screenshot Upload */}
          <div className="pt-1">
            <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center justify-between">
              <span>Registration Screenshot Proof</span>
              <span className="text-[10px] text-slate-400 font-normal font-sans">(Optional: upload now or later)</span>
            </label>
            <div className="border border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-3.5 bg-slate-50/60 relative cursor-pointer text-center transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setScreenshotFile(file);
                    setScreenshotPreview(URL.createObjectURL(file));
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {screenshotPreview ? (
                <div className="flex items-center gap-3 text-left">
                  <img src={screenshotPreview} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold font-mono text-blue-700 truncate">{screenshotFile?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Proof ready to submit with application</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScreenshotFile(null);
                      setScreenshotPreview(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-1 text-slate-500">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium">Attach screenshot proof of event registration (optional)</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              className="flex-1"
              loading={submitting}
            >
              {isUpdate ? 'Update Registration' : 'Submit Request'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default RegisterModal;
