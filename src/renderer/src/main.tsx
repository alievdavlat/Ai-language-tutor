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

function Root(): JSX.Element {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter>
          <App />
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(root).render(
  useClerk ? (
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
      <Root />
    </ClerkProvider>
  ) : (
    <Root />
  )
)
