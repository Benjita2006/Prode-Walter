// src/components/MatchCard.jsx
import React from 'react';
import './MatchCard.css'; 

function MatchCard({ 
    equipoA, logoA, 
    equipoB, logoB, 
    fecha, status, 
    matchId, 
    seleccionActual, 
    onSeleccionChange, 
    bloqueado 
}) { 
    
    // 🛡️ LÓGICA DE IMAGEN
    const fallbackLogo = "https://cdn-icons-png.flaticon.com/512/16/16480.png";
    const handleImageError = (e) => {
        e.target.src = fallbackLogo;
        e.target.style.opacity = "0.5"; 
    };

    // 🛡️ FORMATEO DE HORA
    let hora = "";
    try {
        const d = new Date(fecha);
        if (!isNaN(d.getTime())) {
            hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    } catch (e) {
        console.error(e); // 👈 CORRECCIÓN: Usamos la variable 'e' en vez de dejar vacío
    }

    // 🛡️ TRADUCTOR
    const traducirEstado = (st) => {
        switch(st) {
            case 'NS': return 'No Empezado';
            case 'FT': return 'Finalizado';
            case '1H': return '1er Tiempo';
            case 'HT': return 'Entretiempo';
            case '2H': return '2do Tiempo';
            case 'PST': return 'Postergado';
            default: return st;
        }
    };

    // Manejador de clic
    const handleClick = (opcion) => {
        if (!bloqueado && onSeleccionChange) {
            onSeleccionChange(matchId, opcion);
        }
    };

    return (
        <div className={`match-card ${seleccionActual ? 'card-voted' : ''}`}>
            
            {/* Cabecera Minimalista */}
            <div className="card-header" style={{padding: '5px 10px', minHeight: 'auto'}}>
                <span className="match-date" style={{fontSize: '0.8rem'}}>⏰ {hora}</span>
                <span className={`status-badge ${status === 'FT' ? 'status-finished' : 'status-scheduled'}`} style={{fontSize: '0.7rem', padding: '2px 6px'}}>
                    {traducirEstado(status)}
                </span>
            </div>

            <div className="card-body">
                {/* LOCAL */}
                <div 
                    className={`team-col team-selectable ${seleccionActual === 'HOME' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                    onClick={() => handleClick('HOME')}
                >
                    <img src={logoA || fallbackLogo} onError={handleImageError} alt={equipoA} className="team-logo" />
                    <span className="team-name">{equipoA}</span>
                    {seleccionActual === 'HOME' && <div className="check-mark">✅</div>}
                </div>

                {/* EMPATE */}
                <div className="draw-col">
                    <button 
                        className={`btn-draw ${seleccionActual === 'DRAW' ? 'selected-draw' : ''}`}
                        onClick={() => handleClick('DRAW')}
                        disabled={bloqueado}
                    >
                        X
                    </button>
                </div>

                {/* VISITANTE */}
                <div 
                    className={`team-col team-selectable ${seleccionActual === 'AWAY' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                    onClick={() => handleClick('AWAY')}
                >
                    <img src={logoB || fallbackLogo} onError={handleImageError} alt={equipoB} className="team-logo" />
                    <span className="team-name">{equipoB}</span>
                    {seleccionActual === 'AWAY' && <div className="check-mark">✅</div>}
                </div>
            </div>
        </div>
    );
}

export default MatchCard;