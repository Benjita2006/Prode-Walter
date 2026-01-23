// checkLeagues.js (Ejecutar con: node checkLeagues.js)
const axios = require('axios');

// TU API KEY AQUÍ
const API_KEY = 'e8aec40cef736497bad39b08f84d0f36'; 

async function buscarLigasArgentina() {
    try {
        const config = {
            method: 'get',
            url: 'https://v3.football.api-sports.io/leagues',
            headers: { 'x-apisports-key': API_KEY },
            params: {
                country: 'Argentina',
                season: 2024 // Si no sale nada, prueba 2025 (a veces tardan en abrir el año)
            }
        };

        const response = await axios(config);
        console.log("🏆 Ligas encontradas en Argentina:");
        response.data.response.forEach(league => {
            console.log(`--------------------------------`);
            console.log(`ID: ${league.league.id}`);
            console.log(`Nombre: ${league.league.name}`);
            console.log(`Tipo: ${league.league.type}`);
        });

    } catch (error) {
        console.error(error);
    }
}

buscarLigasArgentina();