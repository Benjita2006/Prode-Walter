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
    
    // Aquí está el estado que daba error
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
            setError(null); // Limpiamos error si sale bien
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
            
            {/* 👇 ESTO ES LO QUE FALTABA: MOSTRAR EL ERROR */}
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
                            // Definimos colores de rol aquí mismo para simplificar
                            const roleColor = user.role === 'Owner' ? '#ffcc00' : user.role === 'Admin' ? '#00d4ff' : '#4caf50';
                            
                            return (
                                <tr key={user.id}>
                                    <td className="col-username">{user.username}</td>
                                    <td className="col-email">{user.email}</td>
                                    <td>
                                        <span className="role-badge" style={{color: roleColor, border: `1px solid ${roleColor}`, padding: '4px 8px', borderRadius: '4px'}}>
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
                <p className="empty-message">No se encontraron usuarios.</p>
            )}

            {/* --- MODAL FLOTANTE --- */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content wide-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Boletas de {selectedUser.username}</h3>
                        
                        {loadingTickets ? (
                            <p>Cargando...</p>
                        ) : (
                            <div className="tickets-scroll-area">
                                {Object.keys(ticketsPorFecha).length === 0 ? (
                                    <p style={{color: '#aaa'}}>Sin boletas creadas.</p>
                                ) : (
                                    Object.keys(ticketsPorFecha).map(fecha => (
                                        <div key={fecha} className="round-group">
                                            <h4 className="round-header" style={{color: '#4caf50', borderBottom: '1px solid #333', paddingBottom: '5px', marginTop:'15px'}}>{fecha}</h4>
                                            <div className="tickets-grid" style={{display: 'grid', gap: '10px', marginTop: '10px'}}>
                                                {ticketsPorFecha[fecha].map(ticket => (
                                                    <button 
                                                        key={ticket.id}
                                                        onClick={() => handleToggleTicket(ticket.id)}
                                                        className={`btn-round ${ticket.is_paid ? 'paid' : 'pending'}`}
                                                        style={{display: 'flex', justifyContent: 'space-between', alignItems:'center', width: '100%', padding:'12px'}}
                                                    >
                                                        <span style={{fontWeight:'bold'}}>{ticket.ticket_name} <small>({ticket.points} pts)</small></span>
                                                        <span style={{fontSize:'0.9rem'}}>{ticket.is_paid ? '✅ HABILITADA' : '🔒 PENDIENTE'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        <button className="btn-close-modal" onClick={() => setSelectedUser(null)} style={{marginTop:'20px'}}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersManagement;