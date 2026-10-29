import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "./i18n";
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { Provider } from 'react-redux';
import { store } from './store/store.ts';
import { ThemeProvider } from "@/components/theme-provider"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Provider store={store} >
          <App />
          <Toaster />
        </Provider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
