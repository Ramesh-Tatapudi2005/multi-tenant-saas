import React, { useEffect, useState } from 'react';
import { projectAPI } from '../services/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.list({});
      setProjects(res.data.data.projects || []);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.create(formData);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectAPI.delete(projectId);
      fetchProjects();
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>Projects</h1>
      {error && <div style={{ color: 'red', padding: '10px', marginBottom: '15px' }}>{error}</div>}

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px' }}>
        {showForm ? '✕ Cancel' : '+ New Project'}
      </button>

      {showForm && (
        <div style={{ background: '#f9f9f9', padding: '20px', marginBottom: '20px', borderRadius: '4px' }}>
          <h3>Create New Project</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Project Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <p>No projects. Create one to get started!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {projects.map(p => (
            <div key={p.id} className="card">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <p><strong>Tasks:</strong> {p.taskCount} ({p.completedTaskCount} completed)</p>
              <p><span className={`badge badge-${p.status === 'active' ? 'success' : 'warning'}`}>{p.status}</span></p>
              <div style={{ marginTop: '10px' }}>
                <a href={`/projects/${p.id}`} className="btn btn-primary" style={{ marginRight: '10px' }}>View</a>
                <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
