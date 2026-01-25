import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './MatchCreator.css'; // Usamos los mismos estilos para que se vea integrado

function MatchResultEditor() {
    const [partidos, setPartidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null); 

    // Cargar partidos al montar el componente
    useEffect(() => {
        fetchPartidos();
    }, []);

    const fetchPartidos = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/partidos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Ordenar por fecha para encontrar fácil los recientes
                setPartidos(data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
            }
        } catch (error) {
            console.error("Error cargando partidos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Manejar cambios en los inputs
    const handleChange = (id, field, value) => {
        setPartidos(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    // Enviar cambios al servidor
    const handleSave = async (partido) => {
        setSavingId(partido.id);
        const token = localStorage.getItem('token');

        // Automatización: Si pone goles, asumimos que terminó (FT)
        let newStatus = partido.status;
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
                    status: newStatus, // Enviamos el estado calculado o el seleccionado
                    match_date: partido.fecha
                })
            });

            if (response.ok) {
                alert("✅ Actualizado. Ranking recalculado.");
                fetchPartidos(); // Recargar para ver los datos frescos de la BD
            } else {
                alert("❌ Error al guardar.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) return <p style={{color:'white', textAlign:'center'}}>Cargando partidos...</p>;

    return (
        <div className="match-creator-container">
            <h2>⚙️ Administrar Resultados</h2>
            <p style={{fontSize: '0.9rem', color: '#ccc', marginBottom: '15px'}}>
                Escribe los goles y presiona el botón azul para guardar. <br/>
                <strong>¡El ranking se actualiza solo!</strong>
            </p>

            <div className="table-responsive">
                <table className="matches-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th style={{textAlign:'right'}}>Local</th>
                            <th style={{textAlign:'center'}}>Goles</th>
                            <th style={{textAlign:'left'}}>Visita</th>
                            <th>Estado</th>
                            <th>Guardar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partidos.map((p) => (
                            <tr key={p.id} style={{borderBottom: '1px solid #444'}}>
                                {/* Fecha editable */}
                                <td>
                                    <input 
                                        type="datetime-local"
                                        className="table-input"
                                        style={{fontSize: '0.75rem', width: '110px'}}
                                        value={p.fecha ? p.fecha.substring(0, 16) : ''}
                                        onChange={(e) => handleChange(p.id, 'fecha', e.target.value)}
                                    />
                                </td>
                                
                                <td style={{textAlign: 'right', fontWeight: 'bold'}}>{p.local}</td>
                                
                                {/* Inputs de Goles */}
                                <td style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                    <input 
                                        type="number" 
                                        className="table-input"
                                        style={{width:'40px', textAlign: 'center', color: '#4caf50', fontWeight:'bold'}}
                                        value={p.home_score !== null ? p.home_score : ''}
                                        placeholder="-"
                                        onChange={(e) => handleChange(p.id, 'home_score', e.target.value)}
                                    />
                                    <span style={{color:'white'}}>:</span>
                                    <input 
                                        type="number" 
                                        className="table-input"
                                        style={{width:'40px', textAlign: 'center', color: '#4caf50', fontWeight:'bold'}}
                                        value={p.away_score !== null ? p.away_score : ''}
                                        placeholder="-"
                                        onChange={(e) => handleChange(p.id, 'away_score', e.target.value)}
                                    />
                                </td>

                                <td style={{textAlign: 'left', fontWeight: 'bold'}}>{p.visitante}</td>

                                {/* Selector de Estado */}
                                <td>
                                    <select 
                                        value={p.status}
                                        onChange={(e) => handleChange(p.id, 'status', e.target.value)}
                                        className="table-input"
                                        style={{width: '65px', padding: '2px', fontSize:'0.8rem'}}
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
                                        style={{
                                            background: savingId === p.id ? '#555' : '#007bff',
                                            color: 'white',
                                            border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                        title="Guardar y Recalcular"
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
    );
}

export default MatchResultEditor;