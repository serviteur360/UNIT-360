import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(new URL("../../database.sqlite", import.meta.url));

const db = new DatabaseSync(databasePath);

db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    organization_type TEXT NOT NULL DEFAULT 'company',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('admin', 'advisor', 'entrepreneur', 'member')),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, organization_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    owner_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    project_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    project_id TEXT,
    uploaded_by TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT,
    storage_key TEXT,
    classification TEXT DEFAULT 'general',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    actor_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (requester_id <> recipient_id),
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_pair
ON connections (
    CASE WHEN requester_id < recipient_id THEN requester_id ELSE recipient_id END,
    CASE WHEN requester_id < recipient_id THEN recipient_id ELSE requester_id END
);

CREATE INDEX IF NOT EXISTS idx_memberships_user
ON memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_organization
ON memberships(organization_id);

CREATE INDEX IF NOT EXISTS idx_projects_organization
ON projects(organization_id);

CREATE INDEX IF NOT EXISTS idx_tasks_organization
ON tasks(organization_id);

CREATE INDEX IF NOT EXISTS idx_documents_organization
ON documents(organization_id);

CREATE INDEX IF NOT EXISTS idx_audit_organization
ON audit_logs(organization_id);
`);

console.log("====================================");
console.log("UNITÉ 360 CORE V1");
console.log("Base de données initialisée.");
console.log("7 tables fondamentales vérifiées.");
console.log("====================================");

db.close();
