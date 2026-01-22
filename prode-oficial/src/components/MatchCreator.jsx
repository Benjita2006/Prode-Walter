import React, { useState } from 'react';
import { API_URL } from '../config';
import { buscarLogo } from '../data/teams'; // 👈 Importamos el diccionario
import './MatchCreator.css';

function MatchCreator({ onMatchCreated }) {
    // Agregamos campos de logo al estado
    const [matches, setMatches] = useState([
        { local: '', localLogo: '', visitante: '', visitanteLogo: '', fecha: '' }
    ]);
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');

    const handleChange = (index, field, value) => {
        const newMatches = [...matches];
        newMatches[index][field] = value;

        // 🧠 Lógica Inteligente: Si cambiamos el nombre, buscamos el logo automáticamente
        if (field === 'local') {
            const logo = buscarLogo(value);
            if (logo) newMatches[index].localLogo = logo;
        }
        if (field === 'visitante') {
            const logo = buscarLogo(value);
            if (logo) newMatches[index].visitanteLogo = logo;
        }

        setMatches(newMatches);
    };

    const handleAddMatch = () => {
        setMatches([...matches, { local: '', localLogo: '', visitante: '', visitanteLogo: '', fecha: '' }]);
        setMessage('');
    };

    const handleRemoveMatch = (index) => {
        if (matches.length > 1) {
            setMatches(matches.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const matchesToSend = matches.filter(m => m.local && m.visitante && m.fecha);
        
        if (matchesToSend.length === 0) {
            setMessage("Completa al menos un partido.");
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('');
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/api/admin/matches/bulk-create`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // 👇 Ahora enviamos también los logos explícitos
                body: JSON.stringify({ matches: matchesToSend }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message);
                setMatches([{ local: '', localLogo: '', visitante: '', visitanteLogo: '', fecha: '' }]);
                if (onMatchCreated) onMatchCreated();
            } else {
                setStatus('error');
                setMessage(data.message || 'Error al crear.');
            }
        } catch (err) {
            console.error("Error al publicar:", err);
            setStatus('error');
            setMessage('Error de conexión.');
        }
    };

    return (
        <div className="match-creator-container">
            <h2>✏️ Carga Manual de Partidos</h2>
            <p>Escribe el nombre del equipo y el escudo aparecerá solo.</p>

            <form onSubmit={handleSubmit}>
                <div className="table-responsive">
                    <table className="matches-table">
                        <thead>
                            <tr>
                                <th style={{width: '35%'}}>Local</th>
                                <th style={{width: '35%'}}>Visitante</th>
                                <th style={{width: '20%'}}>Fecha</th>
                                <th style={{width: '10%'}}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((match, index) => (
                                <tr key={index}>
                                    {/* COLUMNA LOCAL */}
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                            <input 
                                                type="text" 
                                                value={match.local} 
                                                onChange={(e) => handleChange(index, 'local', e.target.value)} 
                                                required 
                                                className="table-input"
                                                placeholder="Ej: Boca"
                                            />
                                            {/* Previsualización del Logo */}
                                            {match.localLogo && <img src={match.localLogo} alt="L" style={{width: '30px', height: '30px'}} />}
                                        </div>
                                        {/* Input opcional para corregir URL manualmente si hiciera falta */}
                                        <input 
                                            type="text" 
                                            value={match.localLogo}
                                            onChange={(e) => handleChange(index, 'localLogo', e.target.value)}
                                            placeholder="URL Logo (opcional)"
                                            style={{fontSize: '0.7rem', color: '#888', width: '100%', marginTop: '5px', border: 'none', background: 'transparent'}}
                                        />
                                    </td>

                                    {/* COLUMNA VISITANTE */}
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                            {match.visitanteLogo && <img src={match.visitanteLogo} alt="V" style={{width: '30px', height: '30px'}} />}
                                            <input 
                                                type="text" 
                                                value={match.visitante} 
                                                onChange={(e) => handleChange(index, 'visitante', e.target.value)} 
                                                required 
                                                className="table-input"
                                                placeholder="Ej: River"
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={match.visitanteLogo}
                                            onChange={(e) => handleChange(index, 'visitanteLogo', e.target.value)}
                                            placeholder="URL Logo (opcional)"
                                            style={{fontSize: '0.7rem', color: '#888', width: '100%', marginTop: '5px', border: 'none', background: 'transparent', textAlign: 'right'}}
                                        />
                                    </td>

                                    {/* COLUMNA FECHA */}
                                    <td>
                                        <input 
                                            type="datetime-local" 
                                            value={match.fecha} 
                                            onChange={(e) => handleChange(index, 'fecha', e.target.value)} 
                                            required 
                                            className="table-input"
                                        />
                                    </td>

                                    <td style={{textAlign: 'center'}}>
                                        {matches.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveMatch(index)} className="icon-remove-button">❌</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="actions-footer">
                    <button type="button" onClick={handleAddMatch} className="add-button">+ Partido</button>
                    <button type="submit" disabled={status === 'loading'} className="submit-button">
                        {status === 'loading' ? 'Guardando...' : 'Guardar Partidos'}
                    </button>
                </div>
            </form>
            {message && <p className={`status-message ${status}`}>{message}</p>}
        </div>
    );
}

export default MatchCreator;