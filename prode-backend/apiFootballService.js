// prode-backend/apiFootballService.js
const axios = require('axios');
const path = require('path');
require('dotenv').config(); // En Railway esto no hace daño, pero no es estrictamente necesario si usas variables de entorno

const API_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'x-apisports-key': API_KEY
    }
});

async function obtenerPartidosDeAPI(leagueId, season) {
    // 🛡️ 1. Validación de seguridad antes de llamar
    if (!API_KEY) {
        console.error("❌ ERROR CRÍTICO: Falta API_FOOTBALL_KEY en las variables de entorno.");
        return []; // Retornamos vacío para no romper, pero avisamos
    }

    try {
        console.log(`📡 Consultando API Football: Liga ${leagueId}, Temporada ${season}`);
        
        const response = await apiClient.get('/fixtures', {
            params: {
                league: leagueId,
                season: season,
                timezone: 'America/Argentina/Buenos_Aires'
            }
        });

        // 🛡️ 2. Verificar si la API respondió con errores lógicos (ej: Key inválida)
        if (response.data.errors && Object.keys(response.data.errors).length > 0) {
            console.error("❌ La API respondió con errores:", response.data.errors);
            return [];
        }

        // 🛡️ 3. Verificar si hay resultados
        const partidos = response.data.response;
        if (!partidos || partidos.length === 0) {
            console.warn("⚠️ La API respondió OK, pero no trajo partidos (Array vacío).");
            return [];
        }

        console.log(`✅ Se encontraron ${partidos.length} partidos.`);
        return partidos;

    } catch (error) {
        console.error("❌ Error de red conectando con API-Football:", error.message);
        if (error.response) {
            console.error("Datos del error:", error.response.data);
        }
        return [];
    }
}

module.exports = { obtenerPartidosDeAPI };