// prode-backend/authController.js (CÓDIGO COMPLETO Y ESTABLE)
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';
// ID 3 es el rol 'User' (Usuario Estándar)
const DEFAULT_ROLE_ID = 3; 

// --- FUNCIÓN DE REGISTRO ---
async function registerUser(username, email, password) {
    try {
        // 1. Verificar si el usuario ya existe
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return { success: false, message: 'El correo ya está registrado.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;
        
        // 👇 Fíjate que el cuarto valor es 'User' (texto), no un número
        await db.execute(sql, [username, email, hashedPassword, 'User']);

        return { success: true, message: 'Usuario registrado con éxito' };

    } catch (error) {
        console.error("Error en registro:", error);
        return { success: false, message: 'Error en el servidor al registrar usuario.' };
    }
}

module.exports = { registerUser, loginUser: require('./authController').loginUser || module.exports.loginUser }; 

// --- FUNCIÓN DE LOGIN ---
async function loginUser(email, password) {
    try {
        // 👇 CORREGIDO: Seleccionamos directo de la tabla users (sin JOINs raros)
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const user = rows[0];
        
        // Verificamos la contraseña
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return { success: false, message: 'Contraseña incorrecta' };
        }

        // 👇 CORREGIDO: Usamos user.role directamente, ya que ahora es texto ('User', 'Owner', etc.)
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        return {
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role }
        };

    } catch (error) {
        console.error("Error en login:", error);
        return { success: false, message: 'Error en el servidor durante el login.' };
    }
// NUEVA FUNCIÓN: LOGIN CON GOOGLE
async function googleLogin(token) {
    try {
        // 1. Verificar el token con Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        const email = payload.email;
        const googleId = payload.sub;
        const name = payload.name || payload.given_name;

        // 2. Verificar si el usuario ya existe en nuestra DB
        const conn = await db.getConnection();
        const [users] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        // 3. Si no existe, lo creamos (Registro automático)
        if (!user) {
            // Generamos un nombre de usuario basado en el nombre de Google o el email
            let username = name || email.split('@')[0];
            
            // Insertamos sin contraseña
            const [result] = await conn.execute(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, NULL, ?)',
                [username, email, 'User']
            );
            
            // Recuperamos el usuario recién creado
            const [newUsers] = await conn.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUsers[0];
        }

        conn.release();

        // 4. Generamos nuestro propio Token JWT (Igual que en el login normal)
        const appToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secreto_super_seguro',
            { expiresIn: '24h' }
        );

        return { 
            success: true, 
            token: appToken, 
            user: { id: user.id, username: user.username, email: user.email, role: user.role } 
        };

    } catch (error) {
        console.error("Error en Google Login:", error);
        return { success: false, message: 'Token de Google inválido.' };
    }
}

}

module.exports = { registerUser, loginUser, googleLogin };