// prode-backend/index.js (VERSIÓN LIMPIEZA FINAL)
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
const axios = require('axios');
require('dotenv').config(); 

// --- IMPORTACIONES LOCALES ---
const authenticateToken = require('./authMiddleware'); 
const db = require('./db'); 
const { registerUser, loginUser } = require('./authController');

const { 
    obtenerPartidos, 
    crearPartidos, 
    submitPrediction, 
    obtenerTodosLosPronosticos, 
    obtenerRanking 
} = require('./footballService'); 

const { obtenerPartidosDeAPI } = require('./apiFootballService');

// 1. PUERTO DINÁMICO (CRÍTICO PARA RAILWAY)
const PORT = process.env.PORT || 3000;

// ======================================================
// 1. INICIALIZACIÓN DEL SERVIDOR
// ======================================================
const app = express(); 
const server = http.createServer(app); 

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// ======================================================
// 2. LÓGICA DEL CHAT (SOCKET.IO)
// ======================================================
io.on('connection', (socket) => {
    console.log('Un usuario se conectó al chat 💬');
    socket.on('chat_message', (data) => {
        io.emit('chat_message', data);
    });
    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// ======================================================
// 3. RUTAS DE LA API (HTTP)
// ======================================================

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const loginResult = await loginUser(email, password); 
    if (loginResult.success) res.status(200).json(loginResult); 
    else res.status(401).json(loginResult);
});

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    const registerResult = await registerUser(username, email, password); 
    if (registerResult.success) res.status(201).json(registerResult);
    else res.status(400).json(registerResult);
});

// --- RUTA: REGISTRAR PRONÓSTICO (USUARIO) ---
app.post('/api/predictions/submit', authenticateToken, async (req, res) => {
    const userId = req.user.id; 
    const { matchId, result } = req.body;
    const predictionResult = await submitPrediction(userId, matchId,result);
    if (predictionResult.success) res.status(201).json(predictionResult);
    else res.status(400).json(predictionResult);
});


// --- RUTAS DE ADMINISTRACIÓN (SOLO PARTIDOS Y API) ---

// RUTA 1: CREAR PARTIDOS MANUALMENTE
app.post('/api/admin/matches/bulk-create', authenticateToken, async (req, res) => {
    const matches = req.body.matches; 
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return res.status(400).json({ success: false, message: 'Se esperaba un array de partidos válido.' });
    }
    const creationResult = await crearPartidos(matches); 
    if (creationResult.success) res.status(201).json({ success: true, message: `Se publicaron ${creationResult.count} partidos.`, count: creationResult.count });
    else res.status(500).json(creationResult);
});

// RUTA 2: SINCRONIZAR PARTIDOS (POST)
app.post('/api/admin/sync-matches', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }

    const LEAGUE_ID = 128; 
    const SEASON = 2025;   
    console.log(`🔄 Iniciando sync para Liga ${LEAGUE_ID}, Temp ${SEASON}...`);
    
    const apiMatches = await obtenerPartidosDeAPI(LEAGUE_ID, SEASON);

    if (!apiMatches || apiMatches.length === 0) {
        return res.status(500).json({ message: 'La API no devolvió partidos. Verifica la temporada.' });
    }

    let creados = 0;
    let actualizados = 0;
    let conn; 

    try {
        // 2. Obtener datos de la API
        const apiMatches = await obtenerPartidosDeAPI(LEAGUE_ID, SEASON);

        if (!apiMatches || apiMatches.length === 0) {
            // No es un error 500, es solo que no hay datos.
            return res.status(404).json({ message: `No se encontraron partidos para la temporada ${SEASON}. Intenta con 2025.` });
        }

        let creados = 0;
        let actualizados = 0;
        const conn = await db.getConnection(); // Obtener conexión del pool

        try {
            await conn.beginTransaction(); // Iniciar transacción segura

            for (const data of apiMatches) {
                // 3. Extracción Segura de Datos (Evita crashes por nulls)
                const m = data.fixture;
                const t = data.teams; 
                const g = data.goals;

                if (!m || !t || !m.date) continue; // Saltar si el partido está roto

                // Formatear fecha para MySQL (YYYY-MM-DD HH:MM:SS)
                const matchDate = new Date(m.date).toISOString().slice(0, 19).replace('T', ' ');

                // 4. Verificar si ya existe
                const [rows] = await conn.execute('SELECT id FROM matches WHERE api_id = ?', [m.id]);

                // Valores seguros (si goles es null, ponemos null)
                const golesLocal = g.home !== null ? g.home : null;
                const golesVisita = g.away !== null ? g.away : null;

                if (rows.length === 0) {
                    // INSERTAR NUEVO
                    await conn.execute(
                        `INSERT INTO matches 
                        (api_id, home_team, home_logo, away_team, away_logo, match_date, status, home_score, away_score, is_active) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                        [m.id, t.home.name, t.home.logo, t.away.name, t.away.logo, matchDate, m.status.short, golesLocal, golesVisita]
                    );
                    creados++;
                } else {
                    // ACTUALIZAR EXISTENTE
                    await conn.execute(
                        `UPDATE matches 
                        SET match_date = ?, status = ?, home_score = ?, away_score = ?, home_logo = ?, away_logo = ? 
                        WHERE api_id = ?`,
                        [matchDate, m.status.short, golesLocal, golesVisita, t.home.logo, t.away.logo, m.id]
                    );
                    actualizados++;
                }
            }

            await conn.commit(); // Confirmar cambios
            conn.release(); // Liberar conexión
            
            console.log(`✅ Sync terminada: ${creados} nuevos, ${actualizados} actualizados.`);
            res.json({ success: true, message: `Sincronización Exitosa: ${creados} nuevos, ${actualizados} actualizados.` });

        } catch (dbError) {
            // Error dentro de la transacción
            await conn.rollback();
            conn.release();
            console.error("❌ Error de Base de Datos durante Sync:", dbError);
            // IMPORTANTE: Devolvemos el mensaje exacto del error para que sepas qué columna falla
            res.status(500).json({ message: `Error SQL: ${dbError.sqlMessage || dbError.message}` });
        }

    } catch (apiError) {
        // Error conectando a la API externa
        console.error("❌ Error General en Sync:", apiError);
        res.status(500).json({ message: 'Error conectando con la API de Fútbol.' });
    }
});

// RUTA 3: BORRAR PARTIDOS (DELETE)
app.delete('/api/admin/matches', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    try {
        const conn = await db.getConnection();
        await conn.execute('DELETE FROM predictions');
        await conn.execute('DELETE FROM matches');
        await conn.execute('ALTER TABLE predictions AUTO_INCREMENT = 1');
        await conn.execute('ALTER TABLE matches AUTO_INCREMENT = 1');
        conn.release();
        res.json({ success: true, message: 'Se eliminaron todos los partidos y pronósticos correctamente.' });
    } catch (error) {
        console.error("Error al borrar datos:", error);
        res.status(500).json({ message: 'Error interno al intentar borrar.' });
    }
});


// --- LECTURA DE DATOS ---

// RUTA 4: VER TODOS LOS PRONÓSTICOS (ADMIN DASHBOARD)
app.get('/api/admin/predictions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    const predictions = await obtenerTodosLosPronosticos();
    res.json(predictions);
});

// RUTA 5: VER PARTIDOS (USUARIO)
app.get('/api/partidos', authenticateToken, async (req, res) => {
    const userId = req.user && req.user.id ? req.user.id : null; 
    if (userId === null) return res.status(403).json({ success: false, message: 'ID de usuario faltante.' });
    
    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) return res.status(403).json({ success: false, message: 'ID inválido.' });
    
    const partidos = await obtenerPartidos(numericUserId); 
    if (partidos.length > 0) res.json(partidos);
    else res.json([]); 
});

// RUTA 6: RANKING
app.get('/api/ranking', authenticateToken, async (req, res) => {
    const result = await obtenerRanking();
    if (result.success) res.json(result.ranking);
    else res.status(500).json({ message: 'Error al obtener ranking' });
});

// RUTA 7: BUSCAR LIGAS (AUXILIAR)
app.get('/api/buscar-ligas', async (req, res) => {
    try {
        const API_KEY = process.env.API_FOOTBALL_KEY || 'TU_CLAVE_AQUI_DIRECTA'; 
        const response = await axios.get('https://v3.football.api-sports.io/leagues', {
            params: { country: 'Argentina' }, 
            headers: { 'x-apisports-key': API_KEY }
        });
        const resultados = response.data.response.map(item => ({
            id: item.league.id,
            nombre: item.league.name,
            tipo: item.league.type,
            ultimo_anio_disponible: item.seasons[item.seasons.length - 1].year
        }));
        const ligasRecientes = resultados.filter(l => l.ultimo_anio_disponible >= 2024);
        res.json(ligasRecientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ======================================================
// 4. ARRANCAR EL SERVIDOR
// ======================================================
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});