import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { TextInput } from '../components/ui/Input';
import { Button, IconButton } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  Server,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  Radio,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../state/stores/useAuthStore';
import { isMixedContentRisk } from '../api/client/urlUtils';
import { CineThemeLogo } from '../components/ui/CineThemeLogo';
import type { ServerProfile } from '../domain/auth/types';

export function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();

  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const serverInfo = useAuthStore((s) => s.serverInfo);
  const savedServers = useAuthStore((s) => s.savedServers);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const removeSavedServer = useAuthStore((s) => s.removeSavedServer);

  const initialUrl = session?.serverUrl || import.meta.env.VITE_JELLYFIN_SERVER_URL || '';

  const [serverUrl, setServerUrl] = React.useState(initialUrl);
  const [username, setUsername] = React.useState(session?.user?.name || '');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = React.useState(false);

  const isLoading = status === 'authenticating';
  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  // Retrieve destination redirect if user was redirected from a protected route
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/home';

  const mixedContentWarning = React.useMemo(() => {
    return isMixedContentRisk(serverUrl);
  }, [serverUrl]);

  const handleSelectSavedServer = (server: ServerProfile) => {
    setServerUrl(server.url);
    if (server.userName) {
      setUsername(server.userName);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl || !username || !password) return;

    try {
      await login(serverUrl, username, password);
      setPassword('');
      navigate(from, { replace: true });
    } catch {
      // Error is set in store state
    }
  };

  const handleLogout = async () => {
    await logout();
    setPassword('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  // If already authenticated, display active connection status
  if (isAuthenticated && session) {
    return (
      <div className="py-12 sm:py-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Container size="sm">
          <Card variant="cinematic" className="max-w-md mx-auto shadow-2xl border-surface-750/70">
            <CardHeader className="text-center space-y-3 pb-4">
              <div className="mx-auto">
                <CineThemeLogo size="lg" showWordmark={false} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Session
                </div>
                <CardTitle className="text-xl font-display">Connected to Server</CardTitle>
                <CardDescription className="mt-1">
                  Signed in as <strong className="text-surface-100 font-semibold">{session.user.name}</strong>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl bg-surface-900/80 border border-surface-800 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-surface-300">
                  <span>Server</span>
                  <span className="font-semibold text-surface-100">
                    {serverInfo?.name || 'Jellyfin Server'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-surface-300">
                  <span>Address</span>
                  <span className="font-mono text-surface-200 truncate max-w-[200px]">
                    {session.serverUrl}
                  </span>
                </div>
                <div className="flex justify-between items-center text-surface-300">
                  <span>User Role</span>
                  <span className="text-surface-100">
                    {session.user.isAdmin ? 'Administrator' : 'Standard User'}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2.5 pt-2">
              <Button
                variant="primary"
                className="w-full gap-2 shadow-lg shadow-brand-500/20"
                onClick={() => navigate(from, { replace: true })}
              >
                <span>Continue to CineTheme</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-2 text-surface-300 hover:text-red-400"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect / Sign Out</span>
              </Button>
            </CardFooter>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Container size="sm">
        <div className="max-w-md mx-auto space-y-6">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <CineThemeLogo size="xl" showWordmark={true} />
            <p className="text-xs sm:text-sm text-surface-400">
              The premium client for Jellyfin media servers
            </p>
          </div>

          <Card variant="cinematic" className="shadow-2xl border-surface-750/70">
            <CardHeader className="space-y-1.5 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase text-brand-400 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-brand-400" />
                  Jellyfin Authentication
                </span>
              </div>
              <CardTitle className="text-xl font-display">Connect to Jellyfin</CardTitle>
              <CardDescription>
                Sign in to stream movies, shows, and anime from your personal Jellyfin server.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLoginSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="error" title="Sign In Failed">
                    {error.message}
                  </Alert>
                )}

                {mixedContentWarning && (
                  <Alert variant="warning" title="Security Warning">
                    <div className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        Connecting from HTTPS to unencrypted HTTP may be blocked by your browser. Use HTTPS or install the desktop application.
                      </span>
                    </div>
                  </Alert>
                )}

                {/* Saved Servers Quick Selector */}
                {savedServers.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-surface-300">
                      Recent Servers
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {savedServers.map((s) => (
                        <div
                          key={s.id || s.url}
                          className="group flex items-center justify-between p-2.5 rounded-xl bg-surface-900/90 border border-surface-800 hover:border-brand-500/50 transition-all cursor-pointer"
                          onClick={() => handleSelectSavedServer(s)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-850 text-brand-400 group-hover:bg-brand-500/20 transition-colors shrink-0">
                              <Server className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-semibold text-surface-100 truncate group-hover:text-brand-300 transition-colors">
                                {s.name}
                              </div>
                              <div className="text-[11px] text-surface-400 font-mono truncate">
                                {s.url}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <IconButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label="Remove saved server"
                              className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-red-400 transition-opacity h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSavedServer(s.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </IconButton>
                            <ChevronRight className="h-3.5 w-3.5 text-surface-400 group-hover:text-brand-400 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Server URL Input */}
                <TextInput
                  label="Jellyfin Server URL"
                  placeholder="https://jellyfin.example.com"
                  value={serverUrl}
                  onChange={(e) => {
                    setServerUrl(e.target.value);
                    if (error) clearError();
                  }}
                  leftIcon={<Server className="h-4 w-4" />}
                  helperText="Domain or IP with protocol (e.g., https://media.example.com or http://192.168.1.50:8096)"
                  required
                  disabled={isLoading}
                />

                {/* Username Input */}
                <TextInput
                  label="Username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) clearError();
                  }}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                  disabled={isLoading}
                />

                {/* Password Input */}
                <div className="space-y-1.5">
                  <TextInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) clearError();
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="h-7 w-7 text-surface-400 hover:text-surface-50"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </IconButton>
                    }
                    required
                    disabled={isLoading}
                  />

                  {isCapsLockOn && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 px-1 animate-in fade-in duration-200">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Caps Lock is ON</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2.5 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full shadow-lg shadow-brand-500/20"
                  isLoading={isLoading}
                  disabled={!serverUrl.trim() || !username.trim() || !password || isLoading}
                >
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </Container>
    </div>
  );
}
