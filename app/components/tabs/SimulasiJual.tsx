"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { cfSell, fmtIdr } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

export default function SimulasiJual({ s, c }: Props) {
  const rows = cfSell(s, c);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<{ destroy(): void } | null>(null);

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    chartInst.current?.destroy();
    chartInst.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels: rows.map(r => r.year === 0 ? "Awal" : `Yr ${r.year}`),
        datasets: [
          { label: "Kum. Revenue", data: rows.map(r => r.cumulativeRevenue), borderColor: "#059669", backgroundColor: "rgba(5,150,105,.1)", fill: false, tension: 0.3, pointRadius: 4 },
          { label: "Kum. Biaya", data: rows.map(r => r.cumulativeCost), borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,.05)", fill: false, tension: 0.3, pointRadius: 4 },
          { label: "Net Kumulatif", data: rows.map(r => r.netCumulative), borderColor: "#4f46e5", backgroundColor: "rgba(79,70,229,.1)", fill: true, tension: 0.3, pointRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { ticks: { callback: (v: unknown) => { const n = Number(v); return Math.abs(n) >= 1e9 ? `${(n/1e9).toFixed(1)}M` : Math.abs(n) >= 1e6 ? `${(n/1e6).toFixed(0)}jt` : n.toString(); }, font: { size: 11 } }, grid: { color: "#e5e7eb" } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, [rows]);

  const paybackRow = rows.find(r => r.netCumulative >= 0 && r.year > 0);

  return (
    <>
      <div className="tab-controls">
        <label>Mode Konstruksi:</label>
        <span style={{ fontWeight: 600, color: "var(--primary)", fontSize: 13 }}>
          {s.sellMode === "presale" ? "Show Unit + Presale" : "Bangun Semua di Tahun 0"}
        </span>
        <label style={{ marginLeft: 8 }}>Unit/tahun:</label>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{s.upy}</span>
        {paybackRow && (
          <span className="dim" style={{ fontSize: 11, flexBasis: "100%", marginTop: 4 }}>
            🎯 Payback Tahun {paybackRow.year} — Net kumulatif: {fmtIdr(paybackRow.netCumulative)}
          </span>
        )}
      </div>

      <div className="chart-box">
        <div className="chart-title">Cash Flow Penjualan Bertahap</div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>

      <div className="chart-box">
        <table className="sim-table">
          <thead>
            <tr>
              {["Tahun", "Unit Terjual", "Revenue", "Kum. Revenue", "Kum. Biaya", "Net Kumulatif"].map(h => (
                <th key={h} style={{ textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.year} style={{ background: r.netCumulative >= 0 && r.year > 0 ? "var(--success-light)" : "transparent" }}>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{r.year === 0 ? "Awal" : `Yr ${r.year}`}</td>
                <td style={{ textAlign: "right" }}>{r.unitsSold}</td>
                <td style={{ textAlign: "right" }} className="num">{fmtIdr(r.revenue)}</td>
                <td style={{ textAlign: "right" }} className="num pos">{fmtIdr(r.cumulativeRevenue)}</td>
                <td style={{ textAlign: "right" }} className="num neg">{fmtIdr(r.cumulativeCost)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }} className={`num ${r.netCumulative >= 0 ? "pos" : "neg"}`}>{fmtIdr(r.netCumulative)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
