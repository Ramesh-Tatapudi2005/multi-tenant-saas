import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '../services/api';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [taskInputs, setTaskInputs] = useState({});
    const navigate = useNavigate();
    
    // Auth & Role Identification
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isTenantAdmin = user.role === 'tenant_admin';
    const isSuperAdmin = user.role === 'super_admin';
    const canManage = isTenantAdmin; 

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [pRes, aRes] = await Promise.all([API.get('/projects'), API.get('/audit-logs')]);
            if (pRes.data.success) setProjects(pRes.data.data.projects);
            if (aRes.data.success) setAuditLogs(aRes.data.data.logs);
        } catch (e) { console.error("Sync Error", e); }
    };

    // --- PROJECT ACTIONS ---
    const handleCreateProject = async () => {
        if (!newProjectName || !canManage) return;
        await API.post('/projects', { name: newProjectName });
        setNewProjectName(''); 
        fetchData();
    };

    const handleDeleteProject = async (projectId) => {
        if (!canManage) return;
        if (window.confirm("Are you sure you want to delete this project?")) {
            await API.delete(`/projects/${projectId}`);
            fetchData();
        }
    };

    // --- TASK ACTIONS ---
    const handleCreateTask = async (projectId) => {
        const title = taskInputs[projectId];
        if (!title || !canManage) return;

        try {
            // Ensure projectId is a Number to match backend Integer requirement
            await API.post('/tasks', { 
                projectId: Number(projectId), 
                title: title 
            });
            setTaskInputs({ ...taskInputs, [projectId]: '' }); 
            fetchData(); 
        } catch (e) {
            console.error("Failed to add task", e.response?.data?.detail);
        }
    };

    const handleToggleTaskStatus = async (taskId, currentStatus) => {
        if (!canManage) return;
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
        
        try {
            // PATCH used for partial update of task status
            await API.patch(`/tasks/${taskId}`, { status: newStatus });
            fetchData();
        } catch (e) {
            console.error("Update failed", e);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!canManage) return;
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await API.delete(`/tasks/${taskId}`);
                fetchData();
            } catch (e) {
                console.error("Delete failed", e);
            }
        }
    };

    // Analytics Calculation
    // --- Updated Analytics Section ---

// 1. Keep chartData for the Bar Chart (Task Load Distribution)
const chartData = projects.map(p => ({ 
    name: p.name, 
    tasks: p.tasks?.length || 0 
}));

// 2. New task-based logic for the Pie Chart (Project Status Completion)
const allTasks = projects.flatMap(p => p.tasks || []);
const completedCount = allTasks.filter(t => t.status === 'completed').length;
const pendingCount = allTasks.filter(t => t.status === 'pending').length;

const statusData = [
    { name: 'Completed Tasks', value: completedCount },
    { name: 'Pending Tasks', value: pendingCount },
];

// 3. Prevent the chart from breaking if no tasks exist
if (allTasks.length === 0) {
    statusData[1].value = 1; 
}

const COLORS = ['#10b981', '#3b82f6'];

    return (
        <div style={layout}>
            {/* --- SIDEBAR NAVIGATION --- */}
            <aside style={sidebar}>
                <div style={logoSection}>
                    SaaS Pro <span style={roleBadge}>{user.role?.replace('_', ' ')}</span>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? activeBtn : navBtn}>📊 Overview</button>
                    <button onClick={() => setActiveTab('projects')} style={activeTab === 'projects' ? activeBtn : navBtn}>📁 Projects</button>
                    <button onClick={() => setActiveTab('logs')} style={activeTab === 'logs' ? activeBtn : navBtn}>📜 Audit Logs</button>
                </nav>
                <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={logoutBtn}>Sign Out</button>
            </aside>

            {/* --- MAIN CONTENT FRAME --- */}
            <main style={mainFrame}>
                <header style={topHeader}>
                    <h2 style={{ margin: 0 }}>{activeTab.toUpperCase()}</h2>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user.email}</div>
                        <small style={{ color: '#666' }}>Tenant: {isSuperAdmin ? 'Global Monitor' : user.tenantId}</small>
                    </div>
                </header>

                <div style={contentPadding}>
                    {/* FRAME 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div style={grid}>
                            <div style={chartCard}>
                                <h3>Task Load Distribution</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={chartData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={chartCard}>
                                <h3>Project Status Completion</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {statusData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* FRAME 2: PROJECTS & TASK MANAGEMENT */}
                    {activeTab === 'projects' && (
                        <div>
                            {canManage && (
                                <div style={glassCard}>
                                    <h4 style={{marginTop:0}}>Launch New Project</h4>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input style={input} placeholder="Enter project name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                                        <button onClick={handleCreateProject} style={btnBlue}>Create Project</button>
                                    </div>
                                </div>
                            )}
                            <div style={grid}>
                                {projects.map(p => (
                                    <div key={p.id} style={projCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h3 style={{margin:0}}>{p.name}</h3>
                                            {canManage && <button onClick={() => handleDeleteProject(p.id)} style={btnDeleteText}>Delete</button>}
                                        </div>
                                        <div style={taskSection}>
                                            <small style={{fontWeight:'bold', color:'#888'}}>ACTIVE TASKS</small>
                                            {p.tasks?.map(t => (
                                                <div key={t.id} style={taskRow}>
                                                    <span style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                                                        {t.title}
                                                    </span>
                                                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                                        <span style={statusTag}>{t.status}</span>
                                                        {canManage && (
                                                            <>
                                                                <button onClick={() => handleToggleTaskStatus(t.id, t.status)} style={btnSmall}>
                                                                    {t.status === 'pending' ? '✓' : '⟲'}
                                                                </button>
                                                                <button onClick={() => handleDeleteTask(t.id)} style={smallDelBtn}>×</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {canManage && (
                                                <div style={{ display: 'flex', marginTop: '10px', gap: '5px' }}>
                                                    <input 
                                                        style={smallInput} 
                                                        placeholder="Assign new task..." 
                                                        value={taskInputs[p.id] || ''} 
                                                        onChange={e => setTaskInputs({...taskInputs, [p.id]: e.target.value})} 
                                                    />
                                                    <button onClick={() => handleCreateTask(p.id)} style={btnCircle}>+</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FRAME 3: AUDIT LOGS */}
                    {activeTab === 'logs' && (
                        <div style={tableContainer}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={tableHeaderRow}>
                                        <th>TIMESTAMP</th>
                                        <th>EVENT</th>
                                        {isSuperAdmin && <th>TENANT ID</th>}
                                        <th>DETAILS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log.id} style={tableBodyRow}>
                                            <td style={{fontSize:'12px'}}>{new Date(log.created_at).toLocaleString()}</td>
                                            <td>
                                                <span style={{
                                                    ...actionBadge, 
                                                    backgroundColor: log.action === 'LOGIN' ? '#dbeafe' : '#d1fae5',
                                                    color: log.action === 'LOGIN' ? '#1e40af' : '#065f46'
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            {isSuperAdmin && <td style={{fontSize:'12px'}}>{log.tenant_id || 'System'}</td>}
                                            <td style={{fontSize:'12px', color:'#475569'}}>{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- STYLES ---
const layout = { display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' };
const sidebar = { width: '280px', backgroundColor: '#0f172a', color: '#fff', padding: '30px', display: 'flex', flexDirection: 'column' };
const logoSection = { fontSize: '24px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' };
const roleBadge = { fontSize: '10px', background: '#3b82f6', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' };
const navBtn = { padding: '14px', textAlign: 'left', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', borderRadius: '8px', transition: '0.2s' };
const activeBtn = { ...navBtn, color: '#fff', backgroundColor: '#1e293b' };
const logoutBtn = { marginTop: 'auto', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const mainFrame = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const topHeader = { padding: '20px 40px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const contentPadding = { padding: '40px', overflowY: 'auto' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' };
const chartCard = { backgroundColor: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const projCard = { backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const taskSection = { marginTop: '20px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '12px' };
const taskRow = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px' };
const statusTag = { fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase' };
const glassCard = { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #e2e8f0' };
const input = { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' };
const btnBlue = { padding: '12px 24px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const btnDeleteText = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const smallInput = { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' };
const btnCircle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' };
const tableContainer = { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeaderRow = { textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' };
const tableBodyRow = { borderBottom: '1px solid #f1f5f9', height: '55px' };
const actionBadge = { fontSize: '11px', fontWeight: 'bold', color: '#059669', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '20px' };
const smallDelBtn = { border:'none', background:'none', color:'#ef4444', cursor:'pointer', fontSize:'18px', padding: '0 5px' };
const btnSmall = { padding: '2px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };

export default Dashboard;