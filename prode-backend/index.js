// prode-backend/index.js (VERSIÓN CORREGIDA Y DEFINITIVA)
const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Importar http
const { Server } = require("socket.io"); // 2. Importar socket
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
    obtenerTodosLosUsuarios,
    obtenerPronosticosDeUsuario,
    obtenerRanking 
} = require('./footballService'); 

const { obtenerPartidosDeAPI } = require('./apiFootballService');

const PORT = 3000;

// ======================================================
// 1. INICIALIZACIÓN DEL SERVIDOR (ORDEN CORRECTO)
// ======================================================

// A) Primero creamos la App de Express
const app = express(); 

// B) Creamos el servidor HTTP pasándole la App
const server = http.createServer(app); 

// C) Configuramos Socket.io sobre ese servidor
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// ======================================================
// 2. LÓGICA DEL CHAT (SOCKET.IO)
// ======================================================
io.on('connection', (socket) => {
    console.log('Un usuario se conectó al chat 💬');

    // Escuchar cuando alguien envía un mensaje
    socket.on('chat_message', (data) => {
        // Reenviar este mensaje a TODOS los conectados
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


// --- RUTAS DE ADMINISTRACIÓN ---

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
    // 1. Verificación de Rol
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }

    const LEAGUE_ID = 128; 
    const SEASON = 2026;   

    console.log(`🔄 Iniciando sync para Liga ${LEAGUE_ID}, Temp ${SEASON}...`);
    
    const apiMatches = await obtenerPartidosDeAPI(LEAGUE_ID, SEASON);

    if (!apiMatches || apiMatches.length === 0) {
        return res.status(500).json({ message: 'La API no devolvió partidos. Verifica la temporada.' });
    }

    let creados = 0;
    let actualizados = 0;
    let conn; // Declaramos conn afuera para usarlo en el catch

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        for (const data of apiMatches) {
            const m = data.fixture;
            const t = data.teams; 
            const g = data.goals;

            // Buscamos si ya existe por api_id
            const [rows] = await conn.execute('SELECT id FROM matches WHERE api_id = ?', [m.id]);

            // Formato de fecha MySQL
            const matchDate = new Date(m.date).toISOString().slice(0, 19).replace('T', ' ');

            if (rows.length === 0) {
                // INSERTAR NUEVO
                await conn.execute(
                    `INSERT INTO matches (api_id, home_team, home_logo, away_team, away_logo, match_date, status, home_score, away_score, is_active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [
                        m.id, 
                        t.home.name, t.home.logo, 
                        t.away.name, t.away.logo, 
                        matchDate, m.status.short, g.home, g.away
                    ]
                );
                creados++;
            } else {
                // ACTUALIZAR EXISTENTE
                await conn.execute(
                    `UPDATE matches 
                     SET match_date = ?, status = ?, home_score = ?, away_score = ?, home_logo = ?, away_logo = ?
                     WHERE api_id = ?`,
                    [
                        matchDate, m.status.short, g.home, g.away, 
                        t.home.logo, t.away.logo, 
                        m.id
                    ]
                );
                actualizados++;
            }
        }

        await conn.commit();
        conn.release();

        console.log(`✅ Sync Completada: ${creados} nuevos, ${actualizados} actualizados.`);
        res.json({ success: true, message: `Sync Exitosa: ${creados} nuevos, ${actualizados} actualizados con logos.` });

    } catch (error) {
        console.error("❌ Error en Sync:", error);
        if (conn) { await conn.rollback(); conn.release(); } 
        res.status(500).json({ message: 'Error en base de datos durante sync.' });
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

        console.log("🗑️ RESET COMPLETO: Se eliminaron partidos y pronósticos.");
        res.json({ success: true, message: 'Se eliminaron todos los partidos y pronósticos correctamente.' });

    } catch (error) {
        console.error("Error al borrar datos:", error);
        res.status(500).json({ message: 'Error interno al intentar borrar.' });
    }
});


// --- OTRAS RUTAS DE LECTURA ---

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Owner o Dev.' });
    }
    const result = await obtenerTodosLosUsuarios();
    
    if (result.success) {
        res.status(200).json(result.users);
    } else {
        res.status(500).json({ message: 'Error interno al cargar usuarios.' });
    }
});

app.get('/api/admin/users/:id/predictions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    const predictions = await obtenerPronosticosDeUsuario(req.params.id);
    res.json(predictions);
});

app.get('/api/admin/predictions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    const predictions = await obtenerTodosLosPronosticos();
    res.json(predictions);
});

// RUTA USUARIO: VER PARTIDOS
app.get('/api/partidos', authenticateToken, async (req, res) => {
    const userId = req.user && req.user.id ? req.user.id : null; 
    
    if (userId === null) return res.status(403).json({ success: false, message: 'ID de usuario faltante.' });
    
    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) return res.status(403).json({ success: false, message: 'ID inválido.' });
    
    const partidos = await obtenerPartidos(numericUserId); 

    if (partidos.length > 0) res.json(partidos);
    else res.json([]); 
});
app.get('/api/buscar-ligas', async (req, res) => {
    try {
        console.log("🔍 Escaneando todas las ligas de Argentina...");
        
        // ⚠️ REVISA QUE ESTO ESTÉ TOMANDO TU API KEY CORRECTAMENTE
        // Si no usas .env, pega tu clave 'alskdjf...' directamente entre las comillas
        const API_KEY = process.env.API_FOOTBALL_KEY || 'TU_CLAVE_AQUI_DIRECTA'; 

        const response = await axios.get('https://v3.football.api-sports.io/leagues', {
            params: { country: 'Argentina' }, // ⬅️ Quitamos 'season' para ver todo
            headers: { 'x-apisports-key': API_KEY }
        });

        // Mapeamos para que sea fácil de leer
        const resultados = response.data.response.map(item => {
            // Buscamos la temporada más reciente disponible en la API para esta liga
            const ultimaTemporada = item.seasons[item.seasons.length - 1];
            
            return {
                id: item.league.id,
                nombre: item.league.name,
                tipo: item.league.type,
                ultimo_anio_disponible: ultimaTemporada.year,
                fecha_inicio: ultimaTemporada.start,
                fecha_fin: ultimaTemporada.end,
                es_actual: ultimaTemporada.current
            };
        });

        // Filtramos para mostrarte solo las que tienen datos de 2024, 2025 o 2026
        // Así no te llenas de ligas viejas del 2010
        const ligasRecientes = resultados.filter(l => l.ultimo_anio_disponible >= 2024);

        console.log("🇦🇷 LIGAS RECIENTES ENCONTRADAS:", ligasRecientes);
        res.json(ligasRecientes);

    } catch (error) {
        console.error("❌ Error buscando ligas:", error.message);
        if (error.response) {
            console.error("Detalle API:", error.response.data);
        }
        res.status(500).json({ error: error.message });
    }
});
// ======================================================
// 4. ARRANCAR EL SERVIDOR
// ======================================================
// ⚠️ Usamos server.listen, NO app.listen
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});