// prode-oficial/src/components/MatchCreator.jsx (SOLUCIÓN FINAL)
import React, { useState } from 'react';
import './MatchCreator.css'; 

function MatchCreator({ onMatchCreated }) {
    const [matches, setMatches] = useState([{ local: '', visitante: '', fecha: '' }]); 
    const [status, setStatus] = useState(null); 
    const [message, setMessage] = useState('');

    const handleChange = (index, field, value) => {
        const newMatches = [...matches];
        newMatches[index] = { ...newMatches[index], [field]: value };
        setMatches(newMatches);
    };

    const handleAddMatch = () => {
        setMatches([...matches, { local: '', visitante: '', fecha: '' }]);
        setMessage('');
    };

    const handleRemoveMatch = (index) => {
        if (matches.length > 1) {
            const newMatches = matches.filter((_, i) => i !== index);
            setMatches(newMatches);
        } else {
            setMessage("Debe haber al menos un partido para publicar.");
        }
    };
    
    // --- ENVÍO AL BACKEND CORREGIDO ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const matchesToSend = matches.filter(m => m.local && m.visitante && m.fecha);
        if (matchesToSend.length === 0) {
            setMessage("Por favor, completa los datos de al menos un partido.");
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('');

        // 1. RECUPERAR EL TOKEN
        const token = localStorage.getItem('token'); 

        try {
            const response = await fetch('http://localhost:3000/api/admin/matches/bulk-create', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // 2. INCLUIR EL TOKEN AQUÍ
                },
                body: JSON.stringify({ matches: matchesToSend }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message || `Se publicaron ${data.count} partidos exitosamente.`);
                setMatches([{ local: '', visitante: '', fecha: '' }]); 
                
                if (onMatchCreated) {
                    onMatchCreated();
                }
            } else {
                setStatus('error');
                // Mostrar el mensaje exacto del backend ayuda a depurar
                setMessage(data.message || 'Error desconocido al crear los partidos.');
            }

        } catch (err) {
            setStatus('error');
            setMessage('Error de conexión con el servidor (Backend).');
            console.error('Fetch error:', err);
        }
    };

    return (
        <div className="match-creator-container">
            <h2>✏️ Publicar Múltiples Partidos</h2>
            <p>Define los equipos y la fecha para la ronda de pronósticos.</p>

            <form onSubmit={handleSubmit}>
                <div className="table-responsive">
                    <table className="matches-table">
                        <thead>
                            <tr>
                                <th style={{width: '30%'}}>Local</th>
                                <th style={{width: '30%'}}>Visitante</th>
                                <th style={{width: '30%'}}>Fecha y Hora</th>
                                <th style={{width: '10%'}}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((match, index) => (
                                <tr key={index}>
                                    <td>
                                        <input 
                                            type="text" 
                                            value={match.local} 
                                            onChange={(e) => handleChange(index, 'local', e.target.value)} 
                                            required 
                                            disabled={status === 'loading'} 
                                            className="table-input"
                                            placeholder="Local"
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="text" 
                                            value={match.visitante} 
                                            onChange={(e) => handleChange(index, 'visitante', e.target.value)} 
                                            required 
                                            disabled={status === 'loading'} 
                                            className="table-input"
                                            placeholder="Visitante"
                                        />
                                    </td>
                                    <td>
                                        <input 
                                            type="datetime-local" 
                                            value={match.fecha} 
                                            onChange={(e) => handleChange(index, 'fecha', e.target.value)} 
                                            required 
                                            disabled={status === 'loading'} 
                                            className="table-input"
                                        />
                                    </td>
                                    <td style={{textAlign: 'center'}}>
                                        {matches.length > 1 ? (
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveMatch(index)} 
                                                className="icon-remove-button" 
                                                disabled={status === 'loading'}
                                            >
                                                ❌
                                            </button>
                                        ) : (
                                            <span style={{color: '#ccc'}}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="actions-footer">
                    <button type="button" onClick={handleAddMatch} className="add-button" disabled={status === 'loading'}>
                        + Nueva Fila
                    </button>
                    
                    <button type="submit" disabled={status === 'loading'} className="submit-button">
                        {status === 'loading' ? 'Publicando...' : `Publicar ${matches.length} Partidos`}
                    </button>
                </div>
            </form>

            {message && (<p className={`status-message ${status}`}>{message}</p>)}
        </div>
    );
}

export default MatchCreator;