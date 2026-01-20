// src/components/UsersManagement.jsx (VERSIÓN FINAL FUNCIONAL)
import React, { useState, useEffect } from 'react';
import './MatchCreator.css'; 
import { API_URL } from '../config';

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

    // FUNCIÓN PARA CAMBIAR ROL
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
                fetchUsers(); // Recargar la lista para ver el cambio
            } else {
                alert('Error al cambiar el rol');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    };

    // Filtrado
    const filteredUsers = usuarios.filter(user => 
        user.username.toLowerCase().includes(filtro.toLowerCase()) ||
        user.email.toLowerCase().includes(filtro.toLowerCase())
    );
    
    return (
        <div className="match-creator-container">
            <h2>👥 Gestión de Usuarios</h2>
            <input 
                type="text" 
                placeholder="🔍 Buscar usuario..." 
                className="table-input"
                style={{marginBottom: '20px', padding: '10px'}}
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
            />
            
            {error && <p className="status-message error">{error}</p>}
            
            <div className="table-responsive">
                <table className="matches-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span style={{
                                        fontWeight: 'bold', 
                                        color: user.role === 'Owner' ? '#ffcc00' : user.role === 'Admin' ? '#00d4ff' : '#4caf50'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <select 
                                        defaultValue="" 
                                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                        style={{padding: '5px', borderRadius: '5px'}}
                                    >
                                        <option value="" disabled>Cambiar Rol...</option>
                                        <option value="User">User</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Dev">Dev</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UsersManagement;