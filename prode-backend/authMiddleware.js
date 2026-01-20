// prode-backend/authMiddleware.js (CÓDIGO COMPLETO Y ESTABLE)
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // 1. Buscamos el token en el encabezado (Header)
    // El formato esperado es: "Bearer [TOKEN]"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        // Si no hay token, acceso denegado (401 Unauthorized)
        return res.status(401).json({ success: false, message: 'Acceso denegado: Falta el Token.' });
    }

    try {
        // 2. Verificamos que el token sea válido usando la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Asignamos el payload decodificado (id, role) a req.user para usarlo en las rutas
        req.user = decoded; 
        
        next(); // Permitir el acceso a la siguiente función (la ruta)

    } catch (error) {
        // Si el token expiró o es inválido (403 Forbidden)
        return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
}

module.exports = authenticateToken;