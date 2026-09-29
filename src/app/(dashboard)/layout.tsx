'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/shell/UnifiedSidebar';
import { UnifiedHeader } from '@/components/shell/UnifiedHeader';
import BranchSetupGuard from '@/components/guards/BranchSetupGuard';
import { useSidebarStore } from '@/store/useSidebarStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isCollapsed } = useSidebarStore();

  const isLauncher = pathname === '/';

  if (isLauncher) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070913] text-slate-900 dark:text-slate-100 overflow-x-hidden select-none transition-colors duration-200">
        {children}
      </div>
    );
  }


  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex h-full shrink-0">
        <UnifiedSidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-slate-900 w-72 max-w-[85vw] h-full flex flex-col z-10 shadow-2xl transition-all duration-300">
            <UnifiedSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <UnifiedHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <BranchSetupGuard>
            {children}
          </BranchSetupGuard>
        </main>
      </div>
    </div>
  );
}
