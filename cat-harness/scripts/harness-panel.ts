/**
 * The data the Harnesses config panel draws (issue #1146).
 *
 * Owner, 2026-09-23: *"should add to cat-harness harness visualize a config
 * panel/popup which shows properties of cat-harness and other instances. add
 * in to render appropraite edit skills as well."* The design is the owner's
 * pick from the WireGen review in `docs/wireframes/harness-config/`: a glass
 * panel grouped as **Instantiated here**, **In this checkout** and
 * **Associated ↗ remote**, a property table per harness, the skills that edit
 * each property, and ✎ to the declaration.
 *
 * It rides `docs/_data/harness.json` as `config`, for the reason that file
 * gives: one generated file, one staleness gate (`docs:harness:check`).
 *
 * ## Associated is never local
 *
 * An `associatedHarnesses` entry naming a harness in THIS checkout is a
 * finding, and `associated-harness-config.test.ts` fails on one in the real
 * tree. The schema refuses the `needs` overlap; this is the half the schema
 * cannot see, because it parses one declaration at a time.
 *
 * @module scripts/harness-panel
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { findDeclarationFile, sourceLinks, type CatHarnessDeclaration } from "../schemas/cat-harness.js";
import { PROPERTY_SKILLS, type DeclarationProperty } from "../schemas/property-skills.js";

export interface PanelSkill {
  name: string;
  /** Site-root-relative page, or absent when no page is published for it. */
  path?: string;
}

export interface PanelProperty {
  key: DeclarationProperty;
  skills: PanelSkill[];
  /** Why no skill edits this yet. Shown as a finding, never as a blank. */
  gap?: string;
}

export interface PanelHarness {
  name: string;
  title: string;
  group: "instantiated" | "checkout";
  /** Repository-relative path to the declaration file. */
  declaredIn: string;
  viewHref?: string;
  editHref?: string;
  /** The keys this harness declares, each with a one-line summary of its value. */
  declared: { key: DeclarationProperty; summary: string }[];
}

export interface PanelAssociated {
  name: string;
  title: string;
  url: string;
  repository?: string;
  /** ✎ goes to the associated harness's OWN repository, never this checkout's. */
  editHref?: string;
  relation?: string;
  note?: string;
  /** The local harnesses that declare it. */
  declaredBy: string[];
}

export interface HarnessPanel {
  properties: PanelProperty[];
  harnesses: PanelHarness[];
  associated: PanelAssociated[];
  findings: string[];
}

/** One line a reader can scan: the value itself when short, else what it is. */
export function summarise(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 90 ? `${v.slice(0, 89)}…` : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[] (none)";
    if (v.every((x) => typeof x === "string")) return summarise((v as string[]).join(", "));
    const names = v.map((x) => (x && typeof x === "object" ? ((x as Record<string, unknown>).name ?? (x as Record<string, unknown>).id) : undefined));
    return names.every((n) => typeof n === "string")
      ? `${v.length}: ${summarise((names as string[]).join(", "))}`
      : `${v.length} entr${v.length === 1 ? "y" : "ies"}`;
  }
  if (typeof v === "object") return `{ ${Object.keys(v as object).join(", ")} }`;
  return String(v);
}

/**
 * Build the panel.
 *
 * `skillPage(name)` answers whether a skill's page is published; the caller
 * reads the site, so this stays testable against a fixture.
 */
export function harnessPanel(
  entries: readonly { dir: string; decl: CatHarnessDeclaration; instantiated: boolean }[],
  repoRoot: string,
  repoUrl: string | undefined,
  branch: string,
  skillPage: (name: string) => string | undefined,
): HarnessPanel {
  const findings: string[] = [];
  const properties: PanelProperty[] = (Object.keys(PROPERTY_SKILLS) as DeclarationProperty[]).map((key) => {
    const row = PROPERTY_SKILLS[key] as { skills: readonly string[]; gap?: string };
    if (row.gap) findings.push(`\`${key}\`: ${row.gap}`);
    return {
      key,
      skills: row.skills.map((name) => {
        const path = skillPage(name);
        return path ? { name, path } : { name };
      }),
      ...(row.gap ? { gap: row.gap } : {}),
    };
  });

  const local = new Set(entries.map((e) => e.decl.name));
  const harnesses: PanelHarness[] = entries.map(({ dir, decl, instantiated }) => {
    const file = findDeclarationFile(dir);
    const declaredIn = relative(repoRoot, join(dir, file ?? "")).split("\\").join("/");
    const raw = decl as unknown as Record<string, unknown>;
    // A key the declaration carries and the schema DROPS (the declaration is a
    // plain z.object) is invisible to every consumer, so it is a finding here.
    if (file) {
      const onDisk = JSON.parse(readFileSync(join(dir, file), "utf-8")) as Record<string, unknown>;
      for (const k of Object.keys(onDisk)) {
        if (k.startsWith("_") || k.startsWith("@") || k in PROPERTY_SKILLS) continue;
        findings.push(`${decl.name}: declares \`${k}\`, which the declaration schema does not have and silently drops.`);
      }
    }
    return {
      name: decl.name,
      title: decl.title ?? decl.name,
      group: instantiated ? "instantiated" : "checkout",
      declaredIn,
      ...(sourceLinks(repoUrl, declaredIn, branch) ?? {}),
      declared: (Object.keys(PROPERTY_SKILLS) as DeclarationProperty[])
        .filter((k) => raw[k] !== undefined && !(Array.isArray(raw[k]) && (raw[k] as unknown[]).length === 0 && k !== "navbarIcons"))
        .map((key) => ({ key, summary: summarise(raw[key]) })),
    };
  });

  const byName = new Map<string, PanelAssociated>();
  for (const { decl } of entries) {
    for (const a of decl.associatedHarnesses ?? []) {
      if (local.has(a.name)) {
        findings.push(
          `${decl.name}: associates \`${a.name}\`, which is a harness in this checkout. Local is not associated: use \`needs\`, or drop the entry.`,
        );
        continue;
      }
      const prev = byName.get(a.name);
      if (prev) {
        prev.declaredBy.push(decl.name);
        continue;
      }
      byName.set(a.name, {
        name: a.name,
        title: a.title ?? a.name,
        url: a.url,
        ...(a.repository ? { repository: a.repository } : {}),
        ...(a.repository ? { editHref: a.repository } : {}),
        ...(a.relation ? { relation: a.relation } : {}),
        ...(a.note ? { note: a.note } : {}),
        declaredBy: [decl.name],
      });
    }
  }
  const associated = [...byName.values()].sort((x, y) => x.name.localeCompare(y.name));
  return { properties, harnesses, associated, findings };
}

/** The published page of a skill, when `reference/skill-instructions/<name>.md` exists in the site. */
export function skillPageIn(siteDir: string): (name: string) => string | undefined {
  return (name) =>
    existsSync(join(siteDir, "reference/skill-instructions", `${name}.md`))
      ? `/reference/skill-instructions/${name}.html`
      : undefined;
}
