import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';
import ReactGA from 'react-ga4'; // 👈 1. Add this import


ReactGA.initialize('G-WBRS3JN90P'); 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);