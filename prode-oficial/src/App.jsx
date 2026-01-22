// prode-oficial/src/App.jsx (VERSIÓN FINAL: PERSISTENCIA + BACK BUTTON)
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
    const [loading, setLoading] = useState(true); // Iniciamos cargando para verificar token
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

    // =========================================================
    // 🟢 NUEVO: PERSISTENCIA DE SESIÓN (AUTO-LOGIN)
    // =========================================================
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (token) {
            try {
                // Decodificamos el token manualmente para evitar instalar librerías extra
                // El token tiene 3 partes: header.payload.signature. Queremos el payload.
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const userDecoded = JSON.parse(jsonPayload);

                // Verificar si expiró
                if (userDecoded.exp * 1000 < Date.now()) {
                    console.log("Sesión expirada");
                    handleLogout();
                } else {
                    // Restauramos al usuario
                    setUsuario(userDecoded);
                    setCurrentView('app'); // Saltamos el login
                }
            } catch (error) {
                console.error("Token inválido", error);
                handleLogout();
            }
        }
        setLoading(false); // Terminó la verificación
    }, [handleLogout]);

    // =========================================================
    // 🟠 NUEVO: MANEJO DEL BOTÓN ATRÁS (ANDROID/IOS)
    // =========================================================
    useEffect(() => {
        // Solo activamos esta "trampa" si el usuario está dentro de la app
        if (currentView === 'app') {
            
            // 1. Empujamos un estado al historial para que el botón atrás tenga algo que "sacar"
            window.history.pushState({ page: 'app_trap' }, '', window.location.pathname);

            const handleBackButton = (event) => {
                // Prevenir comportamiento default momentáneamente
                event.preventDefault();

                if (appView !== 'matches') {
                    // SI ESTAMOS EN OTRA PESTAÑA (Ranking, Chat, etc) -> VOLVER A 'PARTIDOS'
                    setAppView('matches');
                    // Volvemos a poner la trampa para el siguiente click
                    window.history.pushState({ page: 'app_trap' }, '', window.location.pathname);
                } else {
                    // SI ESTAMOS EN 'PARTIDOS' (Home) -> PREGUNTAR SALIDA
                    // Usamos confirm porque bloquea la ejecución hasta que el usuario elige
                    const salir = window.confirm("¿Quieres cerrar sesión y salir de la aplicación?");
                    
                    if (salir) {
                        handleLogout(); // Cerramos sesión
                        // Dejamos que el historial retroceda naturalmente (salir de la app)
                        window.history.back(); 
                    } else {
                        // Si dice "Cancelar", restauramos la trampa
                        window.history.pushState({ page: 'app_trap' }, '', window.location.pathname);
                    }
                }
            };

            // Escuchamos el evento 'popstate' (cuando se presiona Atrás)
            window.addEventListener('popstate', handleBackButton);

            return () => {
                window.removeEventListener('popstate', handleBackButton);
            };
        }
    }, [currentView, appView, handleLogout]);


    // --- FUNCIÓN DE CARGA DE PARTIDOS ---
    const fetchPartidos = useCallback(async () => {
        const token = localStorage.getItem('token'); 
        // Pequeño chequeo de seguridad
        if (!token) return;

        setLoading(true);
        try {
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
    }, [handleLogout]); 

    // --- NAVEGACIÓN INTERNA ---
    const handleNavClick = (viewName) => {
        setAppView(viewName);
        // Optimización: Solo recargar si no hay partidos y vamos a la vista de partidos
        if (viewName === 'matches' && partidos.length === 0) {
            fetchPartidos();
        }
    };

    // --- LOGIN EXITOSO ---
    const handleLoginSuccess = (userObject) => {
        setUsuario(userObject);
        localStorage.setItem('username', userObject.username); 
        setCurrentView('app');
        setShowWelcome(true); 
        fetchPartidos(); // Cargar partidos inmediatamente al entrar
        
        setTimeout(() => {
            setShowWelcome(false);
        }, 2500);
    };


    // --- RENDERIZADO CONDICIONAL: LOGIN / REGISTER ---
    if (loading && !usuario) {
        return <div className="loading-screen">Cargando Prode...</div>; // Pantalla de carga inicial
    }

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
                currentView={appView} 
            /> 
            
            {/* CONTENIDO PRINCIPAL */}
            <div className="main-content-wrapper">
                
                {appView === 'manage-users' && isAdmin && (
                    <UsersManagement /> 
                )}

                {appView === 'admin-dashboard' && isAdmin && (
                    <AdminDashboard />
                )}

                {appView === 'creator' && isAdmin && (
                    <MatchCreator onMatchCreated={() => handleNavClick('matches')} />
                )}

                {appView === 'ranking' && (
                    <Ranking />
                )}

                {appView === 'chat' && (
                    <div className="chat-full-page">
                        <ChatGlobal username={username} fullPage={true} />
                    </div>
                )}

                {/* VISTA: LISTA DE PARTIDOS (DEFAULT) */}
                {appView === 'matches' && (
                    <>
                        <h1 style={{textAlign: 'center', marginBottom: '15px'}}>🏆 Prode</h1>
                        <small style={{display: 'block', textAlign: 'center', marginBottom: '30px', color: 'var(--text-secondary)'}}>
                            Hola, {usuario?.username}! Próximos partidos:
                        </small>
                    
                        {loading ? (
                            <p style={{textAlign: 'center', fontSize: '1.2rem', marginTop: '50px'}}>Cargando partidos... ⏳</p>
                        ) : partidos.length === 0 ? (
                            <p style={{textAlign: 'center', fontSize: '1.2rem', color: '#ff4444', marginTop: '50px'}}>No hay partidos disponibles por ahora.</p>
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
            
            {appView !== 'chat' && <WhatsAppBtn />}
            {usuario && <TutorialOverlay username={usuario.username} />}

        </div>
    );
}

export default App;