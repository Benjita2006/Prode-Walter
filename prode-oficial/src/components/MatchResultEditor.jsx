// src/components/MatchResultEditor.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './MatchCreator.css'; // Reutilizamos estilos base

function MatchResultEditor() {
    const [partidos, setPartidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null); 

    useEffect(() => { fetchPartidos(); }, []);

    const fetchPartidos = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/partidos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Ordenar por fecha
                setPartidos(data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
            }
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const handleChange = (id, field, value) => {
        setPartidos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = async (partido) => {
        setSavingId(partido.id);
        const token = localStorage.getItem('token');
        let newStatus = partido.status;
        
        // Si hay goles, auto-cambiar a FT si está en NS
        if (partido.home_score !== '' && partido.away_score !== '' && partido.status === 'NS') {
             newStatus = 'FT'; 
        }

        try {
            // URL CORRECTA: aseguramos que partido.id existe y se envía en la URL
            const response = await fetch(`${API_URL}/api/admin/matches/${partido.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    home_score: partido.home_score,
                    away_score: partido.away_score,
                    status: newStatus,
                    match_date: partido.fecha
                })
            });

            if (response.ok) {
                alert("✅ Actualizado");
                fetchPartidos(); 
            } else {
                alert("❌ Error al guardar (ver consola)");
                console.error(await response.json());
            }
        } catch (error) { console.error(error); alert("Error de conexión"); } 
        finally { setSavingId(null); }
    };

    // Agrupar por fechas para mostrar ordenado
    const partidosPorFecha = partidos.reduce((acc, p) => {
        const f = p.round || 'Varios';
        if (!acc[f]) acc[f] = [];
        acc[f].push(p);
        return acc;
    }, {});

    if (loading) return <p style={{textAlign:'center'}}>Cargando...</p>;

    // Estilos inline para modo oscuro en inputs
    const inputStyle = {
        background: '#222', color: 'white', border: '1px solid #555', 
        padding: '5px', borderRadius: '4px', textAlign: 'center'
    };

    return (
        <div className="match-creator-container">
            <h2>⚙️ Editar Resultados</h2>
            
            {Object.keys(partidosPorFecha).map(fecha => (
                <div key={fecha} style={{marginBottom: '30px', border: '1px solid #444', borderRadius: '8px', overflow:'hidden'}}>
                    <div style={{background: '#333', color: '#fff', padding: '10px', fontWeight: 'bold'}}>
                        {fecha}
                    </div>
                    <div className="table-responsive">
                        <table className="matches-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th style={{textAlign:'right'}}>Local</th>
                                    <th style={{textAlign:'center'}}>Goles</th>
                                    <th style={{textAlign:'left'}}>Visita</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {partidosPorFecha[fecha].map((p) => (
                                    <tr key={p.id} style={{borderBottom: '1px solid #333'}}>
                                        <td>
                                            <input 
                                                type="datetime-local"
                                                style={{...inputStyle, width: '130px', fontSize: '0.8rem'}}
                                                value={p.fecha ? p.fecha.substring(0, 16) : ''}
                                                onChange={(e) => handleChange(p.id, 'fecha', e.target.value)}
                                            />
                                        </td>
                                        <td style={{textAlign: 'right', fontWeight: 'bold'}}>{p.local}</td>
                                        <td style={{textAlign:'center'}}>
                                            <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                                <input 
                                                    type="number" 
                                                    style={{...inputStyle, width:'50px', fontWeight:'bold', color: '#4caf50'}}
                                                    value={p.home_score !== null ? p.home_score : ''}
                                                    placeholder="-"
                                                    onChange={(e) => handleChange(p.id, 'home_score', e.target.value)}
                                                />
                                                <span>:</span>
                                                <input 
                                                    type="number" 
                                                    style={{...inputStyle, width:'50px', fontWeight:'bold', color: '#4caf50'}}
                                                    value={p.away_score !== null ? p.away_score : ''}
                                                    placeholder="-"
                                                    onChange={(e) => handleChange(p.id, 'away_score', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td style={{textAlign: 'left', fontWeight: 'bold'}}>{p.visitante}</td>
                                        <td>
                                            <select 
                                                value={p.status}
                                                onChange={(e) => handleChange(p.id, 'status', e.target.value)}
                                                style={{...inputStyle, width: '80px'}}
                                            >
                                                <option value="NS">⏳ NS</option>
                                                <option value="FT">✅ FT</option>
                                                <option value="PST">⚠️ PST</option>
                                            </select>
                                        </td>
                                        <td style={{textAlign:'center'}}>
                                            <button 
                                                onClick={() => handleSave(p)}
                                                disabled={savingId === p.id}
                                                style={{
                                                    background: savingId === p.id ? '#555' : '#007bff',
                                                    color: 'white', border: 'none', padding: '8px 15px', 
                                                    borderRadius: '4px', cursor: 'pointer'
                                                }}
                                            >
                                                {savingId === p.id ? '...' : '💾'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MatchResultEditor;