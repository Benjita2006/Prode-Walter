// src/data/teams.js

export const TEAMS_DB = {
    "River Plate": "https://media.api-sports.io/football/teams/435.png",
    "Boca Juniors": "https://media.api-sports.io/football/teams/436.png",
    "Racing Club": "https://media.api-sports.io/football/teams/437.png",
    "Independiente": "https://media.api-sports.io/football/teams/438.png",
    "San Lorenzo": "https://media.api-sports.io/football/teams/439.png",
    "Huracán": "https://media.api-sports.io/football/teams/440.png",
    "Vélez Sarsfield": "https://media.api-sports.io/football/teams/441.png",
    "Defensa y Justicia": "https://media.api-sports.io/football/teams/442.png",
    "Lanús": "https://media.api-sports.io/football/teams/446.png",
    "Banfield": "https://media.api-sports.io/football/teams/448.png",
    "Estudiantes L.P.": "https://media.api-sports.io/football/teams/450.png",
    "Gimnasia L.P.": "https://media.api-sports.io/football/teams/451.png",
    "Tigre": "https://media.api-sports.io/football/teams/452.png",
    "Talleres": "https://media.api-sports.io/football/teams/456.png",
    "Belgrano": "https://media.api-sports.io/football/teams/457.png",
    "Instituto": "https://media.api-sports.io/football/teams/474.png",
    "Rosario Central": "https://media.api-sports.io/football/teams/458.png",
    "Newell's Old Boys": "https://media.api-sports.io/football/teams/459.png",
    "Argentinos Juniors": "https://media.api-sports.io/football/teams/445.png",
    "Platense": "https://media.api-sports.io/football/teams/1064.png",
    "Godoy Cruz": "https://media.api-sports.io/football/teams/453.png",
    "Independiente Rivadavia": "https://media.api-sports.io/football/teams/469.png",
    "Central Córdoba (SdE)": "https://media.api-sports.io/football/teams/1066.png",
    "Atlético Tucumán": "https://media.api-sports.io/football/teams/455.png",
    "Unión": "https://media.api-sports.io/football/teams/460.png",
    "Sarmiento": "https://media.api-sports.io/football/teams/472.png",
    "Barracas Central": "https://media.api-sports.io/football/teams/2426.png",
    "Riestra": "https://media.api-sports.io/football/teams/2427.png"
};

// Función auxiliar para buscar (insensible a mayúsculas/minúsculas)
export const buscarLogo = (nombre) => {
    if (!nombre) return "";
    const nombreNormalizado = nombre.trim().toLowerCase();
    
    // Búsqueda exacta o parcial
    const match = Object.keys(TEAMS_DB).find(key => 
        key.toLowerCase() === nombreNormalizado || 
        key.toLowerCase().includes(nombreNormalizado)
    );

    return match ? TEAMS_DB[match] : "";
};