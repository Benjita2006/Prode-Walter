// src/components/TutorialOverlay.jsx
import React, { useState } from 'react'; // Borramos useEffect, ya no hace falta
import './TutorialOverlay.css';

function TutorialOverlay() {
    // ✅ CORRECCIÓN: Inicializamos el estado leyendo directamente el localStorage.
    // Esto se ejecuta una sola vez al cargar y evita el error de React.
    const [show, setShow] = useState(() => {
        const tutorialVisto = localStorage.getItem('prode_tutorial_visto');
        return !tutorialVisto; // Si NO lo vio (null/false), devuelve true (mostrar)
    });

    const [step, setStep] = useState(1);

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleFinish = () => {
        localStorage.setItem('prode_tutorial_visto', 'true'); // Guardamos que ya lo vio
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-card">
                <div className="tutorial-icon">💡</div>
                
                {step === 1 && (
                    <>
                        <h3>¡Bienvenido al Prode!</h3>
                        <p>¿Es tu primera vez aquí? Te explicamos rápido cómo jugar.</p>
                        <div className="tutorial-example">
                            <div className="fake-team">🛡️ Local</div>
                            <div className="fake-vs">vs</div>
                            <div className="fake-team">🛡️ Visitante</div>
                        </div>
                        <p>1. Toca sobre el <b>Escudo del equipo</b> que crees que va a ganar.</p>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h3>El Empate</h3>
                        <p>Si crees que el partido terminará igualado, presiona el botón del medio.</p>
                        <div className="fake-draw-btn">EMPATE</div>
                        <button className="btn-tutorial" onClick={handleNext}>Siguiente ➡</button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h3>⚠️ Muy Importante</h3>
                        <p>Tu voto <b>NO se guarda solo</b>.</p>
                        <p>Después de elegir, debes presionar el botón azul:</p>
                        <div className="fake-confirm-btn">Confirmar Pronóstico</div>
                        <p>Si no lo haces, ¡no sumarás puntos!</p>
                        <button className="btn-tutorial-finish" onClick={handleFinish}>¡Entendido, a jugar! ⚽</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default TutorialOverlay;