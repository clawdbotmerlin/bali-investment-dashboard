"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { cfSell, fmtIdr, fmtUsd } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

export default function SimulasiJual({ s, c }: Props) {
  const rows = cfSell(s, c);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<{ destroy(): void } | null>(null);
  const fx = s.fxRate;

  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined" || !window.Chart) return;

    const labels = rows.map(r => `Yr ${r.year}`);
    const revData = rows.map(r => r.cumulativeRevenue);
    const costData = rows.map(r => r.cumulativeCost);
    const netData = rows.map(r => r.netCumulative);

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Kumulatif Revenue",
            data: revData,
            borderColor: "#059669",
            backgroundColor: "rgba(5,150,105,0.1)",
            fill: false,
            tension: 0.3,
            pointRadius: 4,
          },
          {
            label: "Kumulatif Biaya",
            data: costData,
            borderColor: "#dc2626",
            backgroundColor: "rgba(220,38,38,0.05)",
            fill: false,
            tension: 0.3,
            pointRadius: 4,
          },
          {
            label: "Net Kumulatif",
            data: netData,
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79,70,229,0.1)",
            fill: true,
            tension: 0.3,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } },
        },
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
  }, [rows]);

  const paybackRow = rows.find(r => r.netCumulative >= 0 && r.year > 0);

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Simulasi Penjualan</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
        Mode: <strong>{s.sellMode === "presale" ? "Presale (bangun per unit terjual)" : "Semua dibangun dulu"}</strong>
        {" · "}{s.upy} unit/tahun
      </p>

      {paybackRow && (
        <div style={{
          background: "var(--success-light)", borderRadius: 10, padding: "10px 16px",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>
              Payback Tahun {paybackRow.year}
            </span>
            <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 8 }}>
              Net kumulatif: {fmtIdr(paybackRow.netCumulative)}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ height: 260, position: "relative" }}>
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Tahun", "Unit Terjual", "Revenue", "Kum. Revenue", "Kum. Biaya", "Net Kumulatif"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "var(--text2)", fontSize: 11, borderBottom: "1px solid var(--border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.year} style={{
                borderBottom: "1px solid var(--border)",
                background: r.netCumulative >= 0 && r.year > 0 ? "var(--success-light)" : "transparent",
              }}>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>
                  {r.year === 0 ? "Awal" : `Yr ${r.year}`}
                </td>
                <td style={{ padding: "9px 12px", textAlign: "right" }}>{r.unitsSold}</td>
                <td style={{ padding: "9px 12px", textAlign: "right" }}>{fmtIdr(r.revenue)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--success)", fontWeight: 600 }}>{fmtIdr(r.cumulativeRevenue)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--danger)" }}>{fmtIdr(r.cumulativeCost)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: r.netCumulative >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {fmtIdr(r.netCumulative)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
