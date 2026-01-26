// src/components/MatchCard.jsx
import React from 'react';
import './MatchCard.css';

function MatchCard({ 
    matchId, 
    equipoA, logoA, 
    equipoB, logoB, 
    fecha, status, 
    bloqueado, 
    seleccionActual, 
    onSeleccionChange,
    golesA, golesB, // Para cuando hay resultado real
    esAdmin, onEditClick
}) {

    // Formato de fecha bonito (Ej: "Lun 26 - 17:00")
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const handleSelect = (valor) => {
        if (!bloqueado) {
            onSeleccionChange(matchId, valor);
        }
    };

    return (
        <div className={`match-card ${bloqueado ? 'bloqueado' : ''}`}>
            
            {/* 1. CABECERA: Fecha y Estado */}
            <div className="match-header">
                <span className="match-date">{fechaFormateada} HS</span>
                <span className={`match-status-badge ${status.toLowerCase()}`}>
                    {status === 'NS' ? 'POR JUGAR' : status === 'FT' ? 'FINAL' : status}
                </span>
                
                {/* Botón Admin Flotante (Si aplica) */}
                {esAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); onEditClick(matchId); }} 
                        style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem'}}>
                        ✏️
                    </button>
                )}
            </div>

            {/* 2. CONTENIDO PRINCIPAL: Equipos y VS */}
            <div className="match-content">
                {/* LOCAL */}
                <div className="team-container">
                    <img src={logoA} alt={equipoA} className="team-logo" />
                    <span className="team-name">{equipoA}</span>
                </div>

                {/* CENTRO: VS o RESULTADO */}
                <div className="match-vs">
                    {status === 'FT' && golesA !== null ? (
                        <div className="real-score">
                            {golesA} - {golesB}
                        </div>
                    ) : (
                        <div className="vs-circle">VS</div>
                    )}
                </div>

                {/* VISITANTE */}
                <div className="team-container">
                    <img src={logoB} alt={equipoB} className="team-logo" />
                    <span className="team-name">{equipoB}</span>
                </div>
            </div>

            {/* 3. FOOTER: BOTONES DE PRONÓSTICO */}
            <div className="prediction-footer">
                {bloqueado ? (
                    <div style={{width:'100%', textAlign:'center'}}>
                        {seleccionActual ? (
                            <span style={{color: '#aaa', fontWeight:'bold', fontSize:'0.9rem'}}>
                                TU PRONÓSTICO: <span style={{color:'white'}}>{
                                    seleccionActual === 'HOME' ? equipoA : 
                                    seleccionActual === 'AWAY' ? equipoB : 'EMPATE'
                                }</span>
                            </span>
                        ) : (
                            <span style={{color:'#666', fontSize:'0.8rem'}}>NO PRONOSTICADO</span>
                        )}
                    </div>
                ) : (
                    <div className="prediction-options">
                        <button 
                            className={`predict-btn ${seleccionActual === 'HOME' ? 'selected-home' : ''}`}
                            onClick={() => handleSelect('HOME')}
                        >
                            LOCAL
                        </button>
                        <button 
                            className={`predict-btn ${seleccionActual === 'DRAW' ? 'selected-draw' : ''}`}
                            onClick={() => handleSelect('DRAW')}
                        >
                            EMPATE
                        </button>
                        <button 
                            className={`predict-btn ${seleccionActual === 'AWAY' ? 'selected-away' : ''}`}
                            onClick={() => handleSelect('AWAY')}
                        >
                            VISITA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MatchCard;