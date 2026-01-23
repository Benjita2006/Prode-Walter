// prode-oficial/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import MatchCard from './components/MatchCard';
import Login from './components/Login';
import Register from './components/Register';
import NavBar from './components/NavBar'; 
import MatchCreator from './components/MatchCreator'; 
import AdminDashboard from './components/AdminDashboard'; 
import UsersManagement from './components/UsersManagement'; 
import ChatGlobal from './components/ChatGlobal';
import Ranking from './components/Ranking';
import { API_URL } from './config'; 
import TutorialOverlay from './components/TutorialOverlay';
import './App.css';

function App() {
    // 1. ESTADOS
    const [usuario, setUsuario] = useState(null); 
    const [partidos, setPartidos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('login'); 
    const [appView, setAppView] = useState('matches'); 
    const [showWelcome, setShowWelcome] = useState(false); 
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // ESTADOS NUEVOS PARA LA LÓGICA DE FECHAS
    const [misPronosticosTemp, setMisPronosticosTemp] = useState({});
    const [fechaAbierta, setFechaAbierta] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const username = localStorage.getItem('username') || (usuario ? usuario.username : "Anónimo");

    // --- TEMA ---
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const userRole = usuario ? usuario.role : null;
    const isAdmin = userRole === 'Owner' || userRole === 'Dev';

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token'); 
        localStorage.removeItem('username'); 
        setUsuario(null);
        setCurrentView('login'); 
    }, []);

    // --- PERSISTENCIA SESIÓN ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const userDecoded = JSON.parse(jsonPayload);
                if (userDecoded.exp * 1000 < Date.now()) {
                    handleLogout();
                } else {
                    setUsuario(userDecoded);
                    setCurrentView('app');
                }
            } catch (error) {
                console.error(error); // 👈 CORRECCIÓN 1: Usamos la variable error
                handleLogout();
            }
        }
        setLoading(false);
    }, [handleLogout]);

    // --- CARGA DE PARTIDOS ---
    const fetchPartidos = useCallback(async () => {
        const token = localStorage.getItem('token'); 
        if (!token) return;

        setLoading(true);
        try {
            const respuesta = await fetch(`${API_URL}/api/partidos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (respuesta.status === 401 || respuesta.status === 403) {
                handleLogout(); return;
            }
            const datos = await respuesta.json();
            setPartidos(datos);
        } catch (error) {
            console.error("Error:", error);
            setPartidos([]); 
        } finally {
            setLoading(false);
        }
    }, [handleLogout]); 

    // --- GESTIÓN DE PRONÓSTICOS TEMPORALES ---
    useEffect(() => {
        if (partidos.length > 0) {
            const buffer = {};
            partidos.forEach(p => {
                if (p.miPronostico) buffer[p.id] = p.miPronostico;
            });
            setMisPronosticosTemp(buffer);
            
            // Abrir la primera fecha por defecto si no hay ninguna abierta
            if (!fechaAbierta && partidos[0]) {
                setFechaAbierta(partidos[0].round || 'Fecha 1'); 
            }
        }
        // 👇 CORRECCIÓN 2: Silenciamos la advertencia porque solo queremos que corra al cambiar 'partidos'
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partidos]); 

    // Agrupar partidos por "round"
    const partidosPorFecha = partidos.reduce((acc, partido) => {
        const fechaNombre = partido.round || 'Fecha General'; 
        if (!acc[fechaNombre]) acc[fechaNombre] = [];
        acc[fechaNombre].push(partido);
        return acc;
    }, {});

    const handleSeleccionChange = (matchId, seleccion) => {
        setMisPronosticosTemp(prev => ({
            ...prev,
            [matchId]: seleccion
        }));
    };

    // GUARDAR FECHA COMPLETA
    const guardarFecha = async (nombreFecha) => {
        setGuardando(true);
        const token = localStorage.getItem('token');
        
        const partidosDeLaFecha = partidosPorFecha[nombreFecha];
        const payload = partidosDeLaFecha
            .filter(p => misPronosticosTemp[p.id]) 
            .map(p => ({
                matchId: p.id,
                result: misPronosticosTemp[p.id]
            }));

        if (payload.length === 0) {
            alert("No has seleccionado ningún resultado para esta fecha.");
            setGuardando(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/predictions/submit-bulk`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ predictions: payload })
            });
            
            if (res.ok) {
                alert(`✅ Pronósticos de ${nombreFecha} guardados con éxito!`);
                fetchPartidos(); 
            } else {
                alert("Hubo un error al guardar.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        } finally {
            setGuardando(false);
        }
    };

    // --- NAVEGACIÓN ---
    const handleNavClick = (viewName) => {
        setAppView(viewName);
        if (viewName === 'matches' && partidos.length === 0) fetchPartidos();
    };
    
    const handleLoginSuccess = (userObject) => {
        setUsuario(userObject);
        localStorage.setItem('username', userObject.username); 
        setCurrentView('app');
        setShowWelcome(true); 
        fetchPartidos();
        setTimeout(() => setShowWelcome(false), 2500);
    };

    // VISTAS DE LOGIN
    if (loading && !usuario) return <div className="loading-screen">Cargando...</div>;
    if (!usuario) {
        return currentView === 'register' 
            ? <Register onRegisterSuccess={() => setCurrentView('login')} onSwitchToLogin={() => setCurrentView('login')} />
            : <Login onLogin={handleLoginSuccess} onSwitchToRegister={() => setCurrentView('register')} />;
    }

    return (
        <div className="app-container">
            {showWelcome && (
                <div className="welcome-overlay">
                    <h1 className="welcome-text">⚽ Bienvenido, {usuario.username} ⚽</h1>
                </div>
            )}

            <NavBar userRole={userRole || 'Guest'} onLogout={handleLogout} onNavClick={handleNavClick} theme={theme} toggleTheme={toggleTheme} currentView={appView} /> 
            
            <div className="main-content-wrapper">
                {appView === 'manage-users' && isAdmin && <UsersManagement />}
                {appView === 'admin-dashboard' && isAdmin && <AdminDashboard />}
                {appView === 'creator' && isAdmin && <MatchCreator onMatchCreated={() => handleNavClick('matches')} />}
                {appView === 'ranking' && <Ranking />}
                {appView === 'chat' && <div className="chat-full-page"><ChatGlobal username={username} fullPage={true} /></div>}

                {/* VISTA DE PARTIDOS (ACORDEÓN) */}
                {appView === 'matches' && (
                    <>
                        <h1 style={{textAlign: 'center', marginBottom: '15px'}}>🏆 Fixture</h1>
                        
                        {loading ? <p style={{textAlign:'center'}}>Cargando...</p> : 
                         Object.keys(partidosPorFecha).length === 0 ? <p style={{textAlign:'center'}}>No hay partidos.</p> : (
                            
                            <div className="fechas-container" style={{paddingBottom: '100px', maxWidth: '800px', margin: '0 auto'}}>
                                {Object.keys(partidosPorFecha).map((nombreFecha) => (
                                    <div key={nombreFecha} style={{marginBottom: '15px', padding: '0 10px'}}>
                                        
                                        {/* CABECERA FECHA */}
                                        <button 
                                            onClick={() => setFechaAbierta(fechaAbierta === nombreFecha ? null : nombreFecha)}
                                            style={{
                                                width: '100%', padding: '15px', 
                                                backgroundColor: fechaAbierta === nombreFecha ? 'var(--card-bg)' : '#333',
                                                border: fechaAbierta === nombreFecha ? '1px solid #4caf50' : '1px solid #444',
                                                color: 'white', borderRadius: '10px',
                                                fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <span>📅 {nombreFecha}</span>
                                            <span>{fechaAbierta === nombreFecha ? '▲' : '▼'}</span>
                                        </button>

                                        {/* CONTENIDO FECHA */}
                                        {fechaAbierta === nombreFecha && (
                                            <div style={{marginTop: '10px'}}>
                                                <div className="matches-grid-container" style={{padding: '0'}}>
                                                    {partidosPorFecha[nombreFecha].map(p => (
                                                        <MatchCard 
                                                            key={p.id}
                                                            matchId={p.id}
                                                            equipoA={p.local} logoA={p.logoLocal}
                                                            equipoB={p.visitante} logoB={p.logoVisitante}
                                                            fecha={p.fecha} status={p.status}
                                                            bloqueado={p.status === 'FT'}
                                                            seleccionActual={misPronosticosTemp[p.id]}
                                                            onSeleccionChange={handleSeleccionChange}
                                                        />
                                                    ))}
                                                </div>

                                                {/* BOTÓN GUARDAR FECHA */}
                                                <div style={{textAlign: 'center', margin: '20px 0'}}>
                                                    <button 
                                                        onClick={() => guardarFecha(nombreFecha)}
                                                        disabled={guardando}
                                                        style={{
                                                            backgroundColor: '#2196F3', color: 'white',
                                                            padding: '12px 30px', fontSize: '1rem', fontWeight: 'bold',
                                                            border: 'none', borderRadius: '50px',
                                                            boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
                                                            cursor: guardando ? 'wait' : 'pointer', width: '90%', maxWidth: '300px'
                                                        }}
                                                    >
                                                        {guardando ? 'Guardando...' : `💾 Guardar ${nombreFecha}`}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {usuario && <TutorialOverlay username={usuario.username} />}
        </div>
    );
}

export default App;