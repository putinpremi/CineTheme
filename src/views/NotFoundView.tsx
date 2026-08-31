import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { Home, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundView() {
  return (
    <div className="py-20 sm:py-32">
      <Container size="sm">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-900 border border-surface-700 text-surface-400">
            <Compass className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-surface-50 font-display">404 - Page Not Found</h1>
            <p className="text-surface-400 text-sm max-w-sm mx-auto leading-relaxed">
              The view or media endpoint you requested does not exist in CineTheme.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/home">
              <Button variant="primary" size="md" className="gap-2">
                <Home className="h-4 w-4" />
                <span>Return to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
