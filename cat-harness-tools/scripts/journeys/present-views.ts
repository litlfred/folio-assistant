/**
 * The presentation frame's other views: the journey map, the persona lens,
 * how it works, the discussion, the table sheets and the device demo — the
 * tabs of the VaxLink walkthrough after its overview and walkthrough
 * (`present.ts`), each a page of its own in the same frame.
 *
 * @module scripts/journeys/present-views
 * @covers user-scenario, workshop, building-blocks
 *
 * ## Routes, under the workshop's own `<instance>/workshops/<id>/`
 *
 * | path | view |
 * |---|---|
 * | `map/` | everyone, every step: a column per step, a lane per person, the record, pain points and enablers, and the technical layer; **Focus on** a person dims the rest, two toggles hide the pain points and the technical layer, a click on a column inspects that moment |
 * | `personas/`, `personas/<actor>/` | one person end to end: goal, needs, frustrations, how they feel along the way, their touchpoints (`personas/` is the first of the cast) |
 * | `how/`, `how/<block>/` | the catalogue's big ideas, the building blocks × moments grid by layer, a block's detail with the moments it makes possible, the ArchiMate views of the taught journeys, the business processes |
 * | `discuss/` | the closing questions with the moments to revisit, the questions module by module, the tables with the moments that force each row, the gap list the walkthrough's gap strips assembled, every moment's policy takeaway |
 * | `sheets/` | the printable sheets, in the frame |
 * | `demo/`, `demo/<screen>/` | the Device Demo: a screen per page with the moments it shows, both ways. The `device-screen` nodes that show a step the workshop presents, each drawn in its device frame with its owner beside it (`screens.ts`); only when there are none, the layer's own app framed, as the workshop's `presentation.deviceDemo` names it |
 *
 * VaxLink's own addresses (`#/map`, `#/personas/khamla`, `#/how/gdhcn`,
 * `#/discuss`, `#/sheets`, `#/demo/S4`) open these from the overview
 * (`present.js`).
 *
 * Everything is read from the graph; a view whose data a layer does not
 * carry (no catalogue, no ArchiMate view, no device demo, no sheets) draws
 * what it has and says what it lacks, never a hard-coded stand-in.
 */
import type { BuildingBlock } from "../../schemas/process/user-scenario.ts";
import { escHtml } from "../thin-page.ts";
import { journeyById, lookup, processDrawing, processName, type JourneyCorpus } from "./read.ts";
import { DAK_ATTR } from "./dak-links.ts";
import { moduleSegment, personaOf, sheetsHtml, sourceHref, type PageFile, type PersonaView, type SiteLinks } from "./render.ts";
import { DEVICE_LABEL, renderDevice, type DemoScreen, type ScreenContext } from "./screens.ts";
import {
  avatar,
  chapterScene,
  countryTones,
  demoLabel,
  deviceGlyph,
  emotionBadge,
  examplePage,
  EMOTION,
  mentionedChips,
  ext,
  frame,
  glyph,
  icon,
  LAYER_TONES,
  ladderOf,
  fromSite,
  personaHref,
  personaNameHtml,
  personaText,
  processLinks,
  rungOf,
  sceneStrip,
  screenHref,
  screensFor,
  siteRootFrom,
  trustColor,
  type Presentation,
  type PresentedStep,
  type View,
} from "./present.ts";

const e = escHtml;

/** The segments these views take under a workshop. */
export const VIEW_SEGMENTS = ["map", "personas", "how", "discuss", "demo"] as const;

/** Where a page `depth` levels below the workshop's directory is. */
interface At {
  root: string;
  toWorkshop: string;
  siteRoot: string;
}
const at = (depth: number, links: SiteLinks): At => {
  const root = "../".repeat(3 + depth);
  return { root, toWorkshop: "../".repeat(depth), siteRoot: siteRootFrom(root, links) };
};

const walkHref = (a: At, s: PresentedStep): string => `${a.toWorkshop}walkthrough/${s.key}/`;

/** The presented step a workshop reference names: `scenario#step`, or a bare step id. */
export function stepByRef(corpus: JourneyCorpus, p: Presentation, ref: string): PresentedStep | undefined {
  const [scenario, step] = ref.includes("#") ? ref.split("#") : [undefined, ref];
  const j = scenario ? journeyById(corpus, p.w.instance, scenario) : undefined;
  return p.steps.find((s) => s.step.id === step && (j === undefined || s.journey === j));
}

const stepChip = (a: At, s: PresentedStep | undefined, ref: string, withTitle = false): string =>
  s
    ? `<a class="jp-revisit" href="${e(walkHref(a, s))}" title="${e(s.step.title)}">${icon("play")}<b>${e(s.step.id)}</b>${withTitle ? `<span>${e(s.step.title)}</span>` : ""}</a>`
    : `<span class="jp-revisit jp-unresolved" title="no such step in this walkthrough">${e(ref)}</span>`;

function note(p: Presentation, view: Exclude<View, "overview" | "walkthrough">): { note?: string } {
  const n = p.w.workshop.presentation?.notes?.[view];
  return n ? { note: n } : {};
}

const presentationName = (p: Presentation): string => p.w.workshop.presentation?.name ?? p.w.workshop.title;

/** The building-block catalogue a workshop's steps read: the workshop's layer's, else its first step's, else any. */
function catalogueOf(corpus: JourneyCorpus, p: Presentation) {
  return corpus.blocks.get(p.w.instance) ?? (p.steps[0] ? corpus.blocks.get(p.steps[0].journey.instance) : undefined) ?? [...corpus.blocks.values()][0];
}

/** Each step a block is used in, with the role it plays there. */
export function blockUsage(p: Presentation, block: string): { s: PresentedStep; role: string }[] {
  return p.steps.flatMap((s) => (s.step.uses ?? []).filter((u) => u.block === block).map((u) => ({ s, role: u.role })));
}

// ── the journey map ──────────────────────────────────────────────────────

/** The BPMN drawings the map shows as thumbnails, copied beside it: one file per process. */
function drawingFile(process: string): string {
  return `bpmn/${process.replace(/\.bpmn$/, "").replace(/[^A-Za-z0-9._-]+/g, "-")}.svg`;
}

function mapPage(corpus: JourneyCorpus, p: Presentation, links: SiteLinks): string {
  const a = at(1, links);
  const pr = p.w.workshop.presentation ?? {};
  const steps = p.steps;
  const tones = countryTones(p.chapters.map((c) => c.journey.scenario.country));
  const cell = (s: PresentedStep, inner: string, cls = "") => `<div class="jp-mc${cls ? ` ${cls}` : ""}" data-col="${s.index}">${inner}</div>`;
  const label = (inner: string, cls = "") => `<div class="jp-ml${cls ? ` ${cls}` : ""}">${inner}</div>`;
  const row = (attrs: string, l: string, cells: string) => `<div class="jp-mr"${attrs}>${l}${cells}</div>`;
  const chapters = row(
    ' data-row="chapter"',
    label("Chapter", "jp-ml-dark"),
    p.chapters
      .map((c, i) => {
        const j = c.journey.scenario;
        return `<div class="jp-mchap" style="grid-column:span ${c.steps.length}"><span class="jp-mchap-n">${i + 1}</span>${sceneStrip(chapterScene(c), tones.get(j.country ?? "") ?? "sky", "sm")}<b>${e(c.title)}</b>${j.when ? `<small>${e(j.when)}</small>` : ""}</div>`;
      })
      .join(""),
  );
  const moments = row(
    ' data-row="moment"',
    label("Moment", "jp-ml-mono"),
    steps
      .map((s) =>
        cell(
          s,
          `<a class="jp-mmoment" href="${e(walkHref(a, s))}" data-jp-col="${s.index}"><span class="jp-mrow"><span class="jp-mono jp-mcode">${e(s.step.id)}</span>${s.step.when ? `<small>${e(s.step.when)}</small>` : ""}</span><b>${e(s.step.title)}</b>${s.step.where ? `<small>${e(s.step.where)}</small>` : ""}${s.step.touchpoint ? `<small class="jp-mtouch">${icon("phone")}${e(s.step.touchpoint)}</small>` : ""}</a>`,
          "jp-mc-moment",
        ),
      )
      .join(""),
  );
  const lanes = p.cast
    .map((x) =>
      row(
        ` data-row="lane" data-actor="${e(x.id)}" style="--c:${e(x.color)}"`,
        label(`${avatar(x)}<span><b>${e(x.name)}</b>${x.role ? `<small>${e(x.role)}</small>` : ""}</span>`, "jp-ml-person"),
        steps
          .map((s) => {
            const ex = s.step.experiences.find((y) => y.actor === x.id);
            if (!ex) return cell(s, "", "jp-mc-empty");
            const lead = s.step.lead === x.id;
            return cell(s, `<div class="jp-mcard${lead ? " is-lead" : ""}"><div class="jp-mcard-h">${emotionBadge(ex.emotion)}${mentionedChips(ex.doing, p.cast, x.id)}${lead ? '<span class="jp-lead">Lead</span>' : ""}</div><p>${personaText(ex.doing, p.cast)}</p>${ex.feeling ? `<p class="jp-feel">${e(ex.feeling)}</p>` : ""}</div>`);
          })
          .join(""),
      ),
    )
    .join("");
  const subject = pr.recordOf ? (p.cast.find((x) => x.id === pr.recordOf)?.name ?? undefined) : undefined;
  const hasRecord = steps.some((s) => s.step.record);
  const record = hasRecord
    ? row(
        ' data-row="record"',
        label(`${icon("package", "jp-emerald")}<span><b>${e(subject ? `${subject}’s record` : "The record")}</b><small>How far it can be trusted</small></span>`, "jp-ml-icon"),
        steps
          .map((s) => {
            const r = s.step.record;
            if (!r) return cell(s, "");
            const ladder = ladderOf(corpus, s.journey);
            const lv = rungOf(ladder, s.step);
            const bars = ladder && lv >= 0 ? `<span class="jp-mbars">${ladder.map((_, i) => `<i style="${i <= lv ? `background:${trustColor(i, ladder.length)}` : ""}"></i>`).join("")}</span>` : "";
            return cell(s, `${bars}<b class="jp-mstate">${e(ladder && lv >= 0 ? ladder[lv]!.label : r.state)}</b><p>${personaText(r.description, p.cast)}</p><small>Held in: ${e(r.heldWhere)}</small>`, "jp-mc-record");
          })
          .join(""),
      )
    : "";
  const textRow = (group: string, cls: string, ic: string, title: string, sub: string, pick: (s: PresentedStep) => string | undefined) =>
    steps.some((s) => pick(s))
      ? row(` data-row="${cls}" data-jp-group="${group}"`, label(`${ic}<span><b>${e(title)}</b><small>${e(sub)}</small></span>`, `jp-ml-icon jp-ml-${cls}`), steps.map((s) => cell(s, pick(s) ? `<p>${personaText(pick(s)!, p.cast)}</p>` : "", `jp-mc-${cls}`)).join(""))
      : "";
  const pain = textRow("pain", "pain", icon("alert", "jp-rose"), "Pain point", "Without this system", (s) => s.step.painPoint);
  const enabler = textRow("pain", "enabler", icon("sparkles", "jp-sky"), "What makes it work", "The enabler, in plain words", (s) => s.step.enabler);
  // The technical layer.
  const cat = catalogueOf(corpus, p);
  const layers = cat?.layers ?? [];
  const blockChip = (b: BuildingBlock, role: string, tone: string) => `<a class="jp-mblock jp-layer-${tone}" href="${e(`${a.toWorkshop}how/${b.id}/`)}" title="${e(`${b.name}: ${role}`)}">${e(b.short ?? b.name)}</a>`;
  const techHead = row(' data-row="tech" data-jp-group="tech"', label(`${icon("cpu", "jp-sky3")}<b>Under the hood</b>`, "jp-ml-dark"), `<div class="jp-mtech" style="grid-column:span ${steps.length}">The standards and tools that make each moment possible. A chip opens the block in How it works.</div>`);
  const layerRows = layers
    .map((l, li) => {
      const tone = LAYER_TONES[li % LAYER_TONES.length]!;
      return row(
        ` data-row="layer" data-jp-group="tech"`,
        label(`<i class="jp-dot jp-layer-${tone}"></i><span><b>${e(l.label)}</b>${l.question ? `<small>${e(l.question)}</small>` : ""}</span>`, `jp-ml-icon jp-ml-layer jp-layer-${tone}`),
        steps
          .map((s) =>
            cell(
              s,
              (s.step.uses ?? [])
                .map((u) => ({ u, b: cat?.blocks.get(u.block) }))
                .filter((x) => x.b?.layer === l.id)
                .map((x) => blockChip(x.b!, x.u.role, tone))
                .join(""),
              "jp-mc-chips",
            ),
          )
          .join(""),
      );
    })
    .join("");
  const who = (v: string | undefined) => (v ? (p.cast.find((x) => x.id === v)?.name ?? v) : undefined);
  const moveRow = steps.some((s) => s.step.handoff?.carrier || s.step.handoff?.from)
    ? row(
        ' data-row="move" data-jp-group="tech"',
        label(`${glyph("transfer")}<span><b>Data on the move</b><small>From → to, and how</small></span>`, "jp-ml-icon"),
        steps
          .map((s) => {
            const h = s.step.handoff;
            if (!h) return cell(s, "");
            const end = (v: string | undefined) => {
              const pv = v ? p.cast.find((x) => x.id === v) : undefined;
              return who(v) ? `${pv ? avatar(pv, "sm") : ""}${e(who(v)!)}` : undefined;
            };
            const ends = who(h.from) || who(h.to) ? `<p class="jp-mends"><b>${[end(h.from), end(h.to)].filter(Boolean).join(" → ")}</b></p>` : "";
            return cell(s, `${ends}${h.carrier ? `<small>${e(h.carrier)}</small>` : ""}${h.offline !== undefined ? `<span class="jp-net ${h.offline ? "is-off" : "is-on"}">${icon(h.offline ? "wifioff" : "wifi")}${h.offline ? "Offline" : "Online"}</span>` : ""}`);
          })
          .join(""),
      )
    : "";
  const handoffRow = steps.some((s) => s.step.handoff)
    ? row(' data-row="handoff" data-jp-group="tech"', label(`${icon("arrow")}<span><b>Hand-off</b><small>What moves to the next step</small></span>`, "jp-ml-icon"), steps.map((s) => cell(s, s.step.handoff ? `<p class="jp-mhand">${icon("arrow")}<span>${personaText(s.step.handoff.summary, p.cast)}</span></p>` : "")).join(""))
    : "";
  const procRow = steps.some((s) => s.step.realisedBy?.length)
    ? row(
        ' data-row="process" data-jp-group="tech"',
        label(`${icon("workflow")}<span><b>Business process</b><small>The BPMN in the IG</small></span>`, "jp-ml-icon"),
        steps
          .map((s) =>
            cell(
              s,
              (s.step.realisedBy ?? [])
                .map((r) => {
                  const d = processDrawing(corpus, s.journey.instance, r.process);
                  const name = processName(corpus, s.journey.instance, r.process) ?? r.process;
                  return `<div class="jp-mproc">${d ? `<img src="${e(drawingFile(r.process))}" alt="" loading="lazy">` : ""}<small>${e(name)}</small><span class="jp-mproc-links">${processLinks(corpus, pr, s.journey, r.process, a.siteRoot)}${sourceHref(corpus, s.journey.instance, r.process) ? ext(sourceHref(corpus, s.journey.instance, r.process)!, "BPMN") : ""}</span></div>`;
                })
                .join(""),
            ),
          )
          .join(""),
      )
    : "";
  const panels = steps
    .map((s, i) => {
      const sc = screensFor(p, s);
      return `<section class="jp-card jp-msel" data-jp-panel="${s.index}"${i === 0 ? "" : " hidden"}><div><div class="jp-small"><b class="jp-mono jp-sky">${e(s.step.id)}</b>${s.step.when ? ` ${e(s.step.when)}` : ""}${s.step.where ? ` · ${e(s.step.where)}` : ""}</div><h3>${e(s.step.title)}</h3>${s.step.headline ? `<p>${personaText(s.step.headline, p.cast)}</p>` : ""}</div><div class="jp-msel-act"><a class="jp-btn-dark" href="${e(walkHref(a, s))}">${icon("play")} Present this moment</a>${sc.map((x) => `<a class="jp-btn-line" href="${e(`${a.toWorkshop}demo/${x.id}/`)}">${deviceGlyph(x)} Open screen ${e(x.id)}</a>`).join("")}</div></section>`;
    })
    .join("");
  const focus = `<div class="jp-mfilter" role="group" aria-label="Focus on"><span>Focus on:</span><button type="button" class="is-on" data-jp-focus="">Everyone</button>${p.cast.map((x) => `<button type="button" data-jp-focus="${e(x.id)}"><i style="background:${e(x.color)}"></i>${e(x.name)}</button>`).join("")}<label><input type="checkbox" checked data-jp-show="pain"> Pain points &amp; enablers</label>${cat ? `<label><input type="checkbox" checked data-jp-show="tech"> Technical layer</label>` : ""}</div>`;
  const body = `<section class="jp-vhead"><h2>Journey map</h2><p>Read across to follow one person. Read down to see everyone at one moment. Click a column to inspect it.</p></section>
${focus}
<div class="jp-card jp-map-scroll" tabindex="0"><div class="jp-mapgrid" data-jp-map style="--n:${steps.length}">
${[chapters, moments, lanes, record, pain, enabler, cat ? techHead + layerRows : "", moveRow, handoffRow, procRow].join("\n")}
</div></div>
${panels}`;
  return frame({ p, root: a.root, toWorkshop: a.toWorkshop, view: "map", title: `Journey map — ${presentationName(p)}`, ...note(p, "map"), body });
}

// ── the persona lens ─────────────────────────────────────────────────────

/** The curve's points: the steps a person is in, by position, with how they feel there. */
export function feelingPoints(p: Presentation, actor: string): { index: number; emotion: number }[] {
  return p.steps.flatMap((s) => {
    const x = s.step.experiences.find((y) => y.actor === actor);
    return x?.emotion === undefined ? [] : [{ index: s.index, emotion: x.emotion }];
  });
}

function curveSvg(p: Presentation, person: PersonaView, toWorkshop: string): string {
  const n = p.steps.length;
  const W = 960;
  const H = 230;
  const L = 40;
  const R = 20;
  const top = 20;
  const bottom = 160;
  const xOf = (i: number) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const yOf = (v: number) => top + ((2 - v) / 4) * (bottom - top);
  const pts = feelingPoints(p, person.id);
  const bands = p.chapters
    .map((c, ci) => {
      const first = c.steps[0]!.index;
      const last = c.steps[c.steps.length - 1]!.index;
      const half = n > 1 ? (W - L - R) / (n - 1) / 2 : 40;
      const x0 = Math.max(L - 14, xOf(first) - half);
      const x1 = Math.min(W - R + 14, xOf(last) + half);
      return `${ci % 2 ? `<rect x="${x0.toFixed(1)}" y="${top - 8}" width="${(x1 - x0).toFixed(1)}" height="${bottom - top + 16}" class="jp-cv-band"/>` : ""}<text x="${((x0 + x1) / 2).toFixed(1)}" y="${H - 6}" class="jp-cv-ch" text-anchor="middle">${ci + 1}. ${e(c.title)}</text>`;
    })
    .join("");
  const grid = [2, 0, -2].map((v) => `<line x1="${L - 10}" x2="${W - R + 10}" y1="${yOf(v)}" y2="${yOf(v)}" class="${v === 0 ? "jp-cv-zero" : "jp-cv-grid"}"/><text x="8" y="${yOf(v) + 4}" class="jp-cv-face">${v > 0 ? "☺" : v < 0 ? "☹" : "·"}</text>`).join("");
  const codes = p.steps.map((s) => `<text x="${xOf(s.index).toFixed(1)}" y="${bottom + 26}" class="jp-cv-code" text-anchor="middle">${e(s.step.id)}</text>`).join("");
  const segs = pts
    .slice(1)
    .map((q, k) => {
      const a = pts[k]!;
      const dashed = q.index - a.index > 1;
      return `<line x1="${xOf(a.index).toFixed(1)}" y1="${yOf(a.emotion)}" x2="${xOf(q.index).toFixed(1)}" y2="${yOf(q.emotion)}" class="jp-cv-line${dashed ? " is-gap" : ""}"/>`;
    })
    .join("");
  const dots = pts
    .map((q) => {
      const s = p.steps[q.index]!;
      return `<a href="${e(`${toWorkshop}walkthrough/${s.key}/`)}"><title>${e(`${s.step.id} ${s.step.title}: ${EMOTION[q.emotion]?.[0] ?? ""}`)}</title><circle cx="${xOf(q.index).toFixed(1)}" cy="${yOf(q.emotion)}" r="9" class="jp-cv-dot"/></a>`;
    })
    .join("");
  return `<svg class="jp-curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(`How ${person.name} feels at each step`)}" style="--c:${e(person.color)}">${bands}${grid}${codes}${segs}${dots}</svg>`;
}

function personaPage(corpus: JourneyCorpus, p: Presentation, links: SiteLinks, who: PersonaView, depth: 1 | 2): string {
  const a = at(depth, links);
  const toPersonas = depth === 1 ? "" : "../";
  const list = p.cast
    .map((x) => `<a class="jp-plist${x.id === who.id ? " is-on" : ""}" href="${e(`${toPersonas}${x.id}/`)}" style="--c:${e(x.color)}"${x.id === who.id ? ' aria-current="page"' : ""}>${avatar(x)}<span><b>${e(x.name)}</b>${x.role ? `<small>${e(x.role)}</small>` : ""}</span></a>`)
    .join("");
  const mine = p.steps.filter((s) => s.step.experiences.some((y) => y.actor === who.id));
  const touch = mine
    .map((s) => {
      const ex = s.step.experiences.find((y) => y.actor === who.id)!;
      return `<li><i style="background:${e(who.color)}"></i><div class="jp-card jp-tp"><div class="jp-tp-main"><div class="jp-small"><b class="jp-mono">${e(s.step.id)}</b>${s.step.when ? ` ${e(s.step.when)}` : ""}${s.step.where ? ` · ${e(s.step.where)}` : ""}</div><h4>${e(s.step.title)}</h4><p>${personaText(ex.doing, p.cast)}</p>${ex.feeling ? `<p class="jp-feel">${e(ex.feeling)}</p>` : ""}${s.step.touchpoint ? `<small>Touchpoint: ${e(s.step.touchpoint)}</small>` : ""}</div><div class="jp-tp-side">${emotionBadge(ex.emotion)}<a class="jp-present" href="${e(walkHref(a, s))}">${icon("play")} Present</a></div></div></li>`;
    })
    .join("");
  const listOf = (title: string, ic: string, items: string[] | undefined) =>
    items?.length ? `<div class="jp-pbox"><div class="jp-pbox-h">${ic} ${e(title)}</div><ul>${items.map((x) => `<li>${e(x)}</li>`).join("")}</ul></div>` : "";
  const body = `<div class="jp-lens">
<aside class="jp-lens-l"><h3 class="jp-h">Whose journey?</h3><nav class="jp-plists" aria-label="People">${list}</nav></aside>
<div class="jp-lens-r">
<section class="jp-card jp-phead" style="--c:${e(who.color)}"><div class="jp-phead-top">${avatar(who, "lg")}<div><h2>${personaNameHtml(who, personaHref(corpus, p.w.workshop.presentation ?? {}, a.siteRoot))}${who.role || who.country ? ` <small>${e([who.role, who.country].filter(Boolean).join(" · "))}</small>` : ""}</h2>${who.goal ? `<p class="jp-goal">${icon("compass")}<b>Goal:</b> ${e(who.goal)}</p>` : ""}</div></div>${who.needs?.length || who.frustrations?.length ? `<div class="jp-pboxes">${listOf("Needs", icon("smile", "jp-emerald"), who.needs)}${listOf("Frustrations", icon("alert", "jp-rose"), who.frustrations)}</div>` : ""}</section>
<section class="jp-card jp-pad"><div class="jp-row"><h3 class="jp-h">How ${e(who.name)} feels along the way</h3><span class="jp-small">A dashed line: not present in between · a point opens that moment</span></div>${feelingPoints(p, who.id).length ? curveSvg(p, who, a.toWorkshop) : `<p class="jp-small">No step says how ${e(who.name)} feels.</p>`}</section>
<section><h3 class="jp-h jp-h-pad">${e(who.name)}’s touchpoints (${mine.length})</h3><ol class="jp-tps">${touch}</ol></section>
</div>
</div>`;
  return frame({ p, root: a.root, toWorkshop: a.toWorkshop, view: "personas", title: `${who.name} — persona lens — ${presentationName(p)}`, ...note(p, "personas"), body });
}

// ── how it works ─────────────────────────────────────────────────────────

/** The workshop's own ArchiMate views, then those of the taught journeys and their chapters, once each, in teaching order. */
function viewsOf(p: Presentation): { instance: string; model: string; view: string; label?: string }[] {
  const out: { instance: string; model: string; view: string; label?: string }[] = [];
  const seen = new Set<string>();
  for (const v of p.w.workshop.presentation?.views ?? []) {
    const k = `${p.w.instance}\0${v.model}\0${v.view}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ instance: p.w.instance, ...v });
    }
  }
  const journeys = [...p.chapters.map((c) => c.journey), ...p.steps.map((s) => s.journey)];
  for (const j of journeys) {
    for (const v of j.scenario.views ?? []) {
      const k = `${j.instance}\0${v.model}\0${v.view}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ instance: j.instance, ...v });
    }
  }
  return out;
}

function howPage(corpus: JourneyCorpus, p: Presentation, links: SiteLinks, selected: string | undefined): string {
  const depth = selected ? 2 : 1;
  const a = at(depth, links);
  const toHow = selected ? "../" : "";
  const pr = p.w.workshop.presentation ?? {};
  const cat = catalogueOf(corpus, p);
  const layers = cat?.layers ?? [];
  const toneOf = (layer: string) => LAYER_TONES[Math.max(0, layers.findIndex((l) => l.id === layer)) % LAYER_TONES.length]!;
  const chip = (id: string) => {
    const b = cat?.blocks.get(id);
    if (!b) return `<span class="jp-bchip jp-unresolved" title="not in the catalogue">${e(id)}</span>`;
    return `<a class="jp-bchip jp-layer-${toneOf(b.layer)}${selected === id ? " is-on" : ""}" href="${e(`${toHow}${id}/`)}">${e(b.short ?? b.name)}</a>`;
  };
  const ideas = cat?.ideas ?? [];
  const ideasHtml = ideas.length
    ? `<section class="jp-ideas">${ideas.map((i) => `<div class="jp-card jp-idea${selected && i.blocks.includes(selected) ? " is-on" : ""}"><div class="jp-idea-h">${icon("bulb", "jp-amber")} ${e(i.title)}</div><p>${e(i.text)}</p><div class="jp-chips">${i.blocks.map(chip).join("")}</div></div>`).join("")}</section>`
    : "";
  const steps = p.steps;
  const blocks = cat ? [...cat.blocks.values()] : [];
  const used = new Set(steps.flatMap((s) => (s.step.uses ?? []).map((u) => u.block)));
  const shown = blocks.filter((b) => used.has(b.id));
  const matrix = cat
    ? `<section class="jp-card jp-matrix-scroll"><div class="jp-matrix" style="--n:${steps.length}">
<div class="jp-mx-corner">Building block ↓ / Moment →</div>${p.chapters.map((c, i) => `<div class="jp-mx-chap" style="grid-column:span ${c.steps.length}">${i + 1}. ${e(c.title)}</div>`).join("")}
<div class="jp-mx-exp"><b>Experience</b><small>A moment opens it in the walkthrough</small></div>${steps.map((s) => `<a class="jp-mx-step" href="${e(walkHref(a, s))}" title="${e(s.step.title)}"><b class="jp-mono">${e(s.step.id)}</b><span>${e(s.step.title)}</span></a>`).join("")}
${layers
  .map((l) => {
    const tone = toneOf(l.id);
    const rows = shown.filter((b) => b.layer === l.id);
    if (rows.length === 0) return "";
    return `<div class="jp-mx-layer jp-layer-${tone}">${e(l.label)}</div><div class="jp-mx-band jp-layer-${tone}" style="grid-column:span ${steps.length}"></div>${rows
      .map((b) => {
        const on = selected === b.id;
        const dim = selected !== undefined && !on;
        return `<a class="jp-mx-block${on ? " is-on" : ""}${dim ? " is-dim" : ""} jp-layer-${tone}" href="${e(`${toHow}${b.id}/`)}"${on ? ' aria-current="true"' : ""}><i class="jp-dot jp-layer-${tone}"></i>${e(b.short ?? b.name)}</a>${steps
          .map((s) => {
            const u = (s.step.uses ?? []).find((x) => x.block === b.id);
            return `<div class="jp-mx-cell${on ? " is-on" : ""}${dim ? " is-dim" : ""} jp-layer-${tone}">${u ? `<a class="jp-dot jp-dot-lg jp-layer-${tone}" href="${e(walkHref(a, s))}" title="${e(`${s.step.id}: ${u.role}`)}" aria-label="${e(`${s.step.id}: ${u.role}`)}"></a>` : ""}</div>`;
          })
          .join("")}`;
      })
      .join("")}`;
  })
  .join("")}
</div></section>`
    : `<section class="jp-card jp-pad"><p class="jp-small">No building-block catalogue is declared for ${e(p.w.instance)}: declare one (a directory of the <code>building-blocks</code> kind) and the grid draws.</p></section>`;
  const b = selected ? cat?.blocks.get(selected) : undefined;
  const detail = b
    ? `<aside class="jp-card jp-bdetail"><span class="jp-lchip jp-layer-${toneOf(b.layer)}">${e(layers.find((l) => l.id === b.layer)?.label ?? b.layer)}</span><h3>${e(b.name)}</h3><small>${glyph("clinic")} ${e([b.owner, b.jurisdiction].filter(Boolean).join(" · "))}</small>
<div><div class="jp-label">What it is</div><p>${e(b.what)}</p></div>
${b.soWhat ? `<div class="jp-sowhat-box"><div class="jp-label jp-amber8">So what for the journey</div><p>${e(b.soWhat)}</p></div>` : ""}
${b.links?.length ? `<div><div class="jp-label">Learn more</div><ul class="jp-blinks">${b.links.map((l) => `<li>${ext(l.url, l.label)}</li>`).join("")}</ul></div>` : ""}
<div><div class="jp-label">Moments it makes possible</div><ul class="jp-buses">${blockUsage(p, b.id)
        .map(({ s, role }) => `<li><a href="${e(walkHref(a, s))}"><span><b class="jp-mono">${e(s.step.id)}</b> ${e(s.step.title)}</span><small>${e(role)}</small></a></li>`)
        .join("") || `<li class="jp-small">No step of this walkthrough uses it.</li>`}</ul></div></aside>`
    : `<aside class="jp-bhint">${icon("bulb")}<p>Select a building block (left of the grid, or a chip in a big idea) to see what it is, why it matters, and which moments depend on it.</p></aside>`;
  const toSite = a.siteRoot;
  const views = viewsOf(p)
    .map((v) => ({ v, t: links.archimateView?.(v.instance, v.model, v.view) }))
    .filter((x): x is { v: (typeof x)["v"]; t: NonNullable<(typeof x)["t"]> } => x.t !== undefined);
  const viewsHtml = views.length
    ? `<section class="jp-card jp-pad jp-am"><h3 class="jp-h2">${icon("branch")} ArchiMate views</h3><p class="jp-small">The journeys and the systems that carry them as ArchiMate views. Every box in a drawing opens its element’s page.</p>
<div class="jp-amtabs" role="tablist">${views.map((x, i) => `<button type="button" role="tab" data-jp-tab="am-${i}" aria-selected="${i === 0}"${i === 0 ? ' class="is-on"' : ""}>${e(x.v.label ?? x.t.name)}</button>`).join("")}</div>
${views
  .map(
    (x, i) =>
      `<div class="jp-ampane" data-jp-pane="am-${i}"${i ? " hidden" : ""}><div class="jp-amlinks"><b>${e(x.t.name)}</b>${ext(toSite + x.t.page, "View page", "", DAK_ATTR)}${ext(`${toSite}${x.t.page}../../`, "All views and elements", "", DAK_ATTR)}</div><object type="image/svg+xml" data-jp-fit data="${e(toSite + x.t.svg)}" aria-label="${e(x.t.name)}"><a href="${e(toSite + x.t.page)}">${e(x.t.name)}</a></object></div>`,
  )
  .join("")}</section>`
    : "";
  // The business processes the taught steps are carried out by, once each.
  const procs = new Map<string, { instance: string; journey: PresentedStep["journey"]; steps: PresentedStep[] }>();
  for (const s of steps) for (const r of s.step.realisedBy ?? []) {
    const k = `${s.journey.instance}\0${r.process}`;
    const x = procs.get(k) ?? { instance: s.journey.instance, journey: s.journey, steps: [] };
    if (!x.steps.includes(s)) x.steps.push(s);
    procs.set(k, x);
  }
  const procHtml = procs.size
    ? `<section class="jp-card jp-pad"><h3 class="jp-h2">${icon("workflow")} Business processes (BPMN)</h3><ul class="jp-procs">${[...procs]
        .map(([k, x]) => {
          const file = k.split("\0")[1]!;
          const src = sourceHref(corpus, x.instance, file);
          return `<li><b>${e(processName(corpus, x.instance, file) ?? file)}</b><span class="jp-chips">${x.steps.map((s) => stepChip(a, s, s.step.id)).join("")}</span><span class="jp-mproc-links">${processLinks(corpus, pr, x.journey, file, a.siteRoot)}${src ? ext(src, "BPMN source") : ""}</span></li>`;
        })
        .join("")}</ul></section>`
    : "";
  const igLinks = (pr.links ?? []).filter((l) => l.frame).map((l) => ext(fromSite(l.href, a.siteRoot), l.label)).join(" · ");
  const body = `<section class="jp-vhead"><h2>How it works: from journey to architecture</h2><p>Every moment in the journey depends on a few standards and open tools. Pick a big idea or a building block to see which moments it makes possible, or a moment to present it with its technical layer.${igLinks ? ` Specified in ${igLinks}.` : ""}</p></section>
${ideasHtml}
<div class="jp-howgrid">${matrix}${detail}</div>
${viewsHtml}
${procHtml}`;
  return frame({ p, root: a.root, toWorkshop: a.toWorkshop, view: "how", title: `${b ? `${b.name} — ` : ""}How it works — ${presentationName(p)}`, ...note(p, "how"), body });
}

// ── the discussion ───────────────────────────────────────────────────────

function discussPage(corpus: JourneyCorpus, p: Presentation, links: SiteLinks): string {
  const a = at(1, links);
  const ws = p.w.workshop;
  const pr = ws.presentation ?? {};
  const mod = (id: string | undefined) => (id ? `<a class="jp-mod" href="${e(`${a.toWorkshop}${moduleSegment(id)}/`)}" title="${e(ws.modules.find((m) => m.id === id)?.title ?? id)}">${e(id)}</a>` : "");
  const cards = (ws.discussion ?? [])
    .map((d, i) => `<div class="jp-card jp-dq"><div class="jp-dq-h"><span class="jp-dq-n">${i + 1}</span><b>${e(d.theme)}</b>${mod(d.module)}</div><p>${e(d.question)}</p>${d.steps?.length ? `<div class="jp-dq-rev"><span>Revisit:</span>${d.steps.map((r) => stepChip(a, stepByRef(corpus, p, r), r, true)).join("")}</div>` : ""}</div>`)
    .join("");
  const byModule = ws.modules
    .map((m) => {
      const qs = p.steps.flatMap((s) => (s.ws?.questions ?? []).filter((q) => q.module === m.id).map((q) => ({ s, q })));
      if (qs.length === 0) return "";
      const sheet = ws.sheets?.find((x) => x.id === m.sheet);
      return `<div class="jp-card jp-dm"><div class="jp-dm-h">${mod(m.id)}<b>${e(m.title)}</b><small>${e([m.day ? `Day ${m.day}` : "", sheet?.label ?? ""].filter(Boolean).join(" · "))}</small></div>${m.carries ? `<p class="jp-dm-c">${e(m.carries)}</p>` : ""}<ul>${qs.map(({ s, q }) => `<li>${stepChip(a, s, s.step.id)}<span>${e(q.text)}</span></li>`).join("")}</ul></div>`;
    })
    .join("");
  const tables = (ws.tables ?? [])
    .map((t) => {
      const rows = t.rows
        .map((r) => {
          const forced = p.steps.filter((s) => (s.ws?.tags ?? []).some((g) => g.table === t.id && g.row === r.id));
          return `<div class="jp-card jp-dt"><b>${e(r.label)}</b>${r.question || r.what ? `<p>${e(r.question ?? r.what!)}</p>` : ""}${r.example ? `<small>e.g. ${e(r.example)}</small>` : ""}${forced.length ? `<div class="jp-dq-rev"><span>Forced by:</span>${forced.map((s) => stepChip(a, s, s.step.id)).join("")}</div>` : ""}</div>`;
        })
        .join("");
      return `<section class="jp-card jp-pad"><h3 class="jp-h">${icon("landmark", "jp-indigo")} ${e(t.title)}${t.module ? ` (${e(t.module)})` : ""}</h3>${t.description ? `<p class="jp-small">${e(t.description)}</p>` : ""}<div class="jp-dts">${rows}</div></section>`;
    })
    .join("");
  const scales = ws.assessment?.scales ?? [];
  const model = gapReportModel(p, (s) => walkHref(a, s));
  const gap = model
    ? `<section class="jp-card jp-pad jp-gapreport" data-jp-gapreport><div class="jp-row"><h3 class="jp-h">${icon("clipboard", "jp-rose")} Gap report</h3><span class="jp-gap-act jp-noprint"><span class="jp-small"><b data-jp-gap-count>0</b> of ${model.items.length} capabilities marked as gaps</span><button type="button" class="jp-btn-line" data-jp-report-print>${icon("printer")} Print / Save as PDF</button><button type="button" class="jp-btn-line" data-jp-report-csv>${icon("file")} Download CSV</button><button type="button" class="jp-btn-line" data-jp-gap-clear>Clear</button></span></div><p class="jp-small">Assembled from the gap strip on every moment of the walkthrough, <b>in this browser only</b>: nothing is sent anywhere, and another browser keeps its own answers. ${e(ws.assessment?.standingLine ?? "")}</p>
<script type="application/json" data-jp-gapreport-model>${jsonInHtml(model)}</script>
<div data-jp-gapreport-body></div><p class="jp-small jp-gap-none" data-jp-gap-none>Nothing marked ${e(scales[0]!.options.slice(1).map((o) => o.label.toLowerCase()).join(" or "))} yet. Open a moment in the walkthrough and use its gap strip.</p></section>`
    : "";
  const takeaways = p.steps.filter((s) => s.step.policy);
  const body = `<section class="jp-dhero"><span class="jp-kicker">${icon("message")} Questions for the room</span><h2>${e(pr.closingQuestion ?? "Closing discussion")}</h2></section>
${cards ? `<div class="jp-dqs">${cards}</div>` : ""}
${ws.promise ? `<section class="jp-promise"><b>The scope promise.</b> ${e(ws.promise)}</section>` : ""}
${byModule ? `<section class="jp-card jp-pad"><h3 class="jp-h">${icon("message", "jp-indigo")} The journey’s questions, module by module</h3><div class="jp-dms">${byModule}</div></section>` : ""}
${tables}
${gap}
${takeaways.length ? `<section class="jp-card jp-pad"><h3 class="jp-h">${icon("landmark", "jp-indigo")} Every moment’s policy takeaway</h3><ul class="jp-takes">${takeaways.map((s) => `<li>${stepChip(a, s, s.step.id)}<div><b>${e(s.step.title)}</b><p>${e(s.step.policy!)}</p></div></li>`).join("")}</ul></section>` : ""}`;
  return frame({ p, root: a.root, toWorkshop: a.toWorkshop, view: "discuss", title: `Discussion — ${presentationName(p)}`, ...note(p, "discuss"), ...(gap ? { head: `<script src="${a.root}assets/gap-report.js" defer></script>` } : {}), prev: `${a.toWorkshop}walkthrough/${p.steps[p.steps.length - 1]!.key}/`, body });
}

// ── the gap report ───────────────────────────────────────────────────────

/** A scale of the workshop's assessment, as the report reads it. */
export interface GapScale {
  id: string;
  label: string;
  options: { id: string; label: string }[];
}

/** What the discussion page hands `assets/gap-report.js`: every capability the walkthrough rates, and where its answers are stored. */
export interface GapReportModel {
  status: GapScale;
  urgency?: GapScale;
  modules: { id: string; title: string }[];
  items: { name: { status: string; urgency?: string }; capability: { id: string; label: string }; step: { id: string; title: string; href: string }; module?: string }[];
}

/**
 * The gap report's model, or undefined when the workshop rates nothing. The
 * first scale is where a capability stands, the second (if any) how urgent a
 * gap is; each capability is filed under the first module its moment's
 * questions name. The storage names are the gap strip's own
 * (`<workshop>:<capability>:<scale>`), so the report reads what the strip wrote.
 */
export function gapReportModel(p: Presentation, href: (s: PresentedStep) => string): GapReportModel | undefined {
  const ws = p.w.workshop;
  const scales = ws.assessment?.scales ?? [];
  const items = p.steps.flatMap((s) =>
    (s.ws?.capabilities ?? []).map((c) => {
      const module = s.ws?.questions?.[0]?.module;
      return {
        name: { status: `${ws.id}:${c.id}:${scales[0]?.id}`, ...(scales[1] ? { urgency: `${ws.id}:${c.id}:${scales[1].id}` } : {}) },
        capability: { id: c.id, label: c.label },
        step: { id: s.step.id, title: s.step.title, href: href(s) },
        ...(module ? { module } : {}),
      };
    }),
  );
  if (items.length === 0 || scales.length === 0) return undefined;
  return { status: scales[0]!, ...(scales[1] ? { urgency: scales[1] } : {}), modules: ws.modules.map((m) => ({ id: m.id, title: m.title })), items };
}

/** JSON safe inside a `<script>` element: no `</script>` or `<!--` can end it early. */
const jsonInHtml = (v: unknown): string => JSON.stringify(v).replace(/</g, "\\u003c");

// ── the table sheets ─────────────────────────────────────────────────────

function sheetsPageFramed(corpus: JourneyCorpus, p: Presentation, links: SiteLinks): string {
  const a = at(1, links);
  const ws = p.w.workshop;
  const sizes = [...new Set((ws.sheets ?? []).map((s) => s.size))].join(" and ");
  const body = `<section class="jp-card jp-sheets-h jp-noprint"><div><h2>Table canvas: ${e(sizes)} sheets</h2><p class="jp-small">${(ws.sheets ?? []).length} sheet${(ws.sheets ?? []).length === 1 ? "" : "s"}, each with this journey’s questions for its module${(ws.sheets ?? []).some((s) => s.assessmentStrip) ? " and the gap strip at its foot" : ""}. Print on ${e(sizes)}, landscape, at 100% with background graphics on.</p></div><button type="button" class="jp-btn-dark" data-jv-print>${icon("printer")} Print the sheets</button></section>
<div class="jp-sheetlist">${sheetsHtml(corpus, p.w)}</div>`;
  return frame({
    p,
    root: a.root,
    toWorkshop: a.toWorkshop,
    view: "sheets",
    title: `Table sheets — ${presentationName(p)}`,
    ...note(p, "sheets"),
    head: `<link rel="stylesheet" href="${a.root}assets/journeys.css">`,
    bodyClass: "jv-print-sheets",
    body,
  });
}

// ── the device demo ──────────────────────────────────────────────────────

function stageBar(p: Presentation, current: string | undefined): string {
  const toDemo = current ? "../" : "";
  return `<nav class="jp-card jp-stages" aria-label="Screens">${p.screens
    .map((x) => `<a href="${e(`${toDemo}${x.id}/`)}"${x.id === current ? ' class="is-on" aria-current="page"' : ""}><b class="jp-mono">${e(x.id)}</b><span>${e(x.title)}</span><small>${e([...x.steps.map((s) => s.step.id), ...x.unresolved].join(", "))}</small></a>`)
    .join("")}</nav>`;
}

/** Whose device a drawn screen is: the cast's view of its owner, else the owner's own persona. */
function ownerOf(corpus: JourneyCorpus, p: Presentation, x: DemoScreen): PersonaView | undefined {
  const node = x.node;
  if (node === undefined) return undefined;
  return p.cast.find((c) => c.id === node.screen.owner) ?? (lookup(corpus.actors, node.instance, node.screen.owner) ? personaOf(corpus, node.instance, node.screen.owner, p.cast.length) : undefined);
}

/** What drawing a screen needs: people (the cast's colours first), example pages and JSON. */
function screenContext(corpus: JourneyCorpus, p: Presentation, instance: string, siteRoot: string): ScreenContext {
  const extra: PersonaView[] = [];
  return {
    person: (id) => {
      const known = p.cast.find((c) => c.id === id) ?? extra.find((c) => c.id === id);
      if (known) return known;
      if (lookup(corpus.actors, instance, id) === undefined) return undefined;
      const pv = personaOf(corpus, instance, id, p.cast.length + extra.length);
      extra.push(pv);
      return pv;
    },
    exampleHref: (key) => examplePage(corpus, p.w.workshop.presentation ?? {}, key, siteRoot),
    exampleJson: (key) => corpus.examples.get(key)?.json,
  };
}

function demoIndex(corpus: JourneyCorpus, p: Presentation, links: SiteLinks): string {
  const a = at(1, links);
  const pr = p.w.workshop.presentation ?? {};
  const label = demoLabel(p);
  const cards = p.screens
    .map((x) => {
      const who = ownerOf(corpus, p, x);
      const steps = [...x.steps.map((s) => `${s.step.id} ${s.step.title}`), ...x.unresolved];
      return `<a class="jp-card jp-screen" href="${e(`${x.id}/`)}"><span class="jp-screen-i">${deviceGlyph(x, "jp-i-lg")}</span><span><b class="jp-mono">${e(x.id)}</b> ${e(x.title)}</span>${who ? `<span class="jp-screen-who">${avatar(who, "sm")}<small>${e(who.name)} · ${e(DEVICE_LABEL[x.device])}</small></span>` : ""}<small>${steps.map((t) => e(t)).join(" · ")}</small>${x.try ? `<small class="jp-try">${e(x.try)}</small>` : ""}</a>`;
    })
    .join("");
  const lede =
    p.demo === "screens"
      ? `One screen per moment: what each person sees on their own device. A screen opens with the moments it shows, and each moment links back to it.`
      : `One screen per moment, in the instance’s own app. A screen opens framed here, with the moments it shows; ${ext(fromSite(pr.deviceDemo!.href, a.siteRoot), "open the app")} to use it on its own.`;
  const body = `<section class="jp-vhead"><h2>${e(label)}: what each person sees</h2><p>${lede}</p></section>
<div class="jp-screens">${cards}</div>`;
  return frame({ p, root: a.root, toWorkshop: a.toWorkshop, view: "demo", title: `${label} — ${presentationName(p)}`, ...note(p, "demo"), body });
}

function demoPage(corpus: JourneyCorpus, p: Presentation, links: SiteLinks, i: number): string {
  const a = at(2, links);
  const pr = p.w.workshop.presentation ?? {};
  const x = p.screens[i]!;
  const back = [
    ...x.steps.map((s) => `<a class="jp-btn-line" href="${e(walkHref(a, s))}">${icon("left")} Back to the user journey: <b>${e(s.step.id)}</b> ${e(s.step.title)}</a>`),
    ...x.unresolved.map((r) => `<span class="jp-btn-line jp-unresolved" title="no such step in this walkthrough">${e(r)}</span>`),
  ].join("");
  const prev = p.screens[i - 1];
  const next = p.screens[i + 1];
  let device: string;
  let open = "";
  if (x.node) {
    device = `<div class="ds-stage">${renderDevice(x.node.screen, screenContext(corpus, p, x.node.instance, a.siteRoot))}</div>`;
    const src = sourceHref(corpus, x.node.instance, x.node.file);
    if (src) open = ext(src, "Screen source", "jp-btn-line");
  } else {
    const src = screenHref(pr, x.id, a.siteRoot)!;
    device = `<div class="jp-device-wrap"><iframe class="jp-device jp-device-${x.device}" src="${e(src)}" title="${e(`${x.id}: ${x.title}`)}" loading="lazy"></iframe></div>`;
    open = ext(src, "Open in a new tab", "jp-btn-line");
  }
  const moments = x.steps.length
    ? `<section class="jp-card ds-moments"><h3 class="jp-h">${icon("route")} Moments this screen shows</h3><ul>${x.steps.map((s) => `<li><a href="${e(walkHref(a, s))}"><b class="jp-mono">${e(s.step.id)}</b> ${e(s.step.title)}</a>${s.step.headline ? `<p>${personaText(s.step.headline, p.cast)}</p>` : ""}</li>`).join("")}</ul></section>`
    : "";
  const desc = x.node?.screen.description ? `<p>${e(x.node.screen.description)}</p>` : "";
  const body = `${stageBar(p, x.id)}
<section class="jp-screen-h"><div><span class="jp-small"><b class="jp-mono">${e(x.id)}</b> · ${e(DEVICE_LABEL[x.device])}</span><h2>${e(x.title)}</h2>${desc}${x.try ? `<p class="jp-try">${icon("sparkles", "jp-amber")} ${e(x.try)}</p>` : ""}</div><div class="jp-screen-act">${back}${open}</div></section>
${device}
${moments}`;
  return frame({
    p,
    root: a.root,
    toWorkshop: a.toWorkshop,
    view: "demo",
    title: `${x.id} ${x.title} — ${presentationName(p)}`,
    ...(x.try ? { note: `Screen ${x.id} — ${x.try}` } : note(p, "demo")),
    ...(prev ? { prev: `../${prev.id}/` } : {}),
    ...(next ? { next: `../${next.id}/` } : {}),
    body,
  });
}

// ── all of them ──────────────────────────────────────────────────────────

/** The views' pages for one workshop, paths relative to its directory. */
export function renderViewPages(corpus: JourneyCorpus, p: Presentation, links: SiteLinks): PageFile[] {
  const out: PageFile[] = [];
  out.push({ path: "map/index.html", content: mapPage(corpus, p, links) });
  // The map's process thumbnails, one copy per drawing.
  const drawn = new Set<string>();
  for (const s of p.steps) for (const r of s.step.realisedBy ?? []) {
    const f = drawingFile(r.process);
    if (drawn.has(f)) continue;
    const d = processDrawing(corpus, s.journey.instance, r.process);
    if (d) {
      drawn.add(f);
      out.push({ path: `map/${f}`, content: d.svg });
    }
  }
  if (p.cast.length) {
    out.push({ path: "personas/index.html", content: personaPage(corpus, p, links, p.cast[0]!, 1) });
    for (const x of p.cast) out.push({ path: `personas/${x.id}/index.html`, content: personaPage(corpus, p, links, x, 2) });
  }
  out.push({ path: "how/index.html", content: howPage(corpus, p, links, undefined) });
  const cat = catalogueOf(corpus, p);
  for (const b of cat?.blocks.keys() ?? []) out.push({ path: `how/${b}/index.html`, content: howPage(corpus, p, links, b) });
  out.push({ path: "discuss/index.html", content: discussPage(corpus, p, links) });
  if (p.w.workshop.sheets?.length) out.push({ path: "sheets/index.html", content: sheetsPageFramed(corpus, p, links) });
  if (p.screens.length) {
    out.push({ path: "demo/index.html", content: demoIndex(corpus, p, links) });
    p.screens.forEach((x, i) => out.push({ path: `demo/${x.id}/index.html`, content: demoPage(corpus, p, links, i) }));
  }
  return out;
}

