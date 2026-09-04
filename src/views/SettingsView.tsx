import * as React from 'react';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { useSettingsStore } from '../state/stores/useSettingsStore';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUIStore } from '../state/stores/useUIStore';
import { useAuthStore } from '../state/stores/useAuthStore';
import { InstallButton } from '../components/pwa/InstallButton';
import { useNetworkStatus } from '../pwa/useNetworkStatus';
import { runtimeConfig } from '../core/config/runtimeConfig';
import { platformAdapter } from '../core/platform/platformAdapter';
import { useTv } from '../platform/tv/TvContext';
import {
  Smartphone,
  Wifi,
  ShieldCheck,
  Tv,
  Palette,
  Film,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import {
  useWebCustomizationStore,
  ACCENT_PRESETS,
  type BackgroundStyle,
  type UiDensity,
} from '../state/stores/useWebCustomizationStore';
import { useSeerrStore } from '../state/stores/useSeerrStore';

export function SettingsView() {
  const settings = useSettingsStore();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const addToast = useUIStore((s) => s.addToast);
  const session = useAuthStore((s) => s.session);
  const { isOnline } = useNetworkStatus();
  const { isTv, setTvModeOverride } = useTv();

  const [showApiKey, setShowApiKey] = React.useState(false);
  const [isTestingSeerr, setIsTestingSeerr] = React.useState(false);

  // Web Customization Store
  const appName = useWebCustomizationStore((s) => s.appName);
  const accentPreset = useWebCustomizationStore((s) => s.accentPreset);
  const customAccentColor = useWebCustomizationStore((s) => s.customAccentColor);
  const backgroundStyle = useWebCustomizationStore((s) => s.backgroundStyle);
  const uiDensity = useWebCustomizationStore((s) => s.uiDensity);
  const customLogoUrl = useWebCustomizationStore((s) => s.customLogoUrl);
  const setAppName = useWebCustomizationStore((s) => s.setAppName);
  const setAccentPreset = useWebCustomizationStore((s) => s.setAccentPreset);
  const setBackgroundStyle = useWebCustomizationStore((s) => s.setBackgroundStyle);
  const setUiDensity = useWebCustomizationStore((s) => s.setUiDensity);
  const setCustomLogoUrl = useWebCustomizationStore((s) => s.setCustomLogoUrl);
  const resetCustomization = useWebCustomizationStore((s) => s.resetDefaults);

  // Seerr Store
  const seerrEnabled = useSeerrStore((s) => s.enabled);
  const seerrUrl = useSeerrStore((s) => s.serverUrl);
  const seerrApiKey = useSeerrStore((s) => s.apiKey);
  const seerrStatus = useSeerrStore((s) => s.status);
  const seerrVersion = useSeerrStore((s) => s.version);
  const seerrError = useSeerrStore((s) => s.errorMessage);
  const setSeerrUrl = useSeerrStore((s) => s.setServerUrl);
  const setSeerrApiKey = useSeerrStore((s) => s.setApiKey);
  const setSeerrEnabled = useSeerrStore((s) => s.setEnabled);
  const testSeerrConnection = useSeerrStore((s) => s.testConnection);
  const disconnectSeerr = useSeerrStore((s) => s.disconnect);

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
                      <SelectItem value="auto">Auto / Server Default</SelectItem>
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

            {/* Web Customization & Appearance */}
            <Card variant="cinematic">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-brand-400" />
                  <CardTitle>Appearance & Web Customization</CardTitle>
                </div>
                <CardDescription>
                  Personalize client title, brand accent colors, background style, and UI density.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* App Name */}
                <div className="space-y-1.5 max-w-sm">
                  <label htmlFor="custom-app-name" className="text-xs font-medium text-surface-300">
                    Application Name
                  </label>
                  <Input
                    id="custom-app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="CineTheme"
                  />
                  <p className="text-[11px] text-surface-400">
                    Custom name displayed in the header, logo, and document title.
                  </p>
                </div>

                {/* Accent Color Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-surface-300 block">
                    Brand Accent Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {(Object.keys(ACCENT_PRESETS) as (keyof typeof ACCENT_PRESETS)[]).map((key) => {
                      const preset = ACCENT_PRESETS[key];
                      const isSelected = accentPreset === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setAccentPreset(key);
                            addToast({
                              title: 'Accent Color',
                              description: `Set to ${preset.label}`,
                              type: 'success',
                            });
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-surface-200 bg-surface-800 shadow-md ring-1 ring-white/20 text-surface-50'
                              : 'border-surface-800 bg-surface-900/60 hover:bg-surface-850 text-surface-400 hover:text-surface-200'
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full shrink-0 shadow-inner"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}

                    {/* Custom Color Input */}
                    <div className="flex items-center gap-2 pl-1">
                      <input
                        type="color"
                        id="custom-hex-picker"
                        value={customAccentColor}
                        onChange={(e) => {
                          setAccentPreset('custom', e.target.value);
                        }}
                        aria-label="Custom Hex Color"
                        className="h-7 w-7 rounded-lg border border-surface-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <span className="text-[11px] text-surface-400 font-mono">
                        {accentPreset === 'custom' ? customAccentColor : 'Custom Hex'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Background Style & UI Density in a grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div className="space-y-1.5">
                    <label htmlFor="bg-style-select" className="text-xs font-medium text-surface-300">
                      Background Style
                    </label>
                    <Select
                      value={backgroundStyle}
                      onValueChange={(val) => setBackgroundStyle(val as BackgroundStyle)}
                    >
                      <SelectTrigger id="bg-style-select">
                        <SelectValue placeholder="Select background" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Cinematic Slate</SelectItem>
                        <SelectItem value="oled">Pure OLED Black</SelectItem>
                        <SelectItem value="cinematic">Dark Navy Tint</SelectItem>
                        <SelectItem value="glass">Frosted Glassmorphism</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ui-density-select" className="text-xs font-medium text-surface-300">
                      UI Density
                    </label>
                    <Select
                      value={uiDensity}
                      onValueChange={(val) => setUiDensity(val as UiDensity)}
                    >
                      <SelectTrigger id="ui-density-select">
                        <SelectValue placeholder="Select density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (Default)</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="relaxed">Relaxed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Logo URL */}
                <div className="space-y-1.5 max-w-sm">
                  <label htmlFor="custom-logo-input" className="text-xs font-medium text-surface-300">
                    Custom Logo Image URL (Optional)
                  </label>
                  <Input
                    id="custom-logo-input"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://example.com/my-logo.png"
                  />
                  <p className="text-[11px] text-surface-400">
                    Replaces the default aperture icon with your custom image.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetCustomization();
                      addToast({
                        title: 'Appearance reset',
                        description: 'Customization restored to default branding',
                        type: 'default',
                      });
                    }}
                    className="gap-2 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Appearance to Defaults</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Media Requests (Jellyseerr / Overseerr) */}
            <Card variant="cinematic">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-brand-400" />
                  <CardTitle>Media Requests (Jellyseerr / Overseerr)</CardTitle>
                </div>
                <CardDescription>
                  Integrate your Jellyseerr or Overseerr instance to search and request movies and TV series directly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable toggle */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/60 border border-surface-800">
                  <input
                    type="checkbox"
                    id="seerr-enable-toggle"
                    checked={seerrEnabled}
                    onChange={(e) => {
                      setSeerrEnabled(e.target.checked);
                      addToast({
                        title: 'Media Requests',
                        description: e.target.checked ? 'Jellyseerr integration enabled' : 'Jellyseerr integration disabled',
                        type: 'default',
                      });
                    }}
                    className="h-4 w-4 rounded accent-brand-500 cursor-pointer"
                  />
                  <label htmlFor="seerr-enable-toggle" className="text-sm font-medium text-surface-200 cursor-pointer">
                    Enable Media Requests Integration
                  </label>
                </div>

                {/* Server URL */}
                <div className="space-y-1.5 max-w-md">
                  <label htmlFor="seerr-url-input" className="text-xs font-medium text-surface-300">
                    Jellyseerr Server URL
                  </label>
                  <Input
                    id="seerr-url-input"
                    value={seerrUrl}
                    onChange={(e) => setSeerrUrl(e.target.value)}
                    placeholder="http://jellyseerr.local:5055"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1.5 max-w-md">
                  <label htmlFor="seerr-key-input" className="text-xs font-medium text-surface-300">
                    API Key
                  </label>
                  <div className="relative">
                    <Input
                      id="seerr-key-input"
                      type={showApiKey ? 'text' : 'password'}
                      value={seerrApiKey}
                      onChange={(e) => setSeerrApiKey(e.target.value)}
                      placeholder="Paste your Jellyseerr API key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Test Connection & Disconnect */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isTestingSeerr || !seerrUrl.trim() || !seerrApiKey.trim()}
                    onClick={async () => {
                      setIsTestingSeerr(true);
                      const ok = await testSeerrConnection();
                      setIsTestingSeerr(false);
                      if (ok) {
                        addToast({
                          title: 'Connection Successful',
                          description: 'Connected to Jellyseerr successfully!',
                          type: 'success',
                        });
                      } else {
                        addToast({
                          title: 'Connection Failed',
                          description: 'Could not connect to Jellyseerr. Please verify URL and API key.',
                          type: 'error',
                        });
                      }
                    }}
                    className="gap-2"
                  >
                    {isTestingSeerr ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Test Connection</span>
                      </>
                    )}
                  </Button>

                  {(seerrUrl || seerrApiKey) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        disconnectSeerr();
                        addToast({
                          title: 'Disconnected',
                          description: 'Jellyseerr configuration cleared',
                          type: 'default',
                        });
                      }}
                      className="text-surface-400 hover:text-red-400 text-xs"
                    >
                      Disconnect / Clear
                    </Button>
                  )}
                </div>

                {/* Status Indicator */}
                {seerrStatus === 'connected' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Connected to Jellyseerr (Version {seerrVersion || 'Active'})</span>
                  </div>
                )}
                {seerrStatus === 'error' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{seerrError || 'Connection error. Check URL and API key.'}</span>
                  </div>
                )}
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
