import { randomUUID } from "crypto";

export const users = [
  {
    id: randomUUID(),
    username: "admin",
    email: "admin@unite360.com",
    fullName: "Administrateur",
    role: "admin",
    createdAt: new Date().toISOString()
  },
  {
    id: randomUUID(),
    username: "demo",
    email: "demo@unite360.com",
    fullName: "Utilisateur Démo",
    role: "user",
    createdAt: new Date().toISOString()
  }
];

export const projects = [
  {
    id: randomUUID(),
    title: "Projet Alpha",
    description: "Premier projet de démonstration",
    status: "active",
    ownerId: users[0].id,
    createdAt: new Date().toISOString()
  },
  {
    id: randomUUID(),
    title: "Projet Beta",
    description: "Deuxième projet en développement",
    status: "active",
    ownerId: users[1].id,
    createdAt: new Date().toISOString()
  }
];

export const messages = [
  {
    id: randomUUID(),
    content: "Bienvenue sur UNITÉ 360 ! 🚀",
    senderId: users[0].id,
    projectId: projects[0].id,
    createdAt: new Date().toISOString()
  }
];
