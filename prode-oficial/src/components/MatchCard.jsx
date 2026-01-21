import React, { useState } from 'react';
import { API_URL } from '../config'; 
import './MatchCard.css'; 

function MatchCard({ matchId, fecha, status, equipoA, logoA, equipoB, logoB, valorInicial, yaGuardado }) {
    
    // Estado de la selección ('HOME', 'DRAW', 'AWAY')
    const [seleccion, setSeleccion] = useState(valorInicial || null);
    const [loading, setLoading] = useState(false);
    const [bloqueado, setBloqueado] = useState(yaGuardado); // Si ya votó, se bloquea visualmente

    // 🛡️ IMAGEN POR DEFECTO (Si falla la carga)
    const fallbackLogo = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

    const handleImageError = (e) => {
        e.target.src = fallbackLogo;
        e.target.style.opacity = "0.5"; // Lo ponemos un poco transparente para que se note que es genérico
    };

    // Función para enviar el voto
    const handleVote = async (eleccion) => {
        // Si el partido ya terminó o está cargando, no hacemos nada
        if (status === 'FT' || loading) return;

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/api/predictions/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    matchId: matchId,
                    result: eleccion // Enviamos 'HOME', 'DRAW' o 'AWAY'
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSeleccion(eleccion);
                setBloqueado(true); // Bloqueamos para dar feedback de "Guardado"
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error al votar:', error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    // Formatear hora
    const fechaObj = new Date(fecha);
    const hora = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const esFinalizado = status === 'FT';

    return (
        <div className={`match-card ${bloqueado ? 'voted' : ''}`}>
            
            {/* ENCABEZADO: Hora y Estado */}
            <div className="card-header">
                <span className="match-time">⏰ {hora}</span>
                {esFinalizado ? (
                    <span style={{color: '#f44336', fontWeight: 'bold'}}>FINALIZADO</span>
                ) : bloqueado ? (
                    <span style={{color: '#4caf50', fontWeight: 'bold'}}>PRONÓSTICO GUARDADO ✅</span>
                ) : (
                    <span>Juega y gana puntos</span>
                )}
            </div>

            {/* CUERPO: Equipos y Botones */}
            <div className="card-body">
                
                {/* EQUIPO LOCAL (A) */}
                <div className="team-col">
                    <div 
                        className={`team-selectable ${seleccion === 'HOME' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                        onClick={() => !bloqueado && handleVote('HOME')}
                    >
                        <img 
                            src={logoA || fallbackLogo} // Si viene nulo, usa fallback
                            onError={handleImageError}  // Si falla al cargar, usa fallback
                            alt={equipoA} 
                            className="team-logo" 
                        />
                        <div className="team-name">{equipoA}</div>
                        {seleccion === 'HOME' && <div className="check-mark">✔ GANA</div>}
                    </div>
                </div>

                {/* EMPATE (Centro) */}
                <div className="draw-col">
                    <button 
                        className={`btn-draw ${seleccion === 'DRAW' ? 'selected-draw' : ''}`}
                        onClick={() => !bloqueado && handleVote('DRAW')}
                        disabled={bloqueado || esFinalizado}
                    >
                        EMPATE
                        {seleccion === 'DRAW' && <div style={{fontSize: '0.7rem'}}>✔</div>}
                    </button>
                </div>

                {/* EQUIPO VISITANTE (B) */}
                <div className="team-col">
                    <div 
                        className={`team-selectable ${seleccion === 'AWAY' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                        onClick={() => !bloqueado && handleVote('AWAY')}
                    >
                        <img 
                            src={logoB || fallbackLogo} 
                            onError={handleImageError} 
                            alt={equipoB} 
                            className="team-logo" 
                        />
                        <div className="team-name">{equipoB}</div>
                        {seleccion === 'AWAY' && <div className="check-mark">✔ GANA</div>}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default MatchCard;