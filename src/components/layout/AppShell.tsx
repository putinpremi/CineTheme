import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { OfflineBanner } from '../pwa/OfflineBanner';
import { PwaUpdateToast } from '../pwa/PwaUpdateToast';
import { useUIStore } from '../../state/stores/useUIStore';
import { cn } from '../../utils/cn';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/player/');

  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 flex flex-col selection:bg-brand-500/30 selection:text-brand-200">
      <OfflineBanner />
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main
          id="main-content"
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
            !isPlayer && (isSidebarOpen ? 'sm:pl-60' : 'sm:pl-16')
          )}
        >
          {children}
        </main>
      </div>
      <ToastContainer />
      <PwaUpdateToast />
    </div>
  );
}
