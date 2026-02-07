// src/components/UsersManagement.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './UsersManagement.css'; // 👈 Importamos el CSS nuevo

function UsersManagement() {
    const [usuarios, setUsuarios] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [error, setError] = useState(null);

    // Cargar usuarios
    const fetchUsers = async () => {
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
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // CAMBIAR ROL
    const handleChangeRole = async (userId, newRole) => {
        const token = localStorage.getItem('token');
        if(!window.confirm(`¿Seguro que quieres cambiar este usuario a ${newRole}?`)) return;

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

    // CAMBIAR PAGO (Toggle simple para is_paid legacy, aunque idealmente usaremos el modal por fecha)
    const togglePayment = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}/payment`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setUsuarios(usuarios.map(u => 
                    u.id === userId ? { ...u, is_paid: !u.is_paid } : u
                ));
            } else {
                alert('Error al actualizar el pago.');
            }
        } catch (error) { 
            console.error(error);
            alert('Error de conexión.');
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
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Pago (Global)</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => {
                            const roleStyle = getRoleStyle(user.role);
                            return (
                                <tr key={user.id}>
                                    <td>#{user.id}</td>
                                    <td className="col-username">{user.username}</td>
                                    <td className="col-email">{user.email}</td>
                                    <td>
                                        <span className="role-badge" style={roleStyle}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {user.is_paid ? (
                                            <span className="payment-status status-paid">✅ PAGADO</span>
                                        ) : (
                                            <span className="payment-status status-pending">❌ PENDIENTE</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="actions-container">
                                            {/* Botón Pago */}
                                            <button 
                                                onClick={() => togglePayment(user.id)}
                                                className={`btn-action ${user.is_paid ? 'btn-revoke' : 'btn-confirm'}`}
                                            >
                                                {user.is_paid ? 'Revocar' : 'Confirmar'}
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
                                                <option value="Dev">Dev</option>
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
        </div>
    );
}

export default UsersManagement;