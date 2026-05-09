"use client";

import { useCallback, useRef, useEffect } from "react";
import type { SessionData } from "@/lib/types";
import { defaultSession, fmtIdr, fmtUsd, calc } from "@/lib/calc";

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

  // Update range track fill
  useEffect(() => {
    if (rangeRef.current) {
      const pct = ((data.margin - 5) / (150 - 5)) * 100;
      rangeRef.current.style.setProperty("--pct", `${pct}%`);
    }
  }, [data.margin]);

  return (
    <div className="panel-left">

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
          <input
            type="text"
            value={fmtInput(data.pricePerSqm)}
            onChange={e => set("pricePerSqm", num(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Total Biaya Leasehold (auto)</label>
          <div className="field-auto num">{fmtIdr(c.leasehold)}</div>
          <div className="field-auto-sub">{data.land}m² × Rp{fmtInput(data.pricePerSqm)}/m²/thn × {data.years} tahun ≈ {fmtUsd(c.leasehold, data.fxRate)}</div>
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
                <div className="field-auto num">{fmtIdr(c.dpAmt)}</div>
              </div>
              <div className="field">
                <label>Cicilan / Tahun</label>
                <div className="field-auto num">{fmtIdr(c.installAmt)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bangunan & Biaya */}
      <div className="form-section">
        <div className="section-title">Bangunan &amp; Biaya</div>
        <div className="field-row">
          <div className="field">
            <label>Jumlah Unit</label>
            <input type="number" value={data.units || ""} onChange={e => set("units", parseFloat(e.target.value) || 0)} min={1} />
          </div>
          <div className="field">
            <label>Ukuran Unit (m²)</label>
            <input type="number" value={data.usize || ""} onChange={e => set("usize", parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="field">
          <label>Biaya Bangun / Unit</label>
          <input type="text" value={fmtInput(data.buildPerUnit)} onChange={e => set("buildPerUnit", num(e.target.value))} />
        </div>
        <div className="field">
          <label>Total Biaya Bangun (auto)</label>
          <div className="field-auto num">{fmtIdr(c.build)}</div>
          <div className="field-auto-sub">{data.units} unit × {fmtIdr(data.buildPerUnit)} ≈ {fmtUsd(c.build, data.fxRate)}</div>
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
          <div className="field-auto num">{fmtIdr(c.costPU)}</div>
          <div className="field-auto-sub">Leasehold/unit + bangun + extras ≈ {fmtUsd(c.costPU, data.fxRate)}</div>
        </div>
      </div>

      {/* Target Margin */}
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
        <div className="field">
          <label>Komisi Agen Jual (% dari harga jual)</label>
          <input type="number" value={data.agentSell} onChange={e => set("agentSell", parseFloat(e.target.value) || 0)} min={0} max={20} step={0.5} />
        </div>
        <div className="sell-result">
          <div className="sr-label">Harga Jual / Unit (Rekomendasi)</div>
          <div className="sr-value num">{fmtIdr(c.sellPU)}</div>
          <div className="sr-sub">≈ {fmtUsd(c.sellPU, data.fxRate)} · HPP {fmtIdr(c.costPU)} + {data.margin}% margin</div>
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
          <div className="field-auto num">{fmtIdr(c.rentalGross)}</div>
          <div className="field-auto-sub">≈ {fmtUsd(c.rentalGross, data.fxRate)}</div>
        </div>
        <div className="field">
          <label>Pendapatan Sewa Neto / Tahun (auto)</label>
          <div className="field-auto num">{fmtIdr(c.netRental)}</div>
          <div className="field-auto-sub">Setelah PM {data.pmgmt}% + opex ≈ {fmtUsd(c.netRental, data.fxRate)}</div>
        </div>
        <div className="field">
          <label>Total Sewa Sepanjang Lease (auto)</label>
          <div className="field-auto num">{fmtIdr(c.netRental * data.years)}</div>
          <div className="field-auto-sub">{data.years} tahun × {fmtIdr(c.netRental)}/tahun ≈ {fmtUsd(c.netRental * data.years, data.fxRate)}</div>
        </div>
      </div>

      {/* Hold & Jual */}
      <div className="form-section">
        <div className="section-title">Hold &amp; Jual</div>
        <div className="field">
          <label>Konstruksi</label>
          <select value={data.sellMode} onChange={e => set("sellMode", e.target.value as SessionData["sellMode"])}>
            <option value="upfront">Bangun Semua di Tahun 0</option>
            <option value="presale">Show Unit + Presale (build per sale)</option>
          </select>
        </div>
        {data.sellMode === "presale" && (
          <div className="field">
            <label>Unit Terjual / Tahun</label>
            <input type="number" value={data.upy} onChange={e => set("upy", parseFloat(e.target.value) || 1)} min={1} />
          </div>
        )}
        <div className="field">
          <label>Hold selama N tahun lalu jual semua</label>
          <input type="number" value={data.holdYears} onChange={e => set("holdYears", parseFloat(e.target.value) || 1)} min={1} max={30} />
        </div>
      </div>

      {/* Reset */}
      <div className="form-section">
        <button
          onClick={() => onChange(defaultSession())}
          style={{
            width: "100%", padding: "8px", background: "transparent",
            border: "1px dashed var(--border)", borderRadius: 8,
            color: "var(--text-3)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--red)"; (e.target as HTMLButtonElement).style.color = "var(--red)"; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--border)"; (e.target as HTMLButtonElement).style.color = "var(--text-3)"; }}
        >Reset ke Default</button>
      </div>
    </div>
  );
}
