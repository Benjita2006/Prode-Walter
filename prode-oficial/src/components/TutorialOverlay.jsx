// src/components/TutorialOverlay.jsx
import React, { useState } from 'react';
import './TutorialOverlay.css';

function TutorialOverlay({ username }) {
    // Cambiamos la clave para que TODOS vean el nuevo tutorial, incluso si vieron el anterior
    const storageKey = `tutorial_v3_visto_${username}`; 

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
                
                {/* PASO 1: ACTIVAR LA FECHA (NUEVO PEDIDO) */}
                {step === 1 && (
                    <>
                        <div className="tutorial-icon">🚀</div>
                        <h3>Empieza a Jugar</h3>
                        <p>Al abrir una fecha nueva, verás un botón grande verde que dice <b>"JUGAR AHORA"</b>.</p>
                        <p>Debes presionarlo para activar la fecha y crear tu primera boleta. ¡Sin eso no verás los partidos!</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 2: BOLETAS */}
                {step === 2 && (
                    <>
                        <div className="tutorial-icon">🎟️</div>
                        <h3>Nuevas Boletas</h3>
                        <p>Una vez activada la fecha, puedes crear más boletas con el botón <b>"+ Nueva Boleta"</b>.</p>
                        <p>Prueba distintas combinaciones: una "Lógica" y otra "Batacazo".</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 3: PAGOS */}
                {step === 3 && (
                    <>
                        <div className="tutorial-icon">🔒</div>
                        <h3>Pago Requerido</h3>
                        <p>Puedes jugar libremente, preciona el boton <b>"GUARDAR"</b> para guardar tu pronostico</p>
                        <p className="warning-text">RECORDA GUARDAR SINO NO SE SUMARAN LOS PUNTOS QUE CONSIGAS</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 4: RANKING */}
                {step === 4 && (
                    <>
                        <div className="tutorial-icon">🏆</div>
                        <h3>Ranking por Fechas</h3>
                        <p>Ahora la tabla de posiciones tiene un filtro.</p>
                        <p>Puedes ver quién ganó una fecha específica o quién es el líder de la tabla General.</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 5: CÓMO VOTAR */}
                {step === 5 && (
                    <>
                        <div className="tutorial-icon">👆</div>
                        <h3>Recordatorio</h3>
                        <p>Toca los <b>Escudos</b> para elegir ganador o el medio para <b>Empate</b>.</p>
                        <div className="tutorial-example">
                            <div className="fake-team">🛡️ A</div>
                            <div className="fake-vs">vs</div>
                            <div className="fake-team">🛡️ B</div>
                        </div>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 6: FINALIZAR */}
                {step === 6 && (
                    <>
                        <div className="tutorial-icon">😎</div>
                        <h3>¡Todo listo!</h3>
                        <p>Ya eres un experto. ¡Mucha suerte, <b>{username}</b>!</p>
                        
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