// prode-backend/db.js
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Configuración de la conexión
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 👇 ESTA ES LA CLAVE: Exportamos la versión con PROMESAS
const promisePool = pool.promise();

console.log("🔌 Conectando a la Base de Datos...");

promisePool.getConnection()
    .then(connection => {
        console.log("✅ Conexión a DB exitosa (Modo Promesas)");
        connection.release();
    })
    .catch(err => {
        console.error("❌ Error conectando a la DB:", err.message);
    });

module.exports = promisePool;