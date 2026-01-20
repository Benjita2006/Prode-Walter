// src/components/AdminDashboard.jsx (LISTO PARA DEPLOY)
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config'; // 👈 1. Importación clave
import './MatchCreator.css'; 

function AdminDashboard() {
    const [pronosticos, setPronosticos] = useState([]);
    const [filtro, setFiltro] = useState('');
    
    // Estados para acciones API
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            // 👇 2. URL Dinámica
            const res = await fetch(`${API_URL}/api/admin/predictions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPronosticos(data);
            }
        } catch (error) {
            console.error("Error cargando dashboard", error);
        }
    };

    // 🔄 SINCRONIZAR (Botón Azul)
    const handleSyncMatches = async () => {
        setLoading(true);
        setMessage('⏳ Conectando con API-Football...');
        const token = localStorage.getItem('token');

        try {
            // 👇 3. URL Dinámica
            const res = await fetch(`${API_URL}/api/admin/sync-matches`, {
                method: 'POST', 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`✅ Éxito: ${data.message}`);
                fetchData(); 
            } else {
                setMessage(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
            setMessage('❌ Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    // 🗑️ BORRAR TODO (Botón Rojo)
    const handleDeleteAll = async () => {
        if(!confirm("⚠️ ¿ESTÁS SEGURO?\nEsto borrará TODOS los partidos y pronósticos asociados.\nEsta acción no se puede deshacer.")) {
            return;
        }

        setLoading(true);
        setMessage('⏳ Eliminando datos...');
        const token = localStorage.getItem('token');

        try {
            // 👇 4. URL Dinámica
            const res = await fetch(`${API_URL}/api/admin/matches`, {
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`🗑️ ${data.message}`);
                setPronosticos([]); 
            } else {
                setMessage(`❌ Error al borrar: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
            setMessage('❌ Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    // Lógica de filtrado
    const filteredData = pronosticos.filter(item => 
        item.username.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="match-creator-container">
            <h2>⚙️ Panel de Control & API</h2>
            
            {/* --- ZONA DE GESTIÓN DE PARTIDOS --- */}
            <div style={{ 
                backgroundColor: '#222', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '30px',
                border: '1px solid #444',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
                <h3 style={{marginTop: 0, color: '#4caf50'}}>Gestión de Partidos (API)</h3>
                <p style={{fontSize: '0.9rem', color: '#ccc', marginBottom: '15px'}}>
                    Controla la carga de datos. Usa "Sincronizar" para traer partidos y "Borrar" para limpiar la base de datos.
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    {/* BOTÓN SINCRONIZAR */}
                    <button 
                        onClick={handleSyncMatches} 
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? '#555' : '#2196F3',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? '⏳ Procesando...' : '🔄 Sincronizar API'}
                    </button>

                    {/* BOTÓN BORRAR */}
                    <button 
                        onClick={handleDeleteAll} 
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? '#555' : '#f44336', 
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🗑️ Borrar Todo
                    </button>
                </div>

                {message && (
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '10px',
                        backgroundColor: message.includes('Error') ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 230, 118, 0.1)',
                        border: message.includes('Error') ? '1px solid #ff4444' : '1px solid #00e676',
                        borderRadius: '4px',
                        color: message.includes('Error') ? '#ff4444' : '#00e676',
                        fontWeight: 'bold'
                    }}>
                        {message}
                    </div>
                )}
            </div>

            {/* --- TABLA DE PRONÓSTICOS --- */}
            <h3>📊 Pronósticos Recientes</h3>
            
            <input 
                type="text" 
                placeholder="🔍 Buscar por usuario..." 
                className="table-input"
                style={{marginBottom: '20px', padding: '10px'}}
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />

            <div className="table-responsive">
                <table className="matches-table">
                    <tbody>
                        {filteredData.map((p) => (
                            <tr key={p.id} style={{verticalAlign: 'middle'}}>
                                <td style={{fontWeight: 'bold', color: '#4caf50'}}>{p.username}</td>
                                
                                {/* 🛡️ COLUMNA DE PARTIDO MEJORADA CON LOGOS */}
                                <td>
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px'}}>
                                        {/* Local */}
                                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                            {p.home_logo && (
                                                <img 
                                                    src={p.home_logo} 
                                                    alt="L" 
                                                    style={{width: '24px', height: '24px', objectFit: 'contain'}} 
                                                />
                                            )}
                                            <span>{p.home_team}</span>
                                        </div>

                                        <span style={{color: '#888', fontSize: '0.9rem', fontWeight: 'bold'}}>vs</span>

                                        {/* Visitante */}
                                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                            <span>{p.away_team}</span>
                                            {p.away_logo && (
                                                <img 
                                                    src={p.away_logo} 
                                                    alt="V" 
                                                    style={{width: '24px', height: '24px', objectFit: 'contain'}} 
                                                />
                                            )}
                                        </div>
                                    </div>
                                </td>

                                <td>{new Date(p.match_date).toLocaleDateString()}</td>
                                {/* Aquí mostramos el resultado (HOME, DRAW, AWAY) o lo que venga del back */}
                                <td style={{textAlign: 'center', fontWeight: 'bold'}}>
                                    {p.prediction_result || (p.prediction_home + " - " + p.prediction_away)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;