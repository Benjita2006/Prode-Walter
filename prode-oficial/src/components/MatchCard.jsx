// src/components/MatchCard.jsx (RESTAURADO + FIX IMÁGENES)
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
    
    // Estado de la selección ('HOME', 'DRAW', 'AWAY')
    const [seleccion, setSeleccion] = useState(valorInicial || null);
    const [requestStatus, setRequestStatus] = useState(yaGuardado ? 'submitted' : null); 

    // 🛡️ LÓGICA DE IMAGEN (NUEVO)
    const fallbackLogo = "https://cdn-icons-png.flaticon.com/512/16/16480.png";
    const handleImageError = (e) => {
        e.target.src = fallbackLogo;
        e.target.style.opacity = "0.5"; 
    };

    // 🛡️ LÓGICA DE FECHA (NUEVO)
    // Intentamos formatear la fecha solo si es válida
    let fechaFormateada = fecha;
    try {
        const d = new Date(fecha);
        // Si la fecha es válida, la mostramos bonita. Si no, mostramos el texto original.
        if (!isNaN(d.getTime())) {
            fechaFormateada = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    } catch (e) {
        console.warn("Fecha inválida:", fecha, e);
    }


    const manejarEnvio = async () => {
        if (!seleccion) return; 

        setRequestStatus('loading');
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/api/predictions/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ matchId, result: seleccion }),
            });
            
            const data = await response.json();
            if (response.ok && data.success) {
                setRequestStatus('submitted'); 
            } else { 
                setRequestStatus(null); 
                alert(data.message || "Error al guardar"); 
            }

        } catch (error) {
            setRequestStatus(null);
            console.error(error);
            alert("Error de conexión");
        }
    };

    const bloqueado = requestStatus === 'submitted' || requestStatus === 'loading' || status === 'FT';

    return (
        <div className={`match-card ${requestStatus === 'submitted' ? 'card-voted' : ''}`}>
            
            <div className="card-header">
                {/* Usamos la fecha corregida */}
                <span className="match-date">⏰ {fechaFormateada}</span>
                
                {status === 'FT' ? (
                     <span className="status-badge status-finished">FINALIZADO</span>
                ) : (
                     <span className="status-badge status-scheduled">{status}</span>
                )}
            </div>

            <div className="card-body">
                {/* LOCAL */}
                <div 
                    className={`team-col team-selectable ${seleccion === 'HOME' ? 'selected-win' : ''} ${bloqueado ? 'disabled' : ''}`}
                    onClick={() => !bloqueado && setSeleccion('HOME')}
                >
                    <img 
                        src={logoA || fallbackLogo} 
                        onError={handleImageError} // 🔥 APLICAMOS EL FIX AQUÍ
                        alt={equipoA} 
                        className="team-logo" 
                    />
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
                    <img 
                        src={logoB || fallbackLogo} 
                        onError={handleImageError} // 🔥 APLICAMOS EL FIX AQUÍ
                        alt={equipoB} 
                        className="team-logo" 
                    />
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