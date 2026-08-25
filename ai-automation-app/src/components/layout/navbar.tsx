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
  Shield,
  Image as ImageIcon,
  Video,
  Check,
  Inbox
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

export function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toggleMobileSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch live real notifications from PostgreSQL database
  const { data: notificationsData, isLoading: isLoadingNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return { notifications: [], total: 0, unreadCount: 0 };
      const json = await res.json();
      return {
        notifications: json.notifications || json.data?.notifications || [],
        total: json.total !== undefined ? json.total : 0,
        unreadCount: json.unreadCount !== undefined ? json.unreadCount : 0,
      };
    },
    refetchInterval: 8000, // Live automatic background refresh
    staleTime: 4000,
  });

  const notifications: any[] = notificationsData?.notifications || [];
  const unreadNotifications = notificationsData?.unreadCount || 0;

  // Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: 0,
          notifications: (old.notifications || []).map((n: any) => ({ ...n, isRead: true })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark single as read handler
  const handleItemClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {}
    }

    if (notif.type === 'IMAGE_GENERATED') {
      router.push('/content-library');
    } else if (notif.type === 'PROJECT_CREATED') {
      router.push('/workspace');
    } else if (notif.type === 'POST_PUBLISHED' || notif.type === 'POST_SCHEDULED') {
      router.push('/scheduler');
    } else if (notif.type === 'ACCOUNT_CONNECTED') {
      router.push('/social-accounts');
    }
  };

  // Close profile dropdown on click outside or Escape key
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

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'IMAGE_GENERATED':
        return (
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
            <Sparkles size={14} />
          </div>
        );
      case 'VIDEO_GENERATED':
        return (
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 mt-0.5">
            <Video size={14} />
          </div>
        );
      case 'PROJECT_CREATED':
        return (
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
            <Folder size={14} />
          </div>
        );
      case 'POST_PUBLISHED':
      case 'POST_SCHEDULED':
        return (
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
            <CheckCircle2 size={14} />
          </div>
        );
      default:
        return (
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
            <Bell size={14} />
          </div>
        );
    }
  };

  const formatTime = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'Recently';
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

        {/* Live Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors outline-none"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-white/10 bg-[#111118] shadow-2xl backdrop-blur-xl">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              <div className="flex items-center gap-2">
                {unreadNotifications > 0 ? (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-none font-semibold">
                    {unreadNotifications} New
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-medium">All caught up</span>
                )}
                {unreadNotifications > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
                    title="Mark all as read"
                  >
                    <Check size={11} />
                    <span>Read all</span>
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto custom-scrollbar">
              {isLoadingNotifs && (
                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Loading updates...</span>
                </div>
              )}

              {!isLoadingNotifs && notifications.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground space-y-1.5">
                  <Inbox className="w-6 h-6 mx-auto opacity-40 text-muted-foreground" />
                  <p className="font-semibold text-foreground">No notifications yet</p>
                  <p className="text-[11px]">Your live AI generation and scheduling updates will appear here.</p>
                </div>
              )}

              {!isLoadingNotifs && notifications.length > 0 && notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 hover:bg-white/5 transition-colors cursor-pointer relative group ${
                    !notif.isRead ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {getNotifIcon(notif.type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className={`text-xs truncate ${!notif.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground/90'}`}>
                          {notif.title}
                        </div>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.message}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatTime(notif.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
