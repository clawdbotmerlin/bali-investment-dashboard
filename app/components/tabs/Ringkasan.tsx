"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { fmtIdr, fmtUsd, pct } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

function SCard({ label, value, cls, usd, roi, roiCls, sub }: {
  label: string; value: string; cls?: string; usd?: string;
  roi?: string; roiCls?: string; sub?: string;
}) {
  return (
    <div className="summary-card">
      <div className="card-label">{label}</div>
      <div className={`card-value${cls ? " " + cls : ""}`}>{value}</div>
      {usd && <div className="usd">{usd}</div>}
      {roi && <div className={`roi-pill${roiCls ? " " + roiCls : ""}`}>{roi}</div>}
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}

export default function Ringkasan({ s, c }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<{ destroy(): void } | null>(null);

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    const sellOnly = c.profit;
    const rentOnly = c.netRental * s.years - c.total;
    const hold = c.holdNet;
    chartInst.current?.destroy();
    chartInst.current = new window.Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: ["Jual Semua", `Sewa ${s.years}yr`, `Hold ${s.holdYears}yr→Jual`],
        datasets: [{
          label: "Net Profit",
          data: [sellOnly, rentOnly, hold],
          backgroundColor: [
            sellOnly >= 0 ? "#059669" : "#dc2626",
            rentOnly >= 0 ? "#2563eb" : "#dc2626",
            hold >= 0 ? "#4f46e5" : "#dc2626",
          ],
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: (v: unknown) => { const n = Number(v); return Math.abs(n) >= 1e9 ? `${(n/1e9).toFixed(1)}M` : Math.abs(n) >= 1e6 ? `${(n/1e6).toFixed(0)}jt` : n.toString(); }, font: { size: 11 } }, grid: { color: "#e5e7eb" } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, [c, s]);

  const fx = s.fxRate;

  return (
    <>
      <div className="summary-grid">
        <SCard label="Total Investasi" value={fmtIdr(c.total)} usd={`≈ ${fmtUsd(c.total, fx)}`} />
        <SCard label="Biaya / Unit" value={fmtIdr(c.costPU)} cls="indigo" usd={`≈ ${fmtUsd(c.costPU, fx)}`} />
        <SCard label="Harga Jual / Unit" value={fmtIdr(c.sellPU)} cls="amber" usd={`≈ ${fmtUsd(c.sellPU, fx)}`} sub={`Margin ${s.margin}% dari HPP`} />
        <SCard label="Total Revenue Jual" value={fmtIdr(c.totalSell)} cls="green" usd={`≈ ${fmtUsd(c.totalSell, fx)}`} sub={`Net setelah komisi: ${fmtIdr(c.netSell)}`} />
        <SCard
          label="Net Profit (Jual)" value={fmtIdr(c.profit)}
          cls={c.profit >= 0 ? "green" : "red"} usd={`≈ ${fmtUsd(c.profit, fx)}`}
          roi={`ROI ${pct(c.profitROI)}`} roiCls={c.profit >= 0 ? "green" : "red"}
          sub={`${fmtIdr(c.netSell)} − ${fmtIdr(c.total)}`}
        />
        <SCard label="Sewa Bruto / Tahun" value={fmtIdr(c.rentalGross)} cls="blue" usd={`≈ ${fmtUsd(c.rentalGross, fx)}`} sub={`Neto: ${fmtIdr(c.netRental)}`} />
        <SCard label="Gross Rental Yield" value={`${c.yield_.toFixed(1)}%`} cls={c.yield_ >= 8 ? "green" : c.yield_ >= 5 ? "amber" : "red"} sub="Sewa tahunan / investasi" />
        <SCard
          label={`Hold ${s.holdYears}yr → Jual`} value={fmtIdr(c.holdNet)}
          cls={c.holdNet >= 0 ? "green" : "red"} usd={`≈ ${fmtUsd(c.holdNet, fx)}`}
          roi={`ROI ${pct(c.holdROI)}`} roiCls={c.holdNet >= 0 ? "green" : "red"}
          sub={`Sewa ${s.holdYears}yr + jual semua`}
        />
        <SCard label="Opex Tahunan" value={fmtIdr(c.opex)} cls="amber" usd={`≈ ${fmtUsd(c.opex, fx)}`} sub={`${s.opex}% dari total investasi`} />
      </div>

      {/* Breakdown */}
      <div className="chart-box">
        <div className="chart-title">Breakdown Biaya</div>
        <table className="sim-table">
          <thead><tr><th>Komponen</th><th style={{ textAlign: "right" }}>Jumlah</th><th style={{ textAlign: "right" }}>USD</th><th style={{ textAlign: "right" }}>%</th></tr></thead>
          <tbody>
            {[
              { label: "Leasehold", val: c.leasehold, sub: `${s.land}m² × Rp${(s.pricePerSqm / 1e6).toFixed(2)}jt × ${s.years}yr` },
              { label: "Bangunan", val: c.build, sub: `${s.units} unit × ${fmtIdr(s.buildPerUnit)}` },
              { label: "Misc / Legal / Agent / FF&E", val: c.upfrontExtras, sub: "" },
              { label: "Total", val: c.total, sub: "", bold: true },
            ].map(row => (
              <tr key={row.label}>
                <td style={{ fontWeight: row.bold ? 700 : 400 }}>
                  {row.label}
                  {row.sub && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{row.sub}</div>}
                </td>
                <td style={{ textAlign: "right", fontWeight: row.bold ? 700 : 600 }} className="num">{fmtIdr(row.val)}</td>
                <td style={{ textAlign: "right" }} className="num dim">{fmtUsd(row.val, fx)}</td>
                <td style={{ textAlign: "right" }} className="num dim">{c.total > 0 ? ((row.val / c.total) * 100).toFixed(1) + "%" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scenario chart */}
      <div className="chart-box">
        <div className="chart-title">Kumulatif Cash Flow — 3 Skenario</div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>
    </>
  );
}
