// src/components/NavBar.jsx
import React from 'react';
import './NavBar.css'; 
// Importamos iconos de FontAwesome (paquete 'fa') y Material Design ('md')
import { FaFutbol, FaChartBar, FaTrophy, FaComments, FaCog, FaSignOutAlt, FaUsers } from 'react-icons/fa';

function NavBar({ userRole, onLogout, onNavClick, currentView }) {
    
    // Definimos los menús con COMPONENTES en lugar de strings
    const allMenuItems = [
        { name: 'Partidos', view: 'matches', roles: ['User', 'Owner', 'Dev'], icon: <FaFutbol /> },
        { name: 'Resultados', view: 'results', roles: ['User', 'Owner', 'Dev'], icon: <FaChartBar /> },
        { name: 'Ranking', view: 'ranking', roles: ['User', 'Owner', 'Dev'], icon: <FaTrophy /> },
        { name: 'Chat', view: 'chat', roles: ['User', 'Owner', 'Dev'], icon: <FaComments /> },
        { name: 'Admin', view: 'admin-dashboard', roles: ['Owner', 'Dev'], icon: <FaCog /> },
        
        // Botón Salir
        { name: 'Salir', view: 'logout', roles: ['User', 'Owner', 'Dev'], icon: <FaSignOutAlt /> }
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* BARRA INFERIOR (MÓVIL) */}
            <div className="bottom-nav">
                {menuItems.map(item => (
                    <button 
                        key={item.name}
                        onClick={() => item.view === 'logout' ? onLogout() : onNavClick(item.view)}
                        className={`bottom-nav-item ${currentView === item.view ? 'active' : ''}`}
                    >
                        {/* Renderizamos el componente del icono directamente */}
                        <span className="bottom-nav-icon" style={{fontSize: '1.4rem', marginBottom:'2px'}}>
                            {item.icon}
                        </span>
                        <span style={{fontSize: '10px'}}>{item.name}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

export default NavBar;