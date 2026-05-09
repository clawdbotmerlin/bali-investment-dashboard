"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { cfSell, fmtIdr, fmtUsd } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; onChange: (s: SessionData) => void; }

export default function SimulasiJual({ s, c, onChange }: Props) {
  const rows = cfSell(s, c);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<{ destroy(): void } | null>(null);
  const presale = s.sellMode === "presale";
  const leaseOnly = s.sellMode === "lease_only";
  const showBuilt = presale || leaseOnly;
  const initOut = rows[0]?.cashOut ?? 0;
  const fx = s.fxRate;

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    chartInst.current?.destroy();
    chartInst.current = new window.Chart(chartRef.current, {
      data: {
        labels: rows.map(r => `Thn ${r.year}`),
        datasets: [
          { type: "bar", label: "Cash In", data: rows.map(r => r.cashIn), backgroundColor: "rgba(5,150,105,.7)", borderColor: "#059669", borderWidth: 1, borderRadius: 4 },
          { type: "bar", label: "Cash Out", data: rows.map(r => -r.cashOut), backgroundColor: "rgba(220,38,38,.7)", borderColor: "#dc2626", borderWidth: 1, borderRadius: 4 },
          { type: "line", label: "Kumulatif", data: rows.map(r => r.cumulative), borderColor: "#d97706", backgroundColor: "transparent", tension: 0.3, pointRadius: 4, borderWidth: 2.5 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { ticks: { callback: (v: unknown) => { const n = Number(v); return Math.abs(n) >= 1e9 ? `Rp ${(n/1e9).toFixed(1)}M` : Math.abs(n) >= 1e6 ? `Rp ${(n/1e6).toFixed(0)}jt` : `Rp ${n}`; }, font: { size: 11 } }, grid: { color: "#f1f5f9" } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    } as Record<string, unknown>);
    return () => { chartInst.current?.destroy(); };
  }, [rows]);

  const targetYear = Math.ceil(s.units / Math.max(1, s.upy || 1));
  const hint = leaseOnly
    ? `Tahun 0: bayar ${s.terms === "installment" ? "DP" : "lunas"} lease + extras saja = ${fmtIdr(initOut)} (${fmtUsd(initOut, fx)}). Tahun 1+: tiap unit dijual baru dibangun (no show unit). Total ${s.units} unit, target ${s.upy}/thn → habis terjual di Tahun ${targetYear}.`
    : presale
    ? `Tahun 0: bayar tanah + bangun 1 show unit + extras = ${fmtIdr(initOut)} (${fmtUsd(initOut, fx)}). Tahun 1+: tiap unit dijual baru dibangun. Total ${s.units} unit, target ${s.upy}/thn → habis terjual di Tahun ${targetYear}.`
    : `Tahun 0: bangun semua ${s.units} unit upfront = ${fmtIdr(initOut)} (${fmtUsd(initOut, fx)}). Tahun 1+: hanya pendapatan penjualan. Total ${s.units} unit, target ${s.upy}/thn → habis terjual di Tahun ${targetYear}.`;

  const headers = showBuilt
    ? ["Tahun", "Sold", "Built", "Cash In", "Cash Out", "Net", "Kumulatif"]
    : ["Tahun", "Sold", "Cash In", "Cash Out", "Net", "Kumulatif"];

  return (
    <>
      <div className="tab-controls">
        <label>Mode Konstruksi:</label>
        <select
          value={s.sellMode}
          onChange={e => onChange({ ...s, sellMode: e.target.value as SessionData["sellMode"] })}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 240 }}
        >
          <option value="upfront">Bangun Semua di Tahun 0</option>
          <option value="presale">Show Unit + Presale (build per sale)</option>
          <option value="lease_only">Lease Only (no show unit, build per sale)</option>
        </select>
        <label>Unit terjual / tahun:</label>
        <input
          type="number"
          min={1}
          value={s.upy || ""}
          onChange={e => onChange({ ...s, upy: parseFloat(e.target.value) || 1 })}
          style={{ width: 70 }}
        />
        <span className="dim" style={{ fontSize: 11, flexBasis: "100%", marginTop: 4 }}>{hint}</span>
      </div>

      <div className="chart-box">
        <div className="chart-title">Cash Flow Penjualan Bertahap</div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>

      <div className="chart-box">
        <table className="sim-table">
          <thead>
            <tr>{headers.map(h => (<th key={h} style={{ textAlign: "right" }}>{h}</th>))}</tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.year} style={{ background: r.cumulative >= 0 && r.year > 0 ? "var(--success-light)" : "transparent" }}>
                <td style={{ textAlign: "right", fontWeight: 600 }}>Thn {r.year}</td>
                <td style={{ textAlign: "right" }}>{r.unitsSold || "—"}</td>
                {showBuilt && <td style={{ textAlign: "right" }}>{r.unitsBuilt || "—"}</td>}
                <td style={{ textAlign: "right" }} className="num pos">{r.cashIn ? fmtIdr(r.cashIn) : "—"}</td>
                <td style={{ textAlign: "right" }} className="num neg">{r.cashOut ? `−${fmtIdr(r.cashOut)}` : "—"}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }} className={`num ${r.net >= 0 ? "pos" : "neg"}`}>{fmtIdr(r.net)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }} className={`num ${r.cumulative >= 0 ? "pos" : "neg"}`}>{fmtIdr(r.cumulative)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
