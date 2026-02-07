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
    // --- ESTADOS ---
    
    const [tickets, setTickets] = useState([]); 
    const [ticketActivo, setTicketActivo] = useState(null); 
    const [estadoPago, setEstadoPago] = useState(null); // Ahora sí se usa
    const [cargandoTickets, setCargandoTickets] = useState(false);
    const [usuario, setUsuario] = useState(null); 
    const [partidos, setPartidos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('login'); 
    const [appView, setAppView] = useState('matches'); 
    const [showWelcome, setShowWelcome] = useState(false); 
    const [theme] = useState('dark'); 
    const [adminTab, setAdminTab] = useState('dashboard');
    const [chatMessages, setChatMessages] = useState([]);

    // --- ESTADOS DE LÓGICA ---
    const [misPronosticosTemp, setMisPronosticosTemp] = useState({});
    const [fechaAbierta, setFechaAbierta] = useState(null);
    const [guardando, setGuardando] = useState(false);
    
    const initializedRef = useRef(false);
    const username = localStorage.getItem('username') || (usuario ? usuario.username : "Anónimo");

    // --- EFECTOS ---
    
    // 1. Tema oscuro
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); 
    }, [theme]);
    
    // 2. Cargar pronósticos al cambiar de boleta
    useEffect(() => {
        const cargarPronosticosDeBoleta = async () => {
            if (!ticketActivo || !fechaAbierta) {
                setMisPronosticosTemp({});
                return;
            }

            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/predictions/my-predictions?ticketId=${ticketActivo.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                const mapaPronosticos = {};
                data.forEach(p => {
                    mapaPronosticos[p.match_id] = p.prediction; 
                });

                setMisPronosticosTemp(mapaPronosticos);

            } catch (error) {
                console.error("Error al cargar pronósticos de la boleta:", error);
            }
        };

        cargarPronosticosDeBoleta();
    }, [ticketActivo, fechaAbierta]);

    const userRole = usuario ? usuario.role : null;
    const isAdmin = userRole === 'Owner' || userRole === 'Dev';

    // --- FUNCIONES AUXILIARES ---

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

    const fetchTickets = useCallback(async (nombreFecha) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setCargandoTickets(true);
        try {
            const res = await fetch(`${API_URL}/api/tickets?round=${nombreFecha}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            setTickets(data);
            
            if (data.length > 0) {
                setTicketActivo(data[0]);
            } else {
                setTicketActivo(null);
            }
        } catch (error) {
            console.error("Error cargando boletas:", error);
        } finally {
            setCargandoTickets(false);
        }
    }, []);

    // 3. Verificar Token al inicio
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

    // 4. Buffer de pronósticos
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
        if (!ticketActivo) {
            alert("Primero selecciona o crea una boleta.");
            return;
        }

        setGuardando(true);
        const token = localStorage.getItem('token');
        
        const partidosDeLaFecha = partidosPorFechaFixture[nombreFecha];
        const payload = partidosDeLaFecha
            .filter(p => misPronosticosTemp[p.id])
            .map(p => ({ matchId: p.id, result: misPronosticosTemp[p.id] }));

        if (payload.length === 0) {
            alert("No has pronosticado ningún partido.");
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
                body: JSON.stringify({ 
                    predictions: payload,
                    ticketId: ticketActivo.id 
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`¡Pronósticos guardados en la boleta "${ticketActivo.ticket_name}"!`);
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (e) { 
            console.error(e);
            alert("Error de conexión al guardar.");
        } finally { 
            setGuardando(false); 
        }
    };

    const crearNuevaBoleta = async (nombreFecha) => {
        const nombre = prompt("Ingresá un nombre para tu nueva boleta:");
        if (!nombre || nombre.trim() === "") return;
        if (nombre.length > 20) return alert("El nombre es muy largo (máx 20 caracteres)");

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/tickets`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    ticketName: nombre, 
                    round: nombreFecha 
                })
            });

            if (res.ok) {
                const nuevaBoleta = await res.json();
                setTickets(prev => [...prev, nuevaBoleta]);
                setTicketActivo(nuevaBoleta);
            } else {
                alert("No se pudo crear la boleta.");
            }
        } catch (error) {
            console.error("Error creando boleta:", error);
        }
    };

    const handleNavClick = (view) => {
        setAppView(view);
        if ((view === 'matches' || view === 'results') && partidos.length === 0) fetchPartidos();
    };
    
    // --- FUNCIÓN TOGGLE FECHA CORREGIDA ---
    const toggleFecha = async (nombreFecha) => {
        if (fechaAbierta === nombreFecha) {
            setFechaAbierta(null);
            setTicketActivo(null);
            setEstadoPago(null); // Resetear estado al cerrar
        } else {
            setFechaAbierta(nombreFecha);
            fetchTickets(nombreFecha);
            
            // Lógica para verificar pago
            setEstadoPago(null); 
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/payments/status?round=${nombreFecha}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setEstadoPago(data.isPaid); // Asignamos el valor
                }
            } catch (error) {
                console.error("Error verificando pago:", error);
            }
        }
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
            
            <NavBar userRole={userRole || 'Guest'} onLogout={handleLogout} onNavClick={handleNavClick} currentView={appView} />
            
            <div className="main-content-wrapper">
                
                {appView === 'manage-users' && isAdmin && <UsersManagement />}
                {appView === 'admin-dashboard' && isAdmin && (
                    <div style={{width: '100%', maxWidth: '800px', margin: '0 auto'}}>
                        <div className="admin-header"><h2>🛠️ Administración</h2></div>
                        <div className="admin-nav-grid">
                            <button onClick={() => setAdminTab('dashboard')} className={`admin-nav-card ${adminTab === 'dashboard' ? 'active' : ''}`}><span className="icon">📊</span><span>General</span></button>
                            <button onClick={() => setAdminTab('create')} className={`admin-nav-card ${adminTab === 'create' ? 'active' : ''}`}><span className="icon">➕</span><span>Crear</span></button>
                            <button onClick={() => setAdminTab('edit')} className={`admin-nav-card ${adminTab === 'edit' ? 'active' : ''}`}><span className="icon">✏️</span><span>Editar</span></button>
                            <button onClick={() => setAdminTab('users')} className={`admin-nav-card ${adminTab === 'users' ? 'active' : ''}`}><span className="icon">👥</span><span>Usuarios</span></button>
                        </div>
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
                {appView === 'matches' && (
                    <>
                        <h1 style={{textAlign: 'center', marginBottom: '20px', textTransform:'uppercase', letterSpacing:'2px'}}>🏆 Fixture</h1>
                        
                        {Object.keys(partidosPorFechaFixture).length === 0 ? (
                            <p style={{textAlign:'center', color:'#888', marginTop:'40px'}}>No hay partidos pendientes.</p> 
                        ) : (
                            <div className="fechas-container" style={{paddingBottom: '100px', width: '100%'}}>
                                {Object.keys(partidosPorFechaFixture).map((nombreFecha) => (
                                    <div key={nombreFecha} className="fecha-group-container">
                                        
                                        {/* 1. BOTÓN ENCABEZADO */}
                                        <button 
                                            onClick={() => toggleFecha(nombreFecha)}
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
                                                
                                                {/* CASO 1: NO HAY BOLETAS */}
                                                {tickets.length === 0 && !cargandoTickets ? (
                                                    <div style={{textAlign: 'center', padding: '40px 20px'}}>
                                                        <p style={{color: '#aaa', marginBottom: '20px'}}>Aún no has participado en esta fecha.</p>
                                                        <button 
                                                            onClick={() => crearNuevaBoleta(nombreFecha)}
                                                            style={{padding: '15px 30px', fontSize: '1.2rem', fontWeight: 'bold', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)'}}
                                                        >
                                                            🚀 JUGAR AHORA
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* CASO 2: YA TIENE BOLETAS */
                                                    <>
                                                        <div className="ticket-selector-container">
                                                            <div className="ticket-tabs-wrapper">
                                                                {tickets.map(t => (
                                                                    <button key={t.id} onClick={() => setTicketActivo(t)} className={`btn-ticket-tab ${ticketActivo?.id === t.id ? 'active' : ''}`}>
                                                                        {t.ticket_name}
                                                                    </button>
                                                                ))}
                                                                <button className="btn-ticket-add" onClick={() => crearNuevaBoleta(nombreFecha)} title="Crear otra boleta">+</button>
                                                            </div>
                                                        </div>

                                                        <div className="matches-grid-container">
                                                            {partidosPorFechaFixture[nombreFecha].map(p => (
                                                                <MatchCard 
                                                                    key={p.id} matchId={p.id} equipoA={p.local} logoA={p.logoLocal} equipoB={p.visitante} logoB={p.logoVisitante} fecha={p.fecha} status={p.status}
                                                                    bloqueado={(p.status !== 'NS' && p.status !== 'PST') || !ticketActivo}
                                                                    seleccionActual={misPronosticosTemp[p.id]} 
                                                                    onSeleccionChange={handleSeleccionChange}
                                                                />
                                                            ))}
                                                        </div>
                                                        
                                                        <div className="save-container">
                                                            {/* --- AQUI SE USA ESTADOPAGO VISUALMENTE --- */}
                                                            <div style={{
                                                                marginBottom: '15px', 
                                                                padding: '10px', 
                                                                borderRadius: '8px', 
                                                                textAlign: 'center',
                                                                backgroundColor: estadoPago ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
                                                                border: `1px solid ${estadoPago ? '#4caf50' : '#f44336'}`
                                                            }}>
                                                                {estadoPago ? (
                                                                    <span style={{color: '#4caf50', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                                                        ✅ FECHA HABILITADA
                                                                    </span>
                                                                ) : (
                                                                    <span style={{color: '#f44336', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                                                        🔒 PAGO PENDIENTE
                                                                    </span>
                                                                )}
                                                                {!estadoPago && (
                                                                    <p style={{fontSize: '0.8rem', color: '#aaa', marginTop: '5px', margin: 0}}>
                                                                        Podrás guardar tus pronósticos una vez que el admin confirme tu pago.
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {/* ------------------------------------------- */}

                                                            <button onClick={() => guardarFecha(nombreFecha)} disabled={guardando || !ticketActivo} className="btn-save-fixture">
                                                                {guardando ? 'Guardando...' : `GUARDAR PRONÓSTICO`}
                                                            </button>
                                                            <p style={{textAlign:'center', marginTop:'15px', fontSize:'0.8rem', color:'#666'}}>
                                                                ¿Quieres probar otro resultado? <span onClick={() => crearNuevaBoleta(nombreFecha)} style={{color:'#4caf50', cursor:'pointer', textDecoration:'underline'}}>Crear nueva boleta</span>
                                                            </p>
                                                        </div>
                                                    </> 
                                                )}
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
                                            <div style={{padding: '15px', background: '#333', color: '#4caf50', fontWeight: 'bold', borderBottom:'1px solid #555'}}>🏁 {nombreFecha}</div>
                                            <div style={{padding: '10px', background: 'rgba(0,0,0,0.2)'}}>
                                                <div className="matches-grid-container" style={{gap: '10px'}}>
                                                    {resultadosPorFecha[nombreFecha].map(p => (
                                                        <MatchCard 
                                                            key={p.id} matchId={p.id} equipoA={p.local} logoA={p.logoLocal} equipoB={p.visitante} logoB={p.logoVisitante} fecha={p.fecha} status={p.status}
                                                            bloqueado={true} seleccionActual={p.miPronostico} golesA={p.home_score} golesB={p.away_score}
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