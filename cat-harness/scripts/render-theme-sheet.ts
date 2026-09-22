/**
 * THE THEMING SUBGRAPH'S VISUALISER — every theme, drawn.
 *
 * ## Why this exists rather than an exemption
 *
 * Bean `2krx`: every time an instance names a directory as a subgraph, that
 * subgraph owes a **visualiser** and a **documentation entry**. `1hvo` adds
 * `cat-harness/skills/theming/`, so it arrives owing both, and *shipping it without
 * them manufactures the finding rather than clearing it*. This is the
 * visualiser; `docs/architecture/theming.md` is the entry.
 *
 * bootstrap's `renderExemption` was the alternative and is the wrong shape
 * here. That exemption is a FLOOR THAT RISES — the bottom layer produces
 * nothing a human browses, so it trades a visualiser for its own graph.
 * Theming is the opposite case: it produces nothing BUT things a human looks
 * at, and a theme nobody rendered is a palette nobody checked.
 *
 * ## It PRINTS and never gates
 *
 * The schema proves a scrim parses and a crop box is square and in bounds.
 * **It cannot see what a picture shows.** Two of the first seven avatar boxes
 * framed scenery, and the operations box was square, in bounds, and clipped
 * the crown off a hard hat — caught by the owner looking at a render, not by
 * any assertion. So this answers a question no gate can carry, and making it
 * fail would only teach somebody to switch it off.
 *
 * Numbers that CAN be gated are gated elsewhere and not restated here: the
 * contrast ratios are computed in `schemas/themes.test.ts`, which is why this
 * page shows them beside a PASS/FAIL against the AAA floor rather than
 * claiming them.
 *
 * Usage:  bun run theme:sheet [--out <file>]
 *
 * @module scripts/render-theme-sheet
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { instanceRootFor, readDeclaration, repoRootFor } from "../schemas/cat-harness.js";
import { THEME_LAYOUTS, resolveThemeBackdrop } from "../schemas/theme.js";
import { THEMES } from "../schemas/themes.js";
import type { ImageRegion, KgImage } from "../schemas/kg-node.js";
import { avatarClip, dataUri } from "./render-avatar-crops.js";

/** The AAA floor. A value below it is not a worse theme; it is a failing one. */
export const AAA = 7;

/** sRGB relative luminance, per WCAG 2.x. Hex only — see `parseColour`. */
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? [...c].map((x) => x + x).join("") : c;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/**
 * `ink` over `scrim` laid on PURE BLACK — the binding case.
 *
 * Not over the art in use, and that is the whole idea: an instance may declare
 * its own art for a role, so the picture a value was tuned against is not the
 * picture it will meet. Pure black is the darkest any instance could declare,
 * so a number measured against it is true of all of them.
 */
export function inkOverScrimOnBlack(ink: string, scrim: string): number | undefined {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(scrim);
  if (m === null) return undefined; // could not determine — say so, never guess
  const a = m[4] === undefined ? 1 : Number(m[4]);
  const over = [1, 2, 3]
    .map((i) => Math.round(Number(m[i]) * a)) // composited onto #000
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return contrast(ink, `#${over}`);
}

function swatch(label: string, value: string): string {
  return `<div class="sw"><span class="chip" style="background:${value}"></span>
    <span class="swl">${label}<br><code>${value}</code></span></div>`;
}

function regionBox(r: ImageRegion, cls: string, title: string): string {
  return `<span class="rgn ${cls}" title="${title}"
    style="left:${r.x * 100}%;top:${r.y * 100}%;width:${r.w * 100}%;height:${r.h * 100}%"></span>`;
}

function artCell(img: KgImage, root: string): string {
  const uri = dataUri(join(root, img.src));
  if (uri === undefined) {
    // "could not read" is not "no art declared". A blank cell rendered as a
    // clean one is the `dh4f` shape on a page whose job is showing what is there.
    return `<td class="art"><div class="miss">could not read<br><code>${img.src}</code></div></td>`;
  }
  const regions =
    (img.textRegion ? regionBox(img.textRegion, "tx", "textRegion — where words may go") : "") +
    (img.avatarRegion ? regionBox(img.avatarRegion, "av", "avatarRegion — the square the frame clips to") : "");
  const avatar =
    img.avatarRegion === undefined
      ? ""
      : `<div class="av46" style="${avatarClip(uri, img.avatarRegion)}" title="46px, navbar size"></div>`;
  return `<td class="art">
    <div class="layout">${img.layout ?? "—"}</div>
    <div class="frame"><img src="${uri}" alt="">${regions}</div>
    ${avatar}
  </td>`;
}

export function buildSheet(root: string): { html: string; themes: number; missing: string[] } {
  const images = readDeclaration(root)?.images ?? [];
  const missing: string[] = [];

  const rows = THEMES.map((t) => {
    const p = t.palette;
    const backdrop = resolveThemeBackdrop(t, images);
    if (backdrop.missing.length > 0) missing.push(`${t.id}: ${backdrop.missing.join(", ")}`);

    const scrim = t.backdrop?.scrim;
    const ratio = scrim === undefined ? undefined : inkOverScrimOnBlack(p.ink, scrim);
    const contrastCell =
      t.backdrop === undefined
        ? `<span class="none">no backdrop — art behind ink is what this theme removes</span>`
        : ratio === undefined
          ? `<span class="undet">could not parse the scrim — not the same as failing</span>`
          : `<strong class="${ratio >= AAA ? "pass" : "fail"}">${ratio.toFixed(2)}:1</strong>
             <span class="note">ink over scrim on pure black · AAA floor ${AAA}:1</span>`;

    const art =
      backdrop.art.size === 0
        ? `<td class="art" colspan="3"><div class="miss">${
            backdrop.none ? "declares no backdrop" : `incomplete — missing ${backdrop.missing.join(", ")}`
          }</div></td>`
        : THEME_LAYOUTS.map((l) => {
            const img = backdrop.art.get(l);
            return img === undefined ? `<td class="art"></td>` : artCell(img as KgImage, root);
          }).join("");

    return `<tr>
      <td class="meta">
        <div class="tid">${t.name}</div><code>${t.id}</code>
        ${t.description ? `<p class="desc">${t.description}</p>` : ""}
        <div class="swatches">
          ${swatch("surface", p.surface)}${swatch("ink", p.ink)}
          ${swatch("edge", p.edge)}${swatch("accent", p.accent)}
        </div>
        <div class="contrast">${contrastCell}</div>
        <div class="demo" style="background:${p.surface};color:${p.ink};border-color:${p.edge};border-left-color:${p.accent}">
          A sticky on this theme.
        </div>
      </td>
      ${art}
    </tr>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Theme sheet</title>
<style>
  :root { color-scheme: light dark; --fg:#16181d; --bg:#fbfbf9; --line:#c9c9c2; --muted:#5d6068; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --fg:#ececee; --bg:#16181d; --line:#3a3d45; --muted:#9a9ea8; }
  }
  body { margin:0; padding:24px 16px; background:var(--bg); color:var(--fg);
         font:15px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; }
  h1 { font-size:1.5rem; margin:0 0 .25rem; }
  p.lede { color:var(--muted); margin:0 0 1.5rem; max-width:64ch; }
  table { border-collapse:collapse; width:100%; }
  td, th { border-bottom:1px solid var(--line); padding:14px 10px; vertical-align:top; text-align:left; }
  th { font-size:.78rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); font-weight:600; }
  .meta { width:32%; min-width:230px; }
  .tid { font-weight:650; }
  code { font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--muted); }
  .desc { font-size:.85rem; color:var(--muted); margin:.4rem 0; }
  .swatches { display:flex; flex-wrap:wrap; gap:.5rem; margin:.6rem 0; }
  .sw { display:flex; align-items:center; gap:.35rem; }
  .chip { width:20px; height:20px; border-radius:4px; border:1px solid var(--line); display:inline-block; }
  .swl { font-size:.7rem; line-height:1.2; color:var(--muted); }
  .contrast { font-size:.85rem; margin:.5rem 0; }
  .pass { color:#1d7a3e; } .fail { color:#c0272d; }
  .none, .undet, .note { color:var(--muted); font-size:.78rem; display:block; }
  .demo { margin-top:.6rem; padding:.6em .7em; border:1px solid; border-left-width:5px; border-radius:6px; font-size:.85rem; }
  .art { width:22%; }
  .layout { font-size:.72rem; color:var(--muted); margin-bottom:.3rem; }
  .frame { position:relative; }
  .frame img { width:100%; display:block; border-radius:5px; }
  .rgn { position:absolute; border-radius:2px; box-shadow:0 0 0 1px rgba(255,255,255,.6); }
  .tx { border:2px solid #2f7bd6; }
  .av { border:2px solid #ff3b6b; }
  .av46 { width:46px; height:46px; border-radius:50%; margin-top:.5rem;
          border:1px solid var(--line); background-repeat:no-repeat; }
  .miss { color:var(--muted); font-size:.8rem; font-style:italic; }
  .key { margin:1rem 0 0; font-size:.8rem; color:var(--muted); }
  .key b.tx { color:#2f7bd6; } .key b.av { color:#ff3b6b; }
  @media (max-width:820px) {
    table, tbody, tr, td { display:block; } thead { display:none; }
    tr { border-bottom:1px solid var(--line); padding:12px 0; }
    td { border:0; width:auto; } .art { display:inline-block; width:31%; vertical-align:top; }
  }
</style></head><body><div class="wrap">
<h1>Theme sheet</h1>
<p class="lede">Every declared theme: palette, the scrim's measured contrast against the binding case,
and each layout's art with its regions drawn. <strong>This page is for looking.</strong> The schema
already proves a box is square and inside the frame — what it cannot tell is whether the box is on
the cat, which is how two crops shipped framing scenery and a third clipped a hard hat.</p>
<table>
  <thead><tr><th>theme</th><th colspan="3">art, per layout — with regions</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
<p class="key">Key: <b class="tx">blue</b> = <code>textRegion</code>, where words may be drawn ·
<b class="av">pink</b> = <code>avatarRegion</code>, the square a frame clips to ·
the circle beneath is that clip at 46px, navbar size.</p>
</div></body></html>
`;
  return { html, themes: THEMES.length, missing };
}

if (import.meta.main) {
  const root = instanceRootFor(import.meta.dir);
  const i = process.argv.indexOf("--out");
  const out = resolve(
    i !== -1 ? process.argv[i + 1]! : join(repoRootFor(root), "_kg", "theme-sheet.html"),
  );
  const { html, themes, missing } = buildSheet(root);
  if (themes === 0) {
    console.error("No themes are declared. Nothing was rendered — that is not a clean run.");
    process.exit(2);
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`Theme sheet → ${out}\n  ${themes} theme(s)`);
  // REPORTED, not fatal. An incomplete backdrop is already refused by
  // `resolveThemeBackdrop` and gated by `check:theme-art`; saying it here too
  // helps the person looking at the page understand a blank cell, and a second
  // gate over one fact is a second answer free to disagree with the first.
  for (const m of missing) console.log(`  incomplete backdrop — ${m}`);
  if (!existsSync(out)) process.exit(1);
}
