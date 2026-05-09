"use client";

import { useState } from "react";
import type { Project, CalcResult, SessionData } from "@/lib/types";
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
  { id: "bandingkan", label: "Bandingkan Sesi" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface TabPanelProps {
  activeProject: Project;
  allProjects: Project[];
  onChange: (data: SessionData) => void;
}

export default function TabPanel({ activeProject, allProjects, onChange }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("ringkasan");
  const c: CalcResult = calc(activeProject.data);

  return (
    <div className="panel-right">
      <div className="right-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`rtab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="right-content" style={{ flex: 1 }}>
        {activeTab === "ringkasan" && <Ringkasan s={activeProject.data} c={c} />}
        {activeTab === "jual" && <SimulasiJual s={activeProject.data} c={c} onChange={onChange} />}
        {activeTab === "sewa" && <SimulasiSewa s={activeProject.data} c={c} />}
        {activeTab === "hold" && <HoldJual s={activeProject.data} c={c} onChange={onChange} />}
        {activeTab === "bandingkan" && <Bandingkan projects={allProjects} activeId={activeProject.id} />}
      </div>
    </div>
  );
}
