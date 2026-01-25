// src/components/MatchResultEditor.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './MatchResultEditor.css'; // 👈 Importamos el nuevo CSS dedicado

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
        
        // Automatización: Si pone goles y estaba en NS, pasamos a FT
        if (partido.home_score !== '' && partido.away_score !== '' && partido.status === 'NS') {
             newStatus = 'FT'; 
        }

        try {
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
                    match_date: partido.fecha // Backend se encargará de formatearlo
                })
            });

            if (response.ok) {
                alert("✅ Actualizado correctamente");
                fetchPartidos(); 
            } else {
                const err = await response.json();
                alert(`❌ Error: ${err.message || 'Desconocido'}`);
                console.error(err);
            }
        } catch (error) { 
            console.error(error); 
            alert("Error de conexión"); 
        } 
        finally { setSavingId(null); }
    };

    // Agrupar por fechas
    const partidosPorFecha = partidos.reduce((acc, p) => {
        const f = p.round || 'Varios';
        if (!acc[f]) acc[f] = [];
        acc[f].push(p);
        return acc;
    }, {});

    if (loading) return <p style={{textAlign:'center', marginTop:'20px'}}>Cargando editor...</p>;

    return (
        <div className="editor-container">
            <h2 className="editor-title">⚙️ Editar Resultados</h2>
            
            {Object.keys(partidosPorFecha).map(fecha => (
                <div key={fecha} className="fecha-group">
                    <div className="fecha-header">
                        📅 {fecha}
                    </div>
                    <div className="editor-table-wrapper">
                        <table className="editor-table">
                            <thead>
                                <tr>
                                    <th style={{width:'140px'}}>Fecha/Hora</th>
                                    <th>Local</th>
                                    <th style={{width:'120px'}}>Resultado</th>
                                    <th>Visita</th>
                                    <th>Estado</th>
                                    <th style={{width:'60px'}}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {partidosPorFecha[fecha].map((p) => (
                                    <tr key={p.id}>
                                        {/* Fecha */}
                                        <td>
                                            <input 
                                                type="datetime-local"
                                                className="editor-input input-date"
                                                value={p.fecha ? p.fecha.substring(0, 16) : ''}
                                                onChange={(e) => handleChange(p.id, 'fecha', e.target.value)}
                                            />
                                        </td>
                                        
                                        {/* Equipo Local */}
                                        <td className="team-name team-local">{p.local}</td>
                                        
                                        {/* Goles */}
                                        <td>
                                            <div className="score-wrapper">
                                                <input 
                                                    type="number" 
                                                    className="editor-input input-score"
                                                    value={p.home_score !== null ? p.home_score : ''}
                                                    placeholder="-"
                                                    onChange={(e) => handleChange(p.id, 'home_score', e.target.value)}
                                                />
                                                <span>-</span>
                                                <input 
                                                    type="number" 
                                                    className="editor-input input-score"
                                                    value={p.away_score !== null ? p.away_score : ''}
                                                    placeholder="-"
                                                    onChange={(e) => handleChange(p.id, 'away_score', e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        {/* Equipo Visita */}
                                        <td className="team-name team-visit">{p.visitante}</td>

                                        {/* Estado */}
                                        <td>
                                            <select 
                                                value={p.status}
                                                onChange={(e) => handleChange(p.id, 'status', e.target.value)}
                                                className="editor-input input-status"
                                            >
                                                <option value="NS">⏳ NS</option>
                                                <option value="FT">✅ FT</option>
                                                <option value="PST">⚠️ PST</option>
                                            </select>
                                        </td>

                                        {/* Botón Guardar */}
                                        <td style={{textAlign:'center'}}>
                                            <button 
                                                onClick={() => handleSave(p)}
                                                disabled={savingId === p.id}
                                                className="btn-save-match"
                                                title="Guardar cambios"
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