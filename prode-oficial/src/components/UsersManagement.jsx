// src/components/UsersManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import './UsersManagement.css'; 

function UsersManagement() {
    const [usuarios, setUsuarios] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [selectedUser, setSelectedUser] = useState(null); // Usuario seleccionado para el modal
    const [error, setError] = useState(null);

    // Lista de fechas disponibles (Idealmente vendría del backend)
    const rondasDisponibles = ['Fecha 1', 'Fecha 2', 'Fecha 3', 'Fecha 4', 'Fecha 5', 'Fecha 6'];

    // Cargar usuarios (envuelto en useCallback para evitar warnings)
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
        } catch (err) {
            setError(err.message);
        }
    }, []);

    // Ejecutar carga inicial
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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

    // TOGGLE PAGO POR FECHA (Llama a la nueva ruta)
    const handleToggleRound = async (userId, roundName) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, roundName })
            });

            if (res.ok) {
                const data = await res.json(); // { success: true, status: 'PAID' o 'PENDING' }
                
                // Actualizar interfaz visualmente sin recargar todo
                setUsuarios(prev => prev.map(u => {
                    if (u.id !== userId) return u;
                    
                    const currentRounds = u.paid_rounds || [];
                    let newRounds;

                    if (data.status === 'PAID') {
                        newRounds = [...currentRounds, roundName];
                    } else {
                        newRounds = currentRounds.filter(r => r !== roundName);
                    }

                    // Actualizamos también el usuario seleccionado para que el modal reaccione en vivo
                    if (selectedUser && selectedUser.id === userId) {
                        setSelectedUser(prevSel => ({ ...prevSel, paid_rounds: newRounds }));
                    }

                    return { ...u, paid_rounds: newRounds };
                }));
            }
        } catch (error) {
            console.error(error);
            alert("Error al actualizar pago");
        }
    };

    // Filtrado
    const filteredUsers = usuarios.filter(user => 
        user.username.toLowerCase().includes(filtro.toLowerCase()) ||
        user.email.toLowerCase().includes(filtro.toLowerCase())
    );
    
    // Helper para estilo de Rol
    const getRoleStyle = (role) => {
        if (role === 'Owner') return { backgroundColor: 'rgba(255, 204, 0, 0.2)', color: '#ffcc00' };
        if (role === 'Admin') return { backgroundColor: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff' };
        return { backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' };
    };

    return (
        <div className="users-management-container">
            <h2 className="users-management-header">👥 Gestión de Usuarios y Pagos</h2>
            
            <input 
                type="text" 
                placeholder="🔍 Buscar usuario por nombre o email..." 
                className="users-search-input"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="table-responsive">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Pagos Activos</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => {
                            const roleStyle = getRoleStyle(user.role);
                            return (
                                <tr key={user.id}>
                                    <td className="col-username">{user.username}</td>
                                    <td className="col-email">{user.email}</td>
                                    <td>
                                        <span className="role-badge" style={roleStyle}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {/* Badge que muestra cuántas fechas pagó */}
                                        <span className="payment-count-badge">
                                            {user.paid_rounds ? user.paid_rounds.length : 0} Fechas
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-container">
                                            {/* Botón para abrir el Modal */}
                                            <button 
                                                onClick={() => setSelectedUser(user)}
                                                className="btn-action btn-manage"
                                            >
                                                💰 Gestionar
                                            </button>

                                            {/* Select Rol */}
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
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Pagos de {selectedUser.username}</h3>
                        <p className="modal-subtitle">Toca una fecha para activar/desactivar:</p>
                        
                        <div className="rounds-grid">
                            {rondasDisponibles.map(ronda => {
                                const isPaid = selectedUser.paid_rounds?.includes(ronda);
                                return (
                                    <button 
                                        key={ronda} 
                                        onClick={() => handleToggleRound(selectedUser.id, ronda)}
                                        className={`btn-round ${isPaid ? 'paid' : 'pending'}`}
                                    >
                                        <span className="round-name">{ronda}</span>
                                        <span className="round-icon">{isPaid ? '✅' : '❌'}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <button className="btn-close-modal" onClick={() => setSelectedUser(null)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersManagement;