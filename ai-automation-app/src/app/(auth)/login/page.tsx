'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound, ArrowLeft, Loader2, ShieldCheck, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp_only'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // OTP Verification state
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'LOGIN' | 'REGISTRATION'>('LOGIN');
  const [otpNotice, setOtpNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (activeTab === 'login') {
        if (loginMethod === 'otp_only') {
          // Passwordless OTP login
          const res = await fetch('/api/auth/send-login-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() }),
          });
          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data.success) {
            setErrorMessage(data.error || 'Failed to dispatch login verification code.');
            return;
          }

          setIsOtpStep(true);
          setOtpPurpose('LOGIN');
          setOtpNotice(data.message || `A 6-digit login verification code was sent to ${email}.`);
          setCooldown(60);
          return;
        }

        // Standard 2-Step Login (Credentials -> OTP)
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          setErrorMessage(data.error || data.message || 'Invalid email or password.');
          return;
        }

        if (data.requiresOtp) {
          setIsOtpStep(true);
          setOtpPurpose('LOGIN');
          setOtpNotice(data.message || `A 6-digit verification code has been dispatched to ${email}.`);
          setCooldown(60);
          return;
        }

        if (data.user) {
          login(data.user);
          window.location.href = '/dashboard';
        }
      } else {
        // Sign Up
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, name: fullName.trim() }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          setErrorMessage(data.error || data.message || 'Registration failed. Please check inputs.');
          return;
        }

        if (data.requiresOtp) {
          setIsOtpStep(true);
          setOtpPurpose('REGISTRATION');
          setOtpNotice(data.message || `A confirmation code has been sent to ${email}.`);
          setCooldown(60);
          return;
        }

        if (data.user) {
          login(data.user);
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: cleanCode,
          purpose: otpPurpose,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid or expired OTP code.');
        return;
      }

      if (data.user) {
        login(data.user);
      }

      // Hard redirect to ensure browser picks up cookies on next route load
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), purpose: otpPurpose }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setOtpNotice(data.message || 'A new verification code has been dispatched.');
        setCooldown(60);
      } else {
        setErrorMessage(data.error || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error requesting new code.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsForgotLoading(true);
    setForgotStatus(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), purpose: 'PASSWORD_RESET' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setForgotStatus({
          type: 'success',
          message: data.message || 'Password reset code dispatched. Check your email.',
        });
      } else {
        setForgotStatus({
          type: 'error',
          message: data.error || 'Failed to request password reset code.',
        });
      }
    } catch (err: any) {
      setForgotStatus({
        type: 'error',
        message: err.message || 'Connection error. Please try again.',
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* ─── LEFT PANEL: FORM ─── */}
        <div className="login-left">

          {/* Logo */}
          <div className="login-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c8f028" />
                  <stop offset="50%" stopColor="#7bc623" />
                  <stop offset="100%" stopColor="#3a9e18" />
                </linearGradient>
              </defs>
              <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4zm6 28c-3 2-7 3-10 1-4-2-6-7-4-11 1-3 4-5 7-5 2 0 4 1 5 3l-4 2c-1-1-2-1-3 0-2 1-2 4-1 5 1 2 3 2 5 1l4 2z" fill="url(#logoGrad)"/>
              <path d="M30 18c-1-2-3-3-5-3-3 0-6 2-7 5-2 4 0 9 4 11 3 2 7 1 10-1l2 3c-4 3-9 4-14 1-5-3-8-10-5-16 2-4 6-7 10-7 3 0 6 1 8 4l-3 3z" fill="url(#logoGrad)" opacity="0.6"/>
            </svg>
          </div>

          {/* Title */}
          <h1 className="login-title">
            {isOtpStep
              ? otpPurpose === 'LOGIN' ? 'Verify Your Login' : 'Verify Your Email'
              : activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="login-subtitle">
            {isOtpStep
              ? `Enter the 6-digit code dispatched to ${email || 'your email'}`
              : activeTab === 'login'
              ? (loginMethod === 'password'
                  ? 'Sign in securely with email & password + OTP verification'
                  : 'Instant login with email verification code')
              : 'Sign up to start automating your social media with AI'}
          </p>

          {!isOtpStep && (
            /* Tabs */
            <div className="tab-switcher">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'login' ? 'active' : 'inactive'}`}
                onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'signup' ? 'active' : 'inactive'}`}
                onClick={() => { setActiveTab('signup'); setErrorMessage(''); }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Login mode selector (Only in Login tab) */}
          {!isOtpStep && activeTab === 'login' && (
            <div className="flex items-center justify-between mb-4 px-1 text-xs">
              <span className="text-muted-foreground font-medium">Login Method:</span>
              <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    loginMethod === 'password'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Password + OTP
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp_only')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    loginMethod === 'otp_only'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Direct OTP (Passwordless)
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
              {errorMessage}
            </div>
          )}

          {isOtpStep ? (
            /* ─── OTP STEP FORM ─── */
            <form onSubmit={handleVerifyOtp}>
              {otpNotice && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>{otpNotice}</span>
                </div>
              )}

              <div className="form-input-wrapper">
                <label className="form-label">6-Digit Verification Code*</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input text-center font-mono tracking-widest text-xl"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between mt-3 mb-5 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setIsOtpStep(false); setOtpCode(''); }}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to edit details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0}
                  className="text-primary hover:underline font-semibold disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading || otpCode.length !== 6}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                  </span>
                ) : (
                  'Verify & Sign In'
                )}
              </button>
            </form>
          ) : (
            /* ─── LOGIN / SIGNUP FORM ─── */
            <form onSubmit={handleSubmit}>
              {activeTab === 'signup' && (
                <div className="form-input-wrapper">
                  <label className="form-label">Full Name*</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Your Name..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-input-wrapper">
                <label className="form-label">Email*</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter Your Email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password field is shown on signup or when password method is selected */}
              {(activeTab === 'signup' || loginMethod === 'password') && (
                <div className="form-input-wrapper">
                  <label className="form-label">Password*</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter Your Password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}

              {/* Remember / Forgot (Shown in password mode) */}
              {activeTab === 'login' && loginMethod === 'password' && (
                <div className="form-options">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotStatus(null); }}
                    className="forgot-link"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {activeTab === 'login'
                      ? (loginMethod === 'otp_only' ? 'Sending Login Code...' : 'Verifying & Sending OTP...')
                      : 'Creating Account...'}
                  </span>
                ) : activeTab === 'login' ? (
                  loginMethod === 'otp_only' ? 'Send Login Code 🚀' : 'Sign in with Password & OTP'
                ) : (
                  'Create Account & Get Code'
                )}
              </button>
            </form>
          )}

          {!isOtpStep && (
            <>
              {/* Divider */}
              <div className="divider">Or</div>

              {/* Social Buttons */}
              <div className="social-row">
                {/* Google */}
                <button
                  type="button"
                  className="social-btn"
                  title="Continue with Google"
                  onClick={handleGoogleLogin}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09a6.97 6.97 0 010-4.18V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.41l3.66-2.84.81-.48z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
                {/* Facebook */}
                <button type="button" className="social-btn" title="Facebook (OAuth login via Settings)" onClick={() => setErrorMessage('Please sign in or use Google Login to access the dashboard.')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                {/* Instagram */}
                <button type="button" className="social-btn" title="Instagram (Channel connection via Social Accounts)" onClick={() => setErrorMessage('Instagram channel authorization is available in Social Accounts.')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </button>
              </div>
            </>
          )}

        </div>

        {/* ─── RIGHT PANEL: IMAGE ─── */}
        <div className="login-right">
          <div className="right-image-wrapper">
            <img
              src="/smart_access_robot.jpg"
              alt="AI Smart Access"
              className="right-image"
            />
            <div className="right-overlay">
              <h2 className="right-overlay-title">
                AI Automation
              </h2>
              <p className="right-overlay-sub">
                Sign in to continue your personalized digital experience and unlock all exclusive features.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">Reset Password</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your registered email address and we will dispatch a 6-digit verification code to reset your credentials.
            </p>

            {forgotStatus && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  forgotStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {forgotStatus.message}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs border border-border hover:bg-accent"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading || !forgotEmail.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                    {isForgotLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">Loading...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
