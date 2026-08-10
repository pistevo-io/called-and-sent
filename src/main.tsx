import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NeonAuthUIProvider } from '@neondatabase/auth-ui'
import '@neondatabase/auth-ui/css'
import { authClient } from './features/auth/auth'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NeonAuthUIProvider authClient={authClient} defaultTheme="dark">
      <App />
    </NeonAuthUIProvider>
  </StrictMode>,
)
