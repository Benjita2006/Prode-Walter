// src/components/TutorialOverlay.jsx
import React, { useState } from 'react';
import './TutorialOverlay.css';

function TutorialOverlay({ username }) {
    // Clave única actualizada para forzar que los usuarios viejos vean el nuevo tutorial
    const storageKey = `tutorial_v2_visto_${username}`; 

    const [show, setShow] = useState(() => {
        const visto = localStorage.getItem(storageKey);
        return !visto; 
    });

    const [step, setStep] = useState(1);

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleFinish = () => {
        localStorage.setItem(storageKey, 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-card">
                
                {/* PASO 1: BOLETAS (NUEVO) */}
                {step === 1 && (
                    <>
                        <div className="tutorial-icon">🎟️</div>
                        <h3>¡Nuevas Boletas!</h3>
                        <p>Ahora puedes crear múltiples pronósticos para una misma fecha.</p>
                        <p>Usa el botón <b>"+ Nueva Boleta"</b> para probar distintas estrategias (una arriesgada, una segura, etc.).</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 2: PAGOS (NUEVO) */}
                {step === 2 && (
                    <>
                        <div className="tutorial-icon">🔒</div>
                        <h3>Verificación de Pago</h3>
                        <p>Podrás jugar y armar tus boletas libremente, pero...</p>
                        <p className="warning-text">El botón "GUARDAR" solo funcionará una vez que hayamos confirmado tu pago.</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 3: RANKING POR FECHAS */}
                {step === 3 && (
                    <>
                        <div className="tutorial-icon">🏆</div>
                        <h3>Ranking Mejorado</h3>
                        <p>Ahora puedes filtrar la tabla de posiciones por fechas específicas.</p>
                        <p>¡Descubre quién fue el mejor de la Fecha 4 o quién lidera la tabla General!</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 4: CÓMO JUGAR (CLÁSICO) */}
                {step === 4 && (
                    <>
                        <div className="tutorial-icon">👆</div>
                        <h3>¿Cómo Jugar?</h3>
                        <p>Elige quién gana tocando el <b>Escudo</b> o selecciona <b>Empate</b> en el medio.</p>
                        <div className="tutorial-example">
                            <div className="fake-team">🛡️ Local</div>
                            <div className="fake-vs">vs</div>
                            <div className="fake-team">🛡️ Visita</div>
                        </div>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 5: FINALIZAR */}
                {step === 5 && (
                    <>
                        <div className="tutorial-icon">😎</div>
                        <h3>¡Todo listo!</h3>
                        <p>Ya conoces las novedades. ¡Mucha suerte con tus pronósticos, <b>{username}</b>!</p>
                        
                        <button className="btn-tutorial-finish" onClick={handleFinish}>
                            ¡A Jugar!
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default TutorialOverlay;