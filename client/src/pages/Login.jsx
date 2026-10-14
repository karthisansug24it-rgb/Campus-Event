import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState('student'); // 'student' | 'admin'

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    section: 'A',
    registerNumber: ''
  });

  // Real-time email parse state for signup
  const [parsedEmailInfo, setParsedEmailInfo] = useState(null);
  const [emailParseLoading, setEmailParseLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, signup, isAuthenticated, isAdmin, isStudent } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const destination = isAdmin ? '/admin' : '/events';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Real-time debounce parsing on student sign-up email input
  useEffect(() => {
    if (!isSignup || !signupForm.email) {
      setParsedEmailInfo(null);
      setEmailError('');
      return;
    }

    const clean = signupForm.email.trim().toLowerCase();

    // Only attempt parse when looks like an email with domain
    if (!clean.includes('@')) {
      setEmailError('Please include the @francisxavier.ac.in college domain.');
      setParsedEmailInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setEmailParseLoading(true);
        setEmailError('');
        const res = await api.post('/auth/parse-email', { email: clean });
        if (res.data && res.data.success) {
          setParsedEmailInfo(res.data.data);
          // Autofill student name if not manually modified
          setSignupForm((prev) => ({
            ...prev,
            name: prev.name.trim().length === 0 ? res.data.data.name : prev.name
          }));
        }
      } catch (err) {
        setParsedEmailInfo(null);
        setEmailError(err.response?.data?.message || 'Invalid Francis Xavier college email.');
      } finally {
        setEmailParseLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [signupForm.email, isSignup]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email.trim(), password, role);
      showToast(`Welcome back, ${user.name}!`, 'success', 3000);
      const target = user.role === 'admin' ? '/admin' : '/events';
      navigate(target, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signupForm.email || !signupForm.password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (signupForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!parsedEmailInfo || !parsedEmailInfo.valid) {
      setErrorMessage(emailError || 'Please provide a valid active student college email.');
      return;
    }

    if (signupForm.registerNumber && !/^[A-Za-z0-9]{8,15}$/.test(signupForm.registerNumber.trim())) {
      setErrorMessage('Register number must be 8 to 15 alphanumeric characters.');
      return;
    }

    try {
      setLoading(true);
      const user = await signup({
        name: signupForm.name.trim() || parsedEmailInfo.name,
        email: signupForm.email.trim(),
        password: signupForm.password,
        section: signupForm.section,
        registerNumber: signupForm.registerNumber.trim()
      });

      showToast(`Account created! Welcome, ${user.name}`, 'success', 3000);
      navigate('/events', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* Brand Icon */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-900 via-blue-700 to-sky-500 items-center justify-center text-white shadow-xl shadow-blue-600/20 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Francis Xavier Engineering College
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
          Autonomous • Tirunelveli • Campus Event Management System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200">
          {/* Main Mode Toggle: Sign In vs Sign Up */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignup(false);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isSignup ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignup(true);
                setRole('student');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isSignup ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Student Sign Up
            </button>
          </div>

          {/* Role Toggle for Sign In: Student vs Admin */}
          {!isSignup && (
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    role === 'student'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold ring-2 ring-blue-100'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    role === 'admin'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold ring-2 ring-blue-100'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Administrator</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          {!isSignup ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {role === 'admin' ? 'Admin Email' : 'College Email'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === 'admin'
                        ? 'admin@francisxavier.ac.in'
                        : 'karthisans.ug.24.it@francisxavier.ac.in'
                    }
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-700/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {role === 'admin' ? 'Administrator' : 'Student'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {role === 'admin' && (
                <p className="text-center text-[11px] text-slate-500 mt-3">
                  Admin credentials from seed: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">admin@francisxavier.ac.in</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">Admin@123</code>
                </p>
              )}
            </form>
          ) : (
            /* Student Sign Up Form */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* College Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  FXEC Student Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, email: e.target.value })
                    }
                    placeholder="karthisans.ug.24.it@francisxavier.ac.in"
                    required
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      emailError
                        ? 'border-rose-400 focus:ring-rose-100 bg-rose-50/20'
                        : parsedEmailInfo
                        ? 'border-emerald-500 focus:ring-emerald-100 bg-emerald-50/10'
                        : 'border-slate-300 focus:ring-blue-100 focus:border-blue-600'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  {emailParseLoading && (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-3" />
                  )}
                  {parsedEmailInfo && !emailParseLoading && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3" />
                  )}
                </div>

                {emailError ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{emailError}</p>
                ) : parsedEmailInfo ? (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-900 font-bold">
                      <span>{parsedEmailInfo.departmentName}</span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-semibold text-[10px]">
                        {parsedEmailInfo.yearLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Admission Year: {parsedEmailInfo.admissionYear} • Level: {parsedEmailInfo.level.toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Pattern: &lt;name&gt;.&lt;ug|pg&gt;.&lt;yy&gt;.&lt;dept&gt;@francisxavier.ac.in
                  </p>
                )}
              </div>

              {/* Full Name (Auto-filled but editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-slate-400 font-normal">(Auto-filled, editable)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder="e.g. Karthisan S"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Section & Register Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    value={signupForm.section}
                    onChange={(e) => setSignupForm({ ...signupForm, section: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Register No.
                  </label>
                  <input
                    type="text"
                    value={signupForm.registerNumber}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, registerNumber: e.target.value })
                    }
                    placeholder="e.g. 950724104042"
                    maxLength={15}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, password: e.target.value })
                    }
                    placeholder="Min 6 characters"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                    }
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (parsedEmailInfo && !parsedEmailInfo.valid)}
                className="w-full mt-2 py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-700/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Student Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
