import React from 'react';
import './Navbar.css'; // Asegúrate de importar el CSS

function Navbar({ userRole, onLogout, onNavClick, theme, toggleTheme, currentView }) {
    
    // Definimos los menús con sus iconos para usarlos fácil en el HTML
    const allMenuItems = [
        { name: 'Partidos', view: 'matches', roles: ['User', 'Owner', 'Dev'], icon: '⚽' },
        { name: 'Ranking', view: 'ranking', roles: ['User', 'Owner', 'Dev'], icon: '🏆' },
        { name: 'Chat', view: 'chat', roles: ['User', 'Owner', 'Dev'], icon: '💬' },
        { name: 'Admin', view: 'admin-dashboard', roles: ['Owner', 'Dev'], icon: '📊' },
        { name: 'Crear', view: 'creator', roles: ['Owner', 'Dev'], icon: '✏️' },
        { name: 'Usuarios', view: 'manage-users', roles: ['Dev', 'Owner'], icon: '👥' }
    ];

    // Filtramos según el rol del usuario
    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* --- BARRA SUPERIOR (TOP NAVBAR) --- */}
            <nav className="navbar">
                {/* Izquierda: Logo */}
                <div className="navbar-brand" onClick={() => onNavClick('matches')}>
                    <span className="logo-icon">⚽</span>
                    <span className="logo-text">PRODE</span>
                </div>

                {/* Centro: Solo visible en Escritorio (Desktop) */}
                <div className="navbar-center">
                    {menuItems.map(item => (
                        <button 
                            key={item.view}
                            onClick={() => onNavClick(item.view)}
                            className={`nav-link ${currentView === item.view ? 'active' : ''}`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>

                {/* Derecha: Tema y Salir (Siempre visibles, ajustados en móvil) */}
                <div className="navbar-right">
                    <button onClick={toggleTheme} className="theme-toggle" title="Cambiar Tema">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button onClick={onLogout} className="btn-logout-minimal">
                        Salir 🚪
                    </button>
                </div>
            </nav>

            {/* --- BARRA INFERIOR (BOTTOM NAV) - Solo visible en Móvil --- */}
            <div className="bottom-nav">
                {menuItems.map(item => (
                    <button 
                        key={item.view}
                        onClick={() => onNavClick(item.view)}
                        className={`bottom-nav-item ${currentView === item.view ? 'active' : ''}`}
                    >
                        <span className="bottom-nav-icon">{item.icon}</span>
                        <span>{item.name}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

export default Navbar;