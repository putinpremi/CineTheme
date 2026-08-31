import { Download } from 'lucide-react';
import { usePwaInstall } from '../../pwa/usePwaInstall';

export interface InstallButtonProps {
  className?: string;
  variant?: 'button' | 'menu-item';
}

export function InstallButton({ className = '', variant = 'button' }: InstallButtonProps) {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) {
    return null;
  }

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm text-surface-200 hover:text-surface-50 hover:bg-surface-800/60 transition-colors focus-ring cursor-pointer ${className}`}
        aria-label="Install CineTheme App"
      >
        <Download className="h-4 w-4 text-brand-400" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={promptInstall}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs shadow-lg transition-transform active:scale-95 focus-ring cursor-pointer ${className}`}
      aria-label="Install CineTheme App"
    >
      <Download className="h-3.5 w-3.5" />
      <span>Install App</span>
    </button>
  );
}
