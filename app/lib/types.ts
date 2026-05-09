export interface SessionData {
  land: number;
  pricePerSqm: number;
  years: number;
  terms: "upfront" | "installment";
  dp: number;
  tenor: number;
  units: number;
  usize: number;
  buildPerUnit: number;
  misc: number;
  agentBuy: number;
  ffe: number;
  opex: number;
  margin: number;
  agentSell: number;
  rmodel: "nightly" | "monthly";
  nrate: number;
  nocc: number;
  mrate: number;
  mocc: number;
  pmgmt: number;
  upy: number;
  holdYears: number;
  sellMode: "upfront" | "presale" | "lease_only";
  fxRate: number;
  mapUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  data: SessionData;
  createdAt: number;
  updatedAt: number;
}

export interface CalcResult {
  leasehold: number;
  build: number;
  upfrontExtras: number;
  total: number;
  landPU: number;
  extrasPU: number;
  dpAmt: number;
  installAmt: number;
  annualI: number;
  costPU: number;
  sellPU: number;
  totalSell: number;
  sellComm: number;
  netSell: number;
  profit: number;
  profitROI: number;
  opex: number;
  rentalGross: number;
  pmgmtFee: number;
  rental: number;
  netRental: number;
  yield_: number;
  N: number;
  holdNet: number;
  holdROI: number;
  year0Capital: number;
  year1BestNet: number;
  year1BestROC: number;
}
