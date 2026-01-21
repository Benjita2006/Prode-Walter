import React, { useState, useEffect, useCallback } from 'react'; // 👈 1. Importamos useCallback
import { API_URL } from '../config'; 
import './MatchCreator.css'; 

function AdminDashboard() {
    // ❌ Eliminamos [pronosticos, setPronosticos] porque ya no se usa para renderizar.
    const [usuariosAgrupados, setUsuariosAgrupados] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [filtro, setFiltro] = useState('');
    
    // Estados de carga/acción
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // 🧠 LÓGICA PARA AGRUPAR USUARIOS (La definimos antes para usarla en fetchData)
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

    // 🔄 2. Envolvemos fetchData en useCallback para estabilizarla
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/predictions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // setPronosticos(data); // ❌ Borramos esta línea que causaba el error
                agruparPorUsuario(data);
            }
        } catch (error) {
            console.error("Error cargando dashboard", error);
        }
    }, []); // [] significa que esta función no cambia nunca

    // 3. Ahora useEffect tiene la dependencia correcta
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 🖼️ MANEJO DE IMÁGENES ROTAS
    const handleImageError = (e) => {
        e.target.src = 'https://cdn-icons-png.flaticon.com/512/16/16480.png'; 
        e.target.style.opacity = "0.5"; 
    };

    // 🔄 SINCRONIZAR
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

    // 🗑️ BORRAR TODO
    const handleDeleteAll = async () => {
        if(!confirm("⚠️ ¿ESTÁS SEGURO? Borrarás TODO.")) return;
        setLoading(true); setMessage('⏳ Eliminando...');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/matches`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) { 
                setMessage(`🗑️ ${data.message}`); 
                // setPronosticos([]); // ❌ Borramos esto también
                setUsuariosAgrupados([]); 
            } 
            else { setMessage(`❌ ${data.message}`); }
        } catch (error) { console.error(error); setMessage('❌ Error conexión.'); } 
        finally { setLoading(false); }
    };

    // Lógica de filtrado
    const usuariosFiltrados = usuariosAgrupados.filter(u => 
        u.username.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="match-creator-container">
            <h2>⚙️ Panel de Control</h2>
            
            {/* ZONA DE ACCIONES */}
            <div style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
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
                        className="table-input"
                        style={{marginBottom: '20px', padding: '10px', width: '100%'}}
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {usuariosFiltrados.map((user) => (
                            <div 
                                key={user.username} 
                                onClick={() => setUsuarioSeleccionado(user)}
                                style={{
                                    backgroundColor: '#333',
                                    padding: '20px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    border: '1px solid #444',
                                    transition: 'transform 0.2s',
                                    textAlign: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{fontSize: '2rem', marginBottom: '10px'}}>👤</div>
                                <h3 style={{margin: '0 0 10px 0', color: '#4caf50'}}>{user.username}</h3>
                                <p style={{margin: 0, color: '#aaa'}}>Pronósticos: <strong>{user.total_pronosticos}</strong></p>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* VISTA 2: DETALLE DEL USUARIO */
                <div>
                    <button 
                        onClick={() => setUsuarioSeleccionado(null)}
                        style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        ⬅ Volver a Usuarios
                    </button>

                    <h3 style={{color: '#4caf50'}}>Pronósticos de: {usuarioSeleccionado.username}</h3>
                    
                    <div className="table-responsive">
                        <table className="matches-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Partido</th>
                                    <th>Pronóstico</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarioSeleccionado.predictions.map((p) => (
                                    <tr key={p.id}>
                                        <td>{new Date(p.match_date).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                <img src={p.home_logo} onError={handleImageError} style={{width:'20px', height:'20px', objectFit:'contain'}} alt="" />
                                                <span>{p.home_team}</span>
                                                <span style={{color:'#888', fontSize:'0.8em'}}>vs</span>
                                                <span>{p.away_team}</span>
                                                <img src={p.away_logo} onError={handleImageError} style={{width:'20px', height:'20px', objectFit:'contain'}} alt="" />
                                            </div>
                                        </td>
                                        <td style={{fontWeight: 'bold', textAlign: 'center', color: '#ffd700'}}>
                                            {p.prediction_result || '-'}
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