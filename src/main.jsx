import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import UpdateBanner from './UpdateBanner.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <UpdateBanner />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // updateViaCache: 'none' makes the phone fetch sw.js fresh instead of from its HTTP cache.
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
