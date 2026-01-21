// prode-oficial/src/App.jsx (CHAT INTEGRADO COMO PESTAÑA)
import React, { useState, useEffect, useCallback } from 'react';
import MatchCard from './components/MatchCard';
import Login from './components/Login';
import Register from './components/Register';
import NavBar from './components/NavBar'; 
import MatchCreator from './components/MatchCreator'; 
import AdminDashboard from './components/AdminDashboard'; 
import WhatsAppBtn from './components/WhatsAppBtn'; 
import UsersManagement from './components/UsersManagement'; 
import ChatGlobal from './components/ChatGlobal';
import Ranking from './components/Ranking';
import { API_URL } from './config'; 
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

    // Nombre de usuario para el chat
    const username = localStorage.getItem('username') || (usuario ? usuario.username : "Anónimo");

    // --- LÓGICA DEL TEMA ---
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // --- ROLES Y LOGOUT ---
    const userRole = usuario ? usuario.role : null;
    const isAdmin = userRole === 'Owner' || userRole === 'Dev';

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token'); 
        localStorage.removeItem('username'); 
        setUsuario(null);
        setCurrentView('login'); 
    }, []);

    // --- FUNCIÓN DE CARGA DE PARTIDOS ---
    const fetchPartidos = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token'); 

        try {
            if (!token && usuario) { 
                handleLogout(); 
                return;
            }

            const respuesta = await fetch(`${API_URL}/api/partidos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (respuesta.status === 401 || respuesta.status === 403) {
                handleLogout();
                return;
            }

            const datos = await respuesta.json();
            setPartidos(datos);
        } catch (error) {
            console.error("Error conectando al servidor:", error);
            setPartidos([]); 
        } finally {
            setLoading(false);
        }
    }, [handleLogout, usuario]); 

    // --- NAVEGACIÓN ---
    const handleNavClick = (viewName) => {
        setAppView(viewName);
        if (viewName === 'matches') {
            fetchPartidos();
        }
    };

    // --- LOGIN ---
    const handleLoginSuccess = (userObject) => {
        setUsuario(userObject);
        localStorage.setItem('username', userObject.username); 
        setCurrentView('app');
        setShowWelcome(true); 
        
        setTimeout(() => {
            setShowWelcome(false);
        }, 2500);
    };

    // Efecto inicial
    useEffect(() => {
        if (usuario) {
            fetchPartidos();
        }
    }, [fetchPartidos, usuario]); 


    // --- RENDERIZADO CONDICIONAL: LOGIN / REGISTER ---
    if (!usuario) {
        if (currentView === 'register') {
            return (
                <Register 
                    onRegisterSuccess={() => setCurrentView('login')}
                    onSwitchToLogin={() => setCurrentView('login')}
                />
            );
        }
        return (
            <Login 
                onLogin={handleLoginSuccess} 
                onSwitchToRegister={() => setCurrentView('register')} 
            />
        );
    }

    // --- RENDERIZADO PRINCIPAL: LA APP ---
    return (
        <div className="app-container">
            
            {/* PANTALLA DE BIENVENIDA */}
            {showWelcome && (
                <div className="welcome-overlay">
                    <h1 className="welcome-text">⚽ Bienvenido, {usuario.username} ⚽</h1>
                    <p>Cargando tus partidos...</p>
                </div>
            )}

            {/* BARRA DE NAVEGACIÓN */}
            <NavBar 
                userRole={userRole || 'Guest'} 
                onLogout={handleLogout} 
                onNavClick={handleNavClick} 
                theme={theme}
                toggleTheme={toggleTheme}
                currentView={appView} // Le pasamos la vista actual para marcar el botón activo
            /> 
            
            {/* CONTENIDO PRINCIPAL */}
            <div className="main-content-wrapper">
                
                {/* VISTA: GESTIÓN DE USUARIOS */}
                {appView === 'manage-users' && isAdmin && (
                    <div className="main-content-wrapper">
                        <UsersManagement /> 
                    </div>
                )}

                {/* VISTA: DASHBOARD ADMIN */}
                {appView === 'admin-dashboard' && isAdmin && (
                    <AdminDashboard />
                )}

                {/* VISTA: CREAR PARTIDOS */}
                {appView === 'creator' && isAdmin && (
                    <MatchCreator onMatchCreated={() => handleNavClick('matches')} />
                )}

                {/* VISTA: RANKING */}
                {appView === 'ranking' && (
                    <Ranking />
                )}

                {/* 👇 NUEVA VISTA: CHAT (Ahora es una pantalla completa) 👇 */}
               {appView === 'chat' && (
                <div className="chat-full-page">

                <ChatGlobal username={username} fullPage={true} />

                </div>
                )}

                {/* VISTA: LISTA DE PARTIDOS (DEFAULT) */}
                {appView === 'matches' && (
                    <>
                        <h1 style={{textAlign: 'center', marginBottom: '15px'}}>🏆 Prode</h1>
                        <small style={{display: 'block', textAlign: 'center', marginBottom: '30px'}}>
                            Hola, {usuario?.username} | Rol: {userRole}
                        </small>
                    
                        {loading ? (
                            <p style={{textAlign: 'center', fontSize: '1.2rem', marginTop: '50px'}}>Cargando partidos... ⏳</p>
                        ) : partidos.length === 0 ? (
                            <p style={{textAlign: 'center', fontSize: '1.2rem', color: '#ff4444', marginTop: '50px'}}>No se encontraron partidos futuros.</p>
                        ) : (
                            <div className="table-responsive-predictions">
                                <div className="predictions-table">
                                    <div className="matches-grid-container"> 
                                    
                                    {(() => {
                                        let ultimaFecha = null;
                                        return partidos.map((p) => {
                                            const fechaActual = p.fecha.split(',')[0]; 
                                            const mostrarHeader = fechaActual !== ultimaFecha;
                                            ultimaFecha = fechaActual;

                                            return (
                                                <React.Fragment key={p.id}>
                                                    {mostrarHeader && (
                                                        <div className="date-separator">📅 {fechaActual}</div>
                                                    )}
                                                    <MatchCard 
                                                        matchId={p.id}
                                                        fecha={p.fecha}
                                                        status={p.status}
                                                        equipoA={p.local}
                                                        logoA={p.logoLocal}
                                                        equipoB={p.visitante}
                                                        logoB={p.logoVisitante}
                                                        valorInicial={p.miPronostico} 
                                                        yaGuardado={p.yaJugo}
                                                    />
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* BOTÓN WHATSAPP (Ese sí lo dejamos flotando) */}
            <WhatsAppBtn /> 
            {appView !== 'chat' && <WhatsAppBtn />}

            {/* ❌ ELIMINADO: El ChatGlobal flotante ya no está aquí */}
        </div>
    );
}

export default App;