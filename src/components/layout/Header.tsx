import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, Server, Settings } from 'lucide-react';
import { useUIStore } from '../../state/stores/useUIStore';
import { useAuthStore } from '../../state/stores/useAuthStore';
import { IconButton } from '../ui/Button';
import { CineThemeLogo } from '../ui/CineThemeLogo';

export function Header() {
  const location = useLocation();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const session = useAuthStore((s) => s.session);

  // Hide standard header in player view
  if (location.pathname.startsWith('/player/')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-surface-750/70 bg-surface-950/85 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <IconButton
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="text-surface-400 hover:text-surface-50 focus-ring"
        >
          <Menu className="h-5 w-5" />
        </IconButton>

        <Link to="/home" aria-label="CineTheme Home" className="flex items-center focus-ring rounded-xl p-0.5">
          <CineThemeLogo size="md" />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/search"
          aria-label="Search media"
          className="p-2 rounded-xl text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
        >
          <Search className="h-5 w-5" />
        </Link>

        <Link
          to="/login"
          aria-label="Server status"
          className={`p-2 rounded-xl hover:bg-surface-800/60 transition-colors focus-ring ${
            session ? 'text-emerald-400 hover:text-emerald-300' : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          <Server className="h-5 w-5" />
        </Link>

        <Link
          to="/settings"
          aria-label="Settings"
          className="p-2 rounded-xl text-surface-300 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
