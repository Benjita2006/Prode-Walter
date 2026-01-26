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
    golesA, golesB, 
    esAdmin, onEditClick
}) {

    const fechaFormateada = new Date(fecha).toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const handleSelect = (valor) => {
        if (!bloqueado) {
            onSeleccionChange(matchId, valor);
        }
    };

    // --- LÓGICA DE GANADOR ---
    const isFinished = status === 'FT' && golesA !== null && golesB !== null;
    const isHomeWinner = isFinished && golesA > golesB;
    const isAwayWinner = isFinished && golesB > golesA;
    // 🗑️ Eliminamos 'isDraw' porque no lo estamos usando visualmente

    return (
        <div className={`match-card ${bloqueado ? 'bloqueado' : ''}`}>
            
            <div className="match-header">
                <span className="match-date">{fechaFormateada} HS</span>
                <span className={`match-status-badge ${status.toLowerCase()}`}>
                    {status === 'NS' ? 'POR JUGAR' : status === 'FT' ? 'FINAL' : status}
                </span>
                {esAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); onEditClick(matchId); }} 
                        style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem'}}>✏️</button>
                )}
            </div>

            <div className="match-content">
                {/* LOCAL */}
                <div className="team-container">
                    <img src={logoA} alt={equipoA} className="team-logo" />
                    {/* Aplicamos clase winner si ganó el local */}
                    <span className={`team-name ${isHomeWinner ? 'winner' : isFinished ? 'loser' : ''}`}>
                        {equipoA}
                    </span>
                </div>

                {/* CENTRO: VS o RESULTADO */}
                <div className="match-vs">
                    {isFinished ? (
                        <div className="real-score">
                            {/* Número Local (Verde si ganó) */}
                            <span className={`score-number ${isHomeWinner ? 'winner' : ''}`}>
                                {golesA}
                            </span>
                            
                            <span className="score-divider">-</span>
                            
                            {/* Número Visita (Verde si ganó) */}
                            <span className={`score-number ${isAwayWinner ? 'winner' : ''}`}>
                                {golesB}
                            </span>
                        </div>
                    ) : (
                        <div className="vs-circle">VS</div>
                    )}
                </div>

                {/* VISITANTE */}
                <div className="team-container">
                    <img src={logoB} alt={equipoB} className="team-logo" />
                    {/* Aplicamos clase winner si ganó la visita */}
                    <span className={`team-name ${isAwayWinner ? 'winner' : isFinished ? 'loser' : ''}`}>
                        {equipoB}
                    </span>
                </div>
            </div>

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