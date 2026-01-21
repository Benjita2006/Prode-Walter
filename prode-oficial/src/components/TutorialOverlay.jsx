// src/components/TutorialOverlay.jsx
import React, { useState } from 'react';
import './TutorialOverlay.css';

function TutorialOverlay({ username }) {
    // Clave única por usuario para el localStorage
    const storageKey = `tutorial_visto_${username}`;

    // Inicialización Perezosa: Comprobamos si ESTE usuario ya lo vio
    const [show, setShow] = useState(() => {
        const visto = localStorage.getItem(storageKey);
        return !visto; // Si no existe la marca, devolvemos true (mostrar)
    });

    const [step, setStep] = useState(1);

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleFinish = () => {
        // Marcamos que ESTE usuario ya lo vio
        localStorage.setItem(storageKey, 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-card">
                
                {/* PASO 1: CÓMO VOTAR */}
                {step === 1 && (
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

                {/* PASO 2: CONFIRMAR (CRÍTICO) */}
                {step === 2 && (
                    <>
                        <div className="tutorial-icon">💾</div>
                        <h3>¡No te olvides!</h3>
                        <p>Tu selección <b>NO se guarda sola</b>.</p>
                        <p>Debes presionar el botón azul para confirmar:</p>
                        <div className="fake-confirm-btn">Confirmar Pronóstico</div>
                        <p className="warning-text">Si no confirmas, no sumas puntos.</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 3: RANKING Y PUNTOS */}
                {step === 3 && (
                    <>
                        <div className="tutorial-icon">🏆</div>
                        <h3>Tabla de Posiciones</h3>
                        <p>Compite contra los demás usuarios.</p>
                        <ul style={{textAlign: 'left', margin: '0 auto', maxWidth: '300px', marginBottom: '20px'}}>
                            <li><b>3 Puntos:</b> Si aciertas el resultado exacto (ej: dijiste 2-1 y salió 2-1).</li>
                            <li><b>1 Punto:</b> Si aciertas quién ganó pero no el resultado exacto.</li>
                        </ul>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 4: CHAT GLOBAL */}
                {step === 4 && (
                    <>
                        <div className="tutorial-icon">💬</div>
                        <h3>Chat Global</h3>
                        <p>En la pestaña <b>Chat</b> puedes hablar con todos los demás participantes en tiempo real.</p>
                        <p>¡Úsalo para festejar goles o debatir jugadas!</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {/* PASO 5: FINALIZAR */}
                {step === 5 && (
                    <>
                        <div className="tutorial-icon">😎</div>
                        <h3>¡Todo listo!</h3>
                        <p>Ya sabes cómo funciona. ¡Mucha suerte, <b>{username}</b>!</p>
                        
                        <button className="btn-tutorial-finish" onClick={handleFinish}>
                            Entendido (No volver a mostrar)
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default TutorialOverlay;