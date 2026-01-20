// prode-oficial/src/components/NavBar.jsx (CÓDIGO COMPLETO)
import React from 'react';
import './NavBar.css'; 

function NavBar({ userRole, onLogout, onNavClick, theme, toggleTheme }) { 
    
    const menuOptions = [
        { name: 'Partidos', view: 'matches', roles: ['User', 'Owner', 'Dev'] }, 
        { name: 'Panel Admin & API', view: 'admin-dashboard', roles: ['Owner', 'Dev'] },
        { name: 'Crear Partidos', view: 'creator', roles: ['Owner', 'Dev'] },
        { name: 'Administrar Usuarios/Roles', view: 'manage-users', roles: ['Dev', 'Owner'] }, // Agregué Owner aquí también por si acaso
    ];
    const visibleOptions = menuOptions.filter(option => 
        option.roles.includes(userRole)
    );

    return (
        <nav className="navbar">
            {/* LOGO MINIMALISTA */}
            <div className="navbar-brand" onClick={() => onNavClick('matches')}>
                <span className="logo-icon">⚽</span> 
                <span className="logo-text">PRODE WALTER</span>
                <span className="logo-dot">.</span>
            </div>
            
            <div className="navbar-center">
                {visibleOptions.map((option) => (
                    <div 
                        key={option.name} 
                        onClick={() => onNavClick(option.view)} 
                        className="nav-link"
                    >
                        {option.name}
                    </div>
                ))}
            </div>
            
            <div className="navbar-right">
                {/* BOTÓN MODO OSCURO */}
                <button onClick={toggleTheme} className="theme-toggle" title="Cambiar Tema">
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <div className="user-badge">
                    <small>{userRole}</small>
                </div>
                <li onClick={() => onNavClick('ranking')}>🏆Puntos</li>
                <button onClick={onLogout} className="btn-logout-minimal">
                    Salir
                </button>
            </div>
        </nav>
    );
    
}


export default NavBar;