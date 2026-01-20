// prode-backend/footballService.js (CORREGIDO Y OPTIMIZADO)
const db = require('./db');

// --- 1. LECTURA DE PARTIDOS (Para el Usuario - CON LOGOS) ---
async function obtenerPartidos(userId) { 
    try {
        const sql = `
            SELECT 
                m.id, m.home_team, m.home_logo, m.away_team, m.away_logo, 
                m.match_date, m.status, 
                p.prediction_result /* 🆕 CAMBIO AQUÍ: Traemos el resultado 1X2 */
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
            // 🆕 CAMBIO: Ya no enviamos goles, enviamos la elección ('HOME', 'DRAW', 'AWAY')
            miPronostico: row.prediction_result, 
            yaJugo: row.prediction_result !== null 
        }));
        
        return datosLimpios;

    } catch (error) {
        console.error("❌ ERROR al consultar partidos:", error);
        return []; 
    }
}

// --- 2. ESCRITURA: Crear MÚLTIPLES partidos ---
async function crearPartidos(matches) {
    const conn = await db.getConnection(); 
    let insertedCount = 0;

    try {
        await conn.beginTransaction(); 

        for (const match of matches) {
            const { local, visitante, fecha } = match;
            // Nota: Al crear manual no tenemos logos, se insertan como NULL
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

// --- 3. ESCRITURA: Enviar Pronóstico ---
async function submitPrediction(userId, matchId, result) { // 🆕 Recibimos 'result' en vez de goles
    if (!userId || !matchId || !result) {
        return { success: false, message: 'Faltan datos.' };
    }

    try {
        const [existing] = await db.execute(
            'SELECT id FROM predictions WHERE user_id = ? AND match_id = ?',
            [userId, matchId]
        );

        if (existing.length > 0) {
            return { success: false, message: 'Ya pronosticaste este partido.' };
        }

        // 🆕 Insertamos en la columna prediction_result
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

// --- 4. LECTURA: Todos los Pronósticos (Dashboard Admin) ---
async function obtenerTodosLosPronosticos() {
    try {
        const sql = `
            SELECT 
                p.id,
                u.username,
                m.home_team,
                m.home_logo,   /* 🛡️ AGREGADO PARA DASHBOARD */
                m.away_team,
                m.away_logo,   /* 🛡️ AGREGADO PARA DASHBOARD */
                m.match_date,
                p.prediction_home,
                p.prediction_away
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

// --- 5. LECTURA: Pronósticos de un Usuario Específico (FALTABA ESTA FUNCIÓN) ---
async function obtenerPronosticosDeUsuario(userId) {
    try {
        const sql = `
            SELECT 
                m.home_team, m.home_logo,
                m.away_team, m.away_logo,
                m.match_date, m.home_score, m.away_score, m.status,
                p.prediction_home, p.prediction_away
            FROM matches m
            LEFT JOIN predictions p ON m.id = p.match_id AND p.user_id = ?
            WHERE m.is_active = 1
            ORDER BY m.match_date ASC
        `;
        const [rows] = await db.execute(sql, [userId]);
        return rows;
    } catch (error) {
        console.error("Error obteniendo historial de usuario:", error);
        return [];
    }
}

// --- 6. LECTURA: Lista de Usuarios ---
async function obtenerTodosLosUsuarios() {
    try {
        const sql = `
            SELECT 
                u.id, u.username, u.email, 
                r.name AS role, u.role_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.username ASC
        `;
        const [rows] = await db.execute(sql);
        return { success: true, users: rows };
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        return { success: false, users: [] };
    }
}

// --- 7. RANKING: Calcular puntos en tiempo real ---
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
                ), 0) as puntos
            FROM users u
            LEFT JOIN predictions p ON u.id = p.user_id
            LEFT JOIN matches m ON p.match_id = m.id
            GROUP BY u.id, u.username
            ORDER BY puntos DESC, u.username ASC
        `;

        const [rows] = await db.execute(sql);
        return rows;

    } catch (error) {
        console.error("Error calculando ranking:", error);
        return [];
    }
}
module.exports = { 
    obtenerPartidos, 
    crearPartidos, 
    submitPrediction, 
    obtenerTodosLosPronosticos, 
    obtenerPronosticosDeUsuario, 
    obtenerTodosLosUsuarios,
    obtenerRanking
};


