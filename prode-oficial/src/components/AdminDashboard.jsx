import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config'; 
import './App.css'; // Asegúrate de importar App.css donde pusimos los estilos nuevos

function AdminDashboard() {
    const [usuariosAgrupados, setUsuariosAgrupados] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // LÓGICA PARA AGRUPAR USUARIOS
    const agruparPorUsuario = (data) => {
        const grupos = data.reduce((acc, curr) => {
            const user = curr.username;
            if (!acc[user]) {
                acc[user] = {
                    username: user,
                    total_pronosticos: 0,
                    puntos_totales: 0,
                    predictions: []
                };
            }
            acc[user].predictions.push(curr);
            acc[user].total_pronosticos += 1;
            acc[user].puntos_totales += (curr.points || 0); // Sumamos los puntos si existen
            return acc;
        }, {});
        setUsuariosAgrupados(Object.values(grupos));
    };

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/predictions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                agruparPorUsuario(data);
            }
        } catch (error) {
            console.error("Error cargando dashboard", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleImageError = (e) => {
        e.target.src = 'https://cdn-icons-png.flaticon.com/512/16/16480.png'; 
        e.target.style.opacity = "0.5"; 
    };

    // SINCRONIZAR
    const handleSyncMatches = async () => {
        setLoading(true); setMessage('⏳ Conectando...');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/sync-matches`, {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) { setMessage(`✅ ${data.message}`); fetchData(); } 
            else { setMessage(`❌ ${data.message}`); }
        } catch (error) { console.error(error); setMessage('❌ Error conexión.'); } 
        finally { setLoading(false); }
    };

    // BORRAR TODO
    const handleDeleteAll = async () => {
        if(!confirm("⚠️ ¿ESTÁS SEGURO? Borrarás TODO.")) return;
        setLoading(true); setMessage('⏳ Eliminando...');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/matches`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) { 
                setMessage(`🗑️ ${data.message}`); 
                setUsuariosAgrupados([]); 
                setUsuarioSeleccionado(null);
            } 
            else { setMessage(`❌ ${data.message}`); }
        } catch (error) { console.error(error); setMessage('❌ Error conexión.'); } 
        finally { setLoading(false); }
    };

    const usuariosFiltrados = usuariosAgrupados.filter(u => 
        u.username.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>⚙️ Panel de Control</h2>
            
            {/* ZONA DE ACCIONES */}
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={handleSyncMatches} disabled={loading} style={{ backgroundColor: '#2196F3', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {loading ? '⏳' : '🔄 Sincronizar API'}
                    </button>
                    <button onClick={handleDeleteAll} disabled={loading} style={{ backgroundColor: '#f44336', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        🗑️ Borrar Todo
                    </button>
                </div>
                {message && <div style={{ marginTop: '10px', fontWeight: 'bold', color: message.includes('Error') || message.includes('❌') ? '#ff4444' : '#00e676' }}>{message}</div>}
            </div>

            {/* VISTA 1: LISTA DE USUARIOS (TARJETAS) */}
            {!usuarioSeleccionado ? (
                <>
                    <h3>👥 Usuarios Activos ({usuariosAgrupados.length})</h3>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar usuario..." 
                        style={{marginBottom: '20px', padding: '10px', width: '100%', borderRadius: '5px', border: '1px solid #555', backgroundColor: '#333', color: 'white'}}
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                        {usuariosFiltrados.map((user) => (
                            <div 
                                key={user.username} 
                                onClick={() => setUsuarioSeleccionado(user)}
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    border: '1px solid #444',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div style={{fontSize: '2rem', marginBottom: '5px'}}>👤</div>
                                <h4 style={{margin: '0 0 5px 0', color: '#4caf50', overflow: 'hidden', textOverflow: 'ellipsis'}}>{user.username}</h4>
                                <small style={{color: '#aaa'}}>Pronósticos: {user.total_pronosticos}</small>
                                <br/>
                                <strong style={{color: '#ffd700'}}>Pts: {user.puntos_totales}</strong>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* VISTA 2: DETALLE DEL USUARIO (CON TABLA RESPONSIVE) */
                <div>
                    <button 
                        onClick={() => setUsuarioSeleccionado(null)}
                        style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        ⬅ Volver a Usuarios
                    </button>

                    <h3 style={{color: '#4caf50', marginBottom: '10px'}}>Pronósticos de: {usuarioSeleccionado.username}</h3>
                    
                    {/* 👇 AQUÍ APLICAMOS LAS CLASES DEL CSS NUEVO */}
                    <div className="table-responsive-admin">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Partido</th>
                                    <th>Pronóstico</th>
                                    <th>Resultado</th>
                                    <th>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarioSeleccionado.predictions.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{fontSize: '0.85rem'}}>{new Date(p.match_date).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}</td>
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                <img src={p.home_logo} onError={handleImageError} className="mini-logo" alt="" />
                                                <span style={{fontSize: '0.8rem'}}>vs</span>
                                                <img src={p.away_logo} onError={handleImageError} className="mini-logo" alt="" />
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                backgroundColor: '#333', 
                                                padding: '2px 6px', 
                                                borderRadius: '4px',
                                                color: p.prediction_result === 'home' ? '#4caf50' : p.prediction_result === 'away' ? '#2196f3' : '#ff9800',
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem'
                                            }}>
                                                {p.prediction_result === 'home' ? 'L' : p.prediction_result === 'away' ? 'V' : 'E'}
                                            </span>
                                        </td>
                                        <td style={{fontSize: '0.85rem'}}>
                                            {p.status === 'FT' ? `${p.home_score}-${p.away_score}` : '⏳'}
                                        </td>
                                        <td style={{fontWeight: 'bold', color: p.points > 0 ? '#4caf50' : '#888'}}>
                                            {p.status === 'FT' ? p.points : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;