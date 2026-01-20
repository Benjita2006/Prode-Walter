// src/components/Ranking.jsx (CORREGIDO)
import React, { useState, useEffect } from 'react';
import './Ranking.css';
import { API_URL } from '../config'; // 👈 1. Importado correctamente

function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async () => {
        const token = localStorage.getItem('token');
        try {
            // 👇 2. CORREGIDO: Sintaxis limpia, sin los tres puntos (...)
            const res = await fetch(`${API_URL}/api/ranking`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRanking(data);
        } catch (error) {
            console.error(error);
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

    if (loading) return <div className="loading-text">Cargando posiciones...</div>;

    return (
        <div className="ranking-container">
            <h2 className="ranking-title">🏆 Tabla de Posiciones</h2>
            
            <div className="ranking-card">
                <table className="ranking-table">
                    <thead>
                        <tr>
                            <th style={{width: '15%'}}>#</th>
                            <th style={{textAlign: 'left'}}>Usuario</th>
                            <th style={{textAlign: 'right'}}>Puntos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranking.map((user, index) => (
                            <tr key={index} className={`rank-row position-${index + 1}`}>
                                <td className="rank-pos">{getMedal(index)}</td>
                                <td className="rank-user">
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{user.username}</span>
                                    </div>
                                </td>
                                <td className="rank-points">{user.puntos}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {ranking.length === 0 && <p className="no-data">Nadie ha sumado puntos aún.</p>}
            </div>
        </div>
    );
}

export default Ranking;