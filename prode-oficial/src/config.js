// src/config.js
// Detecta si estamos en la PC (localhost) o en la nube
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Si es local, usa el puerto 3000. Si es producción, usa la URL que te dará Railway.
export const API_URL = isLocal 
    ? 'http://localhost:3000' 
    : 'https://prode-walter-production.up.railway.app';