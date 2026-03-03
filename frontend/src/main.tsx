import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

// Declare global version from Vite build
declare const __APP_VERSION__: string;

// Auto-update: yangi deploy bo'lganda barcha qurilmalarda avto-reload
const checkForUpdates = async () => {
  try {
    const res = await fetch('/version.json?_=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    const serverVersion = data.version;
    const localVersion = localStorage.getItem('app-version');

    if (localVersion && localVersion !== serverVersion) {
      console.log(`🔄 Yangi versiya topildi: ${localVersion} → ${serverVersion}`);
      localStorage.setItem('app-version', serverVersion);

      // Barcha cache'larni tozalash
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
      // Service worker'ni qayta ro'yxatdan o'tkazish
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister()));
      }
      // Sahifani qayta yuklash
      window.location.reload();
      return;
    }

    // Birinchi marta yoki bir xil versiya
    if (!localVersion) {
      localStorage.setItem('app-version', serverVersion);
    }
  } catch {
    // Silently fail
  }
};

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silently fail if SW registration fails
    });
  });
}

// Version check: yuklanganda + har 2 daqiqada + tab qaytganda
if (import.meta.env.PROD) {
  checkForUpdates();
  setInterval(checkForUpdates, 120_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdates();
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)