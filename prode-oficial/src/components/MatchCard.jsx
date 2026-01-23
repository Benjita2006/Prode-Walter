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
    bloqueado,
    golesA, // Goles del local
    golesB  // Goles del visitante
}) { 
    
    const fallbackLogo = "https://cdn-icons-png.flaticon.com/512/16/16480.png";
    const handleImageError = (e) => {
        e.target.src = fallbackLogo;
        e.target.style.opacity = "0.5"; 
    };

    // --- FORMATEO DE FECHA (CON CORRECCIÓN DE ZONA HORARIA) ---
    let infoFecha = "--/--";
    let infoHora = "--:--";

    try {
        const d = new Date(fecha);
        
        if (!isNaN(d.getTime())) {
            // 👇 CORRECCIÓN: Ajustamos la zona horaria para que no reste 3 horas
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());

            infoFecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            infoHora = `${hours}:${minutes}`;
        }
    } catch (e) { 
        console.error("Error al formatear fecha:", e); 
    }
    // -----------------------------------------------------------

    const traducirEstado = (st) => {
        switch(st) {
            case 'NS': return 'Por Jugar';
            case 'FT': return 'Finalizado';
            case 'PST': return 'Postergado';
            default: return st;
        }
    };

    const handleClick = (opcion) => {
        if (!bloqueado && onSeleccionChange) {
            onSeleccionChange(matchId, opcion);
        }
    };

    // 🏆 LÓGICA DE RESULTADO
    const esFinal = status === 'FT';
    // Determinamos quién ganó para pintarlo de verde
    // (Solo si los goles son números válidos y no null/undefined)
    const scoreValido = esFinal && golesA != null && golesB != null;
    const ganaA = scoreValido && Number(golesA) > Number(golesB);
    const ganaB = scoreValido && Number(golesB) > Number(golesA);

    return (
        <div className={`match-card ${seleccionActual ? 'card-voted' : ''} ${bloqueado ? 'card-locked' : ''}`}>
            
            <div className="card-header">
                {/* Si terminó, mostramos "Resultado Final", si no, la fecha */}
                <span className="match-date">
                    {esFinal ? '🏁 Resultado Final' : `📅 ${infoFecha} | ⏰ ${infoHora} hs`}
                </span>
                <span className={`status-badge ${status === 'FT' ? 'status-finished' : 'status-scheduled'}`}>
                    {traducirEstado(status)}
                </span>
            </div>

            <div className="card-body">
                {/* --- EQUIPO LOCAL --- */}
                <div 
                    className={`team-col team-selectable ${seleccionActual === 'HOME' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                    onClick={() => handleClick('HOME')}
                >
                    <img src={logoA || fallbackLogo} onError={handleImageError} alt={equipoA} className="team-logo" />
                    
                    {/* Nombre del equipo (Verde si ganó) */}
                    <span className="team-name" style={ganaA ? {color: '#4caf50', fontWeight:'bold'} : {}}>
                        {equipoA}
                    </span>

                    {/* Check de tu voto */}
                    {seleccionActual === 'HOME' && <div className="check-mark">✅</div>}
                </div>

                {/* --- CENTRO: O BOTÓN EMPATE O MARCADOR --- */}
                <div className="draw-col">
                    {esFinal ? (
                        /* 🟢 SI TERMINÓ: Mostramos el marcador GRANDE */
                        <div className="score-display">
                            <span className="score-number">{golesA ?? '-'}</span>
                            <span className="score-divider">-</span>
                            <span className="score-number">{golesB ?? '-'}</span>
                        </div>
                    ) : (
                        /* ⚪ SI NO TERMINÓ: Mostramos el botón de EMPATE */
                        <button 
                            className={`btn-draw ${seleccionActual === 'DRAW' ? 'selected-draw' : ''}`}
                            onClick={() => handleClick('DRAW')}
                            disabled={bloqueado}
                            style={{fontSize: '0.75rem', fontWeight: 'bold'}}
                        >
                            EMPATE
                        </button>
                    )}
                </div>

                {/* --- EQUIPO VISITANTE --- */}
                <div 
                    className={`team-col team-selectable ${seleccionActual === 'AWAY' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                    onClick={() => handleClick('AWAY')}
                >
                    <img src={logoB || fallbackLogo} onError={handleImageError} alt={equipoB} className="team-logo" />
                    
                    {/* Nombre del equipo (Verde si ganó) */}
                    <span className="team-name" style={ganaB ? {color: '#4caf50', fontWeight:'bold'} : {}}>
                        {equipoB}
                    </span>

                    {seleccionActual === 'AWAY' && <div className="check-mark">✅</div>}
                </div>
            </div>
        </div>
    );
}

export default MatchCard;