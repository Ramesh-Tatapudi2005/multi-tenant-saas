import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantSubdomain: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await login(formData.email, formData.password, formData.tenantSubdomain);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
      <h1>Login</h1>
      {error && <div className="error" style={{ color: 'red', padding: '10px', background: '#fee', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Tenant Subdomain (leave blank for super admin)</label>
          <input
            type="text"
            name="tenantSubdomain"
            value={formData.tenantSubdomain}
            onChange={handleChange}
            placeholder="e.g., demo"
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don't have an organization? <a href="/register">Register here</a>
      </p>

      <div style={{ marginTop: '30px', padding: '10px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
        <p><strong>Demo Credentials:</strong></p>
        <p>Admin: admin@demo.com / Demo@123</p>
        <p>Tenant Subdomain: demo</p>
        <p>User: user1@demo.com / User@123</p>
        <p style={{ marginTop: '10px' }}><strong>Super Admin:</strong></p>
        <p>Email: superadmin@system.com / Admin@123</p>
      </div>
    </div>
  );
}
