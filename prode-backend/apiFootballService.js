// prode-backend/apiFootballService.js
const axios = require('axios');
const path = require('path');

// ⬇️ FORZAMOS LA RUTA AL ARCHIVO .ENV (Solución a prueba de balas)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const API_URL = 'https://v3.football.api-sports.io';

// Recuperamos la clave del archivo
const API_KEY = process.env.API_FOOTBALL_KEY; 

// --- VERIFICACIÓN DE SEGURIDAD EN CONSOLA ---
if (!API_KEY) {
    console.error("❌ ERROR CRÍTICO: No se encontró API_FOOTBALL_KEY en el archivo .env");
} else {
    // Imprimimos solo los primeros 5 caracteres para verificar que la leyó, sin mostrarla toda
    console.log(`🔒 API Key cargada correctamente: ${API_KEY.substring(0, 5)}...`);
}
// --------------------------------------------

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'x-apisports-key': API_KEY
    }
});

async function obtenerPartidosDeAPI(leagueId, season) {
    try {
        console.log(`📡 Consultando API: Liga ${leagueId}, Temporada ${season}`);
        
        const response = await apiClient.get('/fixtures', {
            params: {
                league: leagueId,
                season: season,
                timezone: 'America/Argentina/Buenos_Aires' 
            }
        });
        
        // Si quieres ver los resultados en consola para debug, descomenta esto:
        // console.log("Partidos encontrados:", response.data.results);
        
        return response.data.response; 
    } catch (error) {
        console.error("❌ Error conectando con API-Football:", error.message);
        return [];
    }
}

module.exports = { obtenerPartidosDeAPI };