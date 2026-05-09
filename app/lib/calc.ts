import type { SessionData, CalcResult } from "./types";

export function defaultSession(): SessionData {
  return {
    land: 2000, pricePerSqm: 1500000, years: 25,
    terms: "upfront", dp: 30, tenor: 3,
    units: 4, usize: 120, buildPerUnit: 800000000, misc: 200000000,
    agentBuy: 0, ffe: 0, opex: 5,
    margin: 30, agentSell: 5,
    rmodel: "nightly", nrate: 2500000, nocc: 70, mrate: 15000000, mocc: 90,
    pmgmt: 15,
    upy: 2, holdYears: 1,
    sellMode: "upfront", fxRate: 16000,
    mapUrl: "",
  };
}

export function calc(s: SessionData): CalcResult {
  const leasehold = s.land * s.pricePerSqm * s.years;
  const build = s.units * s.buildPerUnit;
  const upfrontExtras = (s.misc || 0) + (s.agentBuy || 0) + (s.ffe || 0);
  const total = leasehold + build + upfrontExtras;
  const landPU = leasehold / (s.units || 1);
  const extrasPU = upfrontExtras / (s.units || 1);
  const costPU = landPU + s.buildPerUnit + extrasPU;
  const sellPU = costPU * (1 + s.margin / 100);
  const totalSell = sellPU * s.units;
  const sellComm = totalSell * ((s.agentSell || 0) / 100);
  const netSell = totalSell - sellComm;
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
  const dpAmt = s.terms === "installment" ? leasehold * (s.dp / 100) : leasehold;
  const remaining = leasehold - dpAmt;
  const annualI = s.tenor > 0 ? remaining / s.tenor : 0;
  const installAmt = annualI;
  const N = s.holdYears || 1;
  const holdNet = N * netRental + netSell - total;
  const holdROI = total > 0 ? (holdNet / total) * 100 : 0;

  // Year-0 capital + best-case Year-1 ROC (sell all units in year 1)
  const presale = s.sellMode === "presale";
  const year0Capital = presale
    ? (s.terms === "installment" ? dpAmt : leasehold) + s.buildPerUnit + upfrontExtras
    : (s.terms === "installment" ? dpAmt + s.units * s.buildPerUnit + upfrontExtras : total);
  const sellNetPU = sellPU * (1 - (s.agentSell || 0) / 100);
  const year1Revenue = s.units * sellNetPU;
  const year1BuildCost = presale ? Math.max(0, s.units - 1) * s.buildPerUnit : 0;
  const year1Installment = s.terms === "installment" && s.tenor >= 1 ? annualI : 0;
  const year1BestNet = year1Revenue - year1BuildCost - year1Installment;
  const year1BestROC = year0Capital > 0 ? (year1BestNet / year0Capital) * 100 : 0;

  return {
    leasehold, build, upfrontExtras, total,
    landPU, extrasPU,
    dpAmt, installAmt, annualI,
    costPU, sellPU, totalSell, sellComm, netSell,
    profit, profitROI,
    opex, rentalGross, pmgmtFee, rental, netRental, yield_,
    N, holdNet, holdROI,
    year0Capital, year1BestNet, year1BestROC,
  };
}

export interface SellYearRow {
  year: number;
  unitsSold: number;
  unitsBuilt: number;
  cashIn: number;
  cashOut: number;
  net: number;
  cumulative: number;
}

export function cfSell(s: SessionData, c: CalcResult): SellYearRow[] {
  const sellNetPU = c.sellPU * (1 - (s.agentSell || 0) / 100);
  const presale = s.sellMode === "presale";
  let initOut: number;
  if (presale) {
    const landPaid = s.terms === "installment" ? c.dpAmt : c.leasehold;
    initOut = landPaid + s.buildPerUnit + c.upfrontExtras;
  } else {
    initOut = s.terms === "installment"
      ? c.dpAmt + s.units * s.buildPerUnit + c.upfrontExtras
      : c.total;
  }

  const rows: SellYearRow[] = [];
  let cum = 0;
  let unitsLeft = s.units;
  let unitsBuilt = presale ? 1 : s.units;
  const upy = Math.max(1, s.upy || 1);

  for (let yr = 0; yr <= 10; yr++) {
    let ci = 0, co = 0, sold = 0, built = 0;
    if (yr === 0) {
      co = initOut;
    } else {
      sold = Math.max(0, Math.min(upy, unitsLeft));
      ci = sold * sellNetPU;
      unitsLeft -= sold;
      if (presale) {
        const target = s.units - unitsLeft;
        built = Math.max(0, target - unitsBuilt);
        unitsBuilt += built;
        co += built * s.buildPerUnit;
      }
      if (s.terms === "installment" && yr <= s.tenor) co += c.annualI;
    }
    cum += ci - co;
    rows.push({ year: yr, unitsSold: sold, unitsBuilt: built, cashIn: ci, cashOut: co, net: ci - co, cumulative: cum });
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
  netPosition: number;
}

export function cfRent(s: SessionData, c: CalcResult): RentYearRow[] {
  const rows: RentYearRow[] = [];
  let cumCF = -c.total;
  const horizon = Math.min(Math.max(s.years || 10, 5), 25);

  for (let yr = 1; yr <= horizon; yr++) {
    const installmentOut = s.terms === "installment" && yr <= s.tenor ? c.annualI : 0;
    const cashflow = c.netRental - installmentOut;
    cumCF += cashflow;
    rows.push({
      year: yr,
      grossRental: c.rentalGross,
      pmgmtFee: c.pmgmtFee,
      netRental: c.rental,
      opex: c.opex,
      cashflow,
      cumCashflow: cumCF + c.total,
      netPosition: cumCF,
    });
  }
  return rows;
}

export function fmt(n: number, digits = 0): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function fmtIdr(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function fmtUsd(n: number, fxRate: number): string {
  if (!isFinite(n) || !fxRate) return "—";
  const usd = n / fxRate;
  const abs = Math.abs(usd);
  if (abs >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(usd / 1e3).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

export function pct(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}
