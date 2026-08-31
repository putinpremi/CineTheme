import * as React from 'react';
import { platformAdapter } from '../../core/platform/platformAdapter';
import { useSpatialNavigation } from './useSpatialNavigation';
import { useLocation } from 'react-router-dom';
import { TvContext } from './TvContext';

export function TvProvider({ children }: { children: React.ReactNode }) {
  const [isTv, setIsTv] = React.useState<boolean>(() => platformAdapter.isTVMode());
  const location = useLocation();

  // Re-evaluate TV mode if override changes
  const setTvModeOverride = React.useCallback((enabled: boolean | null) => {
    platformAdapter.setTvModeOverride(enabled);
    setIsTv(platformAdapter.isTVMode());
  }, []);

  // Sync with spatial navigation
  useSpatialNavigation({
    enabled: isTv,
    routeKey: location.pathname,
  });

  // Apply .is-tv class to document.documentElement
  React.useEffect(() => {
    if (isTv) {
      document.documentElement.classList.add('is-tv');
      document.documentElement.setAttribute('data-tv-mode', 'true');
    } else {
      document.documentElement.classList.remove('is-tv');
      document.documentElement.removeAttribute('data-tv-mode');
    }
  }, [isTv]);

  const value = React.useMemo(
    () => ({
      isTv,
      setTvModeOverride,
    }),
    [isTv, setTvModeOverride]
  );

  return <TvContext.Provider value={value}>{children}</TvContext.Provider>;
}
