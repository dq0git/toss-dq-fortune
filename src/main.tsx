import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TDSMobileAITProvider>
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  </TDSMobileAITProvider>
)
