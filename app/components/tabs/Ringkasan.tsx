"use client";

import { useEffect, useRef } from "react";
import type { SessionData, CalcResult } from "@/lib/types";
import { fmtIdr, fmtUsd, pct } from "@/lib/calc";

interface Props {
  s: SessionData;
  c: CalcResult;
}

function SummaryCard({
  label, value, usd, valueClass, roi, roiClass, sub,
}: {
  label: string; value: string; usd?: string; valueClass?: string; roi?: string; roiClass?: string; sub?: string;
}) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: `var(--${valueClass || "text"})` }}>
        {value}
      </div>
      {usd && (
        <div style={{ fontSize: 12, fontWeight: 600, color: `var(--${valueClass || "text2"})`, opacity: 0.7, marginTop: 2 }}>
          ≈ {usd}
        </div>
      )}
      {roi && (
        <span style={{
          display: "inline-block", marginTop: 6,
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
        }} className={`pill-${roiClass || "indigo"}`}>
          ROI {roi}
        </span>
      )}
      {sub && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Ringkasan({ s, c }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<{ destroy(): void } | null>(null);

  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined" || !window.Chart) return;

    const sellOnly = c.profit;
    const rentOnly = c.netRental * s.years - c.total;
    const hold = c.holdNet;

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new window.Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: ["Jual Semua", `Sewa ${s.years}yr`, `Hold ${s.holdYears}yr→Jual`],
        datasets: [{
          label: "Net Profit (Rp)",
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
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
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
  }, [c, s]);

  const fx = s.fxRate;

  return (
    <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Ringkasan Investasi</h2>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>
        Total investasi, biaya per unit, dan proyeksi profit semua skenario
      </p>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        <SummaryCard
          label="Total Investasi"
          value={fmtIdr(c.total)}
          usd={fmtUsd(c.total, fx)}
          valueClass="text"
        />
        <SummaryCard
          label="Biaya per Unit"
          value={fmtIdr(c.costPU)}
          usd={fmtUsd(c.costPU, fx)}
          valueClass="primary"
        />
        <SummaryCard
          label="Harga Jual per Unit"
          value={fmtIdr(c.sellPU)}
          usd={fmtUsd(c.sellPU, fx)}
          valueClass="text"
          sub={`Margin ${s.margin}% dari HPP`}
        />
        <SummaryCard
          label="Total Revenue Jual"
          value={fmtIdr(c.totalSell)}
          usd={fmtUsd(c.totalSell, fx)}
          valueClass="success"
          sub={`Net setelah komisi: ${fmtIdr(c.netSell)}`}
        />
        <SummaryCard
          label="Net Profit (Jual)"
          value={fmtIdr(c.profit)}
          usd={fmtUsd(c.profit, fx)}
          valueClass={c.profit >= 0 ? "success" : "danger"}
          roi={pct(c.profitROI)}
          roiClass={c.profit >= 0 ? "green" : "red"}
          sub={`${fmtIdr(c.netSell)} − ${fmtIdr(c.total)}`}
        />
        <SummaryCard
          label="Pendapatan Sewa / Tahun"
          value={fmtIdr(c.rental)}
          usd={fmtUsd(c.rental, fx)}
          valueClass="blue"
          sub={`Net setelah PM ${s.pmgmt}%: ${fmtIdr(c.netRental)}`}
        />
        <SummaryCard
          label="Gross Rental Yield"
          value={`${c.yield_.toFixed(1)}%`}
          valueClass={c.yield_ >= 8 ? "success" : c.yield_ >= 5 ? "warning" : "danger"}
          sub="Sewa tahunan / total investasi"
        />
        <SummaryCard
          label={`Hold ${s.holdYears}yr → Jual`}
          value={fmtIdr(c.holdNet)}
          usd={fmtUsd(c.holdNet, fx)}
          valueClass={c.holdNet >= 0 ? "success" : "danger"}
          roi={pct(c.holdROI)}
          roiClass={c.holdNet >= 0 ? "green" : "red"}
          sub={`Sewa ${s.holdYears}yr + jual semua`}
        />
        <SummaryCard
          label="Opex Tahunan"
          value={fmtIdr(c.opex)}
          usd={fmtUsd(c.opex, fx)}
          valueClass="warning"
          sub={`${s.opex}% dari total investasi`}
        />
      </div>

      {/* Cost breakdown */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Breakdown Biaya</h3>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {[
            { label: "Leasehold", val: c.leasehold, sub: `${s.land}m² × Rp${(s.pricePerSqm / 1e6).toFixed(2)}jt × ${s.years}yr` },
            { label: "Bangunan", val: c.build, sub: `${s.units} unit × ${fmtIdr(s.buildPerUnit)}` },
            { label: "Misc / Legal / Agent / FF&E", val: c.upfrontExtras, sub: "" },
            { label: "Total", val: c.total, sub: "", bold: true },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 16px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              background: row.bold ? "var(--surface2)" : "transparent",
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                {row.sub && <div style={{ fontSize: 11, color: "var(--text3)" }}>{row.sub}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: row.bold ? 700 : 600, fontSize: 13 }}>{fmtIdr(row.val)}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{fmtUsd(row.val, fx)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario chart */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Perbandingan Skenario</h3>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
          <div style={{ height: 260, position: "relative" }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
