#!/usr/bin/env bun
/**
 * gen-skill-docs.ts — Render the skill *instruction bodies* (the prose how-to
 * markdowns the LLM loads) as browsable HTML pages on the docs site, with an
 * index.
 *
 * Sources (the actual skill bodies — single source of truth):
 *   skills/content-lifecycle/*.md   → "Lifecycle skills"
 *   src/skills/*.md                  → "Agent skills"
 *
 * Output (consumed by Jekyll → HTML on GitHub Pages):
 *   docs/reference/skill-instructions/<name>.md   (+ index.md)
 *
 * Each generated page gets just-the-docs front matter (any front matter already
 * present in the source body is stripped first), so they render with navigation
 * and link back to the source + the skill's typed schema. Regenerate with:
 *
 *     bun run scripts/gen-skill-docs.ts
 *
 * Dependency-free (bun + fs only). Never hand-edit the output.
 *
 * @module scripts/gen-skill-docs
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve, basename } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const OUT_DIR = join(REPO_ROOT, "docs", "reference", "skill-instructions");
const SCHEMA_DIR = join(REPO_ROOT, "docs", "reference", "skills");

interface Group {
  category: string;
  dir: string;
  /** GitHub path prefix for the "source" link. */
  repoPrefix: string;
}

const GROUPS: Group[] = [
  { category: "Lifecycle skills", dir: join(REPO_ROOT, "skills", "content-lifecycle"), repoPrefix: "skills/content-lifecycle" },
  { category: "Agent skills", dir: join(REPO_ROOT, "src", "skills"), repoPrefix: "src/skills" },
];

/** Strip a leading YAML front-matter block (`---\n…\n---`) if present. */
function stripFrontMatter(text: string): string {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const after = text.indexOf("\n", end + 1);
      return after !== -1 ? text.slice(after + 1) : "";
    }
  }
  return text;
}

/** Derive a concise nav title from the first H1, else the filename. */
function deriveTitle(body: string, name: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  let title = m ? m[1].trim() : name;
  // Trim "<thing> — long descriptor" down to the lead, and a trailing " Skill".
  title = title.split(" — ")[0].replace(/\s+Skill$/i, "").trim();
  return title || name;
}

function escapePipes(s: string): string {
  return s.replace(/\|/g, "\\|");
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const indexRows: Record<string, string[]> = {};

  for (const group of GROUPS) {
    indexRows[group.category] = [];
    if (!existsSync(group.dir)) continue;
    const files = readdirSync(group.dir).filter((f) => f.endsWith(".md")).sort();

    for (const file of files) {
      const name = basename(file, ".md");
      const raw = readFileSync(join(group.dir, file), "utf-8");
      const body = stripFrontMatter(raw).replace(/^\n+/, "");
      const title = deriveTitle(body, name);

      const hasSchema = existsSync(join(SCHEMA_DIR, `${name}.md`));
      const sourceUrl = `https://github.com/litlfred/folio-assistant/blob/main/${group.repoPrefix}/${file}`;

      const page: string[] = [];
      page.push("---");
      page.push("layout: default");
      page.push(`title: ${title}`);
      page.push("parent: Skill instructions");
      page.push("---");
      page.push("");
      page.push("{: .note }");
      page.push(
        `> Generated from [\`${group.repoPrefix}/${file}\`](${sourceUrl}) — do not edit here.` +
          (hasSchema ? ` Typed contract: [schema reference](../skills/${name}.html).` : ""),
      );
      page.push("");
      page.push(body.trimEnd());
      page.push("");
      writeFileSync(join(OUT_DIR, `${name}.md`), page.join("\n"));

      const desc = escapePipes((body.match(/^#\s+.+\n+([^\n#].*)$/m)?.[1] ?? "").slice(0, 100));
      const schemaCell = hasSchema ? `[schema](../skills/${name}.html)` : "—";
      indexRows[group.category].push(`| [${title}](${name}.html) | \`${name}\` | ${schemaCell} | ${desc} |`);
      console.log(`  ✓ ${name}.md (${group.category})`);
    }
  }

  // Index page
  const idx: string[] = [];
  idx.push("---");
  idx.push("layout: default");
  idx.push("title: Skill instructions");
  idx.push("nav_order: 6");
  idx.push("has_children: true");
  idx.push("---");
  idx.push("");
  idx.push("# Skill instructions");
  idx.push("");
  idx.push("The prose **instruction bodies** the LLM loads (via `skill_fetch`) when it");
  idx.push("runs a skill. These are generated from the skill source markdowns, so the");
  idx.push("published reference always matches what the agent actually reads.");
  idx.push("");
  idx.push("For each skill's *typed input/output contract*, see the");
  idx.push("[Skill schema reference](../skills/); for the conceptual overview of skills,");
  idx.push("roles, and how they compose with the LLM, see [Skills & roles](../../skills.html).");
  idx.push("");
  for (const group of GROUPS) {
    const rows = indexRows[group.category];
    idx.push(`## ${group.category}`);
    idx.push("");
    if (rows.length === 0) {
      idx.push("_None yet._");
      idx.push("");
      continue;
    }
    idx.push("| Skill | Id | Schema | Summary |");
    idx.push("|-------|----|--------|---------|");
    idx.push(...rows);
    idx.push("");
  }
  idx.push("> The `authoring-math` and `authoring-who-smart-guidelines` packages ship");
  idx.push("> skill *definitions* + typed schemas today; their prose instruction bodies");
  idx.push("> will appear here as they are authored.");
  idx.push("");
  writeFileSync(join(OUT_DIR, "index.md"), idx.join("\n"));
  const total = Object.values(indexRows).reduce((n, r) => n + r.length, 0);
  console.log(`  ✓ index.md (${total} instruction bodies)`);
  console.log(`\nWrote skill instruction docs to ${OUT_DIR}`);
}

main();
