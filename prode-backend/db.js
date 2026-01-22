// prode-backend/db.js
const mysql = require('mysql2'); // Usamos la librería estándar para tener mejor control
require('dotenv').config();

// Detectamos si estamos en Railway o Local
const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway';
const DB_PORT = process.env.MYSQLPORT || process.env.DB_PORT || 3306;

console.log(`🔌 Intentando conectar a la DB en: ${DB_HOST}:${DB_PORT} (Usuario: ${DB_USER})`);

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Importante para Railway: Mantener la conexión viva
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Exportamos la versión con promesas para poder usar 'await'
const promisePool = pool.promise();

// Prueba de conexión inicial (Para ver el error en los logs si falla al arrancar)
promisePool.getConnection()
    .then(conn => {
        console.log(`✅ ¡Conexión exitosa a la Base de Datos '${DB_NAME}'!`);
        conn.release();
    })
    .catch(err => {
        console.error("❌ ERROR FATAL DE CONEXIÓN DB:", err.code, err.message);
    });

module.exports = promisePool;