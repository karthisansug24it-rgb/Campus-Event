import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
  GraduationCap, 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Info
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, parseEmail, isAuthenticated, isAdmin, isStudent } = useAuth();
  const { showToast } = useToast();

  // Mode: 'signin' or 'signup'
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  // Role toggle: 'student' or 'admin' (only active in signin mode)
  const [selectedRole, setSelectedRole] = useState('student');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    section: 'A',
    registerNumber: ''
  });

  // Dynamic email parse preview state
  const [parsingEmail, setParsingEmail] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [emailParseError, setEmailParseError] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || (isAdmin ? '/admin' : '/events');
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, location]);

  // Debounced email parser for live auto-fill preview
  useEffect(() => {
    if (!formData.email) {
      setParsedData(null);
      setEmailParseError('');
      return;
    }

    const timer = setTimeout(async () => {
      const trimmed = formData.email.trim().toLowerCase();
      if (!trimmed.includes('@')) return;

      if (!trimmed.endsWith('@francisxavier.ac.in')) {
        setEmailParseError('Only official @francisxavier.ac.in emails are accepted.');
        setParsedData(null);
        return;
      }

      setParsingEmail(true);
      try {
        const res = await parseEmail(trimmed);
        if (res.success && res.data?.valid) {
          setParsedData(res.data);
          setEmailParseError('');
          // Auto-fill Name if empty or currently untouched
          if (!formData.name && res.data.name) {
            setFormData(prev => ({ ...prev, name: res.data.name }));
          }
        }
      } catch (err) {
        setParsedData(null);
        setEmailParseError(err.response?.data?.message || 'Invalid college email format.');
      } finally {
        setParsingEmail(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = formData.email.trim().toLowerCase();

    // Sign Up submission
    if (isSignUpMode) {
      if (!trimmedEmail.endsWith('@francisxavier.ac.in')) {
        setFormError('Only official @francisxavier.ac.in emails are permitted.');
        return;
      }

      if (formData.password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }

      if (parsedData?.isAlumni) {
        setFormError('Alumni accounts cannot register for active campus events.');
        return;
      }

      setSubmitting(true);
      try {
        await signup({
          name: formData.name,
          email: trimmedEmail,
          password: formData.password,
          section: formData.section,
          registerNumber: formData.registerNumber
        });
        showToast('Welcome! Your student account has been created.', 'success');
        navigate('/events', { replace: true });
      } catch (err) {
        setFormError(err.response?.data?.message || err.message || 'Signup failed.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Sign In submission
      if (!trimmedEmail || !formData.password) {
        setFormError('Please enter both email and password.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await login(trimmedEmail, formData.password, selectedRole);
        showToast(`Welcome back, ${res.data.user.name}!`, 'success');
        const target = selectedRole === 'admin' ? '/admin' : '/events';
        navigate(target, { replace: true });
      } catch (err) {
        setFormError(err.response?.data?.message || err.message || 'Login failed.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-college-50/60 via-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        
        {/* College Header Crest */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-college-800 text-white shadow-lg shadow-college-800/25 mb-3 ring-4 ring-college-100">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Francis Xavier Engineering College
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Campus Event Management Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 backdrop-blur-sm">
          
          {/* Student vs Admin Toggle (Only visible in Sign In mode) */}
          {!isSignUpMode ? (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => { setSelectedRole('student'); setFormError(''); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'student'
                    ? 'bg-white text-college-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Login</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setFormError(''); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-college-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            </div>
          ) : (
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-college-600" />
                Student Registration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your official college email address to automatically configure your profile.
              </p>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* College Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                {selectedRole === 'admin' && !isSignUpMode ? 'Admin Email' : 'College Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={
                    selectedRole === 'admin' && !isSignUpMode 
                      ? 'admin@francisxavier.ac.in' 
                      : 'karthisans.ug.24.it@francisxavier.ac.in'
                  }
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-college-500 focus:border-college-500 focus:bg-white transition-all font-medium placeholder:text-slate-400"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {parsingEmail && <Loader2 className="w-4 h-4 text-college-600 animate-spin" />}
                  {!parsingEmail && parsedData && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Inline validation feedback for Email */}
              {emailParseError && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {emailParseError}
                </p>
              )}

              {/* Derived Information Card (shown when email is validly parsed) */}
              {parsedData && (
                <div className="mt-2.5 p-3 rounded-xl bg-college-50/80 border border-college-200/70 text-college-900 space-y-1.5 animate-modal-pop">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-college-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified FXEC Student
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-college-200/80 text-college-900 text-[10px] font-extrabold uppercase">
                      {parsedData.yearOfStudyRoman}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-college-200/50 text-slate-700">
                    <div>
                      <span className="text-slate-500">Department:</span>{' '}
                      <span className="font-semibold text-slate-900">{parsedData.departmentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Degree:</span>{' '}
                      <span className="font-semibold text-slate-900">{parsedData.level?.toUpperCase()} ({parsedData.admissionYear})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Extra Fields for Sign Up Mode */}
            {isSignUpMode && (
              <>
                {/* Editable Student Name (pre-filled from email) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Full Name
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Auto-derived, editable</span>
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
                      placeholder="e.g. Karthisans"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-college-500 focus:border-college-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Section & Register Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Section
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-college-500 focus:border-college-500 focus:bg-white font-medium"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Reg Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="registerNumber"
                        value={formData.registerNumber}
                        onChange={handleChange}
                        placeholder="953624104001"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-college-500 focus:border-college-500 focus:bg-white uppercase font-medium placeholder:normal-case"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-college-500 focus:border-college-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Confirm Password in Sign Up Mode */}
            {isSignUpMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-college-500 focus:border-college-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedRole === 'admin' && !isSignUpMode
                  ? 'bg-college-900 hover:bg-slate-900 shadow-college-900/25'
                  : 'bg-college-600 hover:bg-college-700 shadow-college-600/30'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSignUpMode ? 'Creating Account...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUpMode ? 'Complete Registration' : `Sign In as ${selectedRole === 'admin' ? 'Admin' : 'Student'}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher: Sign In <-> Student Registration */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {isSignUpMode ? (
              <p className="text-xs text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUpMode(false); setFormError(''); }}
                  className="font-bold text-college-700 hover:text-college-800 underline ml-1"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <div className="space-y-2">
                {selectedRole === 'student' && (
                  <p className="text-xs text-slate-600">
                    New FXEC student?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsSignUpMode(true); setFormError(''); }}
                      className="font-bold text-college-700 hover:text-college-800 underline ml-1"
                    >
                      Create student account
                    </button>
                  </p>
                )}
                {selectedRole === 'admin' && (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <Info className="w-3.5 h-3.5" />
                    <span>Admin accounts are managed via secure system credentials.</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Demo Credentials Reminder Footer */}
        <div className="mt-6 p-3 rounded-xl bg-white/70 border border-slate-200 text-[11px] text-slate-500 shadow-sm backdrop-blur-xs text-center space-y-1">
          <p className="font-semibold text-slate-700">Quick Test Credentials:</p>
          <p>Admin: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">admin@francisxavier.ac.in</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">Admin@123</code></p>
          <p>Student: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">karthisans.ug.24.it@francisxavier.ac.in</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">Student@123</code></p>
        </div>

      </div>
    </div>
  );
};

export default Login;
