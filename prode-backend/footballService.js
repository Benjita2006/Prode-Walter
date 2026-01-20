// prode-backend/footballService.js (VERSIÓN FINAL LIMPIA)
const db = require('./db');

// --- 1. LECTURA DE PARTIDOS (Para el Usuario) ---
async function obtenerPartidos(userId) { 
    try {
        const sql = `
            SELECT 
                m.id, m.home_team, m.home_logo, m.away_team, m.away_logo, 
                m.match_date, m.status, 
                p.prediction_result
            FROM matches m
            LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = ?
            WHERE m.is_active = TRUE
            AND m.status NOT IN ('FT', 'AET', 'PEN', 'PST', 'CANC')
            ORDER BY m.match_date ASC
        `;

        const [rows] = await db.execute(sql, [userId]); 

        const datosLimpios = rows.map(row => ({
            id: row.id,
            local: row.home_team,
            logoLocal: row.home_logo,
            visitante: row.away_team,
            logoVisitante: row.away_logo,
            fecha: new Date(row.match_date).toLocaleString('es-AR'),
            status: row.status,
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
    let insertedCount = 0;

    try {
        await conn.beginTransaction(); 

        for (const match of matches) {
            const { local, visitante, fecha } = match;
            await conn.execute(
                'INSERT INTO matches (home_team, away_team, match_date, is_active) VALUES (?, ?, ?, 1)',
                [local, visitante, fecha]
            );
            insertedCount++;
        }

        await conn.commit(); 
        return { success: true, count: insertedCount };

    } catch (error) {
        await conn.rollback(); 
        console.error("❌ ERROR CRÍTICO creando partidos manuales:", error);
        return { success: false, message: 'Error al insertar los partidos.' };
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
        // Validación de hora (Evitar trampa si el partido ya empezó)
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
            // Si ya existe, actualizamos en lugar de dar error (Mejor experiencia de usuario)
            await db.execute(
                'UPDATE predictions SET prediction_result = ? WHERE id = ?',
                [result, existing[0].id]
            );
            return { success: true, message: 'Pronóstico actualizado.' };
        }

        // Insertar nuevo
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
                p.id,
                u.username,
                m.home_team,
                m.home_logo,   
                m.away_team,
                m.away_logo,   
                m.match_date,
                p.prediction_result, /* Usamos result, no home/away */
                p.points
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
                        /* Si el partido NO terminó, 0 puntos */
                        WHEN m.status != 'FT' THEN 0
                        
                        /* CASO 1: Ganó LOCAL (Home > Away) y usuario eligió 'HOME' */
                        WHEN m.home_score > m.away_score AND p.prediction_result = 'HOME' THEN 1
                        
                        /* CASO 2: Ganó VISITANTE (Away > Home) y usuario eligió 'AWAY' */
                        WHEN m.away_score > m.home_score AND p.prediction_result = 'AWAY' THEN 1
                        
                        /* CASO 3: EMPATE (Home = Away) y usuario eligió 'DRAW' */
                        WHEN m.home_score = m.away_score AND p.prediction_result = 'DRAW' THEN 1
                        
                        /* Si no acertó */
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
        // ✨ CAMBIO CLAVE: Devolvemos un objeto con 'success' para que index.js lo entienda
        return { success: true, ranking: rows };

    } catch (error) {
        console.error("Error calculando ranking:", error);
        return { success: false, message: error.message };
    }
}

// Exportamos solo lo que usamos en index.js
module.exports = { 
    obtenerPartidos, 
    crearPartidos, 
    submitPrediction, 
    obtenerTodosLosPronosticos, 
    obtenerRanking
};