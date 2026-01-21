// src/components/Login.jsx (DISEÑO GLASSMORPHISM)
import React, { useState } from 'react';
import './Auth.css'; // 👈 Importamos el nuevo estilo compartido
import { API_URL } from '../config';

function Login({ onLogin, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Lógica ORIGINAL para Login con Email (Intacta)
    const handleSubmit = async (e) => { 
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token); 
                onLogin(data.user); 
            } else {
                setError(data.message || 'Error de autenticación.');
            }

        } catch (err) {
            setError('Error de conexión con el servidor. Intenta más tarde.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Lógica para Login con Google (Simulada - Intacta)
    const handleGoogleLogin = () => {
        alert("Iniciando conexión con Google (Simulación)...");
        onLogin({username: 'Dueño Simulado', role: 'Owner'}); 
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo Animado */}
                <div className="auth-logo-icon">⚽</div>
                
                <h2>Bienvenido de nuevo</h2>
                <p>Ingresa tus credenciales para jugar</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            name="email"
                            autoComplete="username"
                            placeholder="usuario@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input 
                            type="password" 
                            name="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                    
                    {error && <div className="message-box msg-error">{error}</div>}
                </form>

                <div className="divider">
                    <span>O continúa con</span>
                </div>

                <button type="button" className="google-button" onClick={handleGoogleLogin} disabled={loading}>
                    <img 
                        src="https://www.svgrepo.com/show/475656/google-color.svg" 
                        alt="Google" 
                        width="20" 
                    />
                    Ingresar con Google
                </button>

                <p className="switch-text">
                    ¿No tienes cuenta? 
                    <span 
                        onClick={onSwitchToRegister} 
                        className="auth-link-text"
                    >
                        Regístrate aquí
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;