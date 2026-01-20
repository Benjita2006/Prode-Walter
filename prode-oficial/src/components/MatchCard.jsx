import React, { useState } from 'react';
import { API_URL } from '../config'; 
import './MatchCard.css'; 

function MatchCard({ 
    equipoA, logoA, 
    equipoB, logoB, 
    fecha, status, 
    matchId, valorInicial, 
    yaGuardado 
}) { 
    
    const [seleccion, setSeleccion] = useState(valorInicial || null);
    const [requestStatus, setRequestStatus] = useState(yaGuardado ? 'submitted' : null); 

    const manejarEnvio = async () => {
        if (!seleccion) return; 

        setRequestStatus('loading');
        const token = localStorage.getItem('token');

        try {
            // 👇 2. CORREGIDO: Usamos API_URL y la ruta correcta de predictions
            const response = await fetch(`${API_URL}/api/predictions/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ matchId, result: seleccion }),
            });
            
            const data = await response.json();
            if (response.ok && data.success) setRequestStatus('submitted'); 
            else { setRequestStatus(null); alert(data.message); }

        } catch (error) {
            setRequestStatus(null);
            console.error(error);
        }
    };

    // ... (El resto del renderizado, return y HTML sigue IGUAL, no hace falta cambiarlo)
    const bloqueado = requestStatus === 'submitted' || requestStatus === 'loading' || status === 'FT';

    return (
        <div className={`match-card ${yaGuardado ? 'card-voted' : ''}`}>
            {/* ... Todo el HTML de la tarjeta sigue igual ... */}
            <div className="card-header">
                <span className="match-date">{fecha}</span>
                <span className={`status-badge`}>{status}</span>
            </div>

            <div className="card-body">
                {/* LOCAL */}
                <div 
                    className={`team-col team-selectable ${seleccion === 'HOME' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                    onClick={() => !bloqueado && setSeleccion('HOME')}
                >
                    <img src={logoA} alt={equipoA} className="team-logo" />
                    <span className="team-name">{equipoA}</span>
                    {seleccion === 'HOME' && <div className="check-mark">✅ GANA</div>}
                </div>

                {/* EMPATE */}
                <div className="draw-col">
                    <button 
                        className={`btn-draw ${seleccion === 'DRAW' ? 'selected-draw' : ''}`}
                        onClick={() => !bloqueado && setSeleccion('DRAW')}
                        disabled={bloqueado}
                    >
                        EMPATE
                    </button>
                </div>

                {/* VISITANTE */}
                <div 
                    className={`team-col team-selectable ${seleccion === 'AWAY' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                    onClick={() => !bloqueado && setSeleccion('AWAY')}
                >
                    <img src={logoB} alt={equipoB} className="team-logo" />
                    <span className="team-name">{equipoB}</span>
                    {seleccion === 'AWAY' && <div className="check-mark">✅ GANA</div>}
                </div>
            </div>

            <div className="card-footer">
                {requestStatus === 'submitted' ? (
                    <div className="success-msg">✅ Pronóstico Guardado</div>
                ) : (
                    status !== 'FT' && (
                        <button 
                            onClick={manejarEnvio} 
                            className="btn-save"
                            disabled={requestStatus === 'loading' || !seleccion}
                        >
                            {requestStatus === 'loading' ? 'Guardando...' : 'Confirmar Pronóstico'}
                        </button>
                    )
                )}
            </div>
        </div>
    );
}

export default MatchCard;