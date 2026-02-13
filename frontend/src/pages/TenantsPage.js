import React, { useEffect, useState } from 'react';
import { tenantAPI } from '../services/api';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await tenantAPI.listAll({ limit: 100 });
      setTenants(res.data.data.tenants || []);
    } catch (err) {
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>All Tenants</h1>
      {error && <div style={{ color: 'red', padding: '10px', marginBottom: '15px' }}>{error}</div>}

      {tenants.length === 0 ? (
        <p>No tenants.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Subdomain</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Users</th>
              <th>Projects</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.subdomain}</td>
                <td><span className={`badge badge-${t.status === 'active' ? 'success' : 'warning'}`}>{t.status}</span></td>
                <td>{t.subscriptionPlan}</td>
                <td>{t.totalUsers}</td>
                <td>{t.totalProjects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
