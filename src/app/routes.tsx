import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Route-level code splitting
const HomeView = React.lazy(() =>
  import('../views/HomeView').then((m) => ({ default: m.HomeView }))
);
const LoginView = React.lazy(() =>
  import('../views/LoginView').then((m) => ({ default: m.LoginView }))
);
const LibraryView = React.lazy(() =>
  import('../views/LibraryView').then((m) => ({ default: m.LibraryView }))
);
const SearchView = React.lazy(() =>
  import('../views/SearchView').then((m) => ({ default: m.SearchView }))
);
const ItemDetailsView = React.lazy(() =>
  import('../views/ItemDetailsView').then((m) => ({ default: m.ItemDetailsView }))
);
const PlayerView = React.lazy(() =>
  import('../views/PlayerView').then((m) => ({ default: m.PlayerView }))
);
const SettingsView = React.lazy(() =>
  import('../views/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const NotFoundView = React.lazy(() =>
  import('../views/NotFoundView').then((m) => ({ default: m.NotFoundView }))
);

function RouteLoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface-950">
      <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <React.Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Public Route */}
        <Route path="/login" element={<LoginView />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomeView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/item/:itemId"
          element={
            <ProtectedRoute>
              <ItemDetailsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player/:itemId"
          element={
            <ProtectedRoute>
              <PlayerView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsView />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </React.Suspense>
  );
}
