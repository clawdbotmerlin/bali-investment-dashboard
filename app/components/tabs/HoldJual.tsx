"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { fmtIdr, fmtUsd, pct, calc } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; onChange: (s: SessionData) => void; }

export default function HoldJual({ s, c, onChange }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<{ destroy(): void } | null>(null);
  const fx = s.fxRate;

  const scenarios = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const sx: SessionData = { ...s, holdYears: n };
    const cx = calc(sx);
    return { n, holdNet: cx.holdNet, holdROI: cx.holdROI, cumRentalNet: n * c.netRental };
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
          y: { ticks: { callback: (v: unknown) => { const n = Number(v); return Math.abs(n) >= 1e9 ? `Rp ${(n/1e9).toFixed(1)}M` : Math.abs(n) >= 1e6 ? `Rp ${(n/1e6).toFixed(0)}jt` : `Rp ${n}`; }, font: { size: 11 } }, grid: { color: "#f1f5f9" } },
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
        <input
          type="number"
          min={1}
          max={10}
          value={s.holdYears || ""}
          onChange={e => onChange({ ...s, holdYears: parseFloat(e.target.value) || 1 })}
          style={{ width: 70 }}
        />
        <span className="dim" style={{ fontSize: 11 }}>tahun, lalu jual semua unit di tahun berikutnya</span>
      </div>

      <div className="result-box">
        <div className="result-item">
          <div className="rl">Hold {s.holdYears}yr — Total Keuntungan Bersih</div>
          <div className={`rv ${sel.holdNet >= 0 ? "green" : "red"} num`}>{fmtIdr(sel.holdNet)}</div>
          <div className="usd">≈ {fmtUsd(sel.holdNet, fx)}</div>
        </div>
        <div className="result-item">
          <div className="rl">ROI Total</div>
          <div className={`rv ${sel.holdROI >= 0 ? "indigo" : "red"} num`}>{pct(sel.holdROI)}</div>
          <div className="usd">{s.holdYears} thn hold + 1 thn jual</div>
        </div>
        <div className="result-item">
          <div className="rl">Kum. Sewa Neto ({s.holdYears} thn)</div>
          <div className="rv blue num">{fmtIdr(sel.cumRentalNet)}</div>
          <div className="usd">≈ {fmtUsd(sel.cumRentalNet, fx)}</div>
        </div>
        <div className="result-item">
          <div className="rl">Net Jual (setelah komisi)</div>
          <div className="rv green num">{fmtIdr(c.netSell)}</div>
          <div className="usd">≈ {fmtUsd(c.netSell, fx)}</div>
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
              {["Hold", "Kum. Sewa Neto", "Net Jual", "Net Profit Total", "ROI"].map(h => (
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
