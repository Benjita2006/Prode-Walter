// src/data/teams.js

export const TEAMS_DB = {
    // --- LOS 5 GRANDES ---
    "River Plate": "/escudos/river.png",
    "River": "/escudos/river.png",
    "Boca Juniors": "/escudos/boca.png",
    "Boca": "/escudos/boca.png",
    "Racing Club": "/escudos/racing.png",
    "Racing": "/escudos/racing.png",
    "Independiente": "/escudos/independiente.png",
    "San Lorenzo": "/escudos/san_lorenzo.png",

    // --- EQUIPOS CLAVE (Tus conflictos anteriores) ---
    "Gimnasia L.P.": "/escudos/gimnasia_lp.png",
    "Gimnasia": "/escudos/gimnasia_lp.png", // Por defecto LP
    "Gimnasia (Mza.)": "/escudos/gimnasia_mendoza.png", // El de Mendoza
    
    "Estudiantes L.P.": "/escudos/estudiantes_lp.png",
    "Estudiantes": "/escudos/estudiantes_lp.png", // Por defecto LP
    "Estudiantes (RC)": "/escudos/estudiantes_rc.png", // El de Río Cuarto
    "Estudiantes (Río Cuarto)": "/escudos/estudiantes_rc.png",

    // --- RESTO DE PRIMERA / ZONA A y B ---
    "Huracán": "/escudos/huracan.png",
    "Vélez Sarsfield": "/escudos/velez.png",
    "Vélez": "/escudos/velez.png",
    "Defensa y Justicia": "/escudos/defensa.png",
    "Defensa": "/escudos/defensa.png",
    "Lanús": "/escudos/lanus.png",
    "Banfield": "/escudos/banfield.png",
    "Tigre": "/escudos/tigre.png",
    "Talleres": "/escudos/talleres.png",
    "Belgrano": "/escudos/belgrano.png",
    "Instituto": "/escudos/instituto.png",
    "Rosario Central": "/escudos/rosario_central.png",
    "Newell's Old Boys": "/escudos/newells.png",
    "Newell's": "/escudos/newells.png",
    "Argentinos Juniors": "/escudos/argentinos.png",
    "Argentinos": "/escudos/argentinos.png",
    "Platense": "/escudos/platense.png",
    "Godoy Cruz": "/escudos/godoy_cruz.png",
    "Independiente Rivadavia": "/escudos/independiente_rivadavia.png",
    "Central Córdoba (SdE)": "/escudos/central_cordoba.png",
    "Central Córdoba": "/escudos/central_cordoba.png",
    "Atlético Tucumán": "/escudos/atletico_tucuman.png",
    "Unión": "/escudos/union.png",
    "Sarmiento": "/escudos/sarmiento.png",
    "Barracas Central": "/escudos/barracas.png",
    "Deportivo Riestra": "/escudos/riestra.png",
    "Riestra": "/escudos/riestra.png",
    "Aldosivi": "/escudos/aldosivi.png"
};

// Función auxiliar para buscar (insensible a mayúsculas/minúsculas)
export const buscarLogo = (nombre) => {
    if (!nombre) return "/escudos/default.png"; // Logo por defecto si no encuentra nada
    const nombreNormalizado = nombre.trim().toLowerCase();
    
    // 1. Búsqueda exacta
    const matchExacto = Object.keys(TEAMS_DB).find(key => 
        key.toLowerCase() === nombreNormalizado
    );
    if (matchExacto) return TEAMS_DB[matchExacto];

    // 2. Búsqueda parcial (contiene)
    const matchParcial = Object.keys(TEAMS_DB).find(key => 
        key.toLowerCase().includes(nombreNormalizado)
    );
    return matchParcial ? TEAMS_DB[matchParcial] : "/escudos/default.png";
};