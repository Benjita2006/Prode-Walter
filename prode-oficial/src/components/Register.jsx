// src/components/Register.jsx (CORREGIDO)
import React, { useState } from 'react';
import { API_URL } from '../config'; // 👈 1. Importante: Traemos la configuración
import './Login.css'; 

function Register({ onRegisterSuccess, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Registrando...');

        try {
            // 👇 2. CORREGIDO: Usamos la variable API_URL
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Éxito: ${data.message}. Redirigiendo al Login...`);
                // Esperar un momento y luego cambiar a la pantalla de Login
                setTimeout(() => onRegisterSuccess(), 2000); 
            } else {
                setMessage(`Error: ${data.message || 'Error al registrar.'}`);
            }
        } catch (error) {
            setMessage('Error de conexión con el servidor.');
            console.error('Fetch error:', error);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>✍️ Crear Cuenta</h2>
                <p>Únete al Proyecto Prode.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nombre de Usuario</label>
                        <input type="text" placeholder="TuNombre" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" placeholder="usuario@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="auth-button">
                        Registrarse
                    </button>
                </form>
                
                {message && <p style={{ marginTop: '15px', color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}

                <p className="switch-text">
                    ¿Ya tienes cuenta? <span onClick={onSwitchToLogin} style={{color: '#007bff', fontWeight: 'bold', cursor: 'pointer'}}>Ingresa aquí</span>
                </p>
            </div>
        </div>
    );
}

export default Register;