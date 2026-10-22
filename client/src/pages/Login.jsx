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
  KeyRound,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AnimatedSection } from '../components/ui/AnimatedSection';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, parseEmail, isAuthenticated, isAdmin } = useAuth();
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

  // Check URL query parameters for mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'signup') {
      setIsSignUpMode(true);
    }
  }, [location.search]);

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
  }, [formData.email, parseEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleQuickFill = (type) => {
    if (type === 'faculty' || type === 'davidayling') {
      setIsSignUpMode(false);
      setSelectedRole('admin');
      setFormData({
        name: 'Dr. David Ayling',
        email: 'davidayling@francisxavier.ac.in',
        password: 'Admin@123',
        confirmPassword: '',
        section: 'A',
        registerNumber: ''
      });
      setFormError('');
      showToast('Filled Faculty (Dr. David Ayling) credentials', 'info');
    } else if (type === 'ithod') {
      setIsSignUpMode(false);
      setSelectedRole('admin');
      setFormData({
        name: 'HOD - Information Technology',
        email: 'ithod@francisxavier.ac.in',
        password: 'Admin@123',
        confirmPassword: '',
        section: 'A',
        registerNumber: ''
      });
      setFormError('');
      showToast('Filled IT HOD credentials', 'info');
    } else if (type === 'admin') {
      setIsSignUpMode(false);
      setSelectedRole('admin');
      setFormData({
        name: 'FXEC Event Admin',
        email: 'admin@francisxavier.ac.in',
        password: 'Admin@123',
        confirmPassword: '',
        section: 'A',
        registerNumber: ''
      });
      setFormError('');
      showToast('Filled Admin demo credentials', 'info');
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
      showToast('Filled Student demo credentials', 'info');
    }
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
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] overflow-hidden">
      {/* Background Subtle Dots & Radial Ambience */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <AnimatedSection className="text-center space-y-2" delay={0.05}>
          <img 
            src="/fxec-logo.png" 
            alt="FXEC Official Logo" 
            className="w-20 h-20 mx-auto rounded-full object-contain bg-white shadow-xl shadow-blue-600/15 mb-2 hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Francis Xavier Engineering College
          </h1>
          <p className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Official Campus Event Management Portal
          </p>
        </AnimatedSection>

        {/* Login Card */}
        <AnimatedSection className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-blue-600/5 p-6 sm:p-8" delay={0.15}>
          
          {/* Student vs Faculty/Admin Segmented Toggle (Only in Sign In mode) */}
          {!isSignUpMode ? (
            <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-6 border border-slate-200/80 gap-1">
              <button
                type="button"
                onClick={() => { setSelectedRole('student'); setFormError(''); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'student'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-black'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setFormError(''); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-black'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Faculty / Admin</span>
              </button>
            </div>
          ) : (
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold font-display text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>Student Portal Registration</span>
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Enter your verified college email to register and unlock event access.
              </p>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wide">
                  {selectedRole === 'admin' && !isSignUpMode ? 'Institutional Faculty / Admin Email' : 'Official Student Email'}
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedRole === 'admin' && !isSignUpMode ? 'Staff / HOD / Admin' : 'Student UG / PG'}
                </span>
              </div>
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
                      ? 'davidayling@francisxavier.ac.in or ithod@francisxavier.ac.in' 
                      : 'karthisans.ug.24.it@francisxavier.ac.in'
                  }
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
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
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {emailParseError}
                </p>
              )}

              {/* Student Verified Chip Card */}
              {parsedData && parsedData.accountType === 'student' && (
                <div className="mt-2.5 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-blue-700 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Verified FXEC Student
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-200/80 text-blue-900 text-[10px] font-mono font-bold uppercase border border-blue-300">
                      {parsedData.yearOfStudyRoman} Year
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-blue-200/60 text-slate-700 font-mono">
                    <div>
                      <span className="text-slate-500">Dept:</span>{' '}
                      <span className="font-bold text-slate-900">{parsedData.departmentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Class:</span>{' '}
                      <span className="font-bold text-slate-900">{parsedData.level?.toUpperCase()} ('{parsedData.admissionYear})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Faculty / Admin Verified Chip Card */}
              {parsedData && parsedData.accountType === 'faculty' && (
                <div className="mt-2.5 p-3 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-indigo-700 font-mono text-[11px]">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      Verified FXEC Faculty / Staff
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-200/80 text-indigo-900 text-[10px] font-mono font-bold uppercase border border-indigo-300">
                      Faculty / Admin
                    </span>
                  </div>
                  <div className="text-[11px] pt-1.5 border-t border-indigo-200/60 text-slate-700 font-mono flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Name:</span>{' '}
                      <span className="font-bold text-slate-900">{parsedData.name}</span>
                    </div>
                    {parsedData.departmentName && (
                      <div>
                        <span className="text-slate-500">Dept:</span>{' '}
                        <span className="font-bold text-slate-900">{parsedData.departmentName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Context Switch Helper Alerts */}
              {parsedData && parsedData.accountType === 'faculty' && selectedRole === 'student' && !isSignUpMode && (
                <p className="text-[11px] font-semibold text-indigo-700 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                  <span>Faculty account detected. Please switch to the <strong>Faculty / Admin</strong> tab above to log in.</span>
                </p>
              )}

              {parsedData && parsedData.accountType === 'student' && selectedRole === 'admin' && (
                <p className="text-[11px] font-semibold text-blue-700 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span>Student account detected with department tag. Please switch to the <strong>Student</strong> tab above to log in.</span>
                </p>
              )}

              {parsedData && parsedData.accountType === 'faculty' && isSignUpMode && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>Faculty accounts are pre-provisioned by administration. Please switch to Sign In &gt; Faculty / Admin.</span>
                </p>
              )}
            </div>

            {/* Extra Fields for Sign Up Mode */}
            {isSignUpMode && (
              <>
                {/* Student Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wide">
                      Full Name
                    </label>
                    <span className="text-[10px] font-mono text-blue-600 font-semibold">Auto-derived</span>
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Section & Register Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Section
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Register Number
                    </label>
                    <input
                      type="text"
                      name="registerNumber"
                      value={formData.registerNumber}
                      onChange={handleChange}
                      placeholder="953624104001"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-mono font-bold uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Confirm Password in Sign Up Mode */}
            {isSignUpMode && (
              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                variant={selectedRole === 'admin' && !isSignUpMode ? 'primary' : 'primary'}
                size="lg"
                type="submit"
                className="w-full"
                loading={submitting}
                icon={ArrowRight}
                iconPosition="right"
              >
                {isSignUpMode ? 'Complete Registration' : `Sign In as ${selectedRole === 'admin' ? 'Administrator' : 'Student'}`}
              </Button>
            </div>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {isSignUpMode ? (
              <p className="text-xs text-slate-500 font-sans">
                Already registered?{' '}
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
                  <p className="text-xs text-slate-500 font-sans">
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
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Admin credentials managed by FXEC Systems Office</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </AnimatedSection>

        {/* 1-Click Demo Credentials Quick-Fill Widget */}
        <AnimatedSection className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-600 shadow-xs space-y-3" delay={0.25}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Evaluation Demo Accounts
            </span>
            <span className="text-[10px] font-mono text-blue-700 uppercase font-black">1-Click Fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Student Account */}
            <button
              type="button"
              onClick={() => handleQuickFill('student')}
              className="py-2.5 px-3 rounded-2xl bg-white hover:bg-blue-50 border border-blue-200/90 text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-blue-700 flex items-center justify-between">
                <span>Student</span>
                <span className="text-[10px] text-blue-400 group-hover:text-blue-700 font-mono font-bold">Auto-fill &rarr;</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">karthisans.ug.24.it</div>
            </button>

            {/* Faculty - Dr. David Ayling */}
            <button
              type="button"
              onClick={() => handleQuickFill('davidayling')}
              className="py-2.5 px-3 rounded-2xl bg-white hover:bg-indigo-50 border border-indigo-200/90 text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-indigo-700 flex items-center justify-between">
                <span>Faculty (Dr. David)</span>
                <span className="text-[10px] text-indigo-400 group-hover:text-indigo-700 font-mono font-bold">Auto-fill &rarr;</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">davidayling@francis...</div>
            </button>

            {/* Faculty - IT HOD */}
            <button
              type="button"
              onClick={() => handleQuickFill('ithod')}
              className="py-2.5 px-3 rounded-2xl bg-white hover:bg-indigo-50 border border-indigo-200/90 text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-indigo-700 flex items-center justify-between">
                <span>Faculty (IT HOD)</span>
                <span className="text-[10px] text-indigo-400 group-hover:text-indigo-700 font-mono font-bold">Auto-fill &rarr;</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">ithod@francisxavier</div>
            </button>

            {/* Admin */}
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="py-2.5 px-3 rounded-2xl bg-white hover:bg-blue-50 border border-blue-200/90 text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                <span>Admin</span>
                <span className="text-[10px] text-blue-400 group-hover:text-blue-700 font-mono font-bold">Auto-fill &rarr;</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">admin@francisxavier</div>
            </button>
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
};

export default Login;
