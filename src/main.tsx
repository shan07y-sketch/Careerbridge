import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RootErrorBoundary } from './components/RootErrorBoundary'

// Global safety nets: log (but don't let) uncaught errors and promise
// rejections take the app down silently. On mobile a swallowed startup error
// otherwise reads as "the app crashed on open".
window.addEventListener('error', (e) => {
  console.error('[GlobalError]', e.error ?? e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UnhandledRejection]', e.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
