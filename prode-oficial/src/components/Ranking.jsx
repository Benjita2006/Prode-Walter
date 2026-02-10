// src/components/Ranking.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './Ranking.css'; 

function Ranking() {
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Estado para el filtro
    const [rondaSeleccionada, setRondaSeleccionada] = useState('General');

    // Recuperamos el usuario actual para resaltarlo en la lista
    const currentUser = localStorage.getItem('username');

    // Lista de fechas disponibles
    const fechasDisponibles = [
        'General',
        'Fecha 1', 'Fecha 2', 'Fecha 3', 'Fecha 4', 'Fecha 5', 'Fecha 6', 
        'Fecha 7', 'Fecha 8', 'Fecha 9', 'Fecha 10', 'Fecha 11', 'Fecha 12'
    ];

    useEffect(() => {
        fetchRanking();
    }, [rondaSeleccionada]); 

    const fetchRanking = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/ranking?round=${rondaSeleccionada}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            // Aseguramos que venga ordenado por puntos (mayor a menor)
            // Si el backend ya lo hace, esto es redundante pero seguro
            const sortedData = data.sort((a, b) => b.points - a.points);
            
            setRankingData(sortedData);
        } catch (error) {
            console.error("Error cargando ranking:", error);
        } finally {
            setLoading(false);
        }
    };

    // Iconos de medallas
    const getRankIcon = (index) => {
        if (index === 0) return '🏆';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return index + 1; // Si no es top 3, devuelve el número
    };

    // Clase CSS según posición
    const getRankClass = (index) => {
        if (index === 0) return 'rank-1';
        if (index === 1) return 'rank-2';
        if (index === 2) return 'rank-3';
        return '';
    };

    return (
        <div className="ranking-container">
            
            {/* CABECERA */}
            <div className="ranking-header-area">
                <h2 className="ranking-title">🏆 Tabla de Posiciones</h2>
                
                {/* SELECTOR */}
                <select 
                    className="ranking-selector"
                    value={rondaSeleccionada} 
                    onChange={(e) => setRondaSeleccionada(e.target.value)}
                >
                    {fechasDisponibles.map(f => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                    ))}
                </select>
            </div>

            {/* CONTENIDO */}
            {loading ? (
                <div className="loading-state">
                    <p>Cargando posiciones...</p>
                </div>
            ) : (
                <div className="ranking-list">
                    {rankingData.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay datos registrados para esta fecha.</p>
                        </div>
                    ) : (
                        rankingData.map((user, index) => {
                            const isMe = user.username === currentUser;
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`ranking-card ${getRankClass(index)} ${isMe ? 'is-me' : ''}`}
                                >
                                    {/* 1. Posición / Medalla */}
                                    <div className="rank-position">
                                        {getRankIcon(index)}
                                    </div>

                                    {/* 2. Avatar (Inicial del nombre) */}
                                    <div className="user-avatar">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>

                                    {/* 3. Datos del Usuario */}
                                    <div className="user-info">
                                        <span className="user-name">
                                            {user.username} {isMe && '(Yo)'}
                                        </span>
                                        {/* Solo mostramos la boleta si no es General */}
                                        {rondaSeleccionada !== 'General' && user.ticket_name && (
                                            <span className="ticket-name">🎫 {user.ticket_name}</span>
                                        )}
                                    </div>

                                    {/* 4. Puntos */}
                                    <div className="user-points">
                                        {user.points}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default Ranking;