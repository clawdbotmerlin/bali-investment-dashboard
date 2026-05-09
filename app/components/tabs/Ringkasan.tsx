"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { fmtIdr, fmtUsd, pct, cfSell, cfRent } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

function SCard({ label, value, cls, usd, roi, roiCls, roi2, roi2Label, roi2Cls, sub }: {
  label: string; value: string; cls?: string; usd?: string;
  roi?: string; roiCls?: string;
  roi2?: string; roi2Label?: string; roi2Cls?: string;
  sub?: string;
}) {
  return (
    <div className="summary-card">
      <div className="card-label">{label}</div>
      <div className={`card-value${cls ? " " + cls : ""}`}>{value}</div>
      {usd && <div className="usd">≈ {usd}</div>}
      {(roi || roi2) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {roi && <div className={`roi-pill${roiCls ? " " + roiCls : ""}`}>ROI {roi}</div>}
          {roi2 && <div className={`roi-pill${roi2Cls ? " " + roi2Cls : ""}`}>{roi2Label || "ROI"} {roi2}</div>}
        </div>
      )}
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}

export default function Ringkasan({ s, c }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<{ destroy(): void } | null>(null);
  const fx = s.fxRate;

  const lp = c.total > 0 ? ((c.leasehold / c.total) * 100).toFixed(0) : "0";
  const bp = c.total > 0 ? ((c.build / c.total) * 100).toFixed(0) : "0";
  const ep = c.total > 0 ? ((c.upfrontExtras / c.total) * 100).toFixed(0) : "0";
  const grossProfit = c.totalSell - c.total;
  const grossROI = c.total > 0 ? (grossProfit / c.total) * 100 : 0;
  const totalLeaseRental = c.rental * (s.years || 1);
  const totalLeaseROI = c.total > 0 ? (totalLeaseRental / c.total) * 100 : 0;

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    const sellRows = cfSell(s, c);
    const rentRows = cfRent(s, c);
    const labels = Array.from({ length: 11 }, (_, i) => `Thn ${i}`);

    const sellLine = sellRows.map(r => r.cumulative);
    while (sellLine.length < 11) sellLine.push(sellLine[sellLine.length - 1] ?? 0);

    const rentLine: number[] = [-c.total];
    for (let yr = 1; yr <= 10; yr++) {
      const row = rentRows.find(r => r.year === yr);
      const cf = row ? row.cashflow : c.netRental;
      rentLine.push(rentLine[rentLine.length - 1] + cf);
    }

    const holdLine: number[] = [-c.total];
    for (let yr = 1; yr <= 10; yr++) {
      let v = holdLine[holdLine.length - 1];
      if (yr <= c.N) v += c.netRental;
      else if (yr === c.N + 1) v += c.netSell;
      holdLine.push(v);
    }

    chartInst.current?.destroy();
    chartInst.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Jual Bertahap", data: sellLine, borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,.08)", fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
          { label: "Sewa Saja", data: rentLine, borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.08)", fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
          { label: `Hold ${c.N}yr → Jual`, data: holdLine, borderColor: "#d97706", backgroundColor: "rgba(217,119,6,.08)", fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
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
  }, [s, c]);

  const occ = s.rmodel === "nightly" ? s.nocc : s.mocc;

  return (
    <>
      <div className="summary-grid">
        <SCard label="Total Investasi" value={fmtIdr(c.total)} cls="green" usd={fmtUsd(c.total, fx)}
               sub={`Leasehold ${lp}% · Bangun ${bp}% · Extras ${ep}%`} />
        <SCard label="Modal Tahun 0 (cash needed)" value={fmtIdr(c.year0Capital)} cls="purple" usd={fmtUsd(c.year0Capital, fx)}
               sub={s.sellMode === "presale"
                 ? `${s.terms === "installment" ? "DP lease" : "Lease lunas"} + 1 show unit + extras (${((c.year0Capital / c.total) * 100).toFixed(0)}% dari total)`
                 : `Bangun semua ${s.units} unit upfront${s.terms === "installment" ? " + DP lease" : ""}`} />
        <SCard label="Biaya / Unit" value={fmtIdr(c.costPU)} cls="purple" usd={fmtUsd(c.costPU, fx)}
               sub={`${s.units} unit total`} />
        <SCard label="Harga Jual / Unit" value={fmtIdr(c.sellPU)} cls="amber" usd={fmtUsd(c.sellPU, fx)}
               sub={`Margin ${s.margin}% · komisi ${s.agentSell || 0}%`} />
        <SCard label="Total Revenue (Jual Semua)" value={fmtIdr(c.totalSell)} cls="amber" usd={fmtUsd(c.totalSell, fx)}
               sub={`${s.units} unit × ${fmtIdr(c.sellPU)} (sebelum komisi)`} />
        <SCard label="Gross Profit (Jual)" value={fmtIdr(grossProfit)} cls={grossProfit >= 0 ? "green" : "red"}
               usd={fmtUsd(grossProfit, fx)}
               roi={pct(grossROI)} roiCls={grossROI >= 0 ? "green" : "red"}
               roi2={pct(c.year0Capital > 0 ? (grossProfit / c.year0Capital) * 100 : 0)}
               roi2Label="ROC Modal Y0"
               roi2Cls={grossProfit >= 0 ? "amber" : "red"}
               sub="Revenue − Investasi (sebelum komisi)" />
        <SCard label="Net Profit (Jual)" value={fmtIdr(c.profit)} cls={c.profit >= 0 ? "green" : "red"}
               usd={fmtUsd(c.profit, fx)}
               roi={pct(c.profitROI)} roiCls={c.profitROI >= 0 ? "green" : "red"}
               roi2={pct(c.year0Capital > 0 ? (c.profit / c.year0Capital) * 100 : 0)}
               roi2Label="ROC Modal Y0"
               roi2Cls={c.profit >= 0 ? "amber" : "red"}
               sub={`Revenue ${fmtIdr(c.totalSell)} − Komisi ${fmtIdr(c.sellComm)} − Investasi ${fmtIdr(c.total)}`} />
        <SCard label="Sewa Neto / Tahun" value={fmtIdr(c.rental)} cls="blue" usd={fmtUsd(c.rental, fx)}
               roi={pct(c.yield_)} roiCls="blue"
               sub={`${occ}% occ. · yield tahunan`} />
        <SCard label={`Hold ${c.N}yr → Jual`} value={fmtIdr(c.holdNet)} cls={c.holdNet >= 0 ? "green" : "red"}
               usd={fmtUsd(c.holdNet, fx)}
               roi={pct(c.holdROI)} roiCls={c.holdROI >= 0 ? "green" : "red"}
               roi2={pct(c.year0Capital > 0 ? (c.holdNet / c.year0Capital) * 100 : 0)}
               roi2Label="ROC Modal Y0"
               roi2Cls={c.holdNet >= 0 ? "amber" : "red"}
               sub={`${c.N} thn sewa + jual semua di Thn ${c.N + 1}`} />
      </div>

      <div className="chart-box">
        <div className="chart-title">Kumulatif Cash Flow — 10 Tahun · 3 Skenario</div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>
    </>
  );
}
