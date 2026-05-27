import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
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

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
