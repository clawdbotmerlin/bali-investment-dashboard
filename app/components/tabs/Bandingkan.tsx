"use client";

import { useEffect, useRef } from "react";
import type { Project, CalcResult } from "@/lib/types";
import { calc, fmtIdr, pct } from "@/lib/calc";

interface Props {
  projects: Project[];
  activeId: string | null;
}

export default function Bandingkan({ projects, activeId }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<{ destroy(): void } | null>(null);

  const calcs: { project: Project; c: CalcResult }[] = projects.map(p => ({ project: p, c: calc(p.data) }));

  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined" || !window.Chart || calcs.length === 0) return;

    const labels = calcs.map(({ project }) => project.name);
    const colors = ["#4f46e5", "#059669", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Net Profit Jual (Rp)",
            data: calcs.map(({ c }) => c.profit),
            backgroundColor: calcs.map(({ c }, i) => c.profit >= 0 ? colors[i % colors.length] : "#dc2626"),
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: (v: unknown) => {
                const n = Number(v);
                if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}M`;
                if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(0)}jt`;
                return n.toString();
              },
              font: { size: 11 },
            },
            grid: { color: "#e2e4ed" },
          },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    });

    return () => { chartInstance.current?.destroy(); };
  }, [calcs]);

  if (projects.length === 0) {
    return (
      <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text3)", fontSize: 14 }}>
        Buat minimal 2 proyek untuk membandingkan.
      </div>
    );
  }

  const metrics: { key: keyof CalcResult; label: string; fmt: (v: number) => string; good: "high" | "low" }[] = [
    { key: "total", label: "Total Investasi", fmt: fmtIdr, good: "low" },
    { key: "costPU", label: "Biaya / Unit", fmt: fmtIdr, good: "low" },
    { key: "sellPU", label: "Harga Jual / Unit", fmt: fmtIdr, good: "high" },
    { key: "profit", label: "Net Profit Jual", fmt: fmtIdr, good: "high" },
    { key: "profitROI", label: "ROI Jual", fmt: pct, good: "high" },
    { key: "rental", label: "Net Sewa / Tahun", fmt: fmtIdr, good: "high" },
    { key: "yield_", label: "Gross Yield", fmt: (v) => `${v.toFixed(1)}%`, good: "high" },
    { key: "holdNet", label: "Hold & Jual Net", fmt: fmtIdr, good: "high" },
    { key: "holdROI", label: "Hold ROI", fmt: pct, good: "high" },
  ];

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Bandingkan Proyek</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>
        Semua {projects.length} proyek dibandingkan side-by-side
      </p>

      {/* Chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>Net Profit Jual per Proyek</div>
        <div style={{ height: 220, position: "relative" }}>
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Metrics table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: Math.max(400, 200 + calcs.length * 140) }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--text2)", fontSize: 11, borderBottom: "1px solid var(--border)", position: "sticky", left: 0, background: "var(--surface2)" }}>
                Metrik
              </th>
              {calcs.map(({ project }) => (
                <th key={project.id} style={{
                  padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11,
                  borderBottom: "1px solid var(--border)",
                  color: project.id === activeId ? "var(--primary)" : "var(--text2)",
                  background: project.id === activeId ? "var(--primary-light)" : "var(--surface2)",
                }}>
                  {project.name}
                  {project.id === activeId && <span style={{ fontSize: 9, marginLeft: 4 }}>⬅ aktif</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, mi) => {
              const vals = calcs.map(({ c }) => c[m.key] as number);
              const best = m.good === "high" ? Math.max(...vals) : Math.min(...vals);
              return (
                <tr key={m.key} style={{ borderBottom: "1px solid var(--border)", background: mi % 2 === 0 ? "transparent" : "var(--surface2)" }}>
                  <td style={{
                    padding: "9px 12px", fontWeight: 600, fontSize: 11, color: "var(--text2)",
                    position: "sticky", left: 0, background: mi % 2 === 0 ? "var(--surface)" : "var(--surface2)",
                  }}>
                    {m.label}
                  </td>
                  {vals.map((v, vi) => {
                    const isBest = v === best && vals.filter(x => x === best).length < vals.length;
                    return (
                      <td key={vi} style={{
                        padding: "9px 12px", textAlign: "right", fontWeight: isBest ? 700 : 400,
                        color: isBest ? "var(--success)" : "var(--text)",
                        background: calcs[vi].project.id === activeId ? "var(--primary-light)" : "transparent",
                      }}>
                        {m.fmt(v)}
                        {isBest && <span style={{ marginLeft: 4, fontSize: 10 }}>⭐</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
