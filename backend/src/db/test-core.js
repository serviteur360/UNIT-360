import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

const db = new DatabaseSync("backend/database.sqlite");

try {
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("BEGIN");

  const userId = randomUUID();
  const orgId = randomUUID();
  const membershipId = randomUUID();

  db.prepare(`
    INSERT INTO users
    (id, username, email, password_hash, full_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    userId,
    "test_core",
    "test-core@unite360.local",
    "hash_test_non_utilisable",
    "Utilisateur Test CORE"
  );

  db.prepare(`
    INSERT INTO organizations
    (id, name, slug, created_by)
    VALUES (?, ?, ?, ?)
  `).run(
    orgId,
    "Organisation Test",
    "organisation-test-core",
    userId
  );

  db.prepare(`
    INSERT INTO memberships
    (id, user_id, organization_id, role)
    VALUES (?, ?, ?, ?)
  `).run(membershipId, userId, orgId, "admin");

  const result = db.prepare(`
    SELECT users.full_name, organizations.name, memberships.role
    FROM memberships
    JOIN users ON users.id = memberships.user_id
    JOIN organizations ON organizations.id = memberships.organization_id
    WHERE memberships.id = ?
  `).get(membershipId);

  console.log("========== TEST CORE V1 ==========");
  console.log("Utilisateur :", result.full_name);
  console.log("Organisation :", result.name);
  console.log("Rôle :", result.role);
  console.log("Résultat : SUCCÈS");

  db.exec("ROLLBACK");
  console.log("Données de test annulées.");
} catch (error) {
  try {
    db.exec("ROLLBACK");
  } catch {}
  console.error("ÉCHEC DU TEST :", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
