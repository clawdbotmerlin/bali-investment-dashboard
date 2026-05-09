"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { cfRent, fmtIdr, fmtUsd, fmt } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

export default function SimulasiSewa({ s, c }: Props) {
  const rows = cfRent(s, c);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<{ destroy(): void } | null>(null);

  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined" || !window.Chart) return;

    const labels = rows.map(r => `Yr ${r.year}`);
    const cfData = rows.map(r => r.cumCashflow);
    const posData = rows.map(r => r.netPosition);

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Kum. Cashflow Bersih",
            data: cfData,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.1)",
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: "Net Position (vs Investasi)",
            data: posData,
            borderColor: "#4f46e5",
            backgroundColor: "transparent",
            fill: false,
            tension: 0.3,
            pointRadius: 3,
            borderDash: [4, 4],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } } },
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

  const paybackRow = rows.find(r => r.netPosition >= 0);

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Simulasi Sewa</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
        Proyeksi cashflow sewa selama {Math.min(s.years, 25)} tahun
        {" · "}{s.rmodel === "nightly" ? `Rp${(s.nrate / 1e6).toFixed(1)}jt/malam, occ ${s.nocc}%` : `Rp${(s.mrate / 1e6).toFixed(0)}jt/bulan, occ ${s.mocc}%`}
      </p>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Gross Sewa / Tahun", val: fmtIdr(c.rentalGross), color: "var(--blue)" },
          { label: "Net Sewa / Tahun", val: fmtIdr(c.netRental), color: "var(--success)" },
          { label: "Gross Yield", val: `${c.yield_.toFixed(1)}%`, color: c.yield_ >= 8 ? "var(--success)" : c.yield_ >= 5 ? "var(--warning)" : "var(--danger)" },
          { label: "Payback Sewa", val: paybackRow ? `Yr ${paybackRow.year}` : ">{Math.min(s.years,25)}yr", color: "var(--primary)" },
        ].map(item => (
          <div key={item.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ height: 240, position: "relative" }}>
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Tahun", "Gross Sewa", "PM Fee", "Net Sewa", "Opex", "Cashflow", "Kum. CF", "Net Position"].map(h => (
                <th key={h} style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: "var(--text2)", fontSize: 11, borderBottom: "1px solid var(--border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.year} style={{
                borderBottom: "1px solid var(--border)",
                background: r.netPosition >= 0 ? "var(--success-light)" : "transparent",
              }}>
                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>Yr {r.year}</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmtIdr(r.grossRental)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--warning)" }}>{fmtIdr(r.pmgmtFee)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmtIdr(r.netRental)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--danger)" }}>{fmtIdr(r.opex)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: r.cashflow >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {fmtIdr(r.cashflow)}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--blue)", fontWeight: 600 }}>{fmtIdr(r.cumCashflow)}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: r.netPosition >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {fmtIdr(r.netPosition)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
