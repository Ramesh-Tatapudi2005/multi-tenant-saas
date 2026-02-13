import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Navigation() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="navbar-brand">📊 SaaS Platform</div>
        <div className="navbar-menu">
          <a href="/dashboard">Dashboard</a>
          <a href="/projects">Projects</a>
          {user?.role === 'tenant_admin' && <a href="/users">Users</a>}
          {user?.role === 'super_admin' && <a href="/tenants">Tenants</a>}
          <span style={{ color: '#aaa' }}>|</span>
          <span>{user?.email}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
