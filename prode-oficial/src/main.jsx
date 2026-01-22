import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google'; // 👈 Importar
import './index.css';

// Reemplaza con TU ID DE CLIENTE DEL PASO 1
const GOOGLE_CLIENT_ID = "85437112999-5bmnfd19lhcvb7i67u2qjfg1ib3g5gjr.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> 
            <App />
        </GoogleOAuthProvider>
    </React.StrictMode>,
);