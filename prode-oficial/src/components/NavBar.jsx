// src/components/NavBar.jsx
import React from 'react';
import './NavBar.css'; 
// Asegúrate de importar TODOS los iconos que usas en el array de abajo
import { FaFutbol, FaListOl, FaComments, FaSignOutAlt, FaCog, FaChartBar, FaTrophy } from 'react-icons/fa';

// 1. Agregamos hasUnreadChat a las props recibidas
function NavBar({ userRole, onLogout, onNavClick, currentView, hasUnreadChat }) {
    
    const allMenuItems = [
        { name: 'Partidos', view: 'matches', roles: ['User', 'Owner', 'Dev'], icon: <FaFutbol /> },
        { name: 'Resultados', view: 'results', roles: ['User', 'Owner', 'Dev'], icon: <FaChartBar /> },
        { name: 'Ranking', view: 'ranking', roles: ['User', 'Owner', 'Dev'], icon: <FaTrophy /> },
        { name: 'Chat', view: 'chat', roles: ['User', 'Owner', 'Dev'], icon: <FaComments /> },
        { name: 'Admin', view: 'admin-dashboard', roles: ['Owner', 'Dev'], icon: <FaCog /> },
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
                        <span className="bottom-nav-icon" style={{fontSize: '1.4rem', marginBottom:'2px'}}>
                            
                            {/* 2. Lógica para envolver el icono y poner el badge si es Chat */}
                            <div className="nav-icon-container">
                                {item.icon}
                                {item.view === 'chat' && hasUnreadChat && (
                                    <span className="notification-badge"></span>
                                )}
                            </div>

                        </span>
                        <span style={{fontSize: '10px'}}>{item.name}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

export default NavBar;