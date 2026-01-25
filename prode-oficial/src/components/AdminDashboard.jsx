// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config'; 
import './AdminDashboard.css'; 

function AdminDashboard({ onUpdate }) { // 👈 RECIBIMOS LA PROP onUpdate
    const [usuariosAgrupados, setUsuariosAgrupados] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // ... (Mantén tu función traducirEstado y agruparPorUsuario igual) ...
    const traducirEstado = (st) => {
        const diccionario = {
            'NS': 'Por Jugar', 'FT': 'Final', '1H': '1er T', 
            'HT': 'Entretiempo', '2H': '2do T', 'PST': 'Postergado',
            'CANC': 'Cancelado', 'ABD': 'Abandonado'
        };
        return diccionario[st] || st;
    };

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
            acc[user].puntos_totales += (curr.points || 0);
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

    const handleSyncMatches = async () => {
        setLoading(true); setMessage('⏳ Conectando...');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/sync-matches`, {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) { 
                setMessage(`✅ ${data.message}`); 
                fetchData(); 
                if (onUpdate) onUpdate(); // 👈 ACTUALIZAMOS LA APP PRINCIPAL
            } else { setMessage(`❌ ${data.message}`); }
        } catch (error) { console.error(error); setMessage('❌ Error conexión.'); } 
        finally { setLoading(false); }
    };

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
                if (onUpdate) onUpdate(); // 👈 ESTO ES CLAVE: Limpia los partidos de la vista principal
            } 
            else { setMessage(`❌ ${data.message}`); }
        } catch (error) { console.error(error); setMessage('❌ Error conexión.'); } 
        finally { setLoading(false); }
    };

    // ... (RESTO DEL RENDERIZADO IGUAL QUE ANTES) ...
    const usuariosFiltrados = usuariosAgrupados.filter(u => 
        u.username.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="admin-container">
            <h2 className="admin-title">⚙️ Panel de Control</h2>
            
            <div className="action-bar">
                <div className="action-buttons">
                    {/* Botón Sincronizar (Aunque ahora usamos manual, lo dejamos por si acaso) */}
                    <button onClick={handleSyncMatches} disabled={loading} className="btn-action btn-sync">
                        {loading ? '⏳' : '🔄 Sincronizar API'}
                    </button>
                    <button onClick={handleDeleteAll} disabled={loading} className="btn-action btn-delete">
                        🗑️ Borrar Todo
                    </button>
                </div>
                {message && (
                    <div className={`action-message ${message.includes('Error') || message.includes('❌') ? 'msg-error' : 'msg-success'}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* ... Resto del componente (Lista de usuarios, etc.) es igual ... */}
            {!usuarioSeleccionado ? (
                <>
                    <h3>👥 Usuarios Activos ({usuariosAgrupados.length})</h3>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar usuario..." 
                        className="search-input"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />

                    <div className="users-grid">
                        {usuariosFiltrados.map((user) => (
                            <div 
                                key={user.username} 
                                onClick={() => setUsuarioSeleccionado(user)}
                                className="user-card"
                            >
                                <div className="user-avatar">👤</div>
                                <h4 className="user-name">{user.username}</h4>
                                <small className="user-stats">Pronósticos: {user.total_pronosticos}</small>
                                <br/>
                                <strong className="user-points">Pts: {user.puntos_totales}</strong>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div>
                    <button onClick={() => setUsuarioSeleccionado(null)} className="btn-back">
                        ⬅ Volver a Usuarios
                    </button>
                    <h3 style={{color: '#4caf50', marginBottom: '15px', fontSize: '1.5rem'}}>
                        Pronósticos de: {usuarioSeleccionado.username}
                    </h3>
                    
                    <div className="table-responsive-admin">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Partido</th>
                                    <th>Voto</th>
                                    <th>Resultado</th>
                                    <th>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarioSeleccionado.predictions.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <span className="badge-date">{p.round || 'General'}</span>
                                            <div className="text-muted">
                                                {new Date(p.match_date).toLocaleDateString(undefined, {day:'numeric', month:'numeric'})}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="match-vs">
                                                <img src={p.home_logo} onError={handleImageError} className="mini-logo" alt="" />
                                                <span className="text-muted" style={{fontSize: '1rem'}}>vs</span>
                                                <img src={p.away_logo} onError={handleImageError} className="mini-logo" alt="" />
                                            </div>
                                        </td>
                                        <td>
                                            {p.prediction_result ? (
                                                <span className="badge-prediction" style={{
                                                    backgroundColor: p.prediction_result === 'HOME' ? '#4caf50' : p.prediction_result === 'AWAY' ? '#2196f3' : '#ff9800',
                                                }}>
                                                    {p.prediction_result === 'HOME' ? 'L' : p.prediction_result === 'AWAY' ? 'V' : 'E'}
                                                </span>
                                            ) : <span className="text-muted">Sin Voto</span>}
                                        </td>
                                        <td>
                                            {p.status === 'FT' 
                                                ? <strong style={{fontSize: '1.1rem'}}>{p.home_score} - {p.away_score}</strong> 
                                                : <span className="text-muted">{traducirEstado(p.status)}</span>
                                            }
                                        </td>
                                        <td style={{fontWeight: 'bold', fontSize: '1.2rem', color: p.points > 0 ? '#4caf50' : '#888'}}>
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