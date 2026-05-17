import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Correctly handle service worker registration path with base URL
    const swPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sw.js`;
    navigator.serviceWorker
      .register(swPath)
      .then((reg) => console.log('SW registered!', reg))
      .catch((err) => console.log('SW registration failed:', err))
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
