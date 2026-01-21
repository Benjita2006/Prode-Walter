// src/components/Ranking.jsx (VISUAL MEJORADA)
import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import './Ranking.css'; 

function Ranking() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/ranking`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

                const data = await response.json();
                
                if (Array.isArray(data)) {
                    setUsers(data);
                } else {
                    setUsers([]); 
                }

            } catch (err) {
                console.error("Error cargando ranking:", err);
                setError("No se pudo cargar la tabla.");
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    // Función auxiliar para iconos
    const getMedal = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    // Función auxiliar para clases CSS
    const getRowClass = (index) => {
        if (index === 0) return 'rank-1';
        if (index === 1) return 'rank-2';
        if (index === 2) return 'rank-3';
        return '';
    };

    if (loading) return <div className="loading-spinner">Cargando posiciones...</div>;
    if (error) return <div className="error-message">⚠️ {error}</div>;

    return (
        <div className="ranking-container">
            <h2 className="ranking-title">🏆 Tabla de Posiciones</h2>
            
            <div className="table-responsive">
                <table className="ranking-table">
                    <thead>
                        <tr>
                            <th style={{width: '60px'}}>Pos</th>
                            <th>Jugador</th>
                            <th style={{textAlign: 'right'}}>Puntos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user, index) => (
                                <tr key={index} className={getRowClass(index)}>
                                    <td className="rank-position">
                                        {getMedal(index)}
                                    </td>
                                    <td className="rank-user">
                                        {user.username}
                                        {index === 0 && <span style={{fontSize:'0.8em', marginLeft:'10px', color:'#ffd700'}}>👑 LÍDER</span>}
                                    </td>
                                    <td className="rank-points">
                                        {user.points} <span style={{fontSize:'0.8rem', fontWeight:'normal', opacity:0.7}}>pts</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{textAlign: 'center', padding: '30px'}}>
                                    Aún no hay puntos registrados. ¡Sé el primero en jugar!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Ranking;