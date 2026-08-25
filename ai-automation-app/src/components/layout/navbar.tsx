'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sparkles,
  User,
  Settings,
  LogOut,
  Menu,
  Zap,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Share2,
  Folder,
  Calendar,
  Shield
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function Navbar() {
  const router = useRouter();
  const { toggleMobileSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const [unreadNotifications] = useState(3);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch {
      useAuthStore.setState({ isAuthenticated: false, user: null });
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
      setIsProfileOpen(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Aug 2026';

  return (
    <header className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu & Breadcrumb */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5"
          aria-label="Toggle Mobile Menu"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Platform</Link>
          <ChevronRight size={14} className="mx-2 opacity-50" />
          <span className="text-foreground">Dashboard</span>
        </div>
      </div>

      {/* Right: Search, Credits, Notifications, Profile */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-[200px] hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9 h-9 text-xs bg-white/5 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Credits Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
          <div className="text-xs">
            <span className="font-bold text-foreground">1,250</span>
            <span className="text-muted-foreground"> cr</span>
          </div>
        </div>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-white/10 bg-[#111118] shadow-2xl backdrop-blur-xl">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-none font-semibold">
                3 New
              </Badge>
            </div>
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto custom-scrollbar">
              <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">AI Video Generated</div>
                    <div className="text-[11px] text-muted-foreground">Your 4K promo video is ready.</div>
                    <div className="text-[10px] text-muted-foreground/70 mt-1">2 mins ago</div>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Auto-Post Published</div>
                    <div className="text-[11px] text-muted-foreground">Instagram reel is now live.</div>
                    <div className="text-[10px] text-muted-foreground/70 mt-1">1 hour ago</div>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer bg-gradient-to-tr from-primary to-cyan-500 outline-none"
            aria-label="User Profile Menu"
            aria-expanded={isProfileOpen}
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'}
              alt={user?.name || 'User Avatar'}
              className="w-8 h-8 rounded-full object-cover border-2 border-background"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#111118] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              {/* User Profile Header */}
              <div className="flex items-center gap-3 p-1">
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'}
                  alt={user?.name || 'User Avatar'}
                  className="w-11 h-11 rounded-full object-cover border-2 border-primary/40 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-foreground truncate">{user?.name || 'User Account'}</h3>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary bg-primary/10 font-bold shrink-0">
                      PRO
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'user@aiautomation.com'}</p>
                </div>
              </div>

              {/* Profile Details Card */}
              <div className="p-2.5 bg-white/[0.03] border border-white/5 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Account Status</span>
                  </span>
                  <span className="text-[11px] font-medium text-emerald-400">Active</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Member Since</span>
                  </span>
                  <span className="text-[11px] font-medium text-foreground">{memberSince}</span>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); router.push('/social-accounts'); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span className="flex-1 font-medium">Connected Accounts</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span className="flex-1 font-medium">Profile & Settings</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); router.push('/content-library'); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span className="flex-1 font-medium">Content Library</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>
              </div>

              {/* Divider & Logout Button */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  <div className="flex items-center gap-2">
                    {isLoggingOut ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </div>
                  <span className="text-xs opacity-75">🚪</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
