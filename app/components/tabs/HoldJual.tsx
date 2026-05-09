"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { cfRent, fmtIdr, pct } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

export default function HoldJual({ s, c }: Props) {
  const rentRows = cfRent(s, c);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<{ destroy(): void } | null>(null);

  const scenarios = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const cumRentalNet = rentRows.find(r => r.year === n)?.cumCashflow ?? c.netRental * n;
    const holdNet = cumRentalNet + c.netSell - c.total;
    const holdROI = c.total > 0 ? (holdNet / c.total) * 100 : 0;
    return { n, cumRentalNet, holdNet, holdROI };
  });

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;
    const netData = scenarios.map(sc => sc.holdNet);
    const roiData = scenarios.map(sc => sc.holdROI);
    chartInst.current?.destroy();
    chartInst.current = new window.Chart(chartRef.current, {
      data: {
        labels: scenarios.map(sc => `Hold ${sc.n}yr`),
        datasets: [
          { type: "bar", label: "Net Profit (Rp)", data: netData, backgroundColor: netData.map(v => v >= 0 ? "rgba(5,150,105,.7)" : "rgba(220,38,38,.7)"), borderRadius: 5, yAxisID: "y" },
          { type: "line", label: "ROI (%)", data: roiData, borderColor: "#4f46e5", backgroundColor: "transparent", pointRadius: 4, tension: 0.3, yAxisID: "y2" },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { ticks: { callback: (v: unknown) => { const n = Number(v); return Math.abs(n) >= 1e9 ? `${(n/1e9).toFixed(1)}M` : Math.abs(n) >= 1e6 ? `${(n/1e6).toFixed(0)}jt` : n.toString(); }, font: { size: 11 } }, grid: { color: "#e5e7eb" } },
          y2: { position: "right", ticks: { callback: (v: unknown) => `${Number(v).toFixed(0)}%`, font: { size: 11 } }, grid: { display: false } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    } as Record<string, unknown>);
    return () => { chartInst.current?.destroy(); };
  }, [scenarios]);

  const sel = scenarios.find(sc => sc.n === s.holdYears) || scenarios[0];

  return (
    <>
      <div className="tab-controls">
        <label>Hold &amp; sewa selama:</label>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)" }}>{s.holdYears}</span>
        <span className="dim" style={{ fontSize: 11 }}>tahun, lalu jual semua unit di tahun berikutnya</span>
      </div>

      <div className="result-box">
        <div className="result-item">
          <div className="rl">Hold {s.holdYears}yr — Net Profit</div>
          <div className={`rv ${sel.holdNet >= 0 ? "green" : "red"} num`}>{fmtIdr(sel.holdNet)}</div>
        </div>
        <div className="result-item">
          <div className="rl">ROI Total</div>
          <div className={`rv ${sel.holdROI >= 0 ? "indigo" : "red"} num`}>{pct(sel.holdROI)}</div>
        </div>
        <div className="result-item">
          <div className="rl">Kum. Cashflow Sewa</div>
          <div className="rv blue num">{fmtIdr(sel.cumRentalNet)}</div>
        </div>
        <div className="result-item">
          <div className="rl">Net Jual (setelah komisi)</div>
          <div className="rv green num">{fmtIdr(c.netSell)}</div>
        </div>
      </div>

      <div className="chart-box">
        <div className="chart-title">Hold &amp; Jual — Perbandingan 1–10 Tahun</div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>

      <div className="chart-box">
        <table className="sim-table">
          <thead>
            <tr>
              {["Hold", "Kum. CF Sewa", "Net Jual", "Net Profit Total", "ROI"].map(h => (
                <th key={h} style={{ textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map(sc => (
              <tr key={sc.n} style={{ background: sc.n === s.holdYears ? "var(--primary-light)" : "transparent" }}>
                <td style={{ textAlign: "right", fontWeight: sc.n === s.holdYears ? 700 : 400 }}>
                  {sc.n} tahun {sc.n === s.holdYears ? "◀" : ""}
                </td>
                <td style={{ textAlign: "right" }} className="num blue">{fmtIdr(sc.cumRentalNet)}</td>
                <td style={{ textAlign: "right" }} className="num pos">{fmtIdr(c.netSell)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }} className={`num ${sc.holdNet >= 0 ? "pos" : "neg"}`}>{fmtIdr(sc.holdNet)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }} className={`num ${sc.holdROI >= 0 ? "pos" : "neg"}`}>{pct(sc.holdROI)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
