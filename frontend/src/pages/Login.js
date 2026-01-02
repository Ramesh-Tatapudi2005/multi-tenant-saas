import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '', tenantSubdomain: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // API 2: User Login
            const res = await API.post('/auth/login', formData);
            if (res.data.success) {
                localStorage.setItem('token', res.data.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.data.user));
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Connection failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={backgroundStyle}>
            <div style={glassCard}>
                <div style={headerSection}>
                    <h2 style={{ margin: '0 0 10px 0', color: '#1a202c' }}>Welcome Back</h2>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>Please enter your details to sign in</p>
                </div>

                {error && <div style={errorBox}>{error}</div>}

                <form onSubmit={handleLogin} style={formStyle}>
                    <div style={inputGroup}>
                        <label style={labelStyle}>Tenant Subdomain</label>
                        <input 
                            name="tenantSubdomain"
                            placeholder="e.g. demo"
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={inputGroup}>
                        <label style={labelStyle}>Email Address</label>
                        <input 
                            type="email"
                            name="email"
                            placeholder="admin@demo.com"
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={inputGroup}>
                        <label style={labelStyle}>Password</label>
                        <input 
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={loading ? { ...btnStyle, opacity: 0.7 } : btnStyle}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div style={footerStyle}>
                    <p>New here? Contact your administrator for access.</p>
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const backgroundStyle = {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontFamily: '"Inter", sans-serif'
};
const glassCard = {
    width: '100%', maxWidth: '400px', padding: '40px', background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center'
};
const headerSection = { marginBottom: '30px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputGroup = { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#4a5568', textTransform: 'uppercase' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', transition: 'border 0.2s' };
const btnStyle = {
    padding: '14px', backgroundColor: '#4c51bf', color: '#fff', border: 'none',
    borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'background 0.2s'
};
const errorBox = {
    padding: '12px', backgroundColor: '#fff5f5', color: '#c53030',
    borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid #feb2b2'
};
const footerStyle = { marginTop: '30px', fontSize: '12px', color: '#a0aec0' };

export default Login;