// src/components/NavBar.jsx
import React from 'react';
import './NavBar.css'; 

function NavBar({ userRole, onLogout, onNavClick, theme, toggleTheme, currentView }) {
    
    // Definimos los menús
    const allMenuItems = [
        { name: 'Partidos', view: 'matches', roles: ['User', 'Owner', 'Dev'], icon: '⚽' },
        
        // 🟢 AQUÍ AGREGAMOS EL NUEVO BOTÓN
        { name: 'Resultados', view: 'results', roles: ['User', 'Owner', 'Dev'], icon: '📊' },

        { name: 'Ranking', view: 'ranking', roles: ['User', 'Owner', 'Dev'], icon: '🏆' },
        { name: 'Chat', view: 'chat', roles: ['User', 'Owner', 'Dev'], icon: '💬' },
        { name: 'Admin', view: 'admin-dashboard', roles: ['Owner', 'Dev'], icon: '⚙️' }, // Cambié icono Admin a engranaje para diferenciar
        { name: 'Crear', view: 'creator', roles: ['Owner', 'Dev'], icon: '✏️' },
        { name: 'Usuarios', view: 'manage-users', roles: ['Dev', 'Owner'], icon: '👥' }
    ];

    // Filtramos según el rol
    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* --- BARRA SUPERIOR (ESCRITORIO) --- */}
            <nav className="navbar">
                {/* Izquierda */}
                <div className="navbar-brand" onClick={() => onNavClick('matches')}>
                    <span className="logo-icon">⚽</span>
                    <span className="logo-text">PRODE</span>
                </div>

                {/* Centro (Se oculta en móvil gracias al CSS) */}
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

                {/* Derecha */}
                <div className="navbar-right">
                    <button onClick={toggleTheme} className="theme-toggle">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button onClick={onLogout} className="btn-logout-minimal">
                        Salir
                    </button>
                </div>
            </nav>

            {/* --- BARRA INFERIOR (MÓVIL) --- */}
            <div className="bottom-nav">
                {menuItems.map(item => (
                    <button 
                        key={item.view}
                        onClick={() => onNavClick(item.view)}
                        className={`bottom-nav-item ${currentView === item.view ? 'active' : ''}`}
                    >
                        <span className="bottom-nav-icon">{item.icon}</span>
                        <span style={{fontSize: '10px'}}>{item.name}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

export default NavBar;