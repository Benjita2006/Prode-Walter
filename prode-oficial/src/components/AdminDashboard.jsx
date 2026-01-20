import React, { useState, useEffect } from 'react';
import { API_URL } from '../config'; 
import './MatchCreator.css'; 

function AdminDashboard() {
    const [pronosticos, setPronosticos] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/predictions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPronosticos(data);
            }
        } catch (error) {
            // Aquí sí lo estabas usando, por eso no daba error
            console.error("Error cargando dashboard", error);
        }
    };

    // 🔄 SINCRONIZAR
    const handleSyncMatches = async () => {
        setLoading(true);
        setMessage('⏳ Conectando con API-Football...');
        const token = localStorage.getItem('token');

        try {
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
            // ✅ CORRECCIÓN 1: Usamos la variable 'error'
            console.error("Error en sync:", error);
            setMessage('❌ Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    // 🗑️ BORRAR TODO
    const handleDeleteAll = async () => {
        if(!confirm("⚠️ ¿ESTÁS SEGURO?\nEsto borrará TODOS los partidos y pronósticos.\nNo se puede deshacer.")) {
            return;
        }

        setLoading(true);
        setMessage('⏳ Eliminando datos...');
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}/api/admin/matches`, {
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`🗑️ ${data.message}`);
                setPronosticos([]); 
            } else {
                setMessage(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            // ✅ CORRECCIÓN 2: Usamos la variable 'error'
            console.error("Error al borrar:", error);
            setMessage('❌ Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = pronosticos.filter(item => 
        item.username.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="match-creator-container">
            <h2>⚙️ Panel de Control & API</h2>
            
            <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #444', textAlign: 'center' }}>
                <h3 style={{marginTop: 0, color: '#4caf50'}}>Gestión de Partidos</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px' }}>
                    <button 
                        onClick={handleSyncMatches} 
                        disabled={loading}
                        style={{ backgroundColor: loading ? '#555' : '#2196F3', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        {loading ? '⏳ ...' : '🔄 Sincronizar API'}
                    </button>

                    <button 
                        onClick={handleDeleteAll} 
                        disabled={loading}
                        style={{ backgroundColor: loading ? '#555' : '#f44336', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        🗑️ Borrar Todo
                    </button>
                </div>
                {message && <div style={{ marginTop: '15px', fontWeight: 'bold', color: message.includes('Error') ? '#ff4444' : '#00e676' }}>{message}</div>}
            </div>

            <h3>📊 Pronósticos de Usuarios</h3>
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
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Partido</th>
                            <th>Fecha</th>
                            <th>Pronóstico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((p) => (
                            <tr key={p.id}>
                                <td style={{fontWeight: 'bold', color: '#4caf50'}}>{p.username}</td>
                                <td>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        {/* Si agregaste logos en el backend, descomenta esto: */}
                                        {/* {p.home_logo && <img src={p.home_logo} width="20" alt="L" />} */}
                                        {p.home_team} vs {p.away_team}
                                        {/* {p.away_logo && <img src={p.away_logo} width="20" alt="V" />} */}
                                    </div>
                                </td>
                                <td>{new Date(p.match_date).toLocaleDateString()}</td>
                                <td style={{fontWeight: 'bold', textAlign: 'center'}}>
                                    {p.prediction_result || '-'}
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