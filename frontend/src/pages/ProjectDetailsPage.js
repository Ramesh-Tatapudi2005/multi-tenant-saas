import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { taskAPI, projectAPI } from '../services/api';

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const res = await taskAPI.list(projectId, { limit: 100 });
      setTasks(res.data.data.tasks || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load project data');
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create(projectId, formData);
      setFormData({ title: '', description: '', priority: 'medium' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, { status: newStatus });
      fetchData();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      fetchData();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>Project Tasks</h1>
      {error && <div style={{ color: 'red', padding: '10px', marginBottom: '15px' }}>{error}</div>}

      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px' }}>
        {showForm ? '✕ Cancel' : '+ New Task'}
      </button>

      {showForm && (
        <div style={{ background: '#f9f9f9', padding: '20px', marginBottom: '20px', borderRadius: '4px' }}>
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Task Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <p>No tasks. Create one to get started!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>
                  <select onChange={(e) => handleUpdateStatus(t.id, e.target.value)} value={t.status} style={{ padding: '4px' }}>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td><span className="badge badge-info">{t.priority}</span></td>
                <td>{t.assignedTo?.fullName || '-'}</td>
                <td>
                  <button className="btn btn-danger" onClick={() => handleDeleteTask(t.id)} style={{ padding: '6px 12px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
