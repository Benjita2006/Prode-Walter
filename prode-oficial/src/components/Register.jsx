// src/components/Register.jsx (DISEÑO GLASSMORPHISM)
import React, { useState } from 'react';
import { API_URL } from '../config'; 
import './Auth.css'; // Usamos el mismo estilo compartido

function Register({ onRegisterSuccess, onSwitchToLogin }) {
    // Lógica ORIGINAL (Intacta)
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Registrando...');

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`¡Éxito! ${data.message}. Redirigiendo...`);
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
                <div className="auth-logo-icon">🏆</div>
                
                <h2>Crear Cuenta</h2>
                <p>Únete al Prode y compite con amigos</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nombre de Usuario</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Campeon2026" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            placeholder="usuario@ejemplo.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input 
                            type="password" 
                            placeholder="Crea una clave segura" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className="auth-button">
                        Registrarse
                    </button>
                </form>
                
                {/* Mensaje inteligente: Rojo si es error, Verde si es éxito */}
                {message && (
                    <div className={`message-box ${message.startsWith('Error') ? 'msg-error' : 'msg-success'}`}>
                        {message}
                    </div>
                )}

                <p className="switch-text">
                    ¿Ya tienes cuenta? 
                    <span 
                        onClick={onSwitchToLogin} 
                        className="auth-link-text"
                    >
                        Ingresa aquí
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Register;