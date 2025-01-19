//Controls the overall structure and behaviour of the todo web app

import { supabase } from '@/lib/initSupabase'
import '@/styles/app.css'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { AppProps } from 'next/app'

// App function: wraps all pages with the session SessionContextProvider
function App({ Component, pageProps }: AppProps) {
  // Component represents the page to be rendered, (e.g. index.tsx)
  // Page props are any page properties being applied to the current page
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {/* Render the current page */}
      <Component {...pageProps} />
    </SessionContextProvider>
  )
} 

export default App
