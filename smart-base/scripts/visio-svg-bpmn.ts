#!/usr/bin/env bun
/**
 * visio-svg-bpmn.ts: a DAK's business-process figures, exported from Visio as
 * SVG, turned back into BPMN 2.0 with lanes and diagram interchange.
 *
 * Bean `folio-assistant-96y4`: an immunization DAK carried its nine processes
 * only as Visio SVG images, so nothing could reference a BPMN task or lane.
 * The figures are the authored source, and a Visio export keeps enough of the
 * drawing to recover the process:
 *
 * - every node is a top-level group on the page whose `<title>` is the Visio
 *   master's name (`Task`, `Process`, `Gateway`, `Decision`, `Start Event`,
 *   `End Event`, `Intermediate Event`, `Collapsed Sub-Process`);
 * - every flow is a `Dynamic connector` / `Sequence Flow` shape, labelled by
 *   its text (`Yes`, `No`);
 * - every lane is a `Swimlane` / `Pool / Lane` group, titled by its heading;
 * - the cross-functional container's heading is the process title
 *   (`C. Client registration`).
 *
 * What the export does NOT keep is which shape a connector is glued to. That is
 * recovered from geometry: each end of a connector's path is matched to the
 * node whose outline it touches. An end that touches no node within
 * `SNAP` points is reported, never guessed, and `--check` fails on it.
 *
 * Lanes are named by their heading. With `--map <swimlanes.json>` (the
 * declaration `dak-swimlanes.ts` reads, bean `cydz`), a lane that resolves to
 * personas carries them in its documentation, so the BPMN and the personas
 * page agree on who a lane is; a system lane carries the declared reason it is
 * not a persona. With `--page`, each process carries the objective the
 * business-processes page states for it. A lane or process left without
 * documentation is reported, as `check:lane-documentation` and
 * `check:process-documentation` would.
 *
 *   bun run smart-base/scripts/visio-svg-bpmn.ts --prefix IMMZ --out <dir> [--map swimlanes.json] [--page business-processes.md] [--check] <figure.svg>...
 *
 * Writes `<dir>/<prefix>.<letter>.bpmn` per figure. `--check` exits 1 when a
 * file would change or a connector end is unmatched.
 *
 * @module smart-base/scripts/visio-svg-bpmn
 * @covers processes
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";

import { DOMParser } from "@xmldom/xmldom";

import { kramdownId, processesFrom, resolveLane, type SwimlaneMap } from "./dak-swimlanes.ts";

const SVG_NS = "http://www.w3.org/2000/svg";
const V_NS = "http://schemas.microsoft.com/visio/2003/SVGExtensions/";
/** How far (in SVG user units, points) a connector end may sit from a node's outline. */
export const SNAP = 12;

// ── geometry ──────────────────────────────────────────────────────────────

/** An affine transform [a b c d e f], as SVG's matrix(). */
export type M = [number, number, number, number, number, number];
const I: M = [1, 0, 0, 1, 0, 0];
const mul = (p: M, q: M): M => [
  p[0] * q[0] + p[2] * q[1], p[1] * q[0] + p[3] * q[1],
  p[0] * q[2] + p[2] * q[3], p[1] * q[2] + p[3] * q[3],
  p[0] * q[4] + p[2] * q[5] + p[4], p[1] * q[4] + p[3] * q[5] + p[5],
];
const apply = (m: M, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

export function parseTransform(t: string | null): M {
  let m = I;
  if (!t) return m;
  for (const [, fn, args] of t.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = args!.split(/[\s,]+/).filter(Boolean).map(Number);
    let n: M = I;
    if (fn === "translate") n = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0];
    else if (fn === "scale") n = [a[0]!, 0, 0, a[1] ?? a[0]!, 0, 0];
    else if (fn === "matrix") n = a as M;
    else if (fn === "rotate") {
      const r = (a[0]! * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
      const [cx, cy] = [a[1] ?? 0, a[2] ?? 0];
      n = mul(mul([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
    m = mul(m, n);
  }
  return m;
}

/** The on-path points of an SVG path (end points of every segment; control points skipped). */
export function pathPoints(d: string): [number, number][] {
  const out: [number, number][] = [];
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0;
  const num = () => Number(toks[i++]);
  const arity: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i]!)) cmd = toks[i++]!;
    const lc = cmd.toLowerCase(), rel = cmd !== cmd.toUpperCase();
    if (lc === "z") { x = sx; y = sy; out.push([x, y]); if (i < toks.length && !/[a-zA-Z]/.test(toks[i]!)) i++; continue; }
    const n = arity[lc];
    if (n === undefined || i + n > toks.length) break;
    const v = Array.from({ length: n }, num);
    if (lc === "h") x = rel ? x + v[0]! : v[0]!;
    else if (lc === "v") y = rel ? y + v[0]! : v[0]!;
    else { const [ex, ey] = [v[n - 2]!, v[n - 1]!]; x = rel ? x + ex : ex; y = rel ? y + ey : ey; }
    out.push([x, y]);
    if (lc === "m") { sx = x; sy = y; cmd = rel ? "l" : "L"; }
  }
  return out;
}

export interface Box { x: number; y: number; w: number; h: number }
const boxOf = (pts: [number, number][]): Box | undefined => {
  if (!pts.length) return undefined;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};
/**
 * Distance from a point to a box's OUTLINE, from outside or in. A connector
 * ends on a shape's border; measured to the outline, an end inside a box drawn
 * around other shapes is far from that box unless it really meets its border.
 */
const distTo = (b: Box, [px, py]: [number, number]) => {
  const out = Math.hypot(Math.max(b.x - px, 0, px - (b.x + b.w)), Math.max(b.y - py, 0, py - (b.y + b.h)));
  return out > 0 ? out : Math.min(px - b.x, b.x + b.w - px, py - b.y, b.y + b.h - py);
};

// ── reading the figure ────────────────────────────────────────────────────

type El = Element;
const kids = (e: El) => Array.from(e.childNodes).filter((n): n is El => n.nodeType === 1);
const vattr = (e: El, a: string) => e.getAttributeNS(V_NS, a) || e.getAttribute(`v:${a}`);
const title = (e: El) => kids(e).find((k) => k.localName === "title")?.textContent?.trim() ?? "";
/** The Visio master a shape instantiates: `Task.1012.1146` → `Task` (a copied master gets another suffix). */
const master = (e: El) => title(e).replace(/(\.\d+)+$/, "");
/** The shape's own BPMN properties (`BpmnTaskType` → `Business Rule`), from its Visio custom properties. */
const bpmnProps = (e: El): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const cps of kids(e).filter((k) => k.localName === "custProps"))
    for (const cp of kids(cps)) {
      const k = vattr(cp, "nameU"), v = /^VT4\((.*)\)$/s.exec(vattr(cp, "val") ?? "")?.[1];
      if (k?.startsWith("Bpmn") && v !== undefined) out[k] = v;
    }
  return out;
};

/** A group's visible text, with Visio's line breaks as spaces. */
export function textOf(e: El): string {
  let s = "";
  const walk = (n: Node) => {
    if (n.nodeType === 3) s += n.nodeValue;
    else if (n.nodeType === 1) {
      const el = n as El;
      if (el.localName === "newlineChar" || el.localName === "tspan" && el.getAttribute("dy")) s += " ";
      if (el.localName === "title" || el.localName === "desc") return;
      Array.from(el.childNodes).forEach(walk);
    }
  };
  for (const t of Array.from(e.getElementsByTagNameNS(SVG_NS, "text"))) { walk(t); s += " "; }
  return s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").replace(/\s+([?.,])/g, "$1").trim();
}

/** Every geometry point under `e`, in page coordinates. */
function geometry(e: El, m: M): [number, number][] {
  const own = mul(m, parseTransform(e.getAttribute("transform")));
  const n = (a: string) => Number(e.getAttribute(a) ?? 0);
  const pts: [number, number][] = [];
  switch (e.localName) {
    case "rect": for (const [x, y] of [[n("x"), n("y")], [n("x") + n("width"), n("y")], [n("x"), n("y") + n("height")], [n("x") + n("width"), n("y") + n("height")]]) pts.push(apply(own, x!, y!)); break;
    case "circle": case "ellipse": {
      const rx = n("rx") || n("r"), ry = n("ry") || n("r");
      for (const [x, y] of [[-rx, -ry], [rx, -ry], [-rx, ry], [rx, ry]]) pts.push(apply(own, n("cx") + x!, n("cy") + y!));
      break;
    }
    case "path": for (const [x, y] of pathPoints(e.getAttribute("d") ?? "")) pts.push(apply(own, x, y)); break;
  }
  if (e.localName === "text" || e.localName === "title" || e.localName === "desc") return pts;
  for (const k of kids(e)) pts.push(...geometry(k, own));
  return pts;
}

export type Kind = "task" | "businessRuleTask" | "exclusiveGateway" | "startEvent" | "endEvent" | "intermediateThrowEvent" | "subProcess";
const KINDS: Record<string, Kind> = {
  Task: "task", Process: "task", Gateway: "exclusiveGateway", Decision: "exclusiveGateway",
  "Start Event": "startEvent", "End Event": "endEvent", "Intermediate Event": "intermediateThrowEvent",
  "Collapsed Sub-Process": "subProcess",
};
const CONNECTORS = new Set(["Dynamic connector", "Sequence Flow"]);
const LANES = new Set(["Swimlane", "Pool / Lane"]);

export interface FlowNode { vid: string; kind: Kind; label: string; box: Box; parent?: string; expanded?: boolean; loop?: boolean; link?: boolean }
export interface Flow { vid: string; label: string; points: [number, number][]; from?: string; to?: string }
export interface Lane { label: string; box: Box }
export interface Group { label: string; box: Box }
export interface Figure { title: string; nodes: FlowNode[]; flows: Flow[]; lanes: Lane[]; groups: Group[] }

export function readFigure(svg: string): Figure {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement as unknown as El;
  const page = Array.from(root.getElementsByTagNameNS(SVG_NS, "g")).find((g) => vattr(g, "groupContext") === "foregroundPage");
  if (!page) throw new Error("no Visio foreground page in this SVG");
  // The page's own transform and every ancestor's.
  let pm = I;
  for (let a: Node | null = page as unknown as Node; a && a.nodeType === 1; a = a.parentNode) pm = mul(parseTransform((a as unknown as El).getAttribute("transform")), pm);
  const fig: Figure = { title: "", nodes: [], flows: [], lanes: [], groups: [] };
  const visit = (g: El, m: M) => {
    const name = master(g);
    if (name === "CFF Container" || name === "Swimlane List" || name === "Phase List") {
      const own = mul(m, parseTransform(g.getAttribute("transform")));
      if (name === "CFF Container" && !fig.title) {
        const head = kids(g).find((k) => /Heading|Title/.test(title(k)) || textOf(k));
        fig.title = head ? textOf(head) : "";
        if (!fig.title) fig.title = Array.from(g.getElementsByTagNameNS(SVG_NS, "desc")).map((d) => d.textContent?.trim() ?? "").find(Boolean) ?? "";
      }
      for (const k of kids(g)) if (k.localName === "g") visit(k, own);
      return;
    }
    if (LANES.has(name)) {
      const box = boxOf(geometry(g, m));
      if (box) fig.lanes.push({ label: textOf(g), box });
      return;
    }
    if (CONNECTORS.has(name)) {
      const own = mul(m, parseTransform(g.getAttribute("transform")));
      const path = Array.from(g.getElementsByTagNameNS(SVG_NS, "path"))[0];
      const pts = pathPoints(path?.getAttribute("d") ?? "").map(([x, y]) => apply(own, x, y));
      if (pts.length >= 2) fig.flows.push({ vid: vattr(g, "mID") ?? "", label: textOf(g), points: pts });
      return;
    }
    let kind = KINDS[name];
    const box = kind && boxOf(geometry(g, m));
    if (!kind || !box) return;
    // The Visio BPMN stencil records the BPMN type on the shape itself.
    const p = bpmnProps(g);
    if (kind === "task" && p.BpmnTaskType === "Business Rule") kind = "businessRuleTask";
    const node: FlowNode = { vid: vattr(g, "mID") ?? "", kind, label: textOf(g), box };
    if (p.BpmnLoopType === "Standard") node.loop = true;
    if (p.BpmnTriggerOrResult === "Link") node.link = true;
    fig.nodes.push(node);
  };
  for (const g of kids(page as unknown as El)) if (g.localName === "g") visit(g, pm);
  // Each end of a connector belongs to the node whose outline it is nearest;
  // between equally near ones, the smallest.
  const match = () => {
    for (const f of fig.flows) {
      const near = (p: [number, number]) =>
        fig.nodes
          .map((n) => ({ n, d: Math.round(distTo(n.box, p)) }))
          .filter((x) => x.d <= SNAP)
          .sort((x, y) => x.d - y.d || x.n.box.w * x.n.box.h - y.n.box.w * y.n.box.h)[0]?.n.vid;
      f.from = near(f.points[0]!);
      f.to = near(f.points[f.points.length - 1]!);
    }
  };
  match();
  // A task drawn around other nodes is one of two things, and the flows say which.
  // - Flows cross its border to what it holds (`2. Query client record`:
  //   1 → 2.1 in, 2.3 → 3 out): it is a GROUP, a box around steps of this
  //   process. It becomes a BPMN group; what it holds stays in the process.
  // - Flows meet only its border, and what it holds is a flow of its own
  //   (`5. Validate client details`: 3 → 5 → 6 outside, start → 5.1 … inside):
  //   it is an expanded SUB-PROCESS, and what it holds is nested in it.
  const inside = (o: Box, i: Box) => i.x >= o.x && i.y >= o.y && i.x + i.w <= o.x + o.w && i.y + i.h <= o.y + o.h;
  const area = (b: Box) => b.w * b.h;
  const holders = fig.nodes.filter((o) => fig.nodes.some((n) => n !== o && area(o.box) > area(n.box) && inside(o.box, n.box)));
  holders.sort((a, b) => area(a.box) - area(b.box));
  const grouped = new Set<FlowNode>();
  for (const h of holders) {
    const held = new Set(fig.nodes.filter((n) => n !== h && !grouped.has(n) && area(h.box) > area(n.box) && inside(h.box, n.box)).map((n) => n.vid));
    const crosses = fig.flows.some((f) => f.from && f.to && held.has(f.from) !== held.has(f.to) && f.from !== h.vid && f.to !== h.vid);
    if (crosses) { grouped.add(h); fig.groups.push({ label: h.label, box: h.box }); continue; }
    h.kind = "subProcess";
    h.expanded = true;
    for (const n of fig.nodes) if (held.has(n.vid) && !n.parent) n.parent = h.vid;
  }
  if (grouped.size) { fig.nodes = fig.nodes.filter((n) => !grouped.has(n)); match(); }
  return fig;
}

/**
 * Each process's objective, keyed by its figure's file name, from the IG's
 * business-processes page: the `Objective:` line under an enumerated heading
 * (`####  C.  Client registration`), whose figure `dak-swimlanes.ts` finds.
 */
export function objectivesFrom(md: string): Map<string, string> {
  const out = new Map<string, string>();
  const lines = md.split("\n");
  for (const p of processesFrom(md)) {
    if (!p.figure) continue;
    const at = lines.findIndex((l) => /^#{2,6}\s/.test(l) && kramdownId(l.replace(/^#+/, "").trim()) === p.anchor);
    for (let j = at + 1; at >= 0 && j < lines.length && !/^#{1,6}\s/.test(lines[j]!); j++) {
      const o = /^\s*Objective:\s*(.+?)\s*$/i.exec(lines[j]!);
      if (o) { out.set(basename(p.figure), o[1]!); break; }
    }
  }
  return out;
}

// ── writing BPMN ──────────────────────────────────────────────────────────

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r1 = (n: number) => Math.round(n * 10) / 10;

/** A persona or lane as a FHIR computable name: `Health worker (HW)` → `HealthWorker`, `EPI Manager` → `EPIManager`. */
export const pascal = (s: string) =>
  s.replace(/\([^)]*\)/g, " ").split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join("");

/** `2.3. Possible match found?` → `2.3`; nothing when the label is not numbered. */
const stepNo = (label: string) => /^(\d+(?:\.\d+)*)\.?\s/.exec(label)?.[1];

export function toBpmn(fig: Figure, prefix: string, letter: string, map?: SwimlaneMap, objective?: string): { xml: string; problems: string[] } {
  const pid = `${prefix}.${letter}`;
  const problems: string[] = [];
  const ids = new Map<string, string>();
  const used = new Set<string>();
  const mint = (base: string) => { let id = base, i = 2; while (used.has(id)) id = `${base}_${i++}`; used.add(id); return id; };
  const KIND_ID: Record<Kind, string> = { task: "Task", businessRuleTask: "Task", exclusiveGateway: "Gateway", startEvent: "Start", endEvent: "End", intermediateThrowEvent: "Event", subProcess: "SubProcess" };
  // Number the un-numbered nodes in reading order so ids are stable across runs.
  const order = [...fig.nodes].sort((a, b) => a.box.x - b.box.x || a.box.y - b.box.y);
  for (const n of order) {
    const no = stepNo(n.label);
    ids.set(n.vid, mint(no ? `${pid}.${no}` : `${pid}.${KIND_ID[n.kind]}`));
  }
  for (const f of fig.flows) {
    if (!f.from) problems.push(`connector ${f.vid} (${f.label || "unlabelled"}): its start touches no node`);
    if (!f.to) problems.push(`connector ${f.vid} (${f.label || "unlabelled"}): its end touches no node`);
  }
  const ok = fig.flows.filter((f) => f.from && f.to);
  const flowId = new Map(ok.map((f, i) => [f, `${pid}.Flow${i + 1}`]));
  const laneOf = (n: FlowNode) => {
    const cx = n.box.x + n.box.w / 2, cy = n.box.y + n.box.h / 2;
    return fig.lanes.findIndex((l) => cx >= l.box.x && cx <= l.box.x + l.box.w && cy >= l.box.y && cy <= l.box.y + l.box.h);
  };
  // A lane holds every node drawn in it, a sub-process's children included:
  // each activity answers to someone.
  const top = fig.nodes;
  // A lane's id names who it is, the same in every process of the DAK, so the
  // health worker's lane is one actor across A–I (smart-base's
  // bpmn2fhirfsh.xsl makes one actor per distinct lane id).
  const lanes = fig.lanes.map((l, i) => {
    const personas = map ? resolveLane(l.label, map).personas : [];
    const slug = personas.length ? personas.map(pascal).join("Or") : pascal(l.label);
    return { ...l, personas, id: mint(`${prefix}.Lane.${slug || i + 1}`), members: top.filter((n) => laneOf(n) === i) };
  });
  for (const n of top) if (laneOf(n) < 0) problems.push(`node ${ids.get(n.vid)} (${n.label || n.kind}) lies in no lane`);
  const scopeOf = (vid: string) => fig.nodes.find((n) => n.vid === vid)?.parent;
  for (const f of ok) if (scopeOf(f.from!) !== scopeOf(f.to!)) problems.push(`flow ${flowId.get(f)} (${ids.get(f.from!)} → ${ids.get(f.to!)}) crosses a sub-process boundary`);
  const groups = fig.groups.map((g) => ({ ...g, id: mint(`${pid}.${stepNo(g.label) ?? "Group"}`) }));

  const out: string[] = [];
  out.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  out.push(`<!-- Generated by smart-base/scripts/visio-svg-bpmn.ts from the Visio figure of this process. Do not edit; change the figure and regenerate. -->`);
  out.push(`<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${pid}.Definitions" targetNamespace="http://smart.who.int/bpmn">`);
  out.push(`  <bpmn:collaboration id="${pid}.Collaboration">`);
  out.push(`    <bpmn:participant id="${pid}.Participant" name="${xml(fig.title)}" processRef="${pid}" />`);
  out.push(`  </bpmn:collaboration>`);
  out.push(`  <bpmn:process id="${pid}" name="${xml(fig.title)}" isExecutable="false">`);
  if (objective) out.push(`    <bpmn:documentation>${xml(objective)}</bpmn:documentation>`);
  else problems.push(`process ${pid} has no objective: pass the page that states it (--page)`);
  out.push(`    <bpmn:laneSet id="${pid}.LaneSet">`);
  for (const l of lanes) {
    out.push(`      <bpmn:lane id="${l.id}" name="${xml(l.label)}">`);
    if (map) {
      const who = l.personas.map((p) => `${p} (${prefix}.Persona.${pascal(p)})`);
      const system = Object.entries(map.notPersonas).find(([w]) => w.toLowerCase() === l.label.toLowerCase());
      if (who.length) out.push(`        <bpmn:documentation>Personas: ${xml(who.join("; "))}</bpmn:documentation>`);
      else if (system) out.push(`        <bpmn:documentation>${xml(`${system[0]}: ${system[1]}`)}</bpmn:documentation>`);
      else problems.push(`lane ${l.id} (${l.label}) names no persona and no declared non-persona`);
    } else problems.push(`lane ${l.id} (${l.label}) has no documentation: pass the persona declaration (--map)`);
    for (const n of l.members) out.push(`        <bpmn:flowNodeRef>${ids.get(n.vid)}</bpmn:flowNodeRef>`);
    out.push(`      </bpmn:lane>`);
  }
  out.push(`    </bpmn:laneSet>`);
  const scope = (parent: string | undefined, pad: string) => {
    for (const n of order.filter((m) => m.parent === parent)) {
      const id = ids.get(n.vid)!;
      const inc = ok.filter((f) => f.to === n.vid).map((f) => `${pad}  <bpmn:incoming>${flowId.get(f)}</bpmn:incoming>`);
      const outg = ok.filter((f) => f.from === n.vid).map((f) => `${pad}  <bpmn:outgoing>${flowId.get(f)}</bpmn:outgoing>`);
      const name = n.label ? ` name="${xml(n.label)}"` : "";
      const at = out.length;
      out.push(`${pad}<bpmn:${n.kind} id="${id}"${name}>`, ...inc, ...outg);
      if (n.loop) out.push(`${pad}  <bpmn:standardLoopCharacteristics />`);
      // A link is the figure's off-page connector to another process (`D. Administer vaccine`).
      // BPMN allows a link definition on intermediate events only; a linked start or end keeps its label.
      if (n.link && n.kind === "intermediateThrowEvent") out.push(`${pad}  <bpmn:linkEventDefinition id="${id}.Link" name="${xml(n.label)}" />`);
      if (n.expanded) scope(n.vid, `${pad}  `);
      if (out.length === at + 1) out[at] = out[at]!.replace(/>$/, " />");
      else out.push(`${pad}</bpmn:${n.kind}>`);
    }
    for (const f of ok.filter((g) => scopeOf(g.from!) === parent && scopeOf(g.to!) === parent)) {
      const name = f.label ? ` name="${xml(f.label)}"` : "";
      out.push(`${pad}<bpmn:sequenceFlow id="${flowId.get(f)}"${name} sourceRef="${ids.get(f.from!)}" targetRef="${ids.get(f.to!)}" />`);
    }
  };
  scope(undefined, "    ");
  for (const g of groups) out.push(`    <bpmn:group id="${g.id}" categoryValueRef="${g.id}.Value" />`);
  out.push(`  </bpmn:process>`);
  if (groups.length) {
    out.push(`  <bpmn:category id="${pid}.Category">`);
    for (const g of groups) out.push(`    <bpmn:categoryValue id="${g.id}.Value" value="${xml(g.label)}" />`);
    out.push(`  </bpmn:category>`);
  }
  out.push(`  <bpmndi:BPMNDiagram id="${pid}.Diagram">`);
  out.push(`    <bpmndi:BPMNPlane id="${pid}.Plane" bpmnElement="${pid}.Collaboration">`);
  const all = [...fig.lanes.map((l) => l.box), ...fig.nodes.map((n) => n.box), ...fig.groups.map((g) => g.box)];
  const px = Math.min(...all.map((b) => b.x)), py = Math.min(...all.map((b) => b.y));
  const pw = Math.max(...all.map((b) => b.x + b.w)) - px, ph = Math.max(...all.map((b) => b.y + b.h)) - py;
  const bounds = (b: Box) => `<dc:Bounds x="${r1(b.x)}" y="${r1(b.y)}" width="${r1(b.w)}" height="${r1(b.h)}" />`;
  // The pool's name gets its own band, left of the lanes' headings.
  out.push(`      <bpmndi:BPMNShape id="${pid}.Participant_di" bpmnElement="${pid}.Participant" isHorizontal="true">${bounds({ x: px - 30, y: py, w: pw + 30, h: ph })}</bpmndi:BPMNShape>`);
  for (const l of lanes) out.push(`      <bpmndi:BPMNShape id="${l.id}_di" bpmnElement="${l.id}" isHorizontal="true">${bounds(l.box)}</bpmndi:BPMNShape>`);
  for (const n of order) {
    const id = ids.get(n.vid)!;
    const extra = n.kind === "exclusiveGateway" ? ` isMarkerVisible="true"` : n.kind === "subProcess" ? ` isExpanded="${n.expanded ? "true" : "false"}"` : "";
    out.push(`      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}"${extra}>${bounds(n.box)}</bpmndi:BPMNShape>`);
  }
  for (const g of groups) out.push(`      <bpmndi:BPMNShape id="${g.id}_di" bpmnElement="${g.id}">${bounds(g.box)}</bpmndi:BPMNShape>`);
  for (const f of ok) {
    const id = flowId.get(f)!;
    out.push(`      <bpmndi:BPMNEdge id="${id}_di" bpmnElement="${id}">`);
    for (const [x, y] of f.points) out.push(`        <di:waypoint x="${r1(x)}" y="${r1(y)}" />`);
    out.push(`      </bpmndi:BPMNEdge>`);
  }
  out.push(`    </bpmndi:BPMNPlane>`);
  out.push(`  </bpmndi:BPMNDiagram>`);
  out.push(`</bpmn:definitions>`);
  return { xml: out.join("\n") + "\n", problems };
}

// ── CLI ───────────────────────────────────────────────────────────────────

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const opt = (k: string) => { const i = argv.indexOf(k); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const check = argv.includes("--check");
  if (check) argv.splice(argv.indexOf("--check"), 1);
  const prefix = opt("--prefix"), outDir = opt("--out"), mapPath = opt("--map"), pagePath = opt("--page");
  if (!prefix || !outDir || !argv.length) {
    console.error("usage: visio-svg-bpmn.ts --prefix <DAK prefix> --out <dir> [--map swimlanes.json] [--page business-processes.md] [--check] <figure.svg>...");
    process.exit(2);
  }
  const map = mapPath ? (JSON.parse(readFileSync(mapPath, "utf8")) as SwimlaneMap) : undefined;
  const objectives = pagePath ? objectivesFrom(readFileSync(pagePath, "utf8")) : new Map<string, string>();
  let bad = 0;
  if (!check) mkdirSync(outDir, { recursive: true });
  for (const svgPath of argv) {
    const fig = readFigure(readFileSync(svgPath, "utf8"));
    const letter = /^([A-Z0-9]{1,3})\s*\./.exec(fig.title)?.[1] ?? /-([a-z0-9])-/i.exec(basename(svgPath))?.[1]?.toUpperCase();
    if (!letter) { console.error(`✗ ${svgPath}: cannot tell the process letter from "${fig.title}"`); bad++; continue; }
    const { xml: text, problems } = toBpmn(fig, prefix, letter, map, objectives.get(basename(svgPath)));
    const target = join(outDir, `${prefix}.${letter}.bpmn`);
    for (const p of problems) console.error(`✗ ${basename(svgPath)}: ${p}`);
    bad += problems.length;
    const flows = fig.flows.filter((f) => f.from && f.to).length;
    const summary = `${prefix}.${letter} "${fig.title}": ${fig.nodes.length} nodes, ${flows}/${fig.flows.length} flows, ${fig.lanes.length} lanes`;
    if (check) {
      if (!existsSync(target) || readFileSync(target, "utf8") !== text) { console.error(`✗ stale: ${target}`); bad++; }
      else console.log(`✓ ${summary}`);
    } else { writeFileSync(target, text); console.log(`wrote ${target}: ${summary}`); }
  }
  process.exit(bad ? 1 : 0);
}
