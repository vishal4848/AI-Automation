'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/store/auth-store';
import { CopilotButton } from '@/components/copilot/CopilotButton';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  useEffect(() => {
    // Auth guard redirect if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const toggleCopilot = () => {
    setIsCopilotOpen(!isCopilotOpen);
    if (!isCopilotOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar />
      <MobileDrawer />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        <Footer />
      </div>
      
      {/* AI Copilot */}
      <CopilotButton 
        isOpen={isCopilotOpen} 
        onClick={toggleCopilot} 
        unreadCount={unreadCount} 
      />
      <CopilotPanel 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
      />
    </div>
  );
}
