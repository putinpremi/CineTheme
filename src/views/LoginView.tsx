import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { TextInput } from '../components/ui/Input';
import { Button, IconButton } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Server, Lock, User, Eye, EyeOff, CheckCircle2, LogOut, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../state/stores/useAuthStore';
import { isMixedContentRisk } from '../api/client/urlUtils';

export function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();

  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const serverInfo = useAuthStore((s) => s.serverInfo);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);

  const [serverUrl, setServerUrl] = React.useState(
    session?.serverUrl || import.meta.env.VITE_JELLYFIN_SERVER_URL || ''
  );
  const [username, setUsername] = React.useState(session?.user?.name || '');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const isLoading = status === 'authenticating';
  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  // Retrieve destination redirect if user was redirected from a protected route
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/home';

  const mixedContentWarning = React.useMemo(() => {
    return isMixedContentRisk(serverUrl);
  }, [serverUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl || !username || !password) return;

    try {
      await login(serverUrl, username, password);
      // Clear password from local state immediately after submit
      setPassword('');
      navigate(from, { replace: true });
    } catch {
      // Error handled by store state
    }
  };

  const handleReset = () => {
    setServerUrl('');
    setUsername('');
    setPassword('');
    clearError();
  };

  const handleLogout = async () => {
    await logout();
    setPassword('');
  };

  // If already authenticated, display active connection card with quick resume or logout
  if (isAuthenticated && session) {
    return (
      <div className="py-12 sm:py-16">
        <Container size="sm">
          <Card variant="cinematic" className="max-w-md mx-auto">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Connected to Server</CardTitle>
              <CardDescription>
                Signed in as <strong className="text-surface-50 font-semibold">{session.user.name}</strong> on{' '}
                <span className="text-brand-300 font-mono text-xs">{serverInfo?.name || session.serverUrl}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-lg bg-surface-900 border border-surface-750 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-surface-300">
                  <span>Server URL</span>
                  <span className="font-mono text-surface-100">{session.serverUrl}</span>
                </div>
                <div className="flex justify-between text-surface-300">
                  <span>Server ID</span>
                  <span className="font-mono text-surface-100">{session.serverId.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between text-surface-300">
                  <span>Administrator</span>
                  <span className="text-surface-100">{session.user.isAdmin ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2.5">
              <Button
                variant="primary"
                className="w-full gap-2"
                onClick={() => navigate(from, { replace: true })}
              >
                <span>Continue to CineTheme</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" className="w-full gap-2" onClick={handleLogout}>
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
    <div className="py-12 sm:py-16">
      <Container size="sm">
        <Card variant="cinematic" className="max-w-md mx-auto">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-lg">
              <Server className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-display">Connect to Jellyfin</CardTitle>
            <CardDescription>Enter your Jellyfin server address and credentials.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="error" title="Authentication Failed">
                  {error.message}
                </Alert>
              )}

              {mixedContentWarning && (
                <Alert variant="warning" title="Mixed Content Notice">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Connecting from HTTPS to an unencrypted HTTP server may be blocked by your browser. Use HTTPS or run CineTheme locally.
                    </span>
                  </div>
                </Alert>
              )}

              <TextInput
                label="Jellyfin Server URL"
                placeholder="https://jellyfin.example.com"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  if (error) clearError();
                }}
                leftIcon={<Server className="h-4 w-4" />}
                helperText="Includes protocol and optional subpath (e.g. https://domain.com/jellyfin)"
                required
                disabled={isLoading}
              />

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

              <TextInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
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
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={!serverUrl || !username || !password || isLoading}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-surface-400 hover:text-surface-50"
                onClick={handleReset}
                disabled={isLoading}
              >
                Clear Fields
              </Button>
            </CardFooter>
          </form>
        </Card>
      </Container>
    </div>
  );
}
