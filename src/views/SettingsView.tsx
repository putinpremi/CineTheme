import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { useSettingsStore } from '../state/stores/useSettingsStore';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useUIStore } from '../state/stores/useUIStore';
import { useAuthStore } from '../state/stores/useAuthStore';
import { InstallButton } from '../components/pwa/InstallButton';
import { useNetworkStatus } from '../pwa/useNetworkStatus';
import { runtimeConfig } from '../core/config/runtimeConfig';
import { platformAdapter } from '../core/platform/platformAdapter';
import { useTv } from '../platform/tv/TvContext';
import { Smartphone, Wifi, ShieldCheck, Tv } from 'lucide-react';

export function SettingsView() {
  const settings = useSettingsStore();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const addToast = useUIStore((s) => s.addToast);
  const session = useAuthStore((s) => s.session);
  const { isOnline } = useNetworkStatus();
  const { isTv, setTvModeOverride } = useTv();

  const currentTvOverride = platformAdapter.getTvModeOverride();
  const tvModeValue = currentTvOverride === null ? 'auto' : currentTvOverride ? 'enabled' : 'disabled';

  return (
    <div className="py-8 sm:py-10">
      <Container size="md">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-50">Settings</h1>
            <p className="text-sm text-surface-400">Configure playback, anime subtitles, and client preferences.</p>
          </div>

          <div className="space-y-6">
            {/* TV & 10-Foot UI Presentation Layer */}
            <Card variant="cinematic">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-brand-400" />
                  <CardTitle>Display & 10-Foot TV Experience</CardTitle>
                </div>
                <CardDescription>
                  Configure remote D-pad spatial navigation, large typography, and overscan protection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 max-w-xs">
                  <label htmlFor="tv-mode-select" className="text-xs font-medium text-surface-300">
                    10-Foot TV Mode
                  </label>
                  <Select
                    value={tvModeValue}
                    onValueChange={(val) => {
                      if (val === 'auto') {
                        setTvModeOverride(null);
                        addToast({ title: 'TV Mode', description: 'Set to Auto-detection', type: 'default' });
                      } else if (val === 'enabled') {
                        setTvModeOverride(true);
                        addToast({ title: 'TV Mode', description: '10-Foot TV mode activated', type: 'success' });
                      } else {
                        setTvModeOverride(false);
                        addToast({ title: 'TV Mode', description: 'TV mode disabled', type: 'default' });
                      }
                    }}
                  >
                    <SelectTrigger id="tv-mode-select">
                      <SelectValue placeholder="Select display mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                      <SelectItem value="enabled">Force 10-Foot TV Mode</SelectItem>
                      <SelectItem value="disabled">Force Standard Touch/Pointer Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-xs text-surface-300 pt-1">
                  <span className="text-surface-400">Active State:</span>
                  <span className={`font-semibold ${isTv ? 'text-brand-300' : 'text-surface-300'}`}>
                    {isTv ? '10-Foot TV Mode Active (D-Pad Spatial Navigation Enabled)' : 'Standard Responsive Web/Mobile Mode'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* PWA & Web Platform Status */}
            <Card variant="cinematic">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-brand-400" />
                  <CardTitle>Web Application & PWA</CardTitle>
                </div>
                <CardDescription>Progressive Web App installation and offline application shell.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-surface-900/80 border border-surface-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-surface-100">CineTheme Web Client</span>
                    <span className="text-[11px] text-surface-400 font-mono">
                      Version {runtimeConfig.appVersion} • {platformAdapter.getPlatformType().toUpperCase()}
                    </span>
                  </div>
                  <InstallButton />
                </div>

                <div className="flex items-center justify-between text-xs text-surface-300 pt-1">
                  <div className="flex items-center gap-2">
                    <Wifi className={`h-4 w-4 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span>Connectivity: {isOnline ? 'Online (Connected)' : 'Offline (Cached App Shell)'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-surface-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
                    <span>Media streams are never cached offline</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Session & Server Isolation */}
            {session && (
              <Card variant="cinematic">
                <CardHeader>
                  <CardTitle>Connected Server</CardTitle>
                  <CardDescription>Active Jellyfin session and server identity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-surface-800/60">
                    <span className="text-surface-400">Server URL</span>
                    <span className="font-mono text-surface-200">{session.serverUrl}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-800/60">
                    <span className="text-surface-400">User Account</span>
                    <span className="font-medium text-surface-200">{session.user.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-surface-400">Cache Scope</span>
                    <span className="font-mono text-brand-300">Server + User Isolated</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card variant="cinematic">
              <CardHeader>
                <CardTitle>Audio & Language</CardTitle>
                <CardDescription>Default audio track preference for movies and anime series.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 max-w-xs">
                  <label htmlFor="pref-audio-lang" className="text-xs font-medium text-surface-300">
                    Preferred Audio Track
                  </label>
                  <Select
                    value={settings.preferredAudioLanguage}
                    onValueChange={(val) => {
                      updateSettings({ preferredAudioLanguage: val });
                      addToast({ title: 'Settings updated', description: `Audio language set to ${val}`, type: 'success' });
                    }}
                  >
                    <SelectTrigger id="pref-audio-lang">
                      <SelectValue placeholder="Select audio language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpn">Japanese (Original)</SelectItem>
                      <SelectItem value="eng">English</SelectItem>
                      <SelectItem value="fre">French</SelectItem>
                      <SelectItem value="ger">German</SelectItem>
                      <SelectItem value="spa">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card variant="cinematic">
              <CardHeader>
                <CardTitle>Subtitle Preferences</CardTitle>
                <CardDescription>Default subtitle behavior for anime and foreign language media.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 max-w-xs">
                  <label htmlFor="pref-sub-lang" className="text-xs font-medium text-surface-300">
                    Preferred Subtitle Language
                  </label>
                  <Select
                    value={settings.preferredSubtitleLanguage}
                    onValueChange={(val) => {
                      updateSettings({ preferredSubtitleLanguage: val });
                      addToast({ title: 'Settings updated', description: `Subtitle language set to ${val}`, type: 'success' });
                    }}
                  >
                    <SelectTrigger id="pref-sub-lang">
                      <SelectValue placeholder="Select subtitle language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eng">English</SelectItem>
                      <SelectItem value="spa">Spanish</SelectItem>
                      <SelectItem value="fre">French</SelectItem>
                      <SelectItem value="ger">German</SelectItem>
                      <SelectItem value="off">Subtitles Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetSettings();
                  addToast({ title: 'Settings reset', description: 'Preferences restored to defaults', type: 'default' });
                }}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
