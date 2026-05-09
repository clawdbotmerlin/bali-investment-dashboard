"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { cfRent, fmtIdr, fmtUsd, pct } from "@/lib/calc";

interface Props { s: SessionData; c: CalcResult; }

export default function HoldJual({ s, c }: Props) {
  const rentRows = cfRent(s, c);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<{ destroy(): void } | null>(null);
  const fx = s.fxRate;

  // Build year-by-year hold scenarios for N = 1..10
  const scenarios = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const rentRow = rentRows.find(r => r.year === n);
    const cumRentalNet = rentRow ? rentRow.cumCashflow : c.netRental * n;
    const holdNet = cumRentalNet + c.netSell - c.total;
    const holdROI = c.total > 0 ? (holdNet / c.total) * 100 : 0;
    return { n, cumRentalNet, holdNet, holdROI };
  });

  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined" || !window.Chart) return;

    const labels = scenarios.map(s => `Hold ${s.n}yr`);
    const netData = scenarios.map(s => s.holdNet);
    const roiData = scenarios.map(s => s.holdROI);

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(chartRef.current, {
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Net Profit (Rp)",
            data: netData,
            backgroundColor: netData.map(v => v >= 0 ? "rgba(5,150,105,0.7)" : "rgba(220,38,38,0.7)"),
            borderRadius: 5,
            yAxisID: "y",
          },
          {
            type: "line",
            label: "ROI (%)",
            data: roiData,
            borderColor: "#4f46e5",
            backgroundColor: "transparent",
            pointRadius: 4,
            tension: 0.3,
            yAxisID: "y2",
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
          y2: {
            position: "right",
            ticks: { callback: (v: unknown) => `${Number(v).toFixed(0)}%`, font: { size: 11 } },
            grid: { display: false },
          },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    } as Record<string, unknown>);

    return () => { chartInstance.current?.destroy(); };
  }, [scenarios]);

  const selected = scenarios.find(sc => sc.n === s.holdYears) || scenarios[0];

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Hold & Jual</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
        Sewa N tahun, kemudian jual semua unit. Perbandingan profitabilitas per durasi hold.
      </p>

      {/* Highlighted scenario */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20,
        background: "var(--primary-light)", borderRadius: 12, padding: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Hold {s.holdYears}yr — Net Profit
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: selected.holdNet >= 0 ? "var(--success)" : "var(--danger)" }}>
            {fmtIdr(selected.holdNet)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>≈ {fmtUsd(selected.holdNet, fx)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>ROI</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>{pct(selected.holdROI)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Kum. Cashflow Sewa</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--blue)" }}>{fmtIdr(selected.cumRentalNet)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Net Jual</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{fmtIdr(c.netSell)}</div>
        </div>
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
              {["Hold", "Kum. Cashflow Sewa", "Net Jual", "Net Profit Total", "ROI Total"].map(h => (
                <th key={h} style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: "var(--text2)", fontSize: 11, borderBottom: "1px solid var(--border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map(sc => (
              <tr key={sc.n} style={{
                borderBottom: "1px solid var(--border)",
                background: sc.n === s.holdYears ? "var(--primary-light)" : "transparent",
              }}>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: sc.n === s.holdYears ? 700 : 400 }}>
                  {sc.n} tahun {sc.n === s.holdYears ? "⬅" : ""}
                </td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--blue)", fontWeight: 600 }}>{fmtIdr(sc.cumRentalNet)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--success)", fontWeight: 600 }}>{fmtIdr(c.netSell)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: sc.holdNet >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {fmtIdr(sc.holdNet)}
                </td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: sc.holdROI >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {pct(sc.holdROI)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
