import React from 'react';
import './MatchCard.css';
// Eliminada la referencia a framer-motion para evitar errores

const MatchCard = ({ matchId, equipoA, logoA, equipoB, logoB, fecha, status, bloqueado, seleccionActual, onSeleccionChange, golesA, golesB }) => {

    const ahora = new Date();
    const horaPartido = new Date(fecha);
    
    const estaCerrado = ahora >= horaPartido || status === 'FT' || bloqueado;

    const fechaFormateada = horaPartido.toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const handleSelect = (valor) => {
        if (!estaCerrado) {
            onSeleccionChange(matchId, valor);
        }
    };

    return (
        <div className={`match-card ${estaCerrado ? 'bloqueado' : ''}`}>
            
            <div className="match-header">
                <span className="match-date">{fechaFormateada} HS</span>
                
                <span className={`match-status-badge ${estaCerrado && status === 'NS' ? 'closed' : status.toLowerCase()}`}>
                    {status === 'FT' ? 'FINAL' : (ahora >= horaPartido ? 'CERRADO' : 'POR JUGAR')}
                </span>
            </div>

            <div className="match-content">
                <div className="team-container">
                    <img src={logoA} alt={equipoA} className="team-logo" />
                    <span className={`team-name ${(status === 'FT' && golesA > golesB) ? 'winner' : ''}`}>
                        {equipoA}
                    </span>
                </div>

                <div className="match-vs">
                    {status === 'FT' ? (
                        <div className="real-score">
                            <span className={golesA > golesB ? 'winner' : ''}>{golesA}</span>
                            <span className="score-divider">-</span>
                            <span className={golesB > golesA ? 'winner' : ''}>{golesB}</span>
                        </div>
                    ) : (
                        <div className="vs-circle">VS</div>
                    )}
                </div>

                <div className="team-container">
                    <img src={logoB} alt={equipoB} className="team-logo" />
                    <span className={`team-name ${(status === 'FT' && golesB > golesA) ? 'winner' : ''}`}>
                        {equipoB}
                    </span>
                </div>
            </div>

            <div className="prediction-footer">
                <div className="prediction-options">
                    <button 
                        className={`predict-btn ${seleccionActual === 'HOME' ? 'selected-home' : ''}`}
                        onClick={() => handleSelect('HOME')}
                        disabled={estaCerrado}
                    >
                        LOCAL
                    </button>
                    <button 
                        className={`predict-btn ${seleccionActual === 'DRAW' ? 'selected-draw' : ''}`}
                        onClick={() => handleSelect('DRAW')}
                        disabled={estaCerrado}
                    >
                        EMPATE
                    </button>
                    <button 
                        className={`predict-btn ${seleccionActual === 'AWAY' ? 'selected-away' : ''}`}
                        onClick={() => handleSelect('AWAY')}
                        disabled={estaCerrado}
                    >
                        VISITA
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MatchCard;