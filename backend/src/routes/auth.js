import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { users } from "../data/store.js";

const router = express.Router();

const getSecret = () =>
  process.env.JWT_SECRET || "unite360-dev-secret-change-me";

// ============================================
// INSCRIPTION
// ============================================
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        error: "Tous les champs sont requis"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 6 caractères"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = users.find(
      user =>
        user.email.toLowerCase() === normalizedEmail ||
        user.username.toLowerCase() === normalizedUsername
    );

    if (existingUser) {
      return res.status(409).json({
        error: "Cet email ou ce nom d'utilisateur est déjà utilisé"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: randomUUID(),
      username: username.trim(),
      email: normalizedEmail,
      fullName: fullName.trim(),
      passwordHash,
      role: "user",
      createdAt: new Date().toISOString()
    };

    users.push(user);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      getSecret(),
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Bienvenue dans UNITÉ 360 !",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Erreur inscription :", error);

    return res.status(500).json({
      error: "Erreur interne du serveur"
    });
  }
});

// ============================================
// CONNEXION
// ============================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = users.find(
      user => user.email.toLowerCase() === normalizedEmail
    );

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect"
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      getSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Connexion réussie. Bienvenue sur UNITÉ 360 !",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Erreur connexion :", error);

    return res.status(500).json({
      error: "Erreur interne du serveur"
    });
  }
});

export default router;
