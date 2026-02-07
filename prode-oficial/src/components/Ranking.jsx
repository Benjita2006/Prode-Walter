import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './Ranking.css'; // Asegúrate de tener estilos básicos o usa el de App.css

function Ranking() {
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Estado para el filtro: 'General' es el valor por defecto
    const [rondaSeleccionada, setRondaSeleccionada] = useState('General');

    // Lista de fechas disponibles (Podrías traerlas del backend, pero hardcodearlas es más rápido por ahora)
    const fechasDisponibles = [
        'General',
        'Fecha 1', 'Fecha 2', 'Fecha 3', 'Fecha 4', 'Fecha 5', 'Fecha 6'
    ];

    useEffect(() => {
        fetchRanking();
    }, [rondaSeleccionada]); // Se ejecuta cada vez que cambiamos la fecha

    const fetchRanking = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // Enviamos la ronda seleccionada como parámetro query
            const res = await fetch(`${API_URL}/api/ranking?round=${rondaSeleccionada}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRankingData(data);
        } catch (error) {
            console.error("Error cargando ranking:", error);
        } finally {
            setLoading(false);
        }
    };

    // Función para asignar medallas
    const getMedal = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return index + 1;
    };

    return (
        <div className="ranking-container" style={{padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
            <h2 style={{textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase'}}>
                🏆 Tabla de Posiciones
            </h2>

            {/* --- SELECTOR DE FECHAS --- */}
            <div className="ranking-filter" style={{marginBottom: '20px', display: 'flex', justifyContent: 'center'}}>
                <select 
                    value={rondaSeleccionada} 
                    onChange={(e) => setRondaSeleccionada(e.target.value)}
                    style={{
                        padding: '10px 20px',
                        fontSize: '1rem',
                        borderRadius: '25px',
                        border: '1px solid #4caf50',
                        backgroundColor: '#222',
                        color: 'white',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {fechasDisponibles.map(f => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p style={{textAlign:'center'}}>Cargando posiciones...</p>
            ) : (
                <div className="ranking-list">
                    {rankingData.length === 0 ? (
                        <p style={{textAlign:'center', color: '#888'}}>No hay datos para esta fecha.</p>
                    ) : (
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <thead>
                                <tr style={{borderBottom: '2px solid #444', color: '#888', fontSize: '0.9rem'}}>
                                    <th style={{padding: '10px', textAlign: 'center'}}>#</th>
                                    <th style={{padding: '10px', textAlign: 'left'}}>Usuario</th>
                                    {rondaSeleccionada !== 'General' && <th style={{padding: '10px', textAlign: 'left'}}>Boleta</th>}
                                    <th style={{padding: '10px', textAlign: 'right'}}>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingData.map((user, index) => (
                                    <tr key={index} style={{
                                        borderBottom: '1px solid #333', 
                                        backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
                                    }}>
                                        <td style={{padding: '15px 10px', textAlign: 'center', fontSize: '1.2rem'}}>
                                            {getMedal(index)}
                                        </td>
                                        <td style={{padding: '10px', fontWeight: 'bold'}}>
                                            {user.username}
                                            {index === 0 && <span style={{marginLeft:'5px', fontSize:'0.8rem'}}>👑</span>}
                                        </td>
                                        
                                        {/* Si es por fecha, mostramos el nombre de la boleta */}
                                        {rondaSeleccionada !== 'General' && (
                                            <td style={{padding: '10px', color: '#aaa', fontSize: '0.85rem'}}>
                                                {user.ticket_name}
                                            </td>
                                        )}

                                        <td style={{padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#4caf50', fontSize: '1.1rem'}}>
                                            {user.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default Ranking;