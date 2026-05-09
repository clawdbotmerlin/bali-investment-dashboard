"use client";

import { useCallback, useRef } from "react";
import type { SessionData } from "@/lib/types";
import { defaultSession } from "@/lib/calc";

interface InputPanelProps {
  data: SessionData;
  onChange: (data: SessionData) => void;
  onFxRefresh: () => void;
  fxLoading: boolean;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6,
        borderBottom: "1px solid var(--border)",
      }}>{title}</div>
      {children}
    </div>
  );
}

export default function InputPanel({ data, onChange, onFxRefresh, fxLoading }: InputPanelProps) {
  const set = useCallback(<K extends keyof SessionData>(key: K, val: SessionData[K]) => {
    onChange({ ...data, [key]: val });
  }, [data, onChange]);

  const num = (val: string) => parseFloat(val) || 0;

  return (
    <div style={{
      width: 270,
      minWidth: 270,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      height: "100%",
      overflowY: "auto",
      padding: "16px 14px",
    }}>
      {/* FX Rate */}
      <div style={{ marginBottom: 16, background: "var(--primary-light)", borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Kurs USD/IDR
          </span>
          <button
            onClick={onFxRefresh}
            disabled={fxLoading}
            style={{
              background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 600,
              cursor: "pointer", opacity: fxLoading ? 0.6 : 1,
            }}
          >{fxLoading ? "↻" : "↻ Refresh"}</button>
        </div>
        <input
          type="number"
          value={data.fxRate}
          onChange={e => set("fxRate", num(e.target.value))}
          style={{ fontWeight: 700 }}
        />
      </div>

      <Section title="Tanah & Leasehold">
        <Field label="Luas Tanah (m²)">
          <input type="number" value={data.land} onChange={e => set("land", num(e.target.value))} />
        </Field>
        <Field label="Harga Leasehold / m² / tahun (Rp)">
          <input type="number" value={data.pricePerSqm} onChange={e => set("pricePerSqm", num(e.target.value))} />
        </Field>
        <Field label="Durasi Leasehold (tahun)">
          <input type="number" value={data.years} onChange={e => set("years", num(e.target.value))} min={1} max={99} />
        </Field>
        <Field label="Pembayaran Leasehold">
          <select value={data.terms} onChange={e => set("terms", e.target.value as SessionData["terms"])}>
            <option value="upfront">Upfront (Lunas)</option>
            <option value="installment">Installment (Cicilan)</option>
          </select>
        </Field>
        {data.terms === "installment" && (
          <>
            <Field label="DP (%)" hint="% dari total harga leasehold">
              <input type="number" value={data.dp} onChange={e => set("dp", num(e.target.value))} min={0} max={100} />
            </Field>
            <Field label="Tenor (tahun)">
              <input type="number" value={data.tenor} onChange={e => set("tenor", num(e.target.value))} min={1} max={30} />
            </Field>
          </>
        )}
      </Section>

      <Section title="Bangunan & Unit">
        <Field label="Jumlah Unit">
          <input type="number" value={data.units} onChange={e => set("units", num(e.target.value))} min={1} />
        </Field>
        <Field label="Ukuran Unit (m²)">
          <input type="number" value={data.usize} onChange={e => set("usize", num(e.target.value))} />
        </Field>
        <Field label="Biaya Bangun / Unit (Rp)">
          <input type="number" value={data.buildPerUnit} onChange={e => set("buildPerUnit", num(e.target.value))} />
        </Field>
        <Field label="Konstruksi">
          <select value={data.sellMode} onChange={e => set("sellMode", e.target.value as SessionData["sellMode"])}>
            <option value="upfront">Semua dibangun dulu</option>
            <option value="presale">Presale (bangun per unit terjual)</option>
          </select>
        </Field>
        {data.sellMode === "presale" && (
          <Field label="Unit Sold / Tahun" hint="Rata-rata unit terjual per tahun">
            <input type="number" value={data.upy} onChange={e => set("upy", num(e.target.value))} min={1} />
          </Field>
        )}
      </Section>

      <Section title="Biaya Lain">
        <Field label="Misc / Legal / Notaris (Rp)">
          <input type="number" value={data.misc} onChange={e => set("misc", num(e.target.value))} />
        </Field>
        <Field label="Agent Fee Beli (Rp)" hint="Komisi agen saat membeli tanah">
          <input type="number" value={data.agentBuy} onChange={e => set("agentBuy", num(e.target.value))} />
        </Field>
        <Field label="FF&E / Furnishing (Rp)" hint="Furnitur & perlengkapan">
          <input type="number" value={data.ffe} onChange={e => set("ffe", num(e.target.value))} />
        </Field>
        <Field label="Opex Tahunan (% investasi)" hint="Operasional, maintenance, pajak">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="range" min={0} max={20} step={0.5} value={data.opex} onChange={e => set("opex", num(e.target.value))} />
            <span style={{ width: 38, textAlign: "right", fontWeight: 700, color: "var(--primary)", fontSize: 13 }}>{data.opex}%</span>
          </div>
        </Field>
      </Section>

      <Section title="Strategi Jual">
        <Field label="Target Margin (%)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="range" min={0} max={100} step={1} value={data.margin} onChange={e => set("margin", num(e.target.value))} />
            <span style={{ width: 38, textAlign: "right", fontWeight: 700, color: "var(--success)", fontSize: 13 }}>{data.margin}%</span>
          </div>
        </Field>
        <Field label="Agent Fee Jual (%)">
          <input type="number" value={data.agentSell} onChange={e => set("agentSell", num(e.target.value))} min={0} max={20} step={0.5} />
        </Field>
      </Section>

      <Section title="Strategi Sewa">
        <Field label="Model Sewa">
          <select value={data.rmodel} onChange={e => set("rmodel", e.target.value as SessionData["rmodel"])}>
            <option value="nightly">Nightly / Harian</option>
            <option value="monthly">Monthly / Bulanan</option>
          </select>
        </Field>
        {data.rmodel === "nightly" ? (
          <>
            <Field label="Rate / Malam (Rp)">
              <input type="number" value={data.nrate} onChange={e => set("nrate", num(e.target.value))} />
            </Field>
            <Field label="Occupancy (%)">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="range" min={0} max={100} step={1} value={data.nocc} onChange={e => set("nocc", num(e.target.value))} />
                <span style={{ width: 38, textAlign: "right", fontWeight: 700, color: "var(--blue)", fontSize: 13 }}>{data.nocc}%</span>
              </div>
            </Field>
          </>
        ) : (
          <>
            <Field label="Rate / Bulan (Rp)">
              <input type="number" value={data.mrate} onChange={e => set("mrate", num(e.target.value))} />
            </Field>
            <Field label="Occupancy (%)">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="range" min={0} max={100} step={1} value={data.mocc} onChange={e => set("mocc", num(e.target.value))} />
                <span style={{ width: 38, textAlign: "right", fontWeight: 700, color: "var(--blue)", fontSize: 13 }}>{data.mocc}%</span>
              </div>
            </Field>
          </>
        )}
        <Field label="Property Management Fee (%)">
          <input type="number" value={data.pmgmt} onChange={e => set("pmgmt", num(e.target.value))} min={0} max={50} step={0.5} />
        </Field>
      </Section>

      <Section title="Hold & Jual">
        <Field label="Hold Selama (tahun)" hint="Sewa N tahun lalu jual semua unit">
          <input type="number" value={data.holdYears} onChange={e => set("holdYears", num(e.target.value))} min={1} max={30} />
        </Field>
      </Section>

      {/* Reset button */}
      <button
        onClick={() => onChange(defaultSession())}
        style={{
          width: "100%", padding: "8px", background: "transparent", border: "1.5px dashed var(--border)",
          borderRadius: 8, color: "var(--text3)", fontSize: 12, marginTop: 4,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--danger)"; (e.target as HTMLButtonElement).style.color = "var(--danger)"; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--border)"; (e.target as HTMLButtonElement).style.color = "var(--text3)"; }}
      >Reset ke Default</button>
    </div>
  );
}
