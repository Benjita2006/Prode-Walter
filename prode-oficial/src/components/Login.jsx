// src/components/Login.jsx
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google'; // 👈 Importamos la librería
import { API_URL } from '../config'; 
import './Login.css';

function Login({ onLogin, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // 🛠️ CORRECCIÓN 1: Unificamos nombres (error y setError)
    const [error, setError] = useState('');

    // --- LÓGICA 1: LOGIN CON EMAIL (Clásico) ---
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
            setError('Error de conexión con el servidor.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA 2: LOGIN CON GOOGLE (Real) ---
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        
        try {
            // Enviamos el token de Google a nuestro Backend para verificarlo
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                onLogin(data.user);
            } else {
                setError(data.message || 'Fallo el inicio de sesión con Google');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
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
                    
                    {/* 🛠️ CORRECCIÓN 2: Ahora 'error' sí existe */}
                    {error && <div className="message-box msg-error">{error}</div>}
                </form>

                <div className="divider">
                    <span>O continúa con</span>
                </div>

                {/* 👇 BOTÓN REAL DE GOOGLE (Reemplaza al manual) */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Falló el inicio de sesión con Google')}
                        theme="filled_black" 
                        shape="pill"
                        text="signin_with"
                        locale="es"
                        width="250"
                    />
                </div>

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