import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Project, SessionData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "projects.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  return _db;
}

function row2project(row: { id: string; name: string; data: string; created_at: number; updated_at: number }): Project {
  return {
    id: row.id,
    name: row.name,
    data: JSON.parse(row.data) as SessionData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProjects(): Project[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Parameters<typeof row2project>[0][];
  return rows.map(row2project);
}

export function getProject(id: string): Project | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Parameters<typeof row2project>[0] | undefined;
  return row ? row2project(row) : null;
}

export function createProject(name: string, data: SessionData): Project {
  const db = getDb();
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  db.prepare("INSERT INTO projects (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(
    id, name, JSON.stringify(data), now, now
  );
  return { id, name, data, createdAt: now, updatedAt: now };
}

export function updateProject(id: string, patch: { name?: string; data?: SessionData }): Project | null {
  const db = getDb();
  const existing = getProject(id);
  if (!existing) return null;
  const newName = patch.name ?? existing.name;
  const newData = patch.data ?? existing.data;
  const now = Date.now();
  db.prepare("UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ?").run(
    newName, JSON.stringify(newData), now, id
  );
  return { ...existing, name: newName, data: newData, updatedAt: now };
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}
