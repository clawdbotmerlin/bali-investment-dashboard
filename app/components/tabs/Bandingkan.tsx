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
  const chartInst = useRef<{ destroy(): void } | null>(null);

  const calcs: { project: Project; c: CalcResult }[] = projects.map(p => ({ project: p, c: calc(p.data) }));

  useEffect(() => {
    if (!chartRef.current || !window.Chart || calcs.length === 0) return;
    const colors = ["#4f46e5", "#059669", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];
    chartInst.current?.destroy();
    chartInst.current = new window.Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: calcs.map(({ project }) => project.name),
        datasets: [{
          label: "Net Profit Jual (Rp)",
          data: calcs.map(({ c }) => c.profit),
          backgroundColor: calcs.map(({ c }, i) => c.profit >= 0 ? colors[i % colors.length] : "#dc2626"),
          borderRadius: 5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: { callback: (v: unknown) => { const n = Number(v); return Math.abs(n) >= 1e9 ? `${(n/1e9).toFixed(1)}M` : Math.abs(n) >= 1e6 ? `${(n/1e6).toFixed(0)}jt` : n.toString(); }, font: { size: 11 } },
            grid: { color: "#e5e7eb" },
          },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    } as Record<string, unknown>);
    return () => { chartInst.current?.destroy(); };
  }, [calcs]);

  if (projects.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-3)", fontSize: 14 }}>
        Buat minimal 2 proyek untuk membandingkan.
      </div>
    );
  }

  const metrics: { key: keyof CalcResult; label: string; fmt: (v: number) => string; good: "high" | "low" }[] = [
    { key: "total",     label: "Total Investasi",   fmt: fmtIdr, good: "low"  },
    { key: "costPU",    label: "Biaya / Unit",       fmt: fmtIdr, good: "low"  },
    { key: "sellPU",    label: "Harga Jual / Unit",  fmt: fmtIdr, good: "high" },
    { key: "profit",    label: "Net Profit Jual",    fmt: fmtIdr, good: "high" },
    { key: "profitROI", label: "ROI Jual",            fmt: pct,    good: "high" },
    { key: "netRental", label: "Net Sewa / Tahun",   fmt: fmtIdr, good: "high" },
    { key: "yield_",    label: "Gross Yield",         fmt: (v) => `${v.toFixed(1)}%`, good: "high" },
    { key: "holdNet",   label: "Hold & Jual Net",    fmt: fmtIdr, good: "high" },
    { key: "holdROI",   label: "Hold ROI",            fmt: pct,    good: "high" },
  ];

  return (
    <>
      <div className="tab-controls">
        <label>Membandingkan:</label>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)" }}>{projects.length} proyek</span>
        <span className="dim" style={{ fontSize: 11 }}>Kolom hijau = terbaik di kategori itu</span>
      </div>

      <div className="chart-box">
        <div className="chart-title">Net Profit Jual per Proyek</div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>

      <div className="chart-box" style={{ overflowX: "auto" }}>
        <table className="compare-table" style={{ minWidth: Math.max(400, 180 + calcs.length * 150) }}>
          <thead>
            <tr>
              <th>Metrik</th>
              {calcs.map(({ project }) => (
                <th key={project.id} style={{
                  textAlign: "right",
                  color: project.id === activeId ? "var(--primary)" : undefined,
                  background: project.id === activeId ? "var(--primary-light)" : undefined,
                }}>
                  {project.name}{project.id === activeId ? " ◀" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => {
              const vals = calcs.map(({ c }) => c[m.key] as number);
              const best = m.good === "high" ? Math.max(...vals) : Math.min(...vals);
              const hasDiff = vals.filter(x => x === best).length < vals.length;
              return (
                <tr key={m.key}>
                  <td style={{ fontWeight: 600, fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                    {m.label}
                  </td>
                  {vals.map((v, vi) => {
                    const isBest = hasDiff && v === best;
                    return (
                      <td key={vi} style={{ textAlign: "right", background: calcs[vi].project.id === activeId ? "var(--primary-light)" : undefined }}>
                        <span className={isBest ? "best" : "num"}>{m.fmt(v)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
