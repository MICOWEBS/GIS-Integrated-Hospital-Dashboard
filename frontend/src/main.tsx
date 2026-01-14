import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '9999px',
            padding: '10px 16px',
            background: '#0f172a',
            color: '#f9fafb',
            boxShadow: '0 10px 25px rgba(15,23,42,0.4)',
            fontSize: '0.85rem',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#f97316',
              secondary: '#0f172a',
            },
          },
        }}
      />
    </>
  </React.StrictMode>,
)

