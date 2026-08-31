import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers';
import { TvProvider } from '../platform/tv/TvProvider';
import { AppShell } from '../components/layout/AppShell';
import { AppRoutes } from './routes';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <TvProvider>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </TvProvider>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
