// prode-oficial/src/components/NavBar.jsx (LIMPIO Y ORDENADO)
import React from 'react';
import './NavBar.css'; 

function NavBar({ userRole, onLogout, onNavClick, theme, toggleTheme, currentView }) { 
    
    // Definimos TODAS las opciones aquí para que se generen ordenadas
    const menuOptions = [
        // Opciones para TODOS
        { name: 'Partidos', view: 'matches', roles: ['User', 'Owner', 'Dev'] },
        { name: 'Ranking', view: 'ranking', roles: ['User', 'Owner', 'Dev'] },
        { name: 'Chat', view: 'chat', roles: ['User', 'Owner', 'Dev'] },

        // Opciones solo para ADMINS
        // Acorté un poco los nombres para que entren mejor en celular
        { name: 'Admin', view: 'admin-dashboard', roles: ['Owner', 'Dev'] },
        { name: 'Crear', view: 'creator', roles: ['Owner', 'Dev'] },
        { name: 'Usuarios', view: 'manage-users', roles: ['Dev', 'Owner'] },
    ];

    const visibleOptions = menuOptions.filter(option => 
        option.roles.includes(userRole)
    );

    return (
        <nav className="navbar">
            {/* LOGO IZQUIERDA */}
            <div className="navbar-brand" onClick={() => onNavClick('matches')}>
                <span className="logo-icon">⚽</span> 
                <span className="logo-text">PRODE</span>
            </div>
            
            {/* CENTRO: NAVEGACIÓN PRINCIPAL */}
            <div className="navbar-center">
                {visibleOptions.map((option) => (
                    <button 
                        key={option.view} 
                        onClick={() => onNavClick(option.view)} 
                        className={`nav-link ${currentView === option.view ? 'active' : ''}`}
                    >
                        {option.name}
                    </button>
                ))}
            </div>
            
            {/* DERECHA: UTILIDADES (TEMA Y SALIR) */}
            <div className="navbar-right">
                
                {/* BOTÓN MODO OSCURO */}
                <button onClick={toggleTheme} className="theme-toggle" title="Cambiar Tema">
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                {/* BOTÓN SALIR */}
                <button onClick={onLogout} className="btn-logout-minimal">
                    Salir
                </button>
            </div>
        </nav>
    );
}

export default NavBar;