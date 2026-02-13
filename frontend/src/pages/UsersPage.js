import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { tenantAPI } from '../services/api';

export default function UsersPage() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'user' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await tenantAPI.listUsers(user.tenantId, { limit: 100 });
      setUsers(res.data.data.users || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await tenantAPI.addUser(user.tenantId, formData);
      setFormData({ email: '', password: '', fullName: '', role: 'user' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      // Replace with actual delete endpoint when available
      alert('User deletion would require additional endpoint implementation');
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>Team Users</h1>
      {error && <div style={{ color: 'red', padding: '10px', marginBottom: '15px' }}>{error}</div>}

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px' }}>
        {showForm ? '✕ Cancel' : '+ Add User'}
      </button>

      {showForm && (
        <div style={{ background: '#f9f9f9', padding: '20px', marginBottom: '20px', borderRadius: '4px' }}>
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength="8" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="user">User</option>
                <option value="tenant_admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Add User</button>
          </form>
        </div>
      )}

      {users.length === 0 ? (
        <p>No users. Add one to get started!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-info">{u.role}</span></td>
                <td>{u.isActive ? '✓ Active' : 'Inactive'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
