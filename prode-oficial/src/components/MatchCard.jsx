// src/components/MatchCard.jsx (CORREGIDO VISUALMENTE)
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
    
    // Fallback de imagen
    const fallbackLogo = "https://cdn-icons-png.flaticon.com/512/16/16480.png";
    const handleImageError = (e) => {
        e.target.src = fallbackLogo;
        e.target.style.opacity = "0.5"; 
    };

    // FORMATEO DE HORA AMIGABLE
    let horaDisplay = "--:--";
    try {
        const d = new Date(fecha);
        // Ajuste manual simple para asegurar visualización
        if (!isNaN(d.getTime())) {
            // Extraemos hora y minutos. Ejemplo: "19:30"
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            horaDisplay = `${hours}:${minutes} hs`;
        }
    } catch (e) {
        console.error("Error fecha:", e);
    }

    const traducirEstado = (st) => {
        switch(st) {
            case 'NS': return 'Por Jugar'; // Texto más corto
            case 'FT': return 'Final';
            default: return st;
        }
    };

    const handleClick = (opcion) => {
        if (!bloqueado && onSeleccionChange) {
            onSeleccionChange(matchId, opcion);
        }
    };

    return (
        <div className={`match-card ${seleccionActual ? 'card-voted' : ''}`}>
            
            <div className="card-header">
                <span className="match-date">⏰ {horaDisplay}</span>
                <span className={`status-badge ${status === 'FT' ? 'status-finished' : 'status-scheduled'}`}>
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

                {/* EMPATE (RESTITUÍDO) */}
                <div className="draw-col">
                    <button 
                        className={`btn-draw ${seleccionActual === 'DRAW' ? 'selected-draw' : ''}`}
                        onClick={() => handleClick('DRAW')}
                        disabled={bloqueado}
                        style={{fontSize: '0.75rem', fontWeight: 'bold'}} // Ajuste para que entre bien
                    >
                        EMPATE
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