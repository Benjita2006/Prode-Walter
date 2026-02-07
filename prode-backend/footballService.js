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
    if (!userId || !matchId || !result) {
        return { success: false, message: 'Faltan datos.' };
    }

    try {
        const [match] = await db.execute('SELECT match_date FROM matches WHERE id = ?', [matchId]);
        if (match.length > 0) {
            const now = new Date();
            const matchDate = new Date(match[0].match_date);
            if (now >= matchDate) {
                return { success: false, message: 'El partido ya comenzó.' };
            }
        }

        const [existing] = await db.execute(
            'SELECT id FROM predictions WHERE user_id = ? AND match_id = ?',
            [userId, matchId]
        );

        if (existing.length > 0) {
            await db.execute(
                'UPDATE predictions SET prediction_result = ? WHERE id = ?',
                [result, existing[0].id]
            );
            return { success: true, message: 'Pronóstico actualizado.' };
        }

        const [resultDb] = await db.execute(
            'INSERT INTO predictions (user_id, match_id, prediction_result) VALUES (?, ?, ?)',
            [userId, matchId, result]
        );

        return { success: true, message: 'Pronóstico guardado.', id: resultDb.insertId };

    } catch (error) {
        console.error("❌ ERROR guardando pronóstico:", error);
        return { success: false, message: 'Error interno.' };
    }
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

// --- 5. RANKING: Calcular puntos en tiempo real 🏆 ---
async function obtenerRanking() {
    try {
        const sql = `
            SELECT 
                u.username,
                COALESCE(SUM(
                    CASE 
                        WHEN m.status != 'FT' THEN 0
                        WHEN m.home_score > m.away_score AND p.prediction_result = 'HOME' THEN 1
                        WHEN m.away_score > m.home_score AND p.prediction_result = 'AWAY' THEN 1
                        WHEN m.home_score = m.away_score AND p.prediction_result = 'DRAW' THEN 1
                        ELSE 0
                    END
                ), 0) as points
            FROM users u
            LEFT JOIN predictions p ON u.id = p.user_id
            LEFT JOIN matches m ON p.match_id = m.id
            GROUP BY u.id, u.username
            ORDER BY points DESC, u.username ASC
        `;

        const [rows] = await db.execute(sql);
        return { success: true, ranking: rows };

    } catch (error) {
        console.error("Error calculando ranking:", error);
        return { success: false, message: error.message };
    }
}

// --- NUEVA FUNCIÓN: Obtener o Crear Boletas ---
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
        const [res] = await db.execute(
            'INSERT INTO tickets (user_id, round_name, ticket_name) VALUES (?, ?, ?)',
            [userId, roundName, ticketName]
        );
        return { success: true, id: res.insertId };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// --- ACTUALIZACIÓN: Guardado Masivo con Bloqueo de Horario ---
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

            // 🛡️ BLOQUEO DE SEGURIDAD: Consultar hora del partido
            const [mRows] = await conn.execute('SELECT match_date FROM matches WHERE id = ?', [matchId]);
            if (mRows.length > 0) {
                const matchDate = new Date(mRows[0].match_date);
                if (now >= matchDate) {
                    console.log(`🚫 Intento de hack: Partido ${matchId} ya empezó.`);
                    continue; // Saltamos este partido, no se guarda
                }
            }

            // Guardar o Actualizar vinculado al ticketId
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
                    'INSERT INTO predictions (ticket_id, match_id, prediction_result) VALUES (?, ?, ?)',
                    [ticketId, matchId, result]
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

// --- 7. EDICIÓN: Actualizar Partido y Recalcular Puntos (Admin) ---
// 👇 ESTA ES LA FUNCIÓN QUE TE FALTABA O ESTABA MAL UBICADA
async function updateMatch(matchId, home_score, away_score, status, match_date) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Sanitizar Goles
        const hScore = (home_score === '' || home_score === null || home_score === undefined) ? null : parseInt(home_score);
        const aScore = (away_score === '' || away_score === null || away_score === undefined) ? null : parseInt(away_score);

        // 2. 🛠️ CORRECCIÓN DE FECHA: Convertir ISO (T/Z) a MySQL (Espacio)
        let fechaSQL = match_date;
        if (match_date) {
            // Si viene con formato javascript completo, lo limpiamos
            fechaSQL = new Date(match_date).toISOString().slice(0, 19).replace('T', ' ');
        }

        // 3. Actualizar la tabla matches
        await conn.execute(
            `UPDATE matches 
             SET home_score = ?, away_score = ?, status = ?, match_date = ? 
             WHERE id = ?`,
            [hScore, aScore, status, fechaSQL, matchId]
        );

        // 4. RECALCULAR PUNTOS (Solo si el partido se marca como 'FT')
        if (status === 'FT') {
            console.log(`🔄 Recalculando puntos para el partido ID: ${matchId}...`);
            
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
        } else {
            // Si deja de ser FT, quitamos los puntos
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

// ==========================================
// EXPORTACIONES AL FINAL DEL ARCHIVO
// ==========================================
module.exports = { 
    obtenerPartidos, 
    crearPartidos, 
    submitPrediction, 
    obtenerTodosLosPronosticos, 
    obtenerRanking,
    submitBulkPredictions,
    updateMatch // 👈 AHORA SÍ FUNCIONARÁ PORQUE LA FUNCIÓN updateMatch ESTÁ DEFINIDA ARRIBA
};