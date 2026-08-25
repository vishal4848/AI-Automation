'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = activeTab === 'login' 
        ? { email, password }
        : { email, password, name: fullName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        setErrorMessage('Server returned an invalid response. Please verify backend service.');
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      login(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the authentication service.');
    } finally {
      setIsLoading(false);
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
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Enter your email and password to access your account</p>

          {/* Tabs */}
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

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {errorMessage && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                {errorMessage}
              </div>
            )}

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

            {/* Remember / Forgot */}
            <div className="form-options">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="forgot-link">
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (activeTab === 'login' ? 'Signing in...' : 'Creating Account...') : (activeTab === 'login' ? 'Sign in' : 'Create Account')}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">Or</div>

          {/* Social Buttons */}
          <div className="social-row">
            {/* Google */}
            <button type="button" className="social-btn" title="Google">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09a6.97 6.97 0 010-4.18V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.41l3.66-2.84.81-.48z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            {/* Facebook */}
            <button type="button" className="social-btn" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            {/* Instagram */}
            <button type="button" className="social-btn" title="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </button>
            {/* Twitter */}
            <button type="button" className="social-btn" title="Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>
          </div>

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
    </div>
  );
}
