'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Sparkles, X } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { NAV_ITEMS } from './sidebar';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Flatten the grouped NAV_ITEMS into sections for mobile
const NAV_SECTIONS = [
  { title: 'Create', items: NAV_ITEMS.create },
  { title: 'Manage', items: NAV_ITEMS.manage },
  { title: 'Connect', items: NAV_ITEMS.connect },
];

export function MobileDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarMobileOpen, toggleMobileSidebar } = useAppStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    toggleMobileSidebar();
    await logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <Sheet open={sidebarMobileOpen} onOpenChange={toggleMobileSidebar}>
      <SheetContent side="left" className="p-0 w-72 bg-[#0d0d12] border-r border-white/[0.06]">
        <SheetHeader className="p-4 border-b border-white/[0.06] text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span
              className="font-bold text-base"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AI Automation
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3">
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname?.startsWith(item.href + '/');
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={toggleMobileSidebar}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-violet-500/15 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-violet-400' : 'text-zinc-500'
                        )}
                      />
                      <span className="truncate flex-1">{item.name}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#8b5cf6]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
              }
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-violet-500/30"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate text-white">
                {user?.name || 'User'}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {user?.email || 'user@aiautomation.com'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
