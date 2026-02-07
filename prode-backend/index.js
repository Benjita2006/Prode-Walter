// prode-backend/index.js
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
const path = require('path');
require('dotenv').config(); 

// --- IMPORTACIONES LOCALES ---
const authenticateToken = require('./authMiddleware'); 
const db = require('./db'); 
const { registerUser, loginUser, googleLogin } = require('./authController');

const { 
    obtenerPartidos, 
    crearPartidos, 
    submitPrediction, 
    submitBulkPredictions,
    obtenerTodosLosPronosticos, 
    obtenerRanking,
    updateMatch,
    crearNuevoTicket, 
    obtenerTicketsUsuario,
    obtenerPronosticosPorTicket,
    toggleUserPayment,
    getUserStatus,
    getAllUsers
} = require('./footballService');

const PORT = process.env.PORT || 3000;

// ======================================================
// 1. INICIALIZACIÓN
// ======================================================
const app = express(); 
const server = http.createServer(app); 

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// ======================================================
// 2. SOCKET.IO (CHAT)
// ======================================================
io.on('connection', (socket) => {
    socket.on('chat_message', (data) => { io.emit('chat_message', data); });
});

// ======================================================
// 3. RUTAS DE LA API
// ======================================================

// --- AUTENTICACIÓN ---
app.post('/api/auth/login', async (req, res) => {
    const result = await loginUser(req.body.email, req.body.password); 
    res.status(result.success ? 200 : 401).json(result);
});

// OBTENER PRONÓSTICOS DE UNA BOLETA ESPECÍFICA
app.get('/api/predictions/my-predictions', authenticateToken, async (req, res) => {
    const { ticketId } = req.query;

    if (!ticketId) {
        return res.status(400).json({ message: "Falta el parámetro ticketId" });
    }

    const pronosticos = await obtenerPronosticosPorTicket(ticketId);
    res.json(pronosticos);
});

app.post('/api/auth/register', async (req, res) => {
    const result = await registerUser(req.body.username, req.body.email, req.body.password); 
    res.status(result.success ? 201 : 400).json(result);
});

app.post('/api/auth/google', async (req, res) => {
    const result = await googleLogin(req.body.token);
    res.status(result.success ? 200 : 400).json(result);
});

// --- PRONÓSTICOS ---
app.post('/api/predictions/submit', authenticateToken, async (req, res) => {
    const result = await submitPrediction(req.user.id, req.body.matchId, req.body.result);
    res.status(result.success ? 201 : 400).json(result);
});

app.post('/api/predictions/submit-bulk', authenticateToken, async (req, res) => {
    const { predictions, ticketId } = req.body;

    if (!ticketId) return res.status(400).json({ message: "Falta ticketId" });

    // --- VERIFICACIÓN DE PAGO ESTRICTA ---
    // Si NO es Admin, verificamos pago
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        const estaPagado = await checkPaymentStatus(ticketId);

        if (!estaPagado) {
            // Aquí cortamos la ejecución. El frontend recibirá error 403.
            return res.status(403).json({ 
                message: "⛔ PAGO REQUERIDO: No has abonado esta fecha específica." 
            });
        }
    }
    const result = await submitBulkPredictions(req.user.id, ticketId, predictions);
    res.status(result.success ? 201 : 500).json(result);
});

// --- ADMIN (GESTIÓN MANUAL) ---
app.post('/api/admin/matches/bulk-create', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const result = await crearPartidos(req.body.matches); 
    res.status(result.success ? 201 : 500).json(result);
});

// RUTA PARA EDITAR RESULTADOS (Soluciona el error de guardar)
app.put('/api/admin/matches/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    
    // Validamos que llegue el ID
    if (!req.params.id) return res.status(400).json({message: "Falta ID de partido"});

    const result = await updateMatch(
        req.params.id, 
        req.body.home_score, 
        req.body.away_score, 
        req.body.status, 
        req.body.match_date
    );

    res.status(result.success ? 200 : 500).json(result);
});

app.delete('/api/admin/matches', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    try {
        const conn = await db.getConnection();
        await conn.execute('DELETE FROM predictions');
        await conn.execute('DELETE FROM matches');
        await conn.execute('ALTER TABLE predictions AUTO_INCREMENT = 1');
        await conn.execute('ALTER TABLE matches AUTO_INCREMENT = 1');
        conn.release();
        res.json({ success: true, message: 'Base de datos limpiada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al borrar.' });
    }
});

app.get('/api/tickets', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { round } = req.query; // Ej: "Fecha 4"

    if (!round) return res.status(400).json({ message: "Falta el parámetro round" });

    const tickets = await obtenerTicketsUsuario(userId, round);
    res.json(tickets);
});
// CREAR UNA NUEVA BOLETA
app.post('/api/tickets', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { ticketName, round } = req.body;

    if (!ticketName || !round) {
        return res.status(400).json({ message: "Faltan datos (nombre o fecha)" });
    }

    const resultado = await crearNuevoTicket(userId, round, ticketName);

    if (resultado.success) {
        // Devolvemos el objeto completo de la boleta recién creada
        res.json({ 
            id: resultado.id, 
            user_id: userId, 
            ticket_name: ticketName, 
            round_name: round,
            points: 0 
        });
    } else {
        res.status(500).json({ message: "Error al crear la boleta" });
    }
});

// --- DATOS GENERALES ---
app.get('/api/admin/predictions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const predictions = await obtenerTodosLosPronosticos();
    res.json(predictions);
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    // Verificamos permisos de admin
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        return res.sendStatus(403);
    }

    const users = await getAllUsers();
    res.json(users);
});

app.post('/api/admin/users/payment', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);

    const { userId, roundName } = req.body;
    const result = await toggleRoundPayment(userId, roundName);
    res.json(result);
});

app.get('/api/partidos', authenticateToken, async (req, res) => {
    const userId = req.user ? req.user.id : null; 
    if (!userId) return res.sendStatus(403);
    const partidos = await obtenerPartidos(userId); 
    res.json(partidos || []); 
});

// ADMIN: Habilitar/Deshabilitar Pago de Usuario
app.put('/api/admin/users/:id/payment', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);

    const result = await toggleUserPayment(req.params.id);
    res.status(result.success ? 200 : 500).json(result);
});

app.get('/api/ranking', authenticateToken, async (req, res) => {
    const { round } = req.query; // Leemos el parámetro (ej: "Fecha 4")
    const result = await obtenerRanking(round);
    res.json(result.success ? result.ranking : []);
});

// --- ARRANQUE ---
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});