import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { db } from "../db/connection.js";

const router = express.Router();

function authenticate(req, res, next) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }

  try {
    const decoded = jwt.verify(
      authorization.slice(7),
      process.env.JWT_SECRET
    );

    if (!decoded.id) {
      return res.status(401).json({ error: "Jeton invalide." });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }
}

router.use(authenticate);
// CONNEXIONS ACCEPTEES
router.get("/", (req, res) => {
  try {
    const members = db.prepare(`
      SELECT c.id AS connectionId,
        u.id, u.username, u.full_name AS fullName
      FROM connections c
      JOIN users u ON u.id =
        CASE WHEN c.requester_id = ?
        THEN c.recipient_id ELSE c.requester_id END
      WHERE c.status = 'accepted'
        AND (c.requester_id = ? OR c.recipient_id = ?)
    `).all(req.user.id, req.user.id, req.user.id);

    res.json({ total: members.length, connections: members });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur de chargement." });
  }
});

// INVITATIONS RECUES
router.get("/requests", (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT c.id AS requestId,
        u.id, u.username, u.full_name AS fullName,
        c.created_at AS createdAt
      FROM connections c
      JOIN users u ON u.id = c.requester_id
      WHERE c.recipient_id = ? AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    res.json({ total: requests.length, requests });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur de chargement." });
  }
});

// INVITATIONS ENVOYEES
router.get("/sent", (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT c.id AS requestId,
        u.id, u.username, u.full_name AS fullName,
        c.created_at AS createdAt
      FROM connections c
      JOIN users u ON u.id = c.recipient_id
      WHERE c.requester_id = ? AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    res.json({ total: requests.length, requests });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur de chargement." });
  }
});

// ENVOYER UNE INVITATION
router.post("/requests", (req, res) => {
  try {
    const recipientId = String(req.body.recipientId || "").trim();

    if (!recipientId || recipientId === req.user.id) {
      return res.status(400).json({ error: "Destinataire invalide." });
    }

    const recipient = db.prepare(
      "SELECT id FROM users WHERE id = ? AND status = 'active'"
    ).get(recipientId);

    if (!recipient) {
      return res.status(404).json({ error: "Membre introuvable." });
    }
    const existing = db.prepare(`
      SELECT * FROM connections
      WHERE (requester_id = ? AND recipient_id = ?)
         OR (requester_id = ? AND recipient_id = ?)
    `).get(req.user.id, recipientId, recipientId, req.user.id);

    if (existing && existing.status !== "rejected") {
      return res.status(409).json({
        error: "Une invitation ou une connexion existe déjà."
      });
    }
    if (existing) {
      db.prepare(`
        UPDATE connections
        SET requester_id = ?, recipient_id = ?,
            status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, recipientId, existing.id);

      return res.json({ message: "Invitation renvoyée." });
    }

    db.prepare(`
      INSERT INTO connections
      (id, requester_id, recipient_id, status)
      VALUES (?, ?, ?, 'pending')
    `).run(randomUUID(), req.user.id, recipientId);

    res.status(201).json({ message: "Invitation envoyée." });
  } catch (error) {
    console.error("Erreur invitation :", error.message);
    res.status(500).json({ error: "Impossible d'envoyer l'invitation." });
  }
});

// ACCEPTER OU REFUSER UNE INVITATION
router.post("/requests/:id/:action", (req, res) => {
  try {
    const { id, action } = req.params;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action invalide." });
    }
    const request = db.prepare(`
      SELECT id FROM connections
      WHERE id = ? AND recipient_id = ? AND status = 'pending'
    `).get(id, req.user.id);

    if (!request) {
      return res.status(404).json({ error: "Invitation introuvable." });
    }
    const status = action === "accept" ? "accepted" : "rejected";

    db.prepare(`
      UPDATE connections
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);

    res.json({
      message: action === "accept"
        ? "Connexion acceptée."
        : "Invitation refusée."
    });
  } catch (error) {
    console.error("Erreur traitement invitation :", error.message);
    res.status(500).json({
      error: "Impossible de traiter l'invitation."
    });
  }
});

// SUPPRIMER UNE INVITATION OU UNE CONNEXION
router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM connections
      WHERE id = ?
        AND (
          (requester_id = ? AND status = 'pending')
          OR (requester_id = ? AND status = 'accepted')
          OR (recipient_id = ? AND status = 'accepted')
        )
    `).run(
      req.params.id,
      req.user.id,
      req.user.id,
      req.user.id
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Invitation ou connexion introuvable."
      });
    }
    res.json({ message: "Opération effectuée." });
  } catch (error) {
    console.error("Erreur suppression connexion :", error.message);
    res.status(500).json({
      error: "Impossible d'effectuer cette opération."
    });
  }
});

export default router;
