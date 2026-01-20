// src/components/Ranking.jsx (VERSIÓN SEGURA)
import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import './Ranking.css'; // Asegúrate de que este archivo exista o quita la línea

function Ranking() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const token = localStorage.getItem('token');
                // IMPORTANTE: Asegúrate de que API_URL esté bien importada
                const response = await fetch(`${API_URL}/api/ranking`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status}`);
                }

                const data = await response.json();
                
                // VALIDACIÓN DE SEGURIDAD:
                // Si data no es un array, lo convertimos en uno vacío para no romper el .map
                if (Array.isArray(data)) {
                    setUsers(data);
                } else {
                    console.error("El ranking no devolvió una lista válida:", data);
                    setUsers([]); 
                }

            } catch (err) {
                console.error("Error cargando ranking:", err);
                setError("No se pudo cargar el ranking. Intenta más tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    if (loading) return <div className="loading-spinner">Cargando Tabla...</div>;
    if (error) return <div className="error-message">⚠️ {error}</div>;

    return (
        <div className="ranking-container">
            <h2 className="ranking-title">🏆 Tabla de Posiciones</h2>
            <table className="ranking-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Jugador</th>
                        <th>Puntos</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user, index) => (
                            <tr key={index} className={index < 3 ? `top-${index + 1}` : ''}>
                                <td className="rank-position">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </td>
                                <td className="rank-user">{user.username}</td>
                                <td className="rank-points">{user.points} pts</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={{textAlign: 'center'}}>Aún no hay puntos registrados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Ranking;