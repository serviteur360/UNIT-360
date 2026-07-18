import { useState, useEffect } from 'react';

function App() {
  const [status, setStatus] = useState('Chargement...');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', fullName: '' });
  const [newProject, setNewProject] = useState({ title: '', description: '', ownerId: '' });

  useEffect(() => {
    // Health
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setStatus(`✅ ${d.status} - ${d.version}`))
      .catch(() => setStatus('❌ Backend hors ligne'));

    // Users
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(() => console.error('Erreur users'));

    // Projects
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(() => console.error('Erreur projects'));
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const user = await res.json();
      setUsers([...users, user]);
      setNewUser({ username: '', email: '', password: '', fullName: '' });
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProject, ownerId: users[0]?.id || '' })
      });
      const project = await res.json();
      setProjects([...projects, project]);
      setNewProject({ title: '', description: '', ownerId: '' });
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
        <h1 style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🚀 UNITÉ 360
        </h1>
        <div style={{ color: '#aaa' }}>{status}</div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Users */}
        <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '12px' }}>
          <h2>👥 Utilisateurs ({users.length})</h2>
          <form onSubmit={createUser} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '15px 0' }}>
            <input
              placeholder="Nom d'utilisateur"
              value={newUser.username}
              onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#2a2a4a', color: '#fff' }}
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#2a2a4a', color: '#fff' }}
              required
            />
            <input
              placeholder="Mot de passe"
              type="password"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#2a2a4a', color: '#fff' }}
              required
            />
            <input
              placeholder="Nom complet"
              value={newUser.fullName}
              onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#2a2a4a', color: '#fff' }}
              required
            />
            <button type="submit" style={{ padding: '8px 20px', background: '#667eea', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
              Ajouter
            </button>
          </form>
          <div>
            {users.map(u => (
              <div key={u.id} style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                <span>{u.fullName} (@{u.username})</span>
                <span style={{ color: '#888' }}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '12px' }}>
          <h2>📂 Projets ({projects.length})</h2>
          <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
            <input
              placeholder="Titre du projet"
              value={newProject.title}
              onChange={e => setNewProject({ ...newProject, title: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: 'none', background: '#2a2a4a', color: '#fff' }}
              required
            />
            <input
              placeholder="Description"
              value={newProject.description}
              onChange={e => setNewProject({ ...newProject, description: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: 'none', background: '#2a2a4a', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '8px 20px', background: '#764ba2', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
              Créer un projet
            </button>
          </form>
          <div>
            {projects.map(p => (
              <div key={p.id} style={{ padding: '10px', borderBottom: '1px solid #333' }}>
                <strong>{p.title}</strong>
                <p style={{ color: '#888', fontSize: '14px' }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
