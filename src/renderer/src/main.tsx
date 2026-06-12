import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import ErrorBoundary from './components/feedback/ErrorBoundary'
import './index.css'

// Standalone browser preview: install an in-memory window.api so the app boots
// without the Electron preload bridge. No-op inside Electron (bridge exists)
// and stripped from production builds (import.meta.env.DEV guard).
if (import.meta.env.DEV && !window.api) {
  const { installDevApiMock } = await import('./services/devApiMock')
  installDevApiMock()
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

// Clerk is optional — falls back to the existing local auth flow when the
// publishable key is missing (e.g. running preview without .env.local).
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const useClerk = import.meta.env.VITE_USE_CLERK === '1' && !!clerkPubKey

function AppTree(): JSX.Element {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  )
}

/**
 * Clerk is optional and its hosted instance can be unreachable in some regions.
 * Mounting ClerkProvider OUTSIDE an error boundary means any init failure blanks
 * the whole app (the bug that forced VITE_USE_CLERK=0). So the ErrorBoundary is
 * now the OUTERMOST wrapper — a Clerk failure surfaces a recoverable error screen
 * instead of a silent white page. Enable with VITE_USE_CLERK=1 once the Clerk
 * instance is confirmed reachable.
 */
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      {useClerk ? (
        <ClerkProvider
          publishableKey={clerkPubKey!}
          // Electron loads via file:// — we use HashRouter so all redirects can stay relative.
          signInFallbackRedirectUrl="/#/"
          signUpFallbackRedirectUrl="/#/"
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#2563EB',
              colorBackground: '#0a0e1f',
              colorText: '#e2e8f0',
              colorInputBackground: 'rgba(255,255,255,0.05)',
              colorInputText: '#e2e8f0'
            }
          }}
        >
          <AppTree />
        </ClerkProvider>
      ) : (
        <AppTree />
      )}
    </ErrorBoundary>
  </React.StrictMode>
)
