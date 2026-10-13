'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Video,
  Type,
  Hash,
  Upload,
  LayoutDashboard,
  Library,
  CalendarDays,
  BarChart3,
  Share2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS = {
  create: [
    { name: 'AI Image', href: '/ai-image', icon: ImageIcon },
    { name: 'AI Video', href: '/ai-video', icon: Video },
    { name: 'AI Caption', href: '/ai-caption', icon: Type },
    { name: 'Hashtags', href: '/hashtag', icon: Hash },
    { name: 'Upload from Device', href: '/upload', icon: Upload },
  ],
  manage: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Library', href: '/content-library', icon: Library },
    { name: 'Scheduler', href: '/scheduler', icon: CalendarDays },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ],
  connect: [
    { name: 'Social Accounts', href: '/social-accounts', icon: Share2 },
    { name: 'Workspace', href: '/workspace', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const isOpen = !sidebarCollapsed;

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      {isOpen && (
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-4">
          {title}
        </h4>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-accent text-accent-foreground glow-purple' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }
                `}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_#8b5cf6]"
                  />
                )}
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />
                {isOpen && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="hidden md:flex flex-col h-screen bg-[#0d0d12] border-r border-border relative z-30 overflow-hidden"
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-border/50 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-bold text-gradient whitespace-nowrap"
              >
                AI Automation
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary transition-colors shadow-lg z-50"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        {renderNavGroup('Create', NAV_ITEMS.create)}
        {renderNavGroup('Manage', NAV_ITEMS.manage)}
        {renderNavGroup('Connect', NAV_ITEMS.connect)}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border/50 bg-black/20">
        <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'} p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer`}>
          <div className="relative">
            <img 
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"} 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover border border-primary/50"
            />
            <div className="absolute inset-0 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)] pointer-events-none" />
          </div>
          
          {isOpen && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.email || "user@example.com"}</div>
            </div>
          )}

          {isOpen && (
            <button
              type="button"
              onClick={async () => {
                await logout();
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }}
              title="Log Out"
              className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
