import { Component, type ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from './app/context';
import { App } from './app/App';
import { BrowserStorageAdapter } from './services/storage';
import './styles.css';
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="fatal">
        <h1>We couldn't open the workspace</h1>
        <p>{this.state.error}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
        <button
          onClick={() => {
            if (window.confirm('Restore seed data? All local demo changes will be removed.')) {
              new BrowserStorageAdapter().reset();
              window.location.reload();
            }
          }}
        >
          Reset demo data
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Provider>
          <App />
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    /* Online operation remains available if service workers are disabled. */
  });
}
