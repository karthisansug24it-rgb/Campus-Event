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
  Info,
  Sparkles,
  KeyRound
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

  const handleQuickFill = (role) => {
    if (role === 'admin') {
      setIsSignUpMode(false);
      setSelectedRole('admin');
      setFormData({
        name: '',
        email: 'admin@francisxavier.ac.in',
        password: 'Admin@123',
        confirmPassword: '',
        section: 'A',
        registerNumber: ''
      });
      setFormError('');
    } else {
      setIsSignUpMode(false);
      setSelectedRole('student');
      setFormData({
        name: 'Karthisan S',
        email: 'karthisans.ug.24.it@francisxavier.ac.in',
        password: 'Student@123',
        confirmPassword: '',
        section: 'A',
        registerNumber: '953624104001'
      });
      setFormError('');
    }
    showToast(`Filled ${role} demo credentials`, 'info');
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
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Background Ambient Soft Blue Glows & Grid */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[400px] h-[400px] bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f608_1px,transparent_1px),linear-gradient(to_bottom,#3b82f608_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* College Header Crest */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 mb-3 group hover:scale-105 transition-transform duration-300">
            <GraduationCap className="w-8 h-8 drop-shadow" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Francis Xavier Engineering College
          </h1>
          <p className="text-xs font-mono text-blue-600 font-semibold mt-1 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Campus Event Management System
          </p>
        </div>

        {/* White Glass Card Container */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/5 p-6 sm:p-8 backdrop-blur-xl">
          
          {/* Student vs Admin Toggle (Only visible in Sign In mode) */}
          {!isSignUpMode ? (
            <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => { setSelectedRole('student'); setFormError(''); }}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'student'
                    ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setFormError(''); }}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Shield className="w-4 h-4 text-white" />
                <span>Admin</span>
              </button>
            </div>
          ) : (
            <div className="mb-6 pb-4 border-b border-blue-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Student Registration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your official college email address to automatically configure your profile.
              </p>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-700" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* College Email Field */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {parsingEmail && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                  {!parsingEmail && parsedData && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Inline validation feedback for Email */}
              {emailParseError && (
                <p className="text-[11px] font-medium text-blue-700 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {emailParseError}
                </p>
              )}

              {/* Derived Information Card (shown when email is validly parsed) */}
              {parsedData && (
                <div className="mt-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 space-y-1.5 animate-modal-pop shadow-sm">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-blue-700 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Verified FXEC Student
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-200/80 text-blue-900 text-[10px] font-mono font-extrabold uppercase border border-blue-300">
                      Year {parsedData.yearOfStudyRoman}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-blue-200/60 text-slate-700 font-mono">
                    <div>
                      <span className="text-slate-500">Dept:</span>{' '}
                      <span className="font-semibold text-slate-900">{parsedData.departmentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Degree:</span>{' '}
                      <span className="font-semibold text-slate-900">{parsedData.level?.toUpperCase()} ('{parsedData.admissionYear})</span>
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
                    <label className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider">
                      Full Name
                    </label>
                    <span className="text-[10px] font-mono text-blue-600 font-medium">Auto-derived, editable</span>
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
                      placeholder="e.g. Karthisan S"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Section & Register Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Section
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Reg Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="registerNumber"
                        value={formData.registerNumber}
                        onChange={handleChange}
                        placeholder="953624104001"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase font-mono placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Confirm Password in Sign Up Mode */}
            {isSignUpMode && (
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedRole === 'admin' && !isSignUpMode
                  ? 'bg-blue-800 hover:bg-blue-900 shadow-blue-800/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
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
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUpMode(false); setFormError(''); }}
                  className="font-bold text-blue-600 hover:text-blue-700 underline ml-1"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <div className="space-y-2">
                {selectedRole === 'student' && (
                  <p className="text-xs text-slate-500">
                    New FXEC student?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsSignUpMode(true); setFormError(''); }}
                      className="font-bold text-blue-600 hover:text-blue-700 underline ml-1"
                    >
                      Create student account
                    </button>
                  </p>
                )}
                {selectedRole === 'admin' && (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Admin accounts are managed via secure institutional credentials.</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 1-Click Demo Credentials Quick-Fill Widget */}
        <div className="mt-6 p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Quick Demo Access
            </span>
            <span className="text-[10px] font-mono text-blue-700 uppercase font-bold">One-Click Fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('student')}
              className="py-2.5 px-3 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-blue-700 flex items-center justify-between">
                <span>Student</span>
                <span className="text-[10px] text-blue-400 group-hover:text-blue-700 font-mono font-bold">Fill &rarr;</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">karthisans.ug.24.it</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="py-2.5 px-3 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
                <span>Admin</span>
                <span className="text-[10px] text-blue-400 group-hover:text-blue-900 font-mono font-bold">Fill &rarr;</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">admin@francisxavier</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
