// src/components/NavBar.jsx
import React from 'react';
import './NavBar.css'; 

// 👇 SOLUCIÓN: Eliminamos 'theme' y 'toggleTheme' de los paréntesis porque ya no los usamos aquí
function NavBar({ userRole, onLogout, onNavClick, currentView }) {
    
    // Definimos los menús
    const allMenuItems = [
        { name: 'Partidos', view: 'matches', roles: ['User', 'Owner', 'Dev'], icon: '⚽' },
        { name: 'Resultados', view: 'results', roles: ['User', 'Owner', 'Dev'], icon: '📊' },
        { name: 'Ranking', view: 'ranking', roles: ['User', 'Owner', 'Dev'], icon: '🏆' },
        { name: 'Chat', view: 'chat', roles: ['User', 'Owner', 'Dev'], icon: '💬' },
        { name: 'Admin', view: 'admin-dashboard', roles: ['Owner', 'Dev'], icon: '⚙️' },
        
        // Botón Salir en la barra inferior
        { name: 'Salir', view: 'logout', roles: ['User', 'Owner', 'Dev'], icon: '🚪' }
    ];

    // Filtramos según el rol
    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* --- BARRA INFERIOR (MÓVIL) --- */}
            <div className="bottom-nav">
                {menuItems.map(item => (
                    <button 
                        key={item.name}
                        onClick={() => item.view === 'logout' ? onLogout() : onNavClick(item.view)}
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