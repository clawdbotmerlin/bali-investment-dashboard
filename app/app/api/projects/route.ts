import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/db";
import { defaultSession } from "@/lib/calc";
import type { SessionData } from "@/lib/types";

export async function GET() {
  try {
    const projects = listProjects();
    return NextResponse.json(projects);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { name?: string; data?: SessionData };
    const name = (body.name || "Proyek Baru").trim();
    const data = body.data ?? defaultSession();
    const project = createProject(name, data);
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
