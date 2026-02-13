import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { projectAPI } from '../services/api';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0 });
  const [projects, setProjects] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const projectsRes = await projectAPI.list({ limit: 100 });
      const projectsData = projectsRes.data.data.projects || [];
      setProjects(projectsData.slice(0, 5));

      // Calculate stats
      let totalProjects = projectsData.length;
      let totalTasks = projectsData.reduce((sum, p) => sum + (p.taskCount || 0), 0);
      let completedTasks = projectsData.reduce((sum, p) => sum + (p.completedTaskCount || 0), 0);
      let pendingTasks = totalTasks - completedTasks;

      setStats({
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.fullName}!</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-card-value">{stats.totalProjects}</div>
          <div className="stat-card-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.totalTasks}</div>
          <div className="stat-card-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.completedTasks}</div>
          <div className="stat-card-label">Completed Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.pendingTasks}</div>
          <div className="stat-card-label">Pending Tasks</div>
        </div>
      </div>

      <h2>Recent Projects</h2>
      {projects.length === 0 ? (
        <p>No projects yet. <a href="/projects">Create one now</a></p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Tasks</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td><a href={`/projects/${p.id}`}>{p.name}</a></td>
                <td><span className={`badge badge-${p.status === 'active' ? 'success' : 'warning'}`}>{p.status}</span></td>
                <td>{p.taskCount} / {p.completedTaskCount} completed</td>
                <td>{p.createdBy?.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
