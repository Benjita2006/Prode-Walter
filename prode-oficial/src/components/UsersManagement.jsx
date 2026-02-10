// src/components/UsersManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import './UsersManagement.css'; 

function UsersManagement() {
    const [usuarios, setUsuarios] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userTickets, setUserTickets] = useState([]); 
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [error, setError] = useState(null);

    // Cargar usuarios
    const fetchUsers = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 403) throw new Error('No tienes permisos (Owner/Dev).');
            if (!res.ok) throw new Error('Error al cargar usuarios.');

            const data = await res.json();
            setUsuarios(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // CAMBIAR ROL
    const handleChangeRole = async (userId, newRole) => {
        if(!window.confirm(`¿Seguro que quieres cambiar este usuario a ${newRole}?`)) return;
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                alert('¡Rol actualizado!');
                fetchUsers(); 
            } else {
                alert('Error al cambiar el rol');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    };

    // ABRIR MODAL Y CARGAR TICKETS
    const openManageModal = async (user) => {
        setSelectedUser(user);
        setLoadingTickets(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${user.id}/tickets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserTickets(data);
            }
        } catch (error) {
            console.error(error);
            alert("Error cargando boletas");
        } finally {
            setLoadingTickets(false);
        }
    };

    // TOGGLE PAGO DE BOLETA
    const handleToggleTicket = async (ticketId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/tickets/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ticketId })
            });

            if (res.ok) {
                const data = await res.json();
                setUserTickets(prev => prev.map(t => 
                    t.id === ticketId ? { ...t, is_paid: data.is_paid } : t
                ));
            }
        } catch (error) { console.error(error); }
    };

    // Agrupar tickets por fecha
    const ticketsPorFecha = userTickets.reduce((acc, t) => {
        if (!acc[t.round_name]) acc[t.round_name] = [];
        acc[t.round_name].push(t);
        return acc;
    }, {});

    const filteredUsers = usuarios.filter(u => u.username.toLowerCase().includes(filtro.toLowerCase()));

    return (
        <div className="users-management-container">
            <h2 className="users-management-header">👥 Gestión de Boletas</h2>
            
            <input 
                type="text" 
                placeholder="🔍 Buscar usuario por nombre o email..." 
                className="users-search-input"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />
            
            {error && <p className="error-message" style={{color: '#ff5252', textAlign: 'center'}}>{error}</p>}
            
            <div className="table-responsive">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => {
                            const roleColor = user.role === 'Owner' ? '#ffcc00' : user.role === 'Admin' ? '#00d4ff' : '#4caf50';
                            
                            return (
                                <tr key={user.id}>
                                    <td className="col-username">{user.username}</td>
                                    <td className="col-email">{user.email}</td>
                                    <td>
                                        <span className="role-badge" style={{color: roleColor, border: `1px solid ${roleColor}`}}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <button 
                                                onClick={() => openManageModal(user)}
                                                className="btn-action btn-manage"
                                            >
                                                💰 Ver Boletas
                                            </button>

                                            <select 
                                                value="" 
                                                onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                                className="role-select"
                                            >
                                                <option value="" disabled>Rol...</option>
                                                <option value="User">User</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {filteredUsers.length === 0 && (
                <p className="empty-message" style={{textAlign: 'center', marginTop: '20px', color: '#888'}}>
                    No se encontraron usuarios.
                </p>
            )}

            {/* --- MODAL FLOTANTE (ESTRUCTURA CORREGIDA) --- */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        
                        {/* 1. CABECERA (Fija) */}
                        <h3 className="modal-title">Boletas de {selectedUser.username}</h3>
                        
                        {/* 2. CUERPO (Con Scroll) */}
                        {loadingTickets ? (
                            <p style={{padding: '20px'}}>Cargando...</p>
                        ) : (
                            <div className="tickets-scroll-area">
                                {Object.keys(ticketsPorFecha).length === 0 ? (
                                    <p style={{color: '#aaa', textAlign: 'center', padding: '20px'}}>
                                        Sin boletas creadas.
                                    </p>
                                ) : (
                                    Object.keys(ticketsPorFecha).map(fecha => (
                                        <div key={fecha} className="round-group">
                                            <h4 className="round-header">{fecha}</h4>
                                            <div className="tickets-grid">
                                                {ticketsPorFecha[fecha].map(ticket => (
                                                    <button 
                                                        key={ticket.id}
                                                        onClick={() => handleToggleTicket(ticket.id)}
                                                        className={`btn-round ${ticket.is_paid ? 'paid' : 'pending'}`}
                                                    >
                                                        <span>{ticket.ticket_name} <small>({ticket.points} pts)</small></span>
                                                        <span>{ticket.is_paid ? '✅ HABILITADA' : '🔒 PENDIENTE'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 3. PIE (Fijo) */}
                        <button className="btn-close-modal" onClick={() => setSelectedUser(null)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersManagement;