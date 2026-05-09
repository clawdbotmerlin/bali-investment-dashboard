"use client";

import { useState } from "react";
import type { Project, CalcResult } from "@/lib/types";
import { calc } from "@/lib/calc";
import Ringkasan from "./tabs/Ringkasan";
import SimulasiJual from "./tabs/SimulasiJual";
import SimulasiSewa from "./tabs/SimulasiSewa";
import HoldJual from "./tabs/HoldJual";
import Bandingkan from "./tabs/Bandingkan";

const TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "jual", label: "Simulasi Jual" },
  { id: "sewa", label: "Simulasi Sewa" },
  { id: "hold", label: "Hold & Jual" },
  { id: "bandingkan", label: "Bandingkan" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface TabPanelProps {
  activeProject: Project;
  allProjects: Project[];
}

export default function TabPanel({ activeProject, allProjects }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("ringkasan");
  const c: CalcResult = calc(activeProject.data);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--border)",
        background: "var(--surface)", padding: "0 20px", gap: 2,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "var(--primary)" : "var(--text3)",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "ringkasan" && <Ringkasan s={activeProject.data} c={c} />}
        {activeTab === "jual" && <SimulasiJual s={activeProject.data} c={c} />}
        {activeTab === "sewa" && <SimulasiSewa s={activeProject.data} c={c} />}
        {activeTab === "hold" && <HoldJual s={activeProject.data} c={c} />}
        {activeTab === "bandingkan" && <Bandingkan projects={allProjects} activeId={activeProject.id} />}
      </div>
    </div>
  );
}
