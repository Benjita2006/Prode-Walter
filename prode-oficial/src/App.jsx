// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import MatchCard from './components/MatchCard';
import Login from './components/Login';
import Register from './components/Register';
import NavBar from './components/NavBar'; 
import MatchCreator from './components/MatchCreator'; 
import MatchResultEditor from './components/MatchResultEditor';
import AdminDashboard from './components/AdminDashboard'; 
import UsersManagement from './components/UsersManagement'; 
import ChatGlobal from './components/ChatGlobal';
import Ranking from './components/Ranking';
import { API_URL } from './config'; 
import TutorialOverlay from './components/TutorialOverlay';
import { FaCalendarDay, FaChevronDown } from 'react-icons/fa';
import './App.css';

function App() {
    // ESTADOS
    const [usuario, setUsuario] = useState(null); 
    const [partidos, setPartidos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('login'); 
    const [appView, setAppView] = useState('matches'); 
    const [showWelcome, setShowWelcome] = useState(false); 
    
    // 🌑 MODO OSCURO FORZADO (Ya no leemos localStorage ni permitimos cambiar)
    const [theme] = useState('dark'); 

    const [adminTab, setAdminTab] = useState('dashboard');
    const [chatMessages, setChatMessages] = useState([]);

    // ESTADOS DE LÓGICA
    const [misPronosticosTemp, setMisPronosticosTemp] = useState({});
    const [fechaAbierta, setFechaAbierta] = useState(null);
    const [guardando, setGuardando] = useState(false);
    
    const initializedRef = useRef(false);
    const username = localStorage.getItem('username') || (usuario ? usuario.username : "Anónimo");

    // Efecto para aplicar el tema al HTML
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        // Opcional: Si quieres guardar la preferencia por si activas el modo claro en el futuro
        localStorage.setItem('theme', theme); 
    }, [theme]);

    const userRole = usuario ? usuario.role : null;
    const isAdmin = userRole === 'Owner' || userRole === 'Dev';

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token'); 
        localStorage.removeItem('username'); 
        setUsuario(null);
        setCurrentView('login'); 
        setPartidos([]); 
        initializedRef.current = false; 
    }, []);

    const fetchPartidos = useCallback(async () => {
        const token = localStorage.getItem('token'); 
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/partidos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401 || res.status === 403) { handleLogout(); return; }
            const datos = await res.json();
            setPartidos(datos);
        } catch (error) { console.error("Error:", error); setPartidos([]); } 
        finally { setLoading(false); }
    }, [handleLogout]); 

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const userDecoded = JSON.parse(jsonPayload);
                if (userDecoded.exp * 1000 < Date.now()) handleLogout();
                else { setUsuario(userDecoded); setCurrentView('app'); fetchPartidos(); }
            } catch (error){
                console.error("Error decodificando token:", error); handleLogout();
            }
        }
        setLoading(false);
    }, [handleLogout, fetchPartidos]);

    // GESTIÓN PRONÓSTICOS TEMPORALES
    useEffect(() => {
        if (partidos.length > 0) {
            const buffer = {};
            partidos.forEach(p => { if (p.miPronostico) buffer[p.id] = p.miPronostico; });
            setMisPronosticosTemp(buffer);
        }
    }, [partidos]);

    const partidosActivos = partidos.filter(p => p.status !== 'FT');
    
    const partidosPorFechaFixture = partidosActivos.reduce((acc, p) => {
        const f = p.round || 'Varios';
        if (!acc[f]) acc[f] = [];
        acc[f].push(p);
        return acc;
    }, {});

    const handleSeleccionChange = (matchId, sel) => setMisPronosticosTemp(prev => ({ ...prev, [matchId]: sel }));

    const guardarFecha = async (nombreFecha) => {
        setGuardando(true);
        const token = localStorage.getItem('token');
        const partidosDeLaFecha = partidosPorFechaFixture[nombreFecha];
        const payload = partidosDeLaFecha.filter(p => misPronosticosTemp[p.id]).map(p => ({ matchId: p.id, result: misPronosticosTemp[p.id] }));

        if (payload.length === 0) { alert("Sin pronósticos seleccionados."); setGuardando(false); return; }

        try {
            const res = await fetch(`${API_URL}/api/predictions/submit-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ predictions: payload })
            });
            if (res.ok) { alert(`✅ Guardado!`); fetchPartidos(); } 
            else alert("Error al guardar.");
        } catch (e) { 
            console.error("Error al guardar:", e);
            alert("Error conexión."); 
        } 
        finally { setGuardando(false); }
    };

    const handleNavClick = (view) => {
        setAppView(view);
        if ((view === 'matches' || view === 'results') && partidos.length === 0) fetchPartidos();
    };

    const handleLoginSuccess = (u) => {
        setUsuario(u); localStorage.setItem('username', u.username);
        setCurrentView('app'); setShowWelcome(true); fetchPartidos();
        setTimeout(() => setShowWelcome(false), 2500);
    };

    if (loading && !usuario) return <div className="loading-screen">Cargando...</div>;
    if (!usuario) return currentView === 'register' 
        ? <Register onRegisterSuccess={() => setCurrentView('login')} onSwitchToLogin={() => setCurrentView('login')} />
        : <Login onLogin={handleLoginSuccess} onSwitchToRegister={() => setCurrentView('register')} />;

    return (
        <div className="app-container">
            {showWelcome && <div className="welcome-overlay"><h1 className="welcome-text">⚽ Hola, {usuario.username}</h1></div>}
            
            {/* 👇 NavBar limpio: ya no pasamos theme ni toggleTheme */}
            <NavBar userRole={userRole || 'Guest'} onLogout={handleLogout} onNavClick={handleNavClick} currentView={appView} />
            
            <div className="main-content-wrapper">
                
                {appView === 'manage-users' && isAdmin && <UsersManagement />}
                {appView === 'admin-dashboard' && isAdmin && (
                    <div style={{width: '100%', maxWidth: '800px', margin: '0 auto'}}>
                        
                        {/* Cabecera Unificada */}
                        <div className="admin-header">
                            <h2>🛠️ Administración</h2>
                        </div>

                        {/* Menú de Funciones (Grilla) */}
                        <div className="admin-nav-grid">
                            <button 
                                onClick={() => setAdminTab('dashboard')} 
                                className={`admin-nav-card ${adminTab === 'dashboard' ? 'active' : ''}`}
                                data-tab="dashboard"
                            >
                                <span className="icon">📊</span>
                                <span>General</span>
                            </button>

                            <button 
                                onClick={() => setAdminTab('create')} 
                                className={`admin-nav-card ${adminTab === 'create' ? 'active' : ''}`}
                                data-tab="create"
                            >
                                <span className="icon">➕</span>
                                <span>Crear</span>
                            </button>

                            <button 
                                onClick={() => setAdminTab('edit')} 
                                className={`admin-nav-card ${adminTab === 'edit' ? 'active' : ''}`}
                                data-tab="edit"
                            >
                                <span className="icon">✏️</span>
                                <span>Editar</span>
                            </button>

                            <button 
                                onClick={() => setAdminTab('users')} 
                                className={`admin-nav-card ${adminTab === 'users' ? 'active' : ''}`}
                                data-tab="users"
                            >
                                <span className="icon">👥</span>
                                <span>Usuarios</span>
                            </button>
                        </div>

                        {/* CONTENIDO DINÁMICO */}
                        <div className="admin-content-area">
                            {adminTab === 'dashboard' && <AdminDashboard onUpdate={fetchPartidos} />}
                            {adminTab === 'create' && <MatchCreator onMatchCreated={fetchPartidos} />}
                            {adminTab === 'edit' && <MatchResultEditor />}
                            {adminTab === 'users' && <UsersManagement />}
                        </div>
                    </div>
                )}

                {appView === 'ranking' && <Ranking />}
                {appView === 'chat' && <div className="chat-full-page"><ChatGlobal username={username} fullPage={true} messages={chatMessages} setMessages={setChatMessages} /></div>}

                {/* --- FIXTURE --- */}
                {/* --- VISTA: FIXTURE (SOLO PARTIDOS POR JUGAR) --- */}
                {appView === 'matches' && (
                    <>
                        <h1 style={{textAlign: 'center', marginBottom: '20px', textTransform:'uppercase', letterSpacing:'2px'}}>🏆 Fixture</h1>
                        
                        {Object.keys(partidosPorFechaFixture).length === 0 ? (
                            <p style={{textAlign:'center', color:'#888', marginTop:'40px'}}>No hay partidos pendientes.</p> 
                        ) : (
                            <div className="fechas-container" style={{paddingBottom: '100px', width: '100%'}}>
                                {Object.keys(partidosPorFechaFixture).map((nombreFecha) => (
                                    <div key={nombreFecha} className="fecha-group-container">
                                        
                                        {/* 1. BOTÓN ENCABEZADO MEJORADO */}
                                        <button 
                                            onClick={() => setFechaAbierta(fechaAbierta === nombreFecha ? null : nombreFecha)}
                                            className={`date-header-btn ${fechaAbierta === nombreFecha ? 'open' : ''}`}
                                        >
                                            <div className="date-label-container">
                                                <FaCalendarDay className="date-icon" />
                                                <span>{nombreFecha}</span>
                                            </div>
                                            <FaChevronDown className="arrow-icon" />
                                        </button>

                                        {/* 2. CONTENIDO DESPLEGABLE */}
                                        {fechaAbierta === nombreFecha && (
                                            <div className="date-content-area">
                                                <div className="matches-grid-container" style={{padding: '0', gap: '15px'}}>
                                                    {partidosPorFechaFixture[nombreFecha].map(p => (
                                                        <MatchCard 
                                                            key={p.id} matchId={p.id} equipoA={p.local} logoA={p.logoLocal}
                                                            equipoB={p.visitante} logoB={p.logoVisitante} fecha={p.fecha} status={p.status}
                                                            bloqueado={(p.status !== 'NS' && p.status !== 'PST') || p.miPronostico !== null}
                                                            seleccionActual={misPronosticosTemp[p.id]} onSeleccionChange={handleSeleccionChange}
                                                        />
                                                    ))}
                                                </div>
                                                
                                                <div style={{marginTop: '25px', padding: '0 5px'}}>
                                                    <button 
                                                        onClick={() => guardarFecha(nombreFecha)} 
                                                        disabled={guardando} 
                                                        className="btn-save-fixture"
                                                    >
                                                        {guardando ? 'Guardando...' : `GUARDAR PRONÓSTICOS`}
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

                {/* --- RESULTADOS --- */}
                {appView === 'results' && (
                    <>
                        <h1 style={{textAlign: 'center', marginBottom: '15px'}}>📊 Resultados</h1>
                        {(() => {
                            const terminados = partidos.filter(p => p.status === 'FT');
                            if (terminados.length === 0) return <div style={{textAlign:'center', marginTop:'50px'}}><p style={{fontSize:'3rem'}}>⚽💤</p><p>Aún no hay resultados.</p></div>;
                            
                            const resultadosPorFecha = terminados.reduce((acc, p) => {
                                const f = p.round || 'Varios';
                                if (!acc[f]) acc[f] = [];
                                acc[f].push(p);
                                return acc;
                            }, {});

                            return (
                                <div className="fechas-container" style={{paddingBottom: '100px', width: '100%'}}>
                                    {Object.keys(resultadosPorFecha).map(nombreFecha => (
                                        <div key={nombreFecha} style={{marginBottom: '15px', border:'1px solid #444', borderRadius:'8px', overflow:'hidden'}}>
                                            <div style={{padding: '15px', background: '#333', color: '#4caf50', fontWeight: 'bold', borderBottom:'1px solid #555'}}>
                                                🏁 {nombreFecha}
                                            </div>
                                            <div style={{padding: '10px', background: 'rgba(0,0,0,0.2)'}}>
                                                <div className="matches-grid-container" style={{gap: '10px'}}>
                                                    {resultadosPorFecha[nombreFecha].map(p => (
                                                        <MatchCard 
                                                            key={p.id} matchId={p.id} equipoA={p.local} logoA={p.logoLocal}
                                                            equipoB={p.visitante} logoB={p.logoVisitante} fecha={p.fecha} status={p.status}
                                                            bloqueado={true} seleccionActual={p.miPronostico}
                                                            golesA={p.home_score} golesB={p.away_score}
                                                            onSeleccionChange={() => {}} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
            {usuario && <TutorialOverlay username={usuario.username} />}
        </div>
    );
}

export default App;