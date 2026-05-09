"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Script from "next/script";
import type { Project, SessionData } from "@/lib/types";
import { defaultSession } from "@/lib/calc";
import InputPanel from "./InputPanel";
import TabPanel from "./TabPanel";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "rename"; value: string } | null>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeProject = projects.find(p => p.id === activeId) ?? null;

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (modal && modalInputRef.current) {
      modalInputRef.current.focus();
      modalInputRef.current.select();
    }
  }, [modal]);

  const saveProject = useCallback((id: string, patch: { name?: string; data?: SessionData }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
        .then(r => r.json())
        .then((updated: Project) => {
          setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
        })
        .catch(console.error);
    }, 600);
  }, []);

  const handleDataChange = useCallback((data: SessionData) => {
    if (!activeId) return;
    setProjects(prev => prev.map(p => p.id === activeId ? { ...p, data } : p));
    saveProject(activeId, { data });
  }, [activeId, saveProject]);

  const handleCreate = useCallback((name: string) => {
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, data: defaultSession() }),
    })
      .then(r => r.json())
      .then((created: Project) => {
        setProjects(prev => [created, ...prev]);
        setActiveId(created.id);
      })
      .catch(console.error);
  }, []);

  const handleRename = useCallback((id: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    saveProject(id, { name });
  }, [saveProject]);

  const handleDelete = useCallback(() => {
    if (!activeId) return;
    if (!confirm("Hapus proyek ini?")) return;
    fetch(`/api/projects/${activeId}`, { method: "DELETE" })
      .then(() => {
        setProjects(prev => {
          const next = prev.filter(p => p.id !== activeId);
          setActiveId(next.length > 0 ? next[0].id : null);
          return next;
        });
      })
      .catch(console.error);
  }, [activeId]);

  const handleFxRefresh = useCallback(async () => {
    if (!activeProject || fxLoading) return;
    setFxLoading(true);
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
      const d = await r.json();
      if (d?.rates?.IDR) {
        handleDataChange({ ...activeProject.data, fxRate: Math.round(d.rates.IDR) });
      }
    } catch {
      alert("Gagal fetch kurs. Cek koneksi.");
    } finally {
      setFxLoading(false);
    }
  }, [activeProject, fxLoading, handleDataChange]);

  function openCreate() {
    setModal({ mode: "create", value: "" });
  }

  function openRename() {
    if (!activeProject) return;
    setModal({ mode: "rename", value: activeProject.name });
  }

  function confirmModal() {
    if (!modal) return;
    const name = modal.value.trim() || "Proyek Baru";
    if (modal.mode === "create") {
      handleCreate(name);
    } else if (activeId) {
      handleRename(activeId, name);
    }
    setModal(null);
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setChartReady(true)}
      />

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Header */}
        <div className="header">
          <div className="logo display">Bali <span>Investment</span></div>

          {/* FX Badge */}
          <div className="fx-badge" title="Klik ↻ untuk refresh kurs live">
            <span className="fx-prefix">$1 =</span>
            <span style={{ color: "var(--text-3)", fontSize: 11 }}>Rp</span>
            <input
              type="text"
              className="fx-input"
              value={activeProject ? new Intl.NumberFormat("id-ID").format(activeProject.data.fxRate) : "16.000"}
              onChange={e => {
                if (!activeProject) return;
                const val = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                handleDataChange({ ...activeProject.data, fxRate: val });
              }}
            />
            <button
              className={`fx-refresh${fxLoading ? " spin" : ""}`}
              onClick={handleFxRefresh}
              title="Refresh kurs"
            >↻</button>
          </div>

          {/* Session pills */}
          <div className="sessions">
            {projects.map(p => (
              <button
                key={p.id}
                className={`pill ${p.id === activeId ? "active" : "inactive"}`}
                onClick={() => p.id === activeId ? openRename() : setActiveId(p.id)}
                title={p.id === activeId ? "Klik untuk rename" : p.name}
              >
                {p.name}
                {p.id === activeId && <span style={{ fontSize: 10, opacity: 0.7 }}>✏</span>}
              </button>
            ))}
          </div>

          <button className="pill new-pill" onClick={openCreate}>+ Proyek Baru</button>
          {activeId && (
            <button className="btn-danger" onClick={handleDelete}>Hapus</button>
          )}
        </div>

        {/* Main */}
        {activeProject ? (
          <div className="main">
            <InputPanel
              data={activeProject.data}
              onChange={handleDataChange}
            />
            {chartReady ? (
              <TabPanel activeProject={activeProject} allProjects={projects} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 14 }}>
                Memuat grafik...
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏡</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Belum ada proyek</div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>Klik &quot;+ Proyek Baru&quot; di header untuk memulai</div>
            <button className="btn-confirm" onClick={openCreate}>+ Proyek Baru</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <h3>{modal.mode === "create" ? "Nama Proyek Baru" : "Rename Proyek"}</h3>
            <input
              ref={modalInputRef}
              type="text"
              placeholder="Canggu Villa A"
              value={modal.value}
              onChange={e => setModal(m => m ? { ...m, value: e.target.value } : m)}
              onKeyDown={e => { if (e.key === "Enter") confirmModal(); if (e.key === "Escape") setModal(null); }}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModal(null)}>Batal</button>
              <button className="btn-confirm" onClick={confirmModal}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
