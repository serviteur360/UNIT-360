import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { db } from "../db/connection.js";

const router = express.Router();

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET manquant.");
  }
  return process.env.JWT_SECRET;
};

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  fullName: user.full_name,
  role: "user",
  createdAt: user.created_at
});

// INSCRIPTION
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof fullName !== "string"
    ) {
      return res.status(400).json({
        error: "Tous les champs sont requis."
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    if (!cleanUsername || !normalizedEmail || !cleanFullName || !password) {
      return res.status(400).json({
        error: "Tous les champs sont requis."
      });
    }

    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir entre 6 et 128 caractères."
      });
    }

    const existing = db.prepare(`
      SELECT id FROM users
      WHERE lower(email) = ? OR lower(username) = ?
    `).get(normalizedEmail, cleanUsername);

    if (existing) {
      return res.status(409).json({
        error: "Cet email ou ce nom d'utilisateur est déjà utilisé."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, full_name, status
      )
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(
      userId,
      cleanUsername,
      normalizedEmail,
      passwordHash,
      cleanFullName
    );

    const user = db.prepare(`
      SELECT id, username, email, full_name, created_at
      FROM users WHERE id = ?
    `).get(userId);

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: "user"
    }, getSecret(), { expiresIn: "7d" });

    return res.status(201).json({
      message: "Bienvenue dans UNITÉ 360 !",
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Erreur inscription :", error);
    return res.status(500).json({
      error: "Erreur interne du serveur."
    });
  }
});

// CONNEXION
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email et mot de passe requis."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare(`
      SELECT id, username, email, password_hash,
             full_name, status, created_at
      FROM users
      WHERE lower(email) = ?
    `).get(normalizedEmail);

    if (!user || user.status !== "active") {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect."
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect."
      });
    }

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: "user"
    }, getSecret(), { expiresIn: "7d" });

    return res.json({
      message: "Connexion réussie. Bienvenue sur UNITÉ 360 !",
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Erreur connexion :", error);
    return res.status(500).json({
      error: "Erreur interne du serveur."
    });
  }
});

export default router;
