"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Script from "next/script";
import type { Project, SessionData } from "@/lib/types";
import { defaultSession } from "@/lib/calc";
import Sidebar from "./Sidebar";
import InputPanel from "./InputPanel";
import TabPanel from "./TabPanel";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeProject = projects.find(p => p.id === activeId) ?? null;

  // Load projects on mount
  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(console.error);
  }, []);

  // Auto-save active project data with debounce
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

  const handleDelete = useCallback((id: string) => {
    fetch(`/api/projects/${id}`, { method: "DELETE" })
      .then(() => {
        setProjects(prev => {
          const next = prev.filter(p => p.id !== id);
          if (activeId === id) setActiveId(next.length > 0 ? next[0].id : null);
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
        const fxRate = Math.round(d.rates.IDR);
        handleDataChange({ ...activeProject.data, fxRate });
      }
    } catch {
      alert("Gagal fetch kurs. Cek koneksi internet.");
    } finally {
      setFxLoading(false);
    }
  }, [activeProject, fxLoading, handleDataChange]);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setChartReady(true)}
      />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
        {/* Project sidebar */}
        <Sidebar
          projects={projects}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
        />

        {activeProject ? (
          <>
            {/* Input panel */}
            <InputPanel
              data={activeProject.data}
              onChange={handleDataChange}
              onFxRefresh={handleFxRefresh}
              fxLoading={fxLoading}
            />

            {/* Main tab panel */}
            {chartReady ? (
              <TabPanel activeProject={activeProject} allProjects={projects} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 14 }}>
                Memuat grafik...
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏡</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>Belum ada proyek</div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>Klik + di sidebar untuk membuat proyek pertama</div>
            <button
              onClick={() => handleCreate("Proyek Pertama")}
              style={{
                background: "var(--primary)", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              + Buat Proyek Baru
            </button>
          </div>
        )}
      </div>
    </>
  );
}
