// prode-backend/index.js
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
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
    getAllUsers,           
    getUserTicketsAdmin,    
    toggleTicketPayment,    
    checkPaymentStatus,
    toggleUserPayment
} = require('./footballService');

const PORT = process.env.PORT || 3000;

// ======================================================
// 1. INICIALIZACIÓN Y CONFIGURACIÓN DE CORS
// ======================================================
const app = express(); 
const server = http.createServer(app); 

// 👇 LISTA DE SITIOS PERMITIDOS (Tu Frontend en Vercel y tu Localhost)
const allowedOrigins = [
    "https://prode-walter.vercel.app", // Tu web en producción
    "http://localhost:5173",           // Tu entorno local de Vite
    "http://localhost:3000"            // Por si acaso
];

// A. Configuración CORS para Express (Rutas API)
app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como Postman o móviles) o si está en la lista
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Bloqueado por CORS:", origin);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true // Importante para cookies/sesiones si las usas
}));

app.use(express.json());

// B. Configuración CORS para Socket.IO (El Chat) - ¡SOLO UNA VEZ!
const io = new Server(server, {
    cors: { 
        origin: allowedOrigins, // Usamos la misma lista de arriba
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ======================================================
// 2. SOCKET.IO (CHAT CON PERSISTENCIA)
// ======================================================
io.on('connection', (socket) => {
    // console.log('Usuario conectado al chat'); // Opcional

    socket.on('chat_message', async (data) => {
        // data trae: { user, text, userId, type }
        
        try {
            // 1. Guardar en Base de Datos
            const conn = await db.getConnection();
            // Asegúrate de que la tabla 'messages' exista (en el script SQL la llamamos 'messages', no 'chat_messages')
            // Voy a usar 'messages' que es el nombre estándar del script que te pasé.
            // Si tu tabla se llama 'chat_messages', cambia 'messages' por 'chat_messages' aquí abajo.
            await conn.execute(
                'INSERT INTO messages (user_id, content) VALUES (?, ?)',
                [data.userId, data.text]
            );
            conn.release();

            // 2. Emitir a todos (agregamos timestamp del servidor)
            io.emit('chat_message', { 
                ...data, 
                timestamp: new Date().toISOString() 
            });

        } catch (error) {
            console.error("Error guardando mensaje de chat:", error);
        }
    });
});

// ======================================================
// 3. RUTAS DE LA API
// ======================================================

// --- NUEVA RUTA: OBTENER HISTORIAL DE CHAT (48 HS) ---
app.get('/api/chat/history', authenticateToken, async (req, res) => {
    try {
        // Ajustado a la tabla 'messages' del script SQL nuevo
        const [rows] = await db.execute(`
            SELECT 
                m.user_id as userId, 
                u.username as user, 
                m.content as text, 
                'text' as type, 
                m.created_at as timestamp
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.created_at >= NOW() - INTERVAL 48 HOUR
            ORDER BY m.created_at ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error historial chat:", error);
        res.status(500).json([]);
    }
});

// --- AUTENTICACIÓN ---
app.post('/api/auth/login', async (req, res) => {
    const result = await loginUser(req.body.email, req.body.password); 
    res.status(result.success ? 200 : 401).json(result);
});

app.post('/api/auth/register', async (req, res) => {
    const result = await registerUser(req.body.username, req.body.email, req.body.password); 
    res.status(result.success ? 201 : 400).json(result);
});

app.post('/api/auth/google', async (req, res) => {
    const result = await googleLogin(req.body.token);
    res.status(result.success ? 200 : 400).json(result);
});

// --- PRONÓSTICOS Y BOLETAS ---

app.get('/api/predictions/my-predictions', authenticateToken, async (req, res) => {
    const { ticketId } = req.query;
    if (!ticketId) return res.status(400).json({ message: "Falta el parámetro ticketId" });
    const pronosticos = await obtenerPronosticosPorTicket(ticketId);
    res.json(pronosticos);
});

app.post('/api/predictions/submit', authenticateToken, async (req, res) => {
    const result = await submitPrediction(req.user.id, req.body.matchId, req.body.result);
    res.status(result.success ? 201 : 400).json(result);
});

app.post('/api/predictions/submit-bulk', authenticateToken, async (req, res) => {
    const { predictions, ticketId } = req.body;
    if (!ticketId) return res.status(400).json({ message: "Falta ticketId" });

    // VERIFICACIÓN DE PAGO (POR BOLETA)
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') {
        const estaPagado = await checkPaymentStatus(ticketId);
        if (!estaPagado) {
            return res.status(403).json({ 
                message: "⛔ PAGO REQUERIDO: Esta boleta no está habilitada por el administrador." 
            });
        }
    }

    const result = await submitBulkPredictions(req.user.id, ticketId, predictions);
    res.status(result.success ? 201 : 500).json(result);
});

app.get('/api/tickets', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { round } = req.query; 
    if (!round) return res.status(400).json({ message: "Falta el parámetro round" });
    const tickets = await obtenerTicketsUsuario(userId, round);
    res.json(tickets);
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { ticketName, round } = req.body;
    if (!ticketName || !round) return res.status(400).json({ message: "Faltan datos" });

    const resultado = await crearNuevoTicket(userId, round, ticketName);
    if (resultado.success) {
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

// --- ADMIN ---

app.post('/api/admin/matches/bulk-create', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const result = await crearPartidos(req.body.matches); 
    res.status(result.success ? 201 : 500).json(result);
});

app.put('/api/admin/matches/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    if (!req.params.id) return res.status(400).json({message: "Falta ID"});
    const result = await updateMatch(req.params.id, req.body.home_score, req.body.away_score, req.body.status, req.body.match_date);
    res.status(result.success ? 200 : 500).json(result);
});

app.delete('/api/admin/matches', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    try {
        const conn = await db.getConnection();
        await conn.execute('DELETE FROM predictions');
        await conn.execute('DELETE FROM matches');
        await conn.execute('DELETE FROM tickets'); 
        await conn.execute('ALTER TABLE predictions AUTO_INCREMENT = 1');
        await conn.execute('ALTER TABLE matches AUTO_INCREMENT = 1');
        await conn.execute('ALTER TABLE tickets AUTO_INCREMENT = 1');
        conn.release();
        res.json({ success: true, message: 'Base de datos limpiada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al borrar.' });
    }
});

app.get('/api/admin/predictions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const predictions = await obtenerTodosLosPronosticos();
    res.json(predictions);
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const users = await getAllUsers();
    res.json(users);
});

app.put('/api/admin/users/:id/payment', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const result = await toggleUserPayment(req.params.id);
    res.status(result.success ? 200 : 500).json(result);
});

// NUEVO: Obtener tickets de un usuario
app.get('/api/admin/users/:userId/tickets', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const tickets = await getUserTicketsAdmin(req.params.userId);
    res.json(tickets);
});

// NUEVO: Toggle pago de ticket
app.post('/api/admin/tickets/payment', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Owner' && req.user.role !== 'Dev') return res.sendStatus(403);
    const { ticketId } = req.body;
    const result = await toggleTicketPayment(ticketId);
    res.json(result);
});

// --- DATOS PÚBLICOS ---

app.get('/api/partidos', authenticateToken, async (req, res) => {
    const userId = req.user ? req.user.id : null; 
    if (!userId) return res.sendStatus(403);
    const partidos = await obtenerPartidos(userId); 
    res.json(partidos || []); 
});

// ACTUALIZADO: Verifica pago por ticketId
app.get('/api/payments/status', authenticateToken, async (req, res) => {
    const { ticketId } = req.query; 
    if (req.user.role === 'Owner' || req.user.role === 'Dev') {
        return res.json({ isPaid: true, isVip: true });
    }
    if (!ticketId) return res.json({ isPaid: false }); 
    const pagado = await checkPaymentStatus(ticketId);
    res.json({ isPaid: pagado, isVip: false });
});

app.get('/api/ranking', authenticateToken, async (req, res) => {
    const { round } = req.query; 
    const result = await obtenerRanking(round);
    res.json(result.success ? result.ranking : []);
});

// --- ARRANQUE ---
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});