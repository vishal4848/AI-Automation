"use client";

import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Lock, CreditCard, Palette, Monitor, CheckCircle2, AlertCircle, Loader2, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth-store';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, setUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [mounted, setMounted] = useState(false);

  // Profile form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Billing modal states (Truthful "Coming Soon" states)
  const [billingNotice, setBillingNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setName(user.name || '');
      setBio((user as any).bio || '');
      setAvatarUrl((user as any).avatarUrl || '');
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setBanner(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload using assets API
      const res = await fetch('/api/v1/assets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.url || data.secureUrl)) {
        const newUrl = data.secureUrl || data.url;
        setAvatarUrl(newUrl);

        // Update profile in backend
        const updateRes = await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: newUrl }),
        });

        const updateData = await updateRes.json().catch(() => ({}));
        if (updateRes.ok && updateData.data) {
          setUser({ ...user!, ...updateData.data, avatarUrl: newUrl });
          setBanner({ type: 'success', text: 'Avatar updated successfully.' });
        }
      } else {
        setBanner({ type: 'error', text: data.error || 'Failed to upload avatar image.' });
      }
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Error uploading avatar.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setBanner(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUser({ ...user!, ...data.data });
        setBanner({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setBanner({ type: 'error', text: data.error || 'Failed to save profile changes.' });
      }
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Network error updating profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (n?: string) => {
    if (!n) return 'U';
    return n.trim().slice(0, 1).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 min-h-[calc(100vh-100px)]">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-60 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Settings</h1>
        <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setBanner(null); }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm overflow-y-auto">
        {banner && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 mb-6 ${
              banner.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {banner.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{banner.text}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-foreground">Public Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your personal details and public presentation.</p>
              </div>

              {/* Avatar Section */}
              <div className="flex items-center gap-5 pt-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden border border-border">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(name || user?.name || user?.email)
                    )}
                  </div>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="px-3.5 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Avatar</span>
                  </button>
                  <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG, or WEBP. Max size 10MB.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us a little bit about your brand or workflow..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-all gap-1.5 inline-flex items-center disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ─── APPEARANCE TAB ─── */}
          {activeTab === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-foreground">Appearance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Customize how the interface looks and feels on your devices.</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3">Theme Selection</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'dark', name: 'Dark Mode', preview: 'bg-zinc-950 border-zinc-800' },
                    { id: 'light', name: 'Light Mode', preview: 'bg-zinc-100 border-zinc-300' },
                    { id: 'system', name: 'System Default', preview: 'bg-gradient-to-r from-zinc-100 to-zinc-950 border-zinc-500' },
                  ].map((t) => {
                    const isSelected = mounted && theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-left group ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-accent/40'
                            : 'border-border hover:border-border/80 bg-background'
                        }`}
                      >
                        <div className={`w-full aspect-video rounded-xl border ${t.preview} shadow-sm relative overflow-hidden flex items-center justify-center`}>
                          <div className="w-12 h-6 rounded-md bg-foreground/10 border border-foreground/10" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── BILLING TAB ─── */}
          {activeTab === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-foreground">Billing & Plans</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Review your current plan balance and generation credits.</p>
              </div>

              {billingNotice && (
                <div className="p-3.5 rounded-xl text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-between">
                  <span>{billingNotice}</span>
                  <button onClick={() => setBillingNotice(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
              )}

              {/* Current Plan Card */}
              <div className="bg-gradient-to-tr from-violet-900/40 via-purple-950/40 to-slate-900 border border-border p-6 rounded-2xl relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Active Plan</span>
                    <h3 className="text-2xl font-bold text-foreground mt-0.5">Starter Tier</h3>
                    <p className="text-xs text-muted-foreground mt-1">Free community tier for personal content automation.</p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] font-semibold text-muted-foreground">Credits Balance</span>
                    <div className="text-3xl font-extrabold text-foreground mt-0.5 flex items-center sm:justify-end gap-1.5">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>{user?.credits ?? 100}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setBillingNotice('Stripe / Payment Gateway integration is currently in private preview. Automated credit purchases will be available upon public release.')}
                    className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-all"
                  >
                    Top Up Credits
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingNotice('Subscription tier changes will be enabled once merchant billing is activated.')}
                    className="px-4 py-2 border border-border bg-card text-foreground font-semibold rounded-xl text-xs hover:bg-accent transition-all"
                  >
                    Change Plan
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-foreground">Saved Payment Methods</h3>
                <div className="border border-border rounded-2xl p-4 bg-background/50 flex justify-between items-center text-xs">
                  <div className="text-muted-foreground">
                    No payment methods on file. All platform usage is currently subsidized via starter credits.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── ACCOUNT / NOTIFICATIONS PLACEHOLDERS (TRUTHFUL COMING SOON) ─── */}
          {['account', 'notifications'].includes(activeTab) && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-16 flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground capitalize">{activeTab} Preferences</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Advanced {activeTab} settings and automated webhooks are currently under development and will be available in the upcoming update.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
