import type { SessionData, CalcResult } from "./types";

export function defaultSession(): SessionData {
  return {
    land: 2000,
    pricePerSqm: 1500000,
    years: 25,
    terms: "upfront",
    dp: 30,
    tenor: 3,
    units: 4,
    usize: 120,
    buildPerUnit: 800000000,
    misc: 200000000,
    agentBuy: 0,
    ffe: 0,
    opex: 5,
    margin: 30,
    agentSell: 5,
    rmodel: "nightly",
    nrate: 2500000,
    nocc: 70,
    mrate: 15000000,
    mocc: 90,
    pmgmt: 15,
    upy: 2,
    holdYears: 1,
    sellMode: "upfront",
    fxRate: 16000,
  };
}

export function calc(s: SessionData): CalcResult {
  const leasehold = s.land * s.pricePerSqm * s.years;
  const build = s.units * s.buildPerUnit;
  const upfrontExtras = (s.misc || 0) + (s.agentBuy || 0) + (s.ffe || 0);
  const total = leasehold + build + upfrontExtras;
  const dpAmt = leasehold * ((s.dp || 30) / 100);
  const installAmt = s.tenor > 0 ? (leasehold - dpAmt) / s.tenor : 0;
  const costPU = leasehold / (s.units || 1) + s.buildPerUnit + upfrontExtras / (s.units || 1);
  const sellPU = costPU * (1 + s.margin / 100);
  const totalSell = sellPU * s.units;
  const netSell = totalSell * (1 - (s.agentSell || 0) / 100);
  const profit = netSell - total;
  const profitROI = total > 0 ? (profit / total) * 100 : 0;
  const opex = total * (s.opex / 100);
  const rentalGross =
    s.rmodel === "nightly"
      ? s.nrate * 365 * (s.nocc / 100) * s.units
      : s.mrate * 12 * (s.mocc / 100) * s.units;
  const pmgmtFee = rentalGross * ((s.pmgmt || 0) / 100);
  const rental = rentalGross - pmgmtFee;
  const netRental = rental - opex;
  const yield_ = total > 0 ? (rental / total) * 100 : 0;
  const N = s.holdYears || 1;
  const holdNet = N * netRental + netSell - total;
  const holdROI = total > 0 ? (holdNet / total) * 100 : 0;
  return {
    leasehold,
    build,
    upfrontExtras,
    total,
    dpAmt,
    installAmt,
    costPU,
    sellPU,
    totalSell,
    netSell,
    profit,
    profitROI,
    opex,
    rentalGross,
    pmgmtFee,
    rental,
    netRental,
    yield_,
    holdNet,
    holdROI,
  };
}

export interface SellYearRow {
  year: number;
  unitsSold: number;
  revenue: number;
  cumulativeRevenue: number;
  cumulativeCost: number;
  netCumulative: number;
}

export function cfSell(s: SessionData, c: CalcResult): SellYearRow[] {
  const sellNetPerUnit = c.sellPU * (1 - (s.agentSell || 0) / 100);
  const presale = s.sellMode === "presale";
  let initOut = presale
    ? (s.terms === "installment" ? c.dpAmt : c.leasehold) + s.buildPerUnit + c.upfrontExtras
    : s.terms === "installment"
    ? c.dpAmt + s.units * s.buildPerUnit + c.upfrontExtras
    : c.total;

  const rows: SellYearRow[] = [];
  let cumRev = 0;
  let cumCost = initOut;
  let unitsLeft = s.units;
  let unitsBuilt = presale ? 1 : s.units;
  const upy = Math.max(1, s.upy || 2);

  for (let yr = 0; yr <= 10; yr++) {
    let sold = 0;
    let yearCost = 0;

    if (yr === 0) {
      yearCost = initOut;
    } else {
      if (unitsLeft > 0) {
        sold = Math.min(upy, unitsLeft);
        if (presale && unitsBuilt < s.units) {
          const toBuild = Math.min(sold, s.units - unitsBuilt);
          yearCost = toBuild * s.buildPerUnit;
          if (s.terms === "installment" && yr <= s.tenor) yearCost += c.installAmt;
          unitsBuilt += toBuild;
        } else if (s.terms === "installment" && yr <= s.tenor) {
          yearCost = c.installAmt;
        }
        unitsLeft -= sold;
      } else if (s.terms === "installment" && yr <= s.tenor) {
        yearCost = c.installAmt;
      }
    }

    cumRev += sold * sellNetPerUnit;
    cumCost += yearCost;

    rows.push({
      year: yr,
      unitsSold: sold,
      revenue: sold * sellNetPerUnit,
      cumulativeRevenue: cumRev,
      cumulativeCost: cumCost,
      netCumulative: cumRev - cumCost,
    });
  }
  return rows;
}

export interface RentYearRow {
  year: number;
  grossRental: number;
  pmgmtFee: number;
  netRental: number;
  opex: number;
  cashflow: number;
  cumCashflow: number;
  cumInvestment: number;
  netPosition: number;
}

export function cfRent(s: SessionData, c: CalcResult): RentYearRow[] {
  const rows: RentYearRow[] = [];
  let cumCF = 0;
  let cumInv = c.total;
  const maxYears = Math.min(s.years, 25);

  for (let yr = 1; yr <= maxYears; yr++) {
    const installmentOut =
      s.terms === "installment" && yr <= s.tenor ? c.installAmt : 0;
    cumInv += installmentOut;

    const cashflow = c.netRental - installmentOut;
    cumCF += cashflow;

    rows.push({
      year: yr,
      grossRental: c.rentalGross,
      pmgmtFee: c.pmgmtFee,
      netRental: c.rental,
      opex: c.opex,
      cashflow,
      cumCashflow: cumCF,
      cumInvestment: cumInv,
      netPosition: cumCF - c.total,
    });
  }
  return rows;
}

export function fmt(n: number, digits = 0): string {
  if (!isFinite(n)) return "-";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function fmtIdr(n: number): string {
  if (!isFinite(n)) return "-";
  if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toFixed(2)}M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}jt`;
  return `Rp ${fmt(n)}`;
}

export function fmtUsd(n: number, fxRate: number): string {
  if (!isFinite(n) || !fxRate) return "";
  const usd = n / fxRate;
  if (Math.abs(usd) >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  if (Math.abs(usd) >= 1e3) return `$${(usd / 1e3).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

export function pct(n: number): string {
  if (!isFinite(n)) return "-";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}
