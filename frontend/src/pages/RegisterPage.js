import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { registerTenant } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    adminPassword: '',
    adminFullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerTenant(formData);
      setSuccess('✓ Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
      <h1>Register New Organization</h1>
      {error && <div className="error" style={{ color: 'red', padding: '10px', background: '#fee' }}>{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Organization Name</label>
          <input
            type="text"
            name="tenantName"
            value={formData.tenantName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Subdomain (yoursubdomain.saas)</label>
          <input
            type="text"
            name="subdomain"
            value={formData.subdomain}
            onChange={handleChange}
            placeholder="e.g., mycompany"
            required
          />
        </div>

        <div className="form-group">
          <label>Admin Full Name</label>
          <input
            type="text"
            name="adminFullName"
            value={formData.adminFullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Admin Email</label>
          <input
            type="email"
            name="adminEmail"
            value={formData.adminEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Admin Password</label>
          <input
            type="password"
            name="adminPassword"
            value={formData.adminPassword}
            onChange={handleChange}
            minLength="8"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
}
