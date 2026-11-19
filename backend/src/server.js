
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import searchRoutes from "./routes/search.js";
import connectionsRoutes from "./routes/connections.js";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { projects, messages } from "./data/store.js";
import { db } from "./db/connection.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant : configurez la variable dans backend/.env ou Render.");
}
const app = express();

const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

// ============================================
// DONNÉES PARTAGÉES
// ============================================
// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/connections", connectionsRoutes);

// ============================================
// ROUTES
// ============================================

// Health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// ============================================
// USERS - SOURCE UNIQUE : SQLITE
// ============================================

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, email, full_name, created_at
      FROM users
      WHERE status = 'active'
      ORDER BY created_at DESC
    `).all();

    res.json(users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: 'user',
      createdAt: user.created_at
    })));
  } catch (error) {
    console.error("Erreur lecture utilisateurs :", error);
    res.status(500).json({ error: "Impossible de charger les utilisateurs." });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, full_name, created_at
      FROM users
      WHERE id = ? AND status = 'active'
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: 'user',
      createdAt: user.created_at
    });
  } catch (error) {
    console.error("Erreur lecture utilisateur :", error);
    res.status(500).json({ error: "Impossible de charger cet utilisateur." });
  }
});

// ============================================
// PROJECTS
// ============================================
app.get('/api/projects', (req, res) => {
  res.json(projects);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const { title, description, ownerId } = req.body;
  
  if (!title || !ownerId) {
    return res.status(400).json({ error: 'Titre et propriétaire requis' });
  }
  
  const project = {
    id: randomUUID(),
    title,
    description: description || '',
    status: 'active',
    ownerId,
    createdAt: new Date().toISOString()
  };
  projects.push(project);
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
  
  const { title, description, status } = req.body;
  if (title) project.title = title;
  if (description !== undefined) project.description = description;
  if (status) project.status = status;
  
  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Projet non trouvé' });
  projects.splice(index, 1);
  res.json({ message: 'Projet supprimé' });
});

// ============================================
// MESSAGES
// ============================================
app.get('/api/messages/:projectId', (req, res) => {
  const projectMessages = messages.filter(m => m.projectId === req.params.projectId);
  res.json(projectMessages);
});

app.post('/api/messages', (req, res) => {
  const { content, senderId, projectId } = req.body;
  
  if (!content || !senderId || !projectId) {
    return res.status(400).json({ error: 'Contenu, expéditeur et projet requis' });
  }
  
  const message = {
    id: randomUUID(),
    content,
    senderId,
    projectId,
    createdAt: new Date().toISOString()
  };
  messages.push(message);
  res.status(201).json(message);
});

// ============================================
// STATS
// ============================================
app.get('/api/stats', (req, res) => {
  res.json({
    users: users.length,
    projects: projects.length,
    messages: messages.length,
    uptime: process.uptime()
  });
});

// ============================================
// DÉMARRAGE
// ============================================


app.use(express.static(frontendDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();

  res.sendFile(path.join(frontendDist, "index.html"), err => {
    if (err) next(err);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UNITÉ 360 Backend sur http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📂 Projects: http://localhost:${PORT}/api/projects`);
});
