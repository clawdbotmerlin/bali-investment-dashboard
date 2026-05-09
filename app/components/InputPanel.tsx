"use client";

import { useCallback, useRef, useEffect } from "react";
import type { SessionData } from "@/lib/types";
import { fmtIdr, fmtUsd, calc } from "@/lib/calc";

interface InputPanelProps {
  data: SessionData;
  onChange: (data: SessionData) => void;
}

export default function InputPanel({ data, onChange }: InputPanelProps) {
  const rangeRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof SessionData>(key: K, val: SessionData[K]) => {
    onChange({ ...data, [key]: val });
  }, [data, onChange]);

  const num = (val: string) => parseFloat(val.replace(/\D/g, "")) || 0;
  const fmtInput = (n: number) => n ? new Intl.NumberFormat("id-ID").format(n) : "";

  const c = calc(data);
  const sellNetPU = c.sellPU * (1 - (data.agentSell || 0) / 100);

  useEffect(() => {
    if (rangeRef.current) {
      const pct = ((data.margin - 5) / (150 - 5)) * 100;
      rangeRef.current.style.setProperty("--pct", `${pct}%`);
    }
  }, [data.margin]);

  return (
    <div className="panel-left">
      {/* Lokasi */}
      <div className="form-section">
        <div className="section-title">Lokasi</div>
        <div className="field">
          <label>Google Maps URL</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              placeholder="https://maps.google.com/..."
              value={data.mapUrl || ""}
              onChange={e => set("mapUrl", e.target.value)}
              style={{ flex: 1 }}
            />
            {data.mapUrl && (
              <a
                href={data.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka di Google Maps"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "0 12px", background: "var(--primary)", color: "#fff",
                  borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
                  flexShrink: 0,
                }}
              >📍 Buka</a>
            )}
          </div>
        </div>
      </div>

      {/* Tanah & Leasehold */}
      <div className="form-section">
        <div className="section-title">Tanah &amp; Leasehold</div>
        <div className="field-row">
          <div className="field">
            <label>Luas Tanah (m²)</label>
            <input type="number" value={data.land || ""} onChange={e => set("land", parseFloat(e.target.value) || 0)} min={0} />
          </div>
          <div className="field">
            <label>Durasi Lease (tahun)</label>
            <input type="number" value={data.years || ""} onChange={e => set("years", parseFloat(e.target.value) || 0)} min={1} />
          </div>
        </div>
        <div className="field">
          <label>Harga Leasehold / m² / tahun</label>
          <input type="text" value={fmtInput(data.pricePerSqm)} onChange={e => set("pricePerSqm", num(e.target.value))} />
        </div>
        <div className="field">
          <label>Total Biaya Leasehold (auto)</label>
          <div className="field-auto"><span className="amt">{fmtIdr(c.leasehold)}</span><span className="usd"> ≈ {fmtUsd(c.leasehold, data.fxRate)}</span></div>
          <div className="field-auto-sub">{fmtInput(data.land)} m² × {data.years} thn × {fmtIdr(data.pricePerSqm)}</div>
        </div>
        <div className="field">
          <label>Skema Pembayaran Lease</label>
          <select value={data.terms} onChange={e => set("terms", e.target.value as SessionData["terms"])}>
            <option value="upfront">Upfront — lunas hari ke-1</option>
            <option value="installment">Cicilan — DP + angsuran tahunan</option>
          </select>
        </div>
        {data.terms === "installment" && (
          <>
            <div className="field-row">
              <div className="field">
                <label>DP (%)</label>
                <input type="number" value={data.dp || ""} onChange={e => set("dp", parseFloat(e.target.value) || 0)} min={0} max={100} />
              </div>
              <div className="field">
                <label>Tenor (tahun)</label>
                <input type="number" value={data.tenor || ""} onChange={e => set("tenor", parseFloat(e.target.value) || 0)} min={1} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Jumlah DP</label>
                <div className="field-auto"><span className="amt">{fmtIdr(c.dpAmt)}</span><span className="usd"> ≈ {fmtUsd(c.dpAmt, data.fxRate)}</span></div>
              </div>
              <div className="field">
                <label>Cicilan / Tahun</label>
                <div className="field-auto"><span className="amt">{fmtIdr(c.annualI)}/thn</span><span className="usd"> ≈ {fmtUsd(c.annualI, data.fxRate)}/yr</span></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bangunan & Biaya */}
      <div className="form-section">
        <div className="section-title">Bangunan &amp; Biaya</div>
        <div className="field"><label>Jumlah Unit</label>
          <input type="number" value={data.units || ""} onChange={e => set("units", parseFloat(e.target.value) || 0)} min={1} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Ukuran Unit (m²)</label>
            <input type="number" value={data.usize || ""} onChange={e => set("usize", parseFloat(e.target.value) || 0)} min={1} />
          </div>
          <div className="field">
            <label>Biaya Bangun / Unit</label>
            <input type="text" value={fmtInput(data.buildPerUnit)} onChange={e => set("buildPerUnit", num(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label>Total Biaya Bangun (auto)</label>
          <div className="field-auto"><span className="amt">{fmtIdr(c.build)}</span><span className="usd"> ≈ {fmtUsd(c.build, data.fxRate)}</span></div>
          <div className="field-auto-sub">{data.units} unit × {fmtIdr(data.buildPerUnit)}</div>
        </div>
        <div className="field">
          <label>Biaya Misc (legal, notaris, perizinan, dll.)</label>
          <input type="text" value={fmtInput(data.misc)} onChange={e => set("misc", num(e.target.value))} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Komisi Agen Beli</label>
            <input type="text" value={fmtInput(data.agentBuy)} onChange={e => set("agentBuy", num(e.target.value))} />
          </div>
          <div className="field">
            <label>FF&amp;E / Furnitur</label>
            <input type="text" value={fmtInput(data.ffe)} onChange={e => set("ffe", num(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label>Opex Tahunan (% dari total investasi)</label>
          <input type="number" value={data.opex} onChange={e => set("opex", parseFloat(e.target.value) || 0)} min={0} max={50} step={0.5} />
        </div>
        <div className="field">
          <label>Total Biaya / Unit (auto)</label>
          <div className="field-auto"><span className="amt">{fmtIdr(c.costPU)}</span><span className="usd"> ≈ {fmtUsd(c.costPU, data.fxRate)}</span></div>
          <div className="field-auto-sub">Tanah {fmtIdr(c.landPU)} + Bangun {fmtIdr(data.buildPerUnit)} + Extras {fmtIdr(c.extrasPU)}</div>
        </div>
      </div>

      {/* Margin */}
      <div className="margin-block">
        <div className="section-title">Target Margin</div>
        <div className="margin-header">
          <div className="margin-label">Profit Margin</div>
          <div className="margin-val">{data.margin}%</div>
        </div>
        <input
          ref={rangeRef}
          type="range"
          min={5}
          max={150}
          step={1}
          value={data.margin}
          onChange={e => set("margin", parseFloat(e.target.value))}
        />
        <div className="field" style={{ marginTop: 8 }}>
          <label>Komisi Agen Jual (% dari harga jual)</label>
          <input type="number" value={data.agentSell} onChange={e => set("agentSell", parseFloat(e.target.value) || 0)} min={0} max={20} step={0.5} />
        </div>
        <div className="sell-result">
          <div className="sr-label">Harga Jual / Unit (Rekomendasi)</div>
          <div className="sr-value">{fmtIdr(c.sellPU)}</div>
          <div className="sr-sub">≈ {fmtUsd(c.sellPU, data.fxRate)} · Net setelah komisi {data.agentSell || 0}%: {fmtIdr(sellNetPU)}/unit · Total {fmtIdr(c.netSell)}</div>
        </div>
      </div>

      {/* Pendapatan Sewa */}
      <div className="form-section">
        <div className="section-title">Pendapatan Sewa</div>
        <div className="field">
          <label>Model Rental</label>
          <select value={data.rmodel} onChange={e => set("rmodel", e.target.value as SessionData["rmodel"])}>
            <option value="nightly">Per Malam — short-term / Airbnb / villa</option>
            <option value="monthly">Per Bulan — long-term / kost</option>
          </select>
        </div>
        {data.rmodel === "nightly" ? (
          <div className="field-row">
            <div className="field">
              <label>Rate / Malam</label>
              <input type="text" value={fmtInput(data.nrate)} onChange={e => set("nrate", num(e.target.value))} />
            </div>
            <div className="field">
              <label>Occupancy (%)</label>
              <input type="number" value={data.nocc} onChange={e => set("nocc", parseFloat(e.target.value) || 0)} min={0} max={100} />
            </div>
          </div>
        ) : (
          <div className="field-row">
            <div className="field">
              <label>Rate / Bulan</label>
              <input type="text" value={fmtInput(data.mrate)} onChange={e => set("mrate", num(e.target.value))} />
            </div>
            <div className="field">
              <label>Occupancy (%)</label>
              <input type="number" value={data.mocc} onChange={e => set("mocc", parseFloat(e.target.value) || 0)} min={0} max={100} />
            </div>
          </div>
        )}
        <div className="field">
          <label>Property Management Fee (% dari sewa)</label>
          <input type="number" value={data.pmgmt} onChange={e => set("pmgmt", parseFloat(e.target.value) || 0)} min={0} max={50} step={0.5} />
        </div>
        <div className="field">
          <label>Pendapatan Sewa Bruto / Tahun (auto)</label>
          <div className="field-auto"><span className="amt">{fmtIdr(c.rentalGross)}</span><span className="usd"> ≈ {fmtUsd(c.rentalGross, data.fxRate)}</span></div>
          <div className="field-auto-sub">
            {data.rmodel === "nightly"
              ? `${fmtIdr(data.nrate)} × 365 × ${data.nocc}% × ${data.units} unit`
              : `${fmtIdr(data.mrate)} × 12 × ${data.mocc}% × ${data.units} unit`}
          </div>
        </div>
        <div className="field">
          <label>Pendapatan Sewa Neto / Tahun (auto)</label>
          <div className="field-auto"><span className="amt">{fmtIdr(c.rental)}</span><span className="usd"> ≈ {fmtUsd(c.rental, data.fxRate)}</span></div>
          <div className="field-auto-sub">Setelah {data.pmgmt || 0}% mgmt fee (−{fmtIdr(c.pmgmtFee)})</div>
        </div>
        <div className="field">
          <label>Total Sewa Sepanjang Lease (auto)</label>
          <div className="field-auto"><span className="amt">{fmtIdr(c.rental * data.years)}</span><span className="usd"> ≈ {fmtUsd(c.rental * data.years, data.fxRate)}</span></div>
          <div className="field-auto-sub">{fmtIdr(c.rental)}/thn × {data.years} thn lease</div>
        </div>
      </div>
    </div>
  );
}
