import { cn } from '../../utils/cn';
import { useWebCustomizationStore } from '../../state/stores/useWebCustomizationStore';

export interface CineThemeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 'h-6 w-6', text: 'text-base', gap: 'gap-2' },
  md: { icon: 'h-8 w-8', text: 'text-lg', gap: 'gap-2.5' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl', gap: 'gap-3.5' },
  xl: { icon: 'h-16 w-16', text: 'text-3xl', gap: 'gap-4' },
};

export function CineThemeLogo({
  size = 'md',
  showWordmark = true,
  className,
}: CineThemeLogoProps) {
  const config = SIZE_MAP[size];
  const appName = useWebCustomizationStore((s) => s.appName);
  const customLogoUrl = useWebCustomizationStore((s) => s.customLogoUrl);

  return (
    <div className={cn('inline-flex items-center select-none', config.gap, className)}>
      {/* Official CineTheme Aperture Lens / Custom Logo Mark */}
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-lg shadow-brand-500/20 transition-transform duration-300 hover:scale-105',
          config.icon
        )}
      >
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt={appName || 'Logo'}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}
        {!customLogoUrl && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Background Squircle */}
          <rect width="48" height="48" rx="12" fill="#090C15" />
          <rect
            width="48"
            height="48"
            rx="12"
            stroke="url(#cinetheme-border-grad)"
            strokeWidth="1.5"
          />

          {/* Aperture Shutter Ring */}
          <circle
            cx="24"
            cy="24"
            r="16"
            stroke="url(#cinetheme-brand-grad)"
            strokeWidth="2.5"
            strokeDasharray="80"
            strokeDashoffset="15"
            strokeLinecap="round"
          />

          {/* Secondary Shutter Accent */}
          <path
            d="M33 33L39 39"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Precision Play Glyph */}
          <path
            d="M21 17.5L31 24L21 30.5V17.5Z"
            fill="url(#cinetheme-play-grad)"
            stroke="#818CF8"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="cinetheme-brand-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="cinetheme-play-grad" x1="21" y1="17.5" x2="31" y2="30.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="cinetheme-border-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" stopOpacity="0.5" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
        )}
      </div>

      {/* Typography Wordmark */}
      {showWordmark && (
        <span className={cn('font-display font-black tracking-tight text-surface-50', config.text)}>
          {appName && appName !== 'CineTheme' ? (
            appName
          ) : (
            <>
              Cine
              <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                Theme
              </span>
            </>
          )}
        </span>
      )}
    </div>
  );
}
