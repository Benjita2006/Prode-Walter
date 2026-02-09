// prode-backend/footballService.js
const db = require('./db');

// --- 1. LECTURA DE PARTIDOS (Para el Usuario) ---
async function obtenerPartidos(userId) { 
    try {
        const sql = `
            SELECT 
                m.id, m.home_team, m.home_logo, m.away_team, m.away_logo, 
                m.match_date, m.status, m.round, 
                m.home_score, m.away_score,
                p.prediction_result
            FROM matches m
            LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = ?
            WHERE m.is_active = TRUE
            AND m.status NOT IN ('CANC') 
            ORDER BY m.match_date ASC
        `;

        const [rows] = await db.execute(sql, [userId]); 

        const datosLimpios = rows.map(row => ({
            id: row.id,
            local: row.home_team,
            logoLocal: row.home_logo,
            visitante: row.away_team,
            logoVisitante: row.away_logo,
            fecha: row.match_date, 
            status: row.status,
            round: row.round,
            home_score: row.home_score, 
            away_score: row.away_score,
            miPronostico: row.prediction_result, 
            yaJugo: row.prediction_result !== null 
        }));
        
        return datosLimpios;

    } catch (error) {
        console.error("❌ ERROR al consultar partidos:", error);
        return []; 
    }
}

// --- 2. ESCRITURA: Crear MÚLTIPLES partidos (Admin) ---
async function crearPartidos(matches) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        let count = 0;

        for (const m of matches) {
            const fakeApiId = -1 * (Date.now() + Math.floor(Math.random() * 1000));
            const logoL = m.localLogo || 'https://media.api-sports.io/football/teams/default.png';
            const logoV = m.visitanteLogo || 'https://media.api-sports.io/football/teams/default.png';

            await conn.execute(
                `INSERT INTO matches 
                (api_id, home_team, home_logo, away_team, away_logo, match_date, status, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, 'NS', 1)`,
                [fakeApiId, m.local, logoL, m.visitante, logoV, m.fecha]
            );
            count++;
        }

        await conn.commit();
        return { success: true, count };
    } catch (error) {
        await conn.rollback();
        console.error("Error creando partidos manuales:", error);
        return { success: false, message: error.message };
    } finally {
        conn.release();
    }
}

// --- 3. ESCRITURA: Enviar Pronóstico (Usuario) ---
async function submitPrediction(userId, matchId, result) { 
    return { success: false, message: 'Usar submitBulkPredictions' };
}

// --- 4. LECTURA: Todos los Pronósticos (Admin Dashboard) ---
async function obtenerTodosLosPronosticos() {
    try {
        const sql = `
            SELECT 
                p.id, u.username,
                m.home_team, m.home_logo,   
                m.away_team, m.away_logo,   
                m.match_date, m.round,
                p.prediction_result, p.points,
                m.status, m.home_score, m.away_score
            FROM predictions p
            JOIN users u ON p.user_id = u.id
            JOIN matches m ON p.match_id = m.id
            ORDER BY m.match_date DESC, u.username ASC
        `;
        const [rows] = await db.execute(sql);
        return rows;
    } catch (error) {
        console.error("Error obteniendo pronósticos admin:", error);
        return [];
    }
}

// --- 5. RANKING: Calcular puntos (General o por Fecha) 🏆 ---
async function obtenerRanking(round) {
    try {
        let sql;
        const params = [];

        if (round && round !== 'General') {
            // RANKING POR FECHA (Boletas)
            sql = `
                SELECT 
                    u.username,
                    t.ticket_name, 
                    COALESCE(SUM(p.points), 0) as points
                FROM users u
                JOIN tickets t ON u.id = t.user_id
                LEFT JOIN predictions p ON t.id = p.ticket_id
                WHERE t.round_name = ?
                GROUP BY t.id, u.username, t.ticket_name
                ORDER BY points DESC, u.username ASC
            `;
            params.push(round);
        } else {
            // RANKING GENERAL (Suma total)
            sql = `
                SELECT 
                    u.username,
                    'Acumulado' as ticket_name,
                    COALESCE(SUM(p.points), 0) as points
                FROM users u
                LEFT JOIN tickets t ON u.id = t.user_id
                LEFT JOIN predictions p ON t.id = p.ticket_id
                GROUP BY u.id, u.username
                ORDER BY points DESC, u.username ASC
            `;
        }

        const [rows] = await db.execute(sql, params);
        return { success: true, ranking: rows };

    } catch (error) {
        console.error("Error calculando ranking:", error);
        return { success: false, message: error.message };
    }
}

// --- GESTIÓN DE TICKETS (USUARIO) ---

async function obtenerTicketsUsuario(userId, roundName) {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM tickets WHERE user_id = ? AND round_name = ?',
            [userId, roundName]
        );
        return rows;
    } catch (error) {
        console.error("Error tickets:", error);
        return [];
    }
}

async function crearNuevoTicket(userId, roundName, ticketName) {
    try {
        // CAMBIO AQUÍ: is_paid pasa de 0 a 1 (Nace habilitada)
        const [res] = await db.execute(
            'INSERT INTO tickets (user_id, round_name, ticket_name, is_paid) VALUES (?, ?, ?, 1)',
            [userId, roundName, ticketName]
        );
        return { success: true, id: res.insertId };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function obtenerPronosticosPorTicket(ticketId) {
    try {
        const [rows] = await db.execute(
            'SELECT match_id, prediction_result as prediction FROM predictions WHERE ticket_id = ?',
            [ticketId]
        );
        return rows;
    } catch (error) {
        console.error("Error obteniendo pronósticos del ticket:", error);
        return [];
    }
}

// --- ACTUALIZACIÓN: Guardado Masivo ---
async function submitBulkPredictions(userId, ticketId, predictionsArray) {
    if (!ticketId || !predictionsArray || predictionsArray.length === 0) {
        return { success: false, message: 'Datos incompletos.' };
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const now = new Date();

        for (const pred of predictionsArray) {
            const { matchId, result } = pred;

            // Bloqueo de horario
            const [mRows] = await conn.execute('SELECT match_date FROM matches WHERE id = ?', [matchId]);
            if (mRows.length > 0) {
                const matchDate = new Date(mRows[0].match_date);
                if (now >= matchDate) {
                    continue; 
                }
            }

            // Upsert
            const [existing] = await conn.execute(
                'SELECT id FROM predictions WHERE ticket_id = ? AND match_id = ?',
                [ticketId, matchId]
            );

            if (existing.length > 0) {
                await conn.execute(
                    'UPDATE predictions SET prediction_result = ? WHERE id = ?',
                    [result, existing[0].id]
                );
            } else {
                await conn.execute(
                    'INSERT INTO predictions (ticket_id, user_id, match_id, prediction_result) VALUES (?, ?, ?, ?)',
                    [ticketId, userId, matchId, result]
                );
            }
        }
        await conn.commit();
        return { success: true };
    } catch (error) {
        await conn.rollback();
        return { success: false, message: error.message };
    } finally {
        conn.release();
    }
}

// --- EDICIÓN Y RECALCULO ---
async function updateMatch(matchId, home_score, away_score, status, match_date) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const hScore = (home_score === '' || home_score === null) ? null : parseInt(home_score);
        const aScore = (away_score === '' || away_score === null) ? null : parseInt(away_score);
        
        let fechaSQL = match_date;
        if (match_date) {
            fechaSQL = new Date(match_date).toISOString().slice(0, 19).replace('T', ' ');
        }

        await conn.execute(
            `UPDATE matches SET home_score = ?, away_score = ?, status = ?, match_date = ? WHERE id = ?`,
            [hScore, aScore, status, fechaSQL, matchId]
        );

        if (status === 'FT') {
            // Recalcular puntos individuales
            const sqlRecalculate = `
                UPDATE predictions p
                JOIN matches m ON p.match_id = m.id
                SET p.points = (
                    CASE 
                        WHEN m.status != 'FT' THEN 0
                        WHEN m.home_score > m.away_score AND p.prediction_result = 'HOME' THEN 1
                        WHEN m.away_score > m.home_score AND p.prediction_result = 'AWAY' THEN 1
                        WHEN m.home_score = m.away_score AND p.prediction_result = 'DRAW' THEN 1
                        ELSE 0
                    END
                )
                WHERE p.match_id = ?
            `;
            await conn.execute(sqlRecalculate, [matchId]);

            // ACTUALIZAR PUNTOS TOTALES DEL TICKET
            const sqlUpdateTickets = `
               UPDATE tickets t
               JOIN predictions p ON p.ticket_id = t.id
               SET t.points = (
                   SELECT COALESCE(SUM(sub_p.points), 0)
                   FROM predictions sub_p
                   WHERE sub_p.ticket_id = t.id
               )
               WHERE p.match_id = ?
            `;
             await conn.execute(sqlUpdateTickets, [matchId]);

        } else {
            await conn.execute('UPDATE predictions SET points = 0 WHERE match_id = ?', [matchId]);
        }

        await conn.commit();
        return { success: true, message: 'Partido actualizado.' };

    } catch (error) {
        await conn.rollback();
        console.error("Error updateMatch:", error);
        return { success: false, message: error.message };
    } finally {
        conn.release();
    }
}

// --- ADMIN: OBTENER USUARIOS ---
async function getAllUsers() {
    try {
        const [users] = await db.execute('SELECT id, username, email, role FROM users ORDER BY id DESC');
        return users;
    } catch (error) {
        return [];
    }
}

// --- GESTIÓN DE PAGOS ---
async function toggleUserPayment(userId) {
    try {
        const [rows] = await db.execute('SELECT is_paid FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return { success: false, message: 'Usuario no encontrado' };
        const nuevoEstado = !rows[0].is_paid;
        await db.execute('UPDATE users SET is_paid = ? WHERE id = ?', [nuevoEstado, userId]);
        return { success: true, newStatus: nuevoEstado };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// --- NUEVO: GESTIÓN DE TICKETS PARA ADMIN ---

// 1. Obtener todas las boletas de un usuario
async function getUserTicketsAdmin(userId) {
    const [rows] = await db.execute(
        'SELECT id, ticket_name, round_name, points, is_paid FROM tickets WHERE user_id = ? ORDER BY round_name DESC, id ASC', 
        [userId]
    );
    return rows;
}

// 2. Alternar pago de un TICKET específico
async function toggleTicketPayment(ticketId) {
    await db.execute('UPDATE tickets SET is_paid = NOT is_paid WHERE id = ?', [ticketId]);
    const [rows] = await db.execute('SELECT is_paid FROM tickets WHERE id = ?', [ticketId]);
    return { success: true, is_paid: rows[0].is_paid };
}

// 3. Verificar si puede guardar (Ahora mira el ticket)
async function checkPaymentStatus(ticketId) {
    const [rows] = await db.execute('SELECT is_paid FROM tickets WHERE id = ?', [ticketId]);
    if (rows.length === 0) return false; 
    return rows[0].is_paid === 1; 
}

// EXPORTS
module.exports = { 
    obtenerPartidos, 
    crearPartidos, 
    submitPrediction, 
    obtenerTodosLosPronosticos, 
    obtenerRanking,
    submitBulkPredictions,
    updateMatch,
    obtenerTicketsUsuario, 
    crearNuevoTicket,
    obtenerPronosticosPorTicket,
    getAllUsers,
    getUserTicketsAdmin,      // NUEVO
    toggleTicketPayment,      // NUEVO
    checkPaymentStatus,       // ACTUALIZADO
    toggleUserPayment,
};