// prode-backend/authController.js (CÓDIGO COMPLETO Y ESTABLE)
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
}

module.exports = { registerUser, loginUser };