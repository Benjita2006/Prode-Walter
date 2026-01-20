// src/components/Login.jsx (CORREGIDO)
import React, { useState } from 'react';
import './Login.css';
import { API_URL } from '../config'; // 👈 1. Importamos la configuración

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lógica para Login con Email
  const handleSubmit = async (e) => { 
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        // 👇 2. CORREGIDO: Ruta correcta (/api/auth/login) y sintaxis limpia
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        
        if (response.ok) {
            // Éxito: Guardamos el token
            localStorage.setItem('token', data.token); 
            
            // Enviamos el usuario al componente padre
            onLogin(data.user); 
        } else {
            setError(data.message || 'Error de autenticación.');
        }

    } catch (err) {
        // Mensaje genérico para cuando falle en producción o local
        setError('Error de conexión con el servidor. Intenta más tarde.');
        console.error('Fetch error:', err);
    } finally {
        setLoading(false);
    }
  };

  // Lógica para Login con Google (Simulada)
  const handleGoogleLogin = () => {
     alert("Iniciando conexión con Google (Simulación)...");
     onLogin({username: 'Dueño Simulado', role: 'Owner'}); 
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Bienvenido a Prode Walter⚽</h2>
        <p>Ingresa para jugar</p>
        
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
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          
          {error && <p style={{ color: 'red', marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>}
        </form>

        <div className="divider">
          <span>O continúa con</span>
        </div>

        <button type="button" className="google-button" onClick={handleGoogleLogin} disabled={loading}>
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google Logo" 
            width="20" 
          />
          Ingresar con Google
        </button>

        <p className="switch-text">
          ¿No tienes cuenta? <span 
             onClick={onSwitchToRegister} 
             style={{color: '#007bff', fontWeight: 'bold', cursor: 'pointer'}}
          >Regístrate aquí</span>
        </p>
      </div>
    </div>
  );
}

export default Login;