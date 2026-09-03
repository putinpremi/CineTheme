import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Search, Settings, Server } from 'lucide-react';
import { useUIStore } from '../../state/stores/useUIStore';
import { InstallButton } from '../pwa/InstallButton';
import { CineThemeLogo } from '../ui/CineThemeLogo';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Libraries', path: '/library', icon: Compass },
  { label: 'Search', path: '/search', icon: Search },
  { label: 'Server Select', path: '/login', icon: Server },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const location = useLocation();

  // Hide sidebar in player view
  if (location.pathname.startsWith('/player/')) {
    return null;
  }

  return (
    <aside
      className={cn(
        'fixed top-16 bottom-0 left-0 z-30 flex flex-col border-r border-surface-750/70 bg-surface-950/95 backdrop-blur-md transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-60' : 'w-16 max-sm:hidden'
      )}
    >
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring select-none',
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/30'
                    : 'text-surface-300 hover:bg-surface-850 hover:text-surface-50'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}

        {isSidebarOpen && <InstallButton variant="menu-item" />}
      </nav>

      {isSidebarOpen && (
        <div className="p-4 border-t border-surface-800">
          <div className="rounded-xl bg-surface-900/60 p-3 border border-surface-800/80 flex items-center gap-3">
            <CineThemeLogo size="sm" showWordmark={false} />
            <div className="text-xs text-surface-400 min-w-0">
              <span className="text-surface-100 font-semibold block truncate">CineTheme</span>
              <span className="text-[11px] text-surface-400 truncate block">Cinematic Client</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
