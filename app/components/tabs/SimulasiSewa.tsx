"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { cfRent, fmtIdr } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

export default function SimulasiSewa({ s, c }: Props) {
  const rows = cfRent(s, c);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<{ destroy(): void } | null>(null);

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    chartInst.current?.destroy();
    chartInst.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels: rows.map(r => `Yr ${r.year}`),
        datasets: [
          { label: "Kum. Cashflow Bersih", data: rows.map(r => r.cumCashflow), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.1)", fill: true, tension: 0.3, pointRadius: 3 },
          { label: "Net Position (vs Investasi)", data: rows.map(r => r.netPosition), borderColor: "#4f46e5", backgroundColor: "transparent", fill: false, tension: 0.3, pointRadius: 3, borderDash: [4, 4] },
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

  const paybackRow = rows.find(r => r.netPosition >= 0);

  return (
    <>
      <div className="tab-controls">
        <label>Model:</label>
        <span style={{ fontWeight: 600, color: "var(--primary)", fontSize: 13 }}>
          {s.rmodel === "nightly"
            ? `Rp${(s.nrate / 1e6).toFixed(1)}jt/malam, occ ${s.nocc}%`
            : `Rp${(s.mrate / 1e6).toFixed(0)}jt/bulan, occ ${s.mocc}%`}
        </span>
        <span className="dim" style={{ fontSize: 11, flexBasis: "100%", marginTop: 4 }}>
          Proyeksi {Math.min(s.years, 25)} tahun · PM Fee {s.pmgmt}%
          {paybackRow ? ` · Payback Sewa Yr ${paybackRow.year}` : ""}
        </span>
      </div>

      <div className="chart-box">
        <div className="chart-title">Cash Flow Sewa Tahunan</div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>

      <div className="chart-box">
        <table className="sim-table">
          <thead>
            <tr>
              {["Tahun", "Gross Sewa", "PM Fee", "Net Sewa", "Opex", "Cashflow", "Kum. CF", "Net Position"].map(h => (
                <th key={h} style={{ textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.year} style={{ background: r.netPosition >= 0 ? "var(--success-light)" : "transparent" }}>
                <td style={{ textAlign: "right", fontWeight: 600 }}>Yr {r.year}</td>
                <td style={{ textAlign: "right" }} className="num">{fmtIdr(r.grossRental)}</td>
                <td style={{ textAlign: "right" }} className="num amber">{fmtIdr(r.pmgmtFee)}</td>
                <td style={{ textAlign: "right" }} className="num">{fmtIdr(r.netRental)}</td>
                <td style={{ textAlign: "right" }} className="num neg">{fmtIdr(r.opex)}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }} className={`num ${r.cashflow >= 0 ? "pos" : "neg"}`}>{fmtIdr(r.cashflow)}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }} className="num blue">{fmtIdr(r.cumCashflow)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }} className={`num ${r.netPosition >= 0 ? "pos" : "neg"}`}>{fmtIdr(r.netPosition)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
