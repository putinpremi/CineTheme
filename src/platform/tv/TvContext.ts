import * as React from 'react';

export interface TvContextValue {
  isTv: boolean;
  setTvModeOverride: (enabled: boolean | null) => void;
}

export const TvContext = React.createContext<TvContextValue>({
  isTv: false,
  setTvModeOverride: () => {},
});

export function useTv(): TvContextValue {
  return React.useContext(TvContext);
}
