// prode-backend/src/authController.js
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); // 👈 Importante

// Inicializamos el cliente de Google (Si no hay variable, usa un string vacío para no romper al inicio)
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "");

// --- 1. REGISTRO NORMAL ---
async function registerUser(username, email, password) {
    if (!username || !email || !password) {
        return { success: false, message: 'Faltan datos.' };
    }

    try {
        // Verificar si existe
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return { success: false, message: 'El email ya está registrado.' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar
        // NOTA: Asignamos rol 'User' por defecto. El primero se cambia a mano en DB si es Owner.
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'User']
        );

        return { success: true, message: 'Usuario registrado exitosamente.' };

    } catch (error) {
        console.error("Error en registro:", error);
        return { success: false, message: 'Error en el servidor.' };
    }
}

// --- 2. LOGIN NORMAL ---
async function loginUser(email, password) {
    if (!email || !password) {
        return { success: false, message: 'Faltan datos.' };
    }

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return { success: false, message: 'Usuario no encontrado.' };
        }

        const user = users[0];

        // Si el usuario se creó con Google, no tiene password
        if (!user.password) {
             return { success: false, message: 'Este usuario se registró con Google. Usa el botón de Google.' };
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return { success: false, message: 'Contraseña incorrecta.' };
        }

        // Crear Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secreto_super_seguro',
            { expiresIn: '24h' }
        );

        return { 
            success: true, 
            token, 
            user: { id: user.id, username: user.username, email: user.email, role: user.role } 
        };

    } catch (error) {
        console.error("Error en login:", error);
        return { success: false, message: 'Error en el servidor.' };
    }
}

// --- 3. LOGIN CON GOOGLE (LA QUE FALTABA) ---
async function googleLogin(token) {
    try {
        // A. Verificar el token con Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        const email = payload.email;
        // const googleId = payload.sub; // ID único de google
        const name = payload.name || payload.given_name;

        // B. Verificar si el usuario ya existe en nuestra DB
        const conn = await db.getConnection();
        const [users] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        // C. Si no existe, lo creamos (Registro automático)
        if (!user) {
            // Generamos un nombre de usuario basado en el nombre de Google
            let username = name || email.split('@')[0];
            
            // Insertamos sin contraseña (password NULL)
            const [result] = await conn.execute(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, NULL, ?)',
                [username, email, 'User']
            );
            
            // Recuperamos el usuario recién creado
            const [newUsers] = await conn.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUsers[0];
        }

        conn.release();

        // D. Generamos nuestro propio Token JWT para la App
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
        return { success: false, message: 'Token de Google inválido o error de servidor.' };
    }
}

// Exportamos las 3 funciones
module.exports = { registerUser, loginUser, googleLogin };