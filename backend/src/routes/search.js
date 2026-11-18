import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/connection.js";

const router = express.Router();

// RECHERCHER ET DECOUVRIR LES MEMBRES

function authenticate(req, res, next) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentification requise."
    });
  }

  try {
    const decoded = jwt.verify(
      authorization.slice(7),
      process.env.JWT_SECRET
    );

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

router.get("/members", authenticate, (req, res) => {
  try {
    const query = String(req.query.q || "").trim().slice(0, 80);
    const limit = 50;

    const search = `%${query.toLowerCase()}%`;

    const members = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.full_name AS fullName,
        u.created_at AS createdAt,
        p.bio,
        p.location,
        p.profession,
        p.organization,
        p.experience,
        p.skills_json,
        p.website
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.status = 'active'
        AND (
          ? = ''
          OR lower(u.username) LIKE ?
          OR lower(u.full_name) LIKE ?
          OR lower(COALESCE(p.profession, '')) LIKE ?
          OR lower(COALESCE(p.organization, '')) LIKE ?
          OR lower(COALESCE(p.location, '')) LIKE ?
          OR lower(COALESCE(p.bio, '')) LIKE ?
          OR lower(COALESCE(p.skills_json, '')) LIKE ?
        )
      ORDER BY u.created_at DESC
      LIMIT ?
    `).all(
      query,
      search,
      search,
      search,
      search,
      search,
      search,
      search,
      limit
    );

    const results = members.map(member => {
      let skills = [];

      try {
        skills = JSON.parse(member.skills_json || "[]");
      } catch {
        skills = [];
      }

      return {
        id: member.id,
        username: member.username,
        fullName: member.fullName,
        bio: member.bio || "",
        location: member.location || "",
        profession: member.profession || "",
        organization: member.organization || "",
        experience: member.experience || "",
        skills,
        website: member.website || "",
        createdAt: member.createdAt
      };
    });

    return res.json({
      total: results.length,
      members: results
    });

  } catch (error) {
    console.error("Erreur recherche membres :", error.message);

    return res.status(500).json({
      error: "Impossible de rechercher les membres."
    });
  }
});

export default router;
