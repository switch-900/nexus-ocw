// main.jsx - Frontend entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Load core library based on environment
// Development: dev-loader.js loaded via index.dev.html <script> tag
// Production: inscription loaded via index.html <script> tag

const initializeApp = async () => {
  // Wait for core library to be loaded from HTML script tag
  if (window.NexusWalletConnect) {
    console.log('✅ NexusWalletConnect loaded:', window.NexusWalletConnect.version || 'loaded');
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  } else {
    // Retry if not loaded yet
    setTimeout(initializeApp, 100);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}