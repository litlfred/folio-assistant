/**
 * Paper Content Adapter — implements ContentAdapter for structured academic papers.
 *
 * Content structure: .ts manifests + .md narrative + optional .lean formalization.
 *
 * @module folio-assistant/adapters/paper
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join, resolve, extname } from "path";
import Anthropic from "@anthropic-ai/sdk";

import { registerRenderTools } from "./tools/render.js";
import { registerValidateTools } from "./tools/validate.js";
import { registerLeanTools } from "./tools/lean.js";
import { registerDepsTools } from "../../src/tools/check-deps.js";
import { registerPreferenceTools } from "../../src/tools/preferences.js";
import { registerPreviewTools } from "../../src/tools/preview.js";
import { registerSkillFetchTools } from "../../src/tools/skill-fetch.js";

import type {
  ContentAdapter,
  FolioItem,
  ContentOutline,
  ChapterDetail,
  ResolvedSection,
  ResolvedDocument,
  ResolvedBlock,
  DocumentDiff,
  BlockDiff,
  BranchCharacterization,
  TriageResult,
  FeedbackItem,
  UserRole,
} from "../../src/types.js";
import type { GitHelper } from "../../src/core/git.js";
import type { FeedbackStore } from "../../src/core/feedback.js";
import { log } from "../../src/core/logging.js";
import { hasRole, forbidden, getUserName, getUserEmail } from "../../src/core/rbac.js";
import { PaperResolver } from "./resolver.js";
import { getAnthropic } from "../../src/routes/chat.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function serveFile(path: string): Response | null {
  if (!existsSync(path)) return null;
  return new Response(readFileSync(path), {
    headers: {
      "Content-Type": MIME[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      ...CORS,
    },
  });
}

export class PaperContentAdapter implements ContentAdapter {
  readonly type = "paper";
  readonly name = "Paper Assistant";
  readonly repoRoot: string;

  private resolver: PaperResolver;
  private gitHelper: GitHelper;
  private feedbackStore: FeedbackStore;
  private contentDir: string;
  private leanDir: string;
  private buildDir: string;
  private mainTex: string;

  constructor(repoRoot: string, gitHelper: GitHelper, feedbackStore: FeedbackStore) {
    this.repoRoot = repoRoot;
    this.gitHelper = gitHelper;
    this.feedbackStore = feedbackStore;
    this.resolver = new PaperResolver(repoRoot, gitHelper, feedbackStore);
    this.contentDir = resolve(repoRoot, "content");
    this.leanDir = resolve(repoRoot, "lean");
    this.buildDir = resolve(repoRoot, "build");
    this.mainTex = resolve(repoRoot, "main.tex");
  }

  // ── Discovery ──────────────────────────────────────────────────

  async listItems(branch?: string) {
    return this.resolver.resolveFolio(branch);
  }

  async getOutline(itemId: string, branch?: string) {
    return this.resolver.resolveOutline(itemId, branch);
  }

  async getChapterDetail(itemId: string, chapterDir: string, branch?: string) {
    return this.resolver.resolveChapterDetail(itemId, chapterDir, branch);
  }

  async getSection(itemId: string, chapterDir: string, sectionIndex: number, branch?: string) {
    return this.resolver.resolveSection(itemId, chapterDir, sectionIndex, branch);
  }

  async getDocument(itemId: string, branch?: string) {
    return this.resolver.resolveDocument(itemId, branch);
  }

  // ── Editing ──────────────────────────────────────────────────

  async saveBlock(itemId: string, rootName: string, md: string): Promise<string> {
    const paperDir = join(this.contentDir, itemId);
    if (!existsSync(paperDir)) throw new Error("Paper not found");

    let mdPath: string | null = null;
    for (const d of readdirSync(paperDir)) {
      const candidate = join(paperDir, d, `${rootName}.ts`);
      if (existsSync(candidate)) {
        mdPath = join(paperDir, d, `${rootName}.md`);
        break;
      }
    }
    if (!mdPath) throw new Error(`Block "${rootName}" not found`);

    writeFileSync(mdPath, md, "utf-8");
    this.invalidateCache(itemId);
    log("edit", `block saved: ${itemId}/${rootName}`, `${md.length} chars → ${mdPath}`);
    return mdPath;
  }

  invalidateCache(itemId?: string): void {
    this.resolver.invalidateCache(itemId);
  }

  // ── Diff ───────────────────────────────────────────────────────

  async computeDiff(itemId: string, base: string, head: string): Promise<DocumentDiff> {
    const mb = this.gitHelper.mergeBase(base, head);
    const effectiveBase = mb || base;

    const [basePaper, headPaper] = await Promise.all([
      this.resolver.resolveDocument(itemId, effectiveBase),
      this.resolver.resolveDocument(itemId, head),
    ]);

    return this.computeDocumentDiff(basePaper, headPaper, base, head, itemId, mb || undefined);
  }

  private computeDocumentDiff(
    basePaper: ResolvedDocument | null,
    headPaper: ResolvedDocument | null,
    base: string,
    head: string,
    itemId?: string,
    mergeBase?: string,
  ): DocumentDiff {
    const documentId = headPaper?.id || basePaper?.id || itemId || "";

    function flattenBlocks(paper: ResolvedDocument | null): Map<string, ResolvedBlock> {
      const map = new Map();
      if (!paper) return map;
      for (const ch of paper.chapters || [])
        for (const sec of ch.sections || [])
          for (const blk of sec.blocks || [])
            map.set(blk.rootName, blk);
      return map;
    }

    const baseBlocks = flattenBlocks(basePaper);
    const headBlocks = flattenBlocks(headPaper);
    const allNames = new Set([...baseBlocks.keys(), ...headBlocks.keys()]);

    const blocks: BlockDiff[] = [];
    const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };

    for (const name of allNames) {
      const baseBlk = baseBlocks.get(name);
      const headBlk = headBlocks.get(name);
      const blockTodos = this.feedbackStore.read(documentId, name);
      const todos = blockTodos.length ? blockTodos : undefined;

      if (!baseBlk && headBlk) {
        blocks.push({
          rootName: name, kind: headBlk.kind, label: headBlk.label, title: headBlk.title, status: "added",
          mdDiff: headBlk.md ? { base: "", head: headBlk.md } : undefined,
          leanDiff: headBlk.lean?.source ? { base: "", head: headBlk.lean.source } : undefined,
          todos,
        });
        summary.added++;
      } else if (baseBlk && !headBlk) {
        blocks.push({
          rootName: name, kind: baseBlk.kind, label: baseBlk.label, title: baseBlk.title, status: "removed",
          mdDiff: baseBlk.md ? { base: baseBlk.md, head: "" } : undefined,
          leanDiff: baseBlk.lean?.source ? { base: baseBlk.lean.source, head: "" } : undefined,
          todos,
        });
        summary.removed++;
      } else if (baseBlk && headBlk) {
        const mdChanged = baseBlk.md !== headBlk.md;
        const leanChanged = (baseBlk.lean?.source || "") !== (headBlk.lean?.source || "");
        const statusChanged = baseBlk.status !== headBlk.status;

        if (mdChanged || leanChanged || statusChanged) {
          const diff: BlockDiff = { rootName: name, kind: headBlk.kind, label: headBlk.label, title: headBlk.title, status: "changed", todos };
          if (mdChanged) diff.mdDiff = { base: baseBlk.md, head: headBlk.md };
          if (leanChanged) diff.leanDiff = { base: baseBlk.lean?.source || "", head: headBlk.lean?.source || "" };
          if (statusChanged) diff.statusDiff = { base: baseBlk.status || "", head: headBlk.status || "" };
          blocks.push(diff);
          summary.changed++;
        } else {
          blocks.push({ rootName: name, kind: headBlk.kind, label: headBlk.label, title: headBlk.title, status: "unchanged", todos });
          summary.unchanged++;
        }
      }
    }

    return { base, head, documentId, blocks, summary, mergeBase };
  }

  // ── AI characterization ────────────────────────────────────────

  async characterizeChanges(diff: DocumentDiff): Promise<BranchCharacterization> {
    const client = getAnthropic();
    if (!client) return this.fallbackCharacterization(diff);

    const changedBlocks = diff.blocks.filter((b) => b.status !== "unchanged");
    const blockDescriptions = changedBlocks
      .slice(0, 30)
      .map((b) => {
        let desc = `[${b.status}] ${b.kind}: ${b.title || b.rootName}`;
        if (b.label) desc += ` (${b.label})`;
        if (b.statusDiff) desc += ` | status: ${b.statusDiff.base} → ${b.statusDiff.head}`;
        if (b.mdDiff) desc += ` | md changed`;
        if (b.leanDiff) desc += ` | lean source changed`;
        return desc;
      })
      .join("\n");

    const prompt = `Characterize the changes between branch "${diff.base}" and "${diff.head}" for document "${diff.documentId}".

Summary: +${diff.summary.added} added, -${diff.summary.removed} removed, ~${diff.summary.changed} changed, ${diff.summary.unchanged} unchanged blocks.

Changed blocks:
${blockDescriptions}

Respond in JSON: {"title": "...", "summary": "...", "categories": [...], "impact": "minor|moderate|major", "suggestions": [...]}`;

    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || "Branch changes",
          summary: parsed.summary || "",
          categories: parsed.categories || [],
          impact: parsed.impact || "moderate",
          suggestions: parsed.suggestions,
        };
      }
      return this.fallbackCharacterization(diff);
    } catch (e) {
      return {
        ...this.fallbackCharacterization(diff),
        error: `AI error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  private fallbackCharacterization(diff: DocumentDiff): BranchCharacterization {
    const { added, removed, changed } = diff.summary;
    const total = added + removed + changed;
    const categories: string[] = [];
    const changedBlocks = diff.blocks.filter((b) => b.status !== "unchanged");
    const kinds = new Set(changedBlocks.map((b) => b.kind));
    if (kinds.has("definition")) categories.push("definitions");
    if (kinds.has("theorem") || kinds.has("lemma") || kinds.has("proposition")) categories.push("proofs");
    if (changedBlocks.some((b) => b.leanDiff)) categories.push("formalization");
    if (added > 0) categories.push("new-content");
    if (removed > 0) categories.push("removals");
    const impact = total > 10 ? "major" : total > 3 ? "moderate" : "minor";
    return {
      title: `${total} block${total !== 1 ? "s" : ""} changed (${diff.base} → ${diff.head})`,
      summary: `${added} added, ${removed} removed, ${changed} modified.`,
      categories,
      impact,
    };
  }

  // ── AI triage ──────────────────────────────────────────────────

  async triageFeedback(
    todo: FeedbackItem,
    blockContent: string,
    blockKind: string,
    itemId: string,
    rootName: string,
  ): Promise<TriageResult> {
    const client = getAnthropic();
    if (!client) {
      return {
        assessment: `Feedback: "${todo.summary}". Priority: ${todo.priority}. No AI available.`,
        actionable: false,
      };
    }

    const prompt = `You are an editor triaging feedback on a structured document.

Block: "${rootName}" (kind: ${blockKind}, document: ${itemId})

Block content (markdown):
\`\`\`
${blockContent.slice(0, 2000)}
\`\`\`

Feedback:
- Summary: ${todo.summary}
- Detail: ${todo.comment || "(none)"}
- Priority: ${todo.priority}

Respond in JSON: {"assessment": "...", "actionable": boolean, "proposedEdit": {"description": "...", "newMd": "..."}}`;

    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          assessment: parsed.assessment || "No assessment.",
          actionable: !!parsed.actionable,
          proposedEdit: parsed.proposedEdit
            ? { description: parsed.proposedEdit.description || "", newMd: parsed.proposedEdit.newMd }
            : undefined,
        };
      }
      return { assessment: "Failed to parse AI response.", actionable: false };
    } catch (e) {
      return {
        assessment: `Feedback: "${todo.summary}".`,
        actionable: false,
        error: `AI error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  // ── Chat tools ─────────────────────────────────────────────────

  getChatTools(): unknown[] {
    return [
      {
        name: "get_document_status",
        description: "Get document overview: chapters, block counts, proof status, formalization stats.",
        input_schema: {
          type: "object" as const,
          properties: { itemId: { type: "string", description: "Document ID (optional)" } },
          required: [],
        },
      },
      {
        name: "get_todos",
        description: "Get open todos/feedback items. Can filter by document or block.",
        input_schema: {
          type: "object" as const,
          properties: {
            itemId: { type: "string" },
            blockLabel: { type: "string" },
            status: { type: "string", enum: ["open", "in_progress", "blocked", "resolved"] },
          },
          required: [],
        },
      },
      {
        name: "get_block",
        description: "Get full content of a specific block by label.",
        input_schema: {
          type: "object" as const,
          properties: { label: { type: "string", description: "Block label" } },
          required: ["label"],
        },
      },
      {
        name: "get_chapter_blocks",
        description: "List all blocks in a chapter.",
        input_schema: {
          type: "object" as const,
          properties: {
            itemId: { type: "string" },
            chapterNumber: { type: "number", description: "Chapter number (1-indexed)" },
          },
          required: ["chapterNumber"],
        },
      },
      {
        name: "search_blocks",
        description: "Search blocks by keyword in title, label, tags, or content.",
        input_schema: {
          type: "object" as const,
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    ];
  }

  async executeChatTool(name: string, input: Record<string, unknown>, context?: Record<string, unknown>): Promise<string> {
    const pid = (input.itemId as string) || (input.paperId as string) || (context?.paperId as string) || "";

    try {
      switch (name) {
        case "get_document_status": {
          const paper = pid ? await this.getDocument(pid) : null;
          if (!paper) return JSON.stringify({ error: "Document not found", itemId: pid });
          const stats: Record<string, number> = { chapters: 0, totalBlocks: 0, definitions: 0, theorems: 0, openTodos: 0 };
          stats.chapters = paper.chapters.length;
          for (const ch of paper.chapters)
            for (const sec of ch.sections || [])
              for (const blk of sec.blocks || []) {
                stats.totalBlocks++;
                if (blk.kind === "definition") stats.definitions++;
                if (blk.kind === "theorem" || blk.kind === "lemma" || blk.kind === "proposition") stats.theorems++;
                stats.openTodos += (blk.todos || []).filter((t: any) => t.status === "open").length;
              }
          return JSON.stringify({ title: paper.title, ...stats });
        }

        case "get_todos": {
          const rawLabel = (input.blockLabel || input.rootName) as string | undefined;
          const rootName = rawLabel?.replace(/^(def|thm|lem|prop|cor|rem|ex|conj):/, "") || undefined;
          if (rootName && pid) {
            return JSON.stringify(this.feedbackStore.read(pid, rootName));
          }
          const status = (input.status as string) || "open";
          const all = this.feedbackStore.listAll(status);
          const filtered = pid ? all.filter((t) => t.itemId === pid) : all;
          return JSON.stringify(filtered.slice(0, 30));
        }

        case "get_block": {
          const label = input.label as string;
          const paper = pid ? await this.getDocument(pid) : null;
          if (!paper) return JSON.stringify({ error: "Document not found" });
          for (const ch of paper.chapters)
            for (const sec of ch.sections || [])
              for (const blk of sec.blocks || [])
                if (blk.label === label) {
                  return JSON.stringify({
                    kind: blk.kind, label: blk.label, title: blk.title,
                    md: (blk.md || "").slice(0, 3000),
                    lean: blk.lean ? { ref: blk.lean.ref, validation: blk.lean.validation } : null,
                    status: blk.status, uses: blk.uses, tags: blk.tags,
                    chapter: ch.title, section: sec.title,
                  });
                }
          return JSON.stringify({ error: `Block not found: ${label}` });
        }

        case "get_chapter_blocks": {
          const chNum = input.chapterNumber as number;
          const paper = pid ? await this.getDocument(pid) : null;
          if (!paper) return JSON.stringify({ error: "Document not found" });
          const ch = paper.chapters.find((c: any) => c.number === chNum);
          if (!ch) return JSON.stringify({ error: `Chapter ${chNum} not found` });
          const blocks: unknown[] = [];
          for (const sec of ch.sections || [])
            for (const blk of sec.blocks || [])
              blocks.push({ kind: blk.kind, label: blk.label, title: blk.title, status: blk.status, section: sec.title });
          return JSON.stringify({ chapter: ch.title, blocks });
        }

        case "search_blocks": {
          const q = ((input.query as string) || "").toLowerCase();
          const paper = pid ? await this.getDocument(pid) : null;
          if (!paper) return JSON.stringify({ error: "Document not found" });
          const matches: unknown[] = [];
          for (const ch of paper.chapters)
            for (const sec of ch.sections || [])
              for (const blk of sec.blocks || []) {
                const searchable = [blk.label, blk.title, blk.kind, ...(blk.tags || []), (blk.md || "").slice(0, 500)].join(" ").toLowerCase();
                if (searchable.includes(q))
                  matches.push({ kind: blk.kind, label: blk.label, title: blk.title, chapter: ch.title, section: sec.title });
                if (matches.length >= 15) break;
              }
          return JSON.stringify(matches);
        }

        default:
          return JSON.stringify({ error: `Unknown tool: ${name}` });
      }
    } catch (e) {
      return JSON.stringify({ error: String(e) });
    }
  }

  getChatSystemPrompt(mode: string, userRole: UserRole, userName: string, context?: Record<string, unknown>): string {
    let prompt = `You are Folio, an editorial assistant for structured documents. You help readers understand, navigate, and improve content.

## User: ${userName} (${userRole})

You have tools to fetch live data. Use them proactively.
Keep responses concise. Use $...$ for inline math and $$...$$ for display math.

End every response with suggested follow-ups:
[suggestions]: First option | Second option | Third option`;

    if (mode === "status") {
      prompt += `\n\nEDITOR mode — focus on status, priorities, and what needs work.`;
    } else if (mode === "edit") {
      prompt += `\n\nEDITOR mode — help report errors, suggest improvements, discuss editorial decisions.`;
    } else {
      prompt += `\n\nREADER mode — help understand content. Use get_block to fetch details when explaining.`;
    }

    if (context) {
      if (context.selectedText) prompt += `\n\nSelected text: """${(context.selectedText as string).slice(0, 1000)}"""`;
      if (context.blockLabel && context.blockMd) {
        prompt += `\n\nViewing block "${context.blockLabel}" (${context.blockKind || "unknown"}):\n"""${(context.blockMd as string).slice(0, 3000)}"""`;
      }
      if (context.paperId) prompt += `\n\nDocument ID: ${context.paperId}`;
    }

    return prompt;
  }

  // ── Content-specific routes ────────────────────────────────────

  async handleGet(url: URL): Promise<Response | null> {
    const path = url.pathname;

    // Folio listing
    if (path === "/api/folio") {
      const branch = url.searchParams.get("branch") || undefined;
      try {
        const data = await this.listItems(branch);
        return Response.json(data, { headers: { "Cache-Control": "no-cache", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Paper (full document)
    if (path === "/api/paper") {
      const id = url.searchParams.get("id");
      const branch = url.searchParams.get("branch") || undefined;
      if (!id) return Response.json({ error: "Missing ?id=" }, { status: 400 });
      try {
        const data = await this.getDocument(id, branch);
        if (!data) return Response.json({ error: `Not found: ${id}` }, { status: 404 });
        return Response.json(data, { headers: { "Cache-Control": "no-cache", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Paper outline
    if (path === "/api/paper/outline") {
      const id = url.searchParams.get("id");
      const branch = url.searchParams.get("branch") || undefined;
      if (!id) return Response.json({ error: "Missing ?id=" }, { status: 400 });
      try {
        const data = await this.getOutline(id, branch);
        if (!data) return Response.json({ error: `Not found: ${id}` }, { status: 404 });
        return Response.json(data, { headers: { "Cache-Control": "max-age=300", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Chapter detail
    if (path === "/api/paper/chapter") {
      const id = url.searchParams.get("id");
      const chapter = url.searchParams.get("chapter");
      const branch = url.searchParams.get("branch") || undefined;
      if (!id || !chapter) return Response.json({ error: "Missing ?id= or ?chapter=" }, { status: 400 });
      try {
        const data = await this.getChapterDetail(id, chapter, branch);
        if (!data) return Response.json({ error: `Chapter not found: ${chapter}` }, { status: 404 });
        return Response.json(data, { headers: { "Cache-Control": "max-age=300", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Section
    if (path === "/api/paper/section") {
      const id = url.searchParams.get("id");
      const chapter = url.searchParams.get("chapter");
      const sectionIdx = url.searchParams.get("section");
      const branch = url.searchParams.get("branch") || undefined;
      if (!id || !chapter || sectionIdx == null) return Response.json({ error: "Missing params" }, { status: 400 });
      try {
        const data = await this.getSection(id, chapter, parseInt(sectionIdx, 10), branch);
        if (!data) return Response.json({ error: "Section not found" }, { status: 404 });
        return Response.json(data, { headers: { "Cache-Control": "max-age=300", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Diff
    if (path === "/api/diff") {
      const id = url.searchParams.get("id");
      const base = url.searchParams.get("base") || "main";
      const head = url.searchParams.get("head") || this.gitHelper.currentBranch();
      if (!id) return Response.json({ error: "Missing ?id=" }, { status: 400 });
      try {
        const diff = await this.computeDiff(id, base, head);
        return Response.json(diff, { headers: { "Cache-Control": "no-cache", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Characterize
    if (path === "/api/characterize") {
      const id = url.searchParams.get("id");
      const base = url.searchParams.get("base") || "main";
      const head = url.searchParams.get("head") || this.gitHelper.currentBranch();
      if (!id) return Response.json({ error: "Missing ?id=" }, { status: 400 });
      try {
        const diff = await this.computeDiff(id, base, head);
        const summary = await this.characterizeChanges(diff);
        return Response.json({ ...summary, diff: diff.summary }, { headers: { "Cache-Control": "no-cache", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Content assets
    if (path.startsWith("/api/content-asset/")) {
      const rel = path.slice("/api/content-asset/".length);
      return serveFile(join(this.contentDir, rel)) || new Response("Asset not found", { status: 404 });
    }

    // Uploads listing
    if (path === "/api/uploads") {
      try {
        const uploadsDir = join(this.repoRoot, "uploads");
        if (!existsSync(uploadsDir)) return Response.json({ uploads: [] }, { headers: CORS });
        const dirs = readdirSync(uploadsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => {
            const intakePath = join(uploadsDir, d.name, "intake.json");
            let intake: Record<string, unknown> | null = null;
            if (existsSync(intakePath)) {
              try { intake = JSON.parse(readFileSync(intakePath, "utf-8")); } catch { /* skip */ }
            }
            return {
              id: d.name,
              title: intake?.title ?? d.name,
              stage: (intake?.pipeline as any)?.stage ?? "unknown",
              classification: intake?.classification ?? null,
              blockCount: intake?.blockCount ?? 0,
              files: readdirSync(join(uploadsDir, d.name)).filter((f) => f !== "intake.json"),
            };
          });
        return Response.json({ uploads: dirs }, { headers: CORS });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: CORS });
      }
    }

    // Single upload detail
    if (path.startsWith("/api/uploads/")) {
      const docId = path.slice("/api/uploads/".length).replace(/\/$/, "");
      const docDir = join(this.repoRoot, "uploads", docId);
      if (!existsSync(docDir)) return Response.json({ error: "Not found" }, { status: 404, headers: CORS });
      try {
        const files = readdirSync(docDir);
        const intakePath = join(docDir, "intake.json");
        let intake: Record<string, unknown> | null = null;
        if (existsSync(intakePath)) {
          try { intake = JSON.parse(readFileSync(intakePath, "utf-8")); } catch { /* skip */ }
        }
        return Response.json({ id: docId, intake, files }, { headers: CORS });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: CORS });
      }
    }

    // Render PDF status
    if (path === "/api/render-pdf/status") {
      try {
        const { execSync } = require("child_process") as typeof import("child_process");
        execSync("which latexmk", { stdio: "pipe" });
        return Response.json({ available: true }, { headers: CORS });
      } catch {
        return Response.json({ available: false, reason: "latexmk not installed" }, { headers: CORS });
      }
    }

    // Block changelog (git log for block's sibling files)
    if (path === "/api/block-changelog") {
      const id = url.searchParams.get("id");
      const label = url.searchParams.get("label");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      if (!id) return Response.json({ error: "Missing ?id= parameter" }, { status: 400, headers: CORS });
      if (!label) return Response.json({ error: "Missing ?label= parameter" }, { status: 400, headers: CORS });
      try {
        const paper = await this.getDocument(id);
        if (!paper) return Response.json({ error: "Paper not found" }, { status: 404, headers: CORS });
        let rootName: string | null = null;
        let chapterDir: string | null = null;
        for (const ch of paper.chapters || []) {
          for (const sec of ch.sections || []) {
            for (const blk of sec.blocks || []) {
              if (blk.label === label) { rootName = blk.rootName; break; }
            }
            if (rootName) break;
          }
          if (rootName) {
            const paperDir = join(this.contentDir, id || "");
            for (const d of readdirSync(paperDir, { withFileTypes: true })) {
              if (d.isDirectory() && existsSync(join(paperDir, d.name, `${rootName}.ts`))) {
                chapterDir = d.name; break;
              }
            }
            break;
          }
        }
        if (!rootName || !chapterDir) {
          return Response.json({ error: `Block "${label}" not found` }, { status: 404, headers: CORS });
        }
        const base = `content/${id}/${chapterDir}/${rootName}`;
        const files = [`${base}.ts`, `${base}.md`, `${base}.lean`];
        const commits = this.gitHelper.gitLogFiles(files, limit);
        return Response.json({ label, rootName, chapterDir, commits }, { headers: { "Cache-Control": "no-cache", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: CORS });
      }
    }

    // Undo impact analysis (reverse dependency walk)
    if (path === "/api/undo-impact") {
      const id = url.searchParams.get("id");
      const label = url.searchParams.get("label");
      if (!id) return Response.json({ error: "Missing ?id= parameter" }, { status: 400, headers: CORS });
      if (!label) return Response.json({ error: "Missing ?label= parameter" }, { status: 400, headers: CORS });
      try {
        const paper = await this.getDocument(id);
        if (!paper) return Response.json({ error: "Paper not found" }, { status: 404, headers: CORS });
        const allBlocks: Array<{ label: string; kind: string; title: string; uses: string[] }> = [];
        const reverseDeps = new Map<string, string[]>();
        for (const ch of paper.chapters || []) {
          for (const sec of ch.sections || []) {
            for (const blk of sec.blocks || []) {
              if (!blk.label) continue;
              allBlocks.push({ label: blk.label, kind: blk.kind, title: blk.title || "", uses: blk.uses || [] });
              for (const dep of blk.uses || []) {
                if (!reverseDeps.has(dep)) reverseDeps.set(dep, []);
                reverseDeps.get(dep)!.push(blk.label);
              }
            }
          }
        }
        const target = allBlocks.find(b => b.label === label);
        if (!target) return Response.json({ error: `Block "${label}" not found` }, { status: 404, headers: CORS });
        const directDependents = (reverseDeps.get(label) || []).map(l => allBlocks.find(b => b.label === l)!).filter(Boolean);
        const visited = new Set<string>([label]);
        const queue = [...(reverseDeps.get(label) || [])];
        const transitive: typeof allBlocks = [];
        while (queue.length) {
          const cur = queue.shift()!;
          if (visited.has(cur)) continue;
          visited.add(cur);
          const blk = allBlocks.find(b => b.label === cur);
          if (blk) transitive.push(blk);
          for (const next of reverseDeps.get(cur) || []) {
            if (!visited.has(next)) queue.push(next);
          }
        }
        return Response.json({
          target: { label: target.label, kind: target.kind, title: target.title },
          directDependents: directDependents.map(b => ({ label: b.label, kind: b.kind, title: b.title })),
          transitiveDependents: transitive.filter(b => !directDependents.some(d => d.label === b.label))
            .map(b => ({ label: b.label, kind: b.kind, title: b.title })),
          totalAffected: transitive.length,
        }, { headers: { "Cache-Control": "no-cache", ...CORS } });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: CORS });
      }
    }

    // TeX export — build content pipeline and serve files as JSON manifest
    if (path === "/api/tex-export") {
      try {
        const { spawnSync } = require("child_process") as typeof import("child_process");

        const buildResult = spawnSync("bun", ["run", join(this.repoRoot, "content/pipeline/build.ts")], {
          cwd: this.repoRoot, stdio: "pipe", timeout: 60_000,
        });
        if (buildResult.status !== 0) {
          return Response.json({ error: "Build failed: " + (buildResult.stderr?.toString() || "unknown error") }, { status: 500, headers: CORS });
        }

        const files: { name: string; data: Buffer }[] = [];

        const mainTexPath = resolve(this.repoRoot, "main.tex");
        if (existsSync(mainTexPath)) {
          files.push({ name: "main.tex", data: readFileSync(mainTexPath) as Buffer });
        }

        const chaptersDir = resolve(this.repoRoot, "chapters");
        if (existsSync(chaptersDir)) {
          for (const f of readdirSync(chaptersDir)) {
            if (f.endsWith(".tex")) {
              files.push({ name: `chapters/${f}`, data: readFileSync(join(chaptersDir, f)) as Buffer });
            }
          }
        }

        const preamblePath = resolve(this.repoRoot, "latex/preamble.tex");
        if (existsSync(preamblePath)) {
          files.push({ name: "latex/preamble.tex", data: readFileSync(preamblePath) as Buffer });
        }

        const bibPath = resolve(this.repoRoot, "references.bib");
        if (existsSync(bibPath)) {
          files.push({ name: "references.bib", data: readFileSync(bibPath) as Buffer });
        }

        if (files.length === 0) {
          return Response.json({ error: "No TeX files generated" }, { status: 500, headers: CORS });
        }

        const manifest = files.map(f => ({
          name: f.name,
          content: f.data.toString("utf-8"),
        }));

        return Response.json({ files: manifest }, { headers: CORS });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: CORS });
      }
    }

    return null;
  }

  async handlePost(url: URL, req: Request): Promise<Response | null> {
    const path = url.pathname;

    // Save block
    if (path === "/api/block/save") {
      if (!hasRole(req, "collaborator")) return forbidden("editing content", "collaborator");
      try {
        const body = (await req.json()) as { paperId: string; rootName: string; md: string };
        const mdPath = await this.saveBlock(body.paperId, body.rootName, body.md);
        return Response.json({ ok: true, path: mdPath });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
      }
    }

    // Upload document
    if (path === "/api/upload") {
      if (!hasRole(req, "collaborator")) return forbidden("uploading documents", "collaborator");
      try {
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
          // Multipart file upload
          const formData = await req.formData();
          const docId = (formData.get("id") as string) || `upload-${Date.now()}`;
          const title = (formData.get("title") as string) || docId;
          const docType = (formData.get("type") as string) || "paper";
          const domain = (formData.get("domain") as string) || "";
          const normativeLevel = (formData.get("normativeLevel") as string) || "";

          const uploadsDir = join(this.repoRoot, "uploads", docId);
          if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

          // Save uploaded files
          const savedFiles: string[] = [];
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              const filename = value.name || `${key}.bin`;
              const buffer = Buffer.from(await value.arrayBuffer());
              const filePath = join(uploadsDir, filename);
              writeFileSync(filePath, buffer);
              savedFiles.push(filename);
            }
          }

          // Detect format from file extensions
          const format = savedFiles.some((f) => f.endsWith(".tex")) ? "latex"
            : savedFiles.some((f) => f.endsWith(".pdf")) ? "pdf"
            : savedFiles.some((f) => f.endsWith(".docx")) ? "docx"
            : savedFiles.some((f) => f.match(/\.(png|jpg|jpeg|tiff?)$/i)) ? "scan"
            : "unknown";

          // Create intake.json
          const intake = {
            id: docId,
            title,
            source: { type: "upload", fetchedAt: new Date().toISOString() },
            format,
            pipeline: {
              stage: "uploaded",
              extractedAt: null,
              structuredAt: null,
              generatedAt: null,
              errors: [],
            },
            classification: {
              type: docType,
              domain: domain || null,
              normativeLevel: normativeLevel || null,
            },
            chapters: [],
            blockCount: 0,
            targetPaper: null,
          };
          writeFileSync(join(uploadsDir, "intake.json"), JSON.stringify(intake, null, 2));

          return Response.json({
            ok: true,
            id: docId,
            files: savedFiles,
            format,
            stage: "uploaded",
          }, { headers: CORS });
        }

        // JSON body — for URL-based intake (arXiv, web URLs)
        const body = (await req.json()) as {
          id?: string; title?: string; url?: string;
          type?: string; domain?: string; normativeLevel?: string;
        };
        const docId = body.id || `upload-${Date.now()}`;
        const uploadsDir = join(this.repoRoot, "uploads", docId);
        if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

        const intake = {
          id: docId,
          title: body.title || docId,
          source: { type: "url", url: body.url, fetchedAt: new Date().toISOString() },
          format: "pending",
          pipeline: {
            stage: "uploaded",
            extractedAt: null,
            structuredAt: null,
            generatedAt: null,
            errors: [],
          },
          classification: {
            type: body.type || "paper",
            domain: body.domain || null,
            normativeLevel: body.normativeLevel || null,
          },
          chapters: [],
          blockCount: 0,
          targetPaper: null,
        };
        writeFileSync(join(uploadsDir, "intake.json"), JSON.stringify(intake, null, 2));

        return Response.json({
          ok: true,
          id: docId,
          stage: "uploaded",
          message: "Intake created. Upload files to /api/upload with multipart/form-data.",
        }, { headers: CORS });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: CORS });
      }
    }

    // Render PDF
    if (path === "/api/render-pdf") {
      try {
        const { spawnSync, execSync } = require("child_process") as typeof import("child_process");
        try {
          execSync("which latexmk", { stdio: "pipe" });
        } catch {
          return Response.json({ error: "latexmk not installed" }, { status: 503, headers: CORS });
        }

        // Build content → .tex
        spawnSync("bun", ["run", join(this.repoRoot, "content/pipeline/build.ts")], {
          cwd: this.repoRoot, stdio: "pipe", timeout: 60_000,
        });

        // Run latexmk
        if (!existsSync(this.buildDir)) mkdirSync(this.buildDir, { recursive: true });
        const latexResult = spawnSync("latexmk", [
          "-pdf", "-g", `-output-directory=${this.buildDir}`,
          "-interaction=nonstopmode", "-file-line-error", this.mainTex,
        ], { cwd: this.repoRoot, stdio: "pipe", timeout: 300_000 });

        // Find generated PDF
        const pdfFiles = existsSync(this.buildDir) ? readdirSync(this.buildDir).filter((f) => f.endsWith(".pdf")) : [];
        const pdfPath = pdfFiles.length > 0 ? join(this.buildDir, pdfFiles[0]) : null;
        if (pdfPath && existsSync(pdfPath)) {
          return new Response(readFileSync(pdfPath), {
            headers: { "Content-Type": "application/pdf", ...CORS },
          });
        }

        return Response.json({ error: "LaTeX compilation failed", exitCode: latexResult.status }, { status: 500, headers: CORS });
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: CORS });
      }
    }

    return null;
  }

  // ── MCP tool registration ──────────────────────────────────────

  registerMcpTools(server: any): void {
    // Paper-specific MCP tools
    registerRenderTools(server);
    registerValidateTools(server);
    registerLeanTools(server);

    // Generic tools
    registerDepsTools(server);
    registerPreferenceTools(server);
    registerPreviewTools(server);
    registerSkillFetchTools(server);
  }
}
