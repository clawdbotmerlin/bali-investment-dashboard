"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";

interface SidebarProps {
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ projects, activeId, onSelect, onCreate, onRename, onDelete }: SidebarProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  function handleCreate() {
    const name = newName.trim() || "Proyek Baru";
    onCreate(name);
    setNewName("");
    setCreating(false);
  }

  function startRename(p: Project) {
    setRenamingId(p.id);
    setRenameVal(p.name);
  }

  function commitRename(id: string) {
    const v = renameVal.trim();
    if (v) onRename(id, v);
    setRenamingId(null);
  }

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirm("Hapus proyek ini?")) onDelete(id);
  }

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}>
      {/* Header */}
      <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>🏡</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>Bali Invest</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>Leasehold Simulator</div>
      </div>

      {/* Section label */}
      <div style={{ padding: "12px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Proyek
        </span>
        <button
          onClick={() => setCreating(true)}
          title="Proyek Baru"
          style={{
            width: 22, height: 22, borderRadius: 6, border: "1.5px dashed var(--border)",
            background: "transparent", color: "var(--text3)", fontSize: 16, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--primary)"; (e.target as HTMLButtonElement).style.color = "var(--primary)"; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--border)"; (e.target as HTMLButtonElement).style.color = "var(--text3)"; }}
        >+</button>
      </div>

      {/* New project input */}
      {creating && (
        <div style={{ padding: "4px 16px 8px", display: "flex", gap: 6 }}>
          <input
            autoFocus
            type="text"
            placeholder="Nama proyek..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
            style={{ flex: 1, fontSize: 12, padding: "5px 8px" }}
          />
          <button
            onClick={handleCreate}
            style={{
              background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 6, padding: "0 8px", fontSize: 12, fontWeight: 600,
            }}
          >OK</button>
        </div>
      )}

      {/* Project list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
        {projects.length === 0 && (
          <div style={{ padding: "16px 8px", textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
            Belum ada proyek.<br />Klik + untuk mulai.
          </div>
        )}
        {projects.map(p => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              marginBottom: 2,
              cursor: "pointer",
              background: p.id === activeId ? "var(--primary-light)" : "transparent",
              borderLeft: p.id === activeId ? "3px solid var(--primary)" : "3px solid transparent",
              transition: "all 0.1s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={e => { if (p.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = "var(--surface2)"; }}
            onMouseLeave={e => { if (p.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <span style={{ fontSize: 13 }}>📋</span>
            {renamingId === p.id ? (
              <input
                autoFocus
                type="text"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={() => commitRename(p.id)}
                onKeyDown={e => { if (e.key === "Enter") commitRename(p.id); if (e.key === "Escape") setRenamingId(null); }}
                onClick={e => e.stopPropagation()}
                style={{ flex: 1, fontSize: 12, padding: "2px 6px" }}
              />
            ) : (
              <>
                <span style={{
                  flex: 1, fontSize: 12, fontWeight: p.id === activeId ? 600 : 400,
                  color: p.id === activeId ? "var(--primary)" : "var(--text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {p.name}
                </span>
                <div style={{ display: "flex", gap: 2, opacity: 0 }} className="proj-actions"
                  onMouseEnter={e => e.stopPropagation()}
                >
                  <button
                    title="Rename"
                    onClick={e => { e.stopPropagation(); startRename(p); }}
                    style={{ background: "none", border: "none", fontSize: 11, color: "var(--text3)", padding: "1px 3px", borderRadius: 4 }}
                  >✏️</button>
                  <button
                    title="Hapus"
                    onClick={e => handleDeleteClick(e, p.id)}
                    style={{ background: "none", border: "none", fontSize: 11, color: "var(--danger)", padding: "1px 3px", borderRadius: 4 }}
                  >🗑</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        div:hover .proj-actions { opacity: 1 !important; }
      `}</style>
    </aside>
  );
}
