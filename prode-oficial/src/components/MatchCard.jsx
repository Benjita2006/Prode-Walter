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
    
    // Fallback de imagen
    const fallbackLogo = "https://cdn-icons-png.flaticon.com/512/16/16480.png";
    const handleImageError = (e) => {
        e.target.src = fallbackLogo;
        e.target.style.opacity = "0.5"; 
    };

    // 📅 FORMATEO DE FECHA Y HORA
    // Queremos que se vea así: "22/01 - 19:00 hs"
    let infoFecha = "--/--";
    let infoHora = "--:--";

    try {
        const d = new Date(fecha);
        if (!isNaN(d.getTime())) {
            // Formato Fecha: 22/01
            infoFecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            // Formato Hora: 19:00
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            infoHora = `${hours}:${minutes}`;
        }
    } catch (e) {
        console.error(e);
    }

    const traducirEstado = (st) => {
        switch(st) {
            case 'NS': return 'Por Jugar';
            case 'FT': return 'Final';
            case 'PST': return 'Postergado';
            default: return st; // Muestra minutos (ej: 45')
        }
    };

    const handleClick = (opcion) => {
        // Si está bloqueado (ya votó o ya empezó), no hacemos nada
        if (!bloqueado && onSeleccionChange) {
            onSeleccionChange(matchId, opcion);
        }
    };

    return (
        // Si está bloqueado, le agregamos la clase 'card-locked' para bajarle opacidad visualmente
        <div className={`match-card ${seleccionActual ? 'card-voted' : ''} ${bloqueado ? 'card-locked' : ''}`}>
            
            <div className="card-header">
                {/* 📅 AQUÍ MOSTRAMOS LA FECHA Y LA HORA JUNTAS */}
                <span className="match-date">
                     {infoFecha} <span style={{opacity: 0.5, margin: '0 5px'}}>|</span>  {infoHora} hs
                </span>
                
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

                {/* EMPATE */}
                <div className="draw-col">
                    <button 
                        className={`btn-draw ${seleccionActual === 'DRAW' ? 'selected-draw' : ''}`}
                        onClick={() => handleClick('DRAW')}
                        disabled={bloqueado}
                        style={{fontSize: '0.75rem', fontWeight: 'bold'}}
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