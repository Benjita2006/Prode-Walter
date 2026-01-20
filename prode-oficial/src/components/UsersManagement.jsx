// src/components/UsersManagement.jsx (CÓDIGO COMPLETO CON FILTRADO)
import React, { useState, useEffect } from 'react';
// Reutilizamos estilos, asumiendo que los estilos de MatchCreator.css funcionan
import './MatchCreator.css'; 
import { API_URL } from '../config';

function UsersManagement() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [error, setError] = useState(null);

    // 1. Cargar datos al iniciar el componente
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.status === 403) {
                    setError('ERROR: No tienes los permisos suficientes (Owner/Dev).');
                    return;
                }
                
                if (!res.ok) throw new Error('Error al cargar usuarios.');

                const data = await res.json();
                setUsuarios(data);
                
            } catch (err) {
                setError(err.message || 'Fallo de conexión al cargar la lista de usuarios.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // 2. Lógica de Filtrado
    const filteredUsers = usuarios.filter(user => 
        user.username.toLowerCase().includes(filtro.toLowerCase()) ||
        user.email.toLowerCase().includes(filtro.toLowerCase())
    );
    
    // 3. Renderizado del componente
    return (
        <div className="match-creator-container">
            <h2>👥 Panel de Gestión de Usuarios y Roles</h2>

            <input 
                type="text" 
                placeholder="🔍 Filtrar por Usuario o Email..." 
                className="table-input"
                style={{marginBottom: '20px', padding: '10px'}}
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                disabled={loading}
            />
            
            {error && <p className="status-message error">{error}</p>}
            
            {loading ? (
                <p>Cargando usuarios...</p>
            ) : (
                <div className="table-responsive">
                    <table className="matches-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol Actual</th>
                                <th>Acción (Cambiar Rol)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td style={{fontWeight: 'bold', color: user.role === 'Owner' ? '#ffcc00' : '#4caf50'}}>
                                        {user.role}
                                    </td>
                                    <td>
                                        {/* Aquí irá el selector y la lógica para cambiar el rol */}
                                        <button disabled>Cambiar a...</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default UsersManagement;