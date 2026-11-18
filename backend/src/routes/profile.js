import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/connection.js";

const router = express.Router();

// TABLE DES PROFILS
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    bio TEXT DEFAULT '',
    location TEXT DEFAULT '',
    profession TEXT DEFAULT '',
    organization TEXT DEFAULT '',
    experience TEXT DEFAULT '',
    skills_json TEXT DEFAULT '[]',
    website TEXT DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// PROTECTION JWT
function authenticate(req, res, next) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentification requise."
    });
  }

  const token = authorization.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        error: "Jeton invalide."
      });
    }

    req.user = decoded;
    next();

  } catch {
    return res.status(401).json({
      error: "Session invalide ou expirée."
    });
  }
}

// FORMAT DU PROFIL
function formatProfile(user, profile) {
  let skills = [];

  try {
    skills = JSON.parse(profile?.skills_json || "[]");
  } catch {
    skills = [];
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    bio: profile?.bio || "",
    location: profile?.location || "",
    profession: profile?.profession || "",
    organization: profile?.organization || "",
    experience: profile?.experience || "",
    skills,
    website: profile?.website || "",
    updatedAt: profile?.updated_at || null
  };
}

// CONSULTER SON PROPRE PROFIL
router.get("/me", authenticate, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, full_name
      FROM users
      WHERE id = ? AND status = 'active'
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur introuvable."
      });
    }

    const profile = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(user.id);

    return res.json({
      profile: formatProfile(user, profile)
    });

  } catch (error) {
    console.error("Erreur lecture profil :", error.message);

    return res.status(500).json({
      error: "Impossible de charger le profil."
    });
  }
});

// MODIFIER SON PROPRE PROFIL
router.put("/me", authenticate, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, full_name
      FROM users
      WHERE id = ? AND status = 'active'
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur introuvable."
      });
    }

    const body = req.body || {};

    const fields = [
      "bio",
      "location",
      "profession",
      "organization",
      "experience",
      "website"
    ];

    const values = {};

    for (const field of fields) {
      const value = body[field] ?? "";

      if (typeof value !== "string") {
        return res.status(400).json({
          error: `Le champ ${field} doit être un texte.`
        });
      }

      if (value.length > 2000) {
        return res.status(400).json({
          error: `Le champ ${field} est trop long.`
        });
      }

      values[field] = value.trim();
    }

    let skills = body.skills ?? [];

    if (
      !Array.isArray(skills) ||
      skills.length > 30 ||
      !skills.every(skill =>
        typeof skill === "string" && skill.trim().length <= 60
      )
    ) {
      return res.status(400).json({
        error: "La liste des compétences est invalide."
      });
    }

    skills = [...new Set(
      skills.map(skill => skill.trim()).filter(Boolean)
    )];

    db.prepare(`
      INSERT INTO profiles (
        user_id, bio, location, profession,
        organization, experience, skills_json,
        website, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)

      ON CONFLICT(user_id) DO UPDATE SET
        bio = excluded.bio,
        location = excluded.location,
        profession = excluded.profession,
        organization = excluded.organization,
        experience = excluded.experience,
        skills_json = excluded.skills_json,
        website = excluded.website,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      user.id,
      values.bio,
      values.location,
      values.profession,
      values.organization,
      values.experience,
      JSON.stringify(skills),
      values.website
    );

    const profile = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(user.id);

    return res.json({
      message: "Profil mis à jour avec succès.",
      profile: formatProfile(user, profile)
    });

  } catch (error) {
    console.error("Erreur modification profil :", error.message);

    return res.status(500).json({
      error: "Impossible de mettre à jour le profil."
    });
  }
});

// CONSULTER UN PROFIL PUBLIC PAR NOM D'UTILISATEUR
router.get("/:username", (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, full_name
      FROM users
      WHERE lower(username) = lower(?)
      AND status = 'active'
    `).get(req.params.username);

    if (!user) {
      return res.status(404).json({
        error: "Profil introuvable."
      });
    }

    const profile = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(user.id);

    return res.json({
      profile: formatProfile(user, profile)
    });

  } catch (error) {
    console.error("Erreur profil public :", error.message);

    return res.status(500).json({
      error: "Impossible de consulter ce profil."
    });
  }
});

export default router;
