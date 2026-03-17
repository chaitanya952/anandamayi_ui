import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Expo-style font imports (self-hosted, no network dependency)
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'

const isAdmin = window.location.pathname.startsWith('/admin')

async function bootstrap() {
  if (isAdmin) {
    const { default: AdminApp } = await import('./Admin')
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <AdminApp />
      </StrictMode>
    )
  } else {
    const { default: App } = await import('./App')
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  }
}

bootstrap()
