/**
 * Paper adapter — Content resolution (folio, paper, chapter, section, block).
 *
 * Resolves .ts manifests + .md content + .lean source from disk or git branches.
 *
 * @module folio-assistant/adapters/paper/resolver
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { GitHelper } from "../../src/core/git.js";
import type { FeedbackStore } from "../../src/core/feedback.js";
import { TtlCache } from "../../src/core/cache.js";
import type {
  FolioItem,
  ContentOutline,
  OutlineChapter,
  ResolvedBlock,
  ResolvedSection,
  ResolvedChapter,
  ResolvedDocument,
  ChapterDetail,
  SectionStub,
} from "../../src/types.js";
import { leanPackageByName } from "../../schemas/lean-packages.js";
import type { Block, Chapter, Folio, Paper, Section } from "../../schemas/types.js";
import {
  blockCaption, blockExamples, blockLean, blockProofs, blockTex,
  isSectionRef, sectionBlockNames, tryParseLeanRef,
} from "../manifest-entries.js";
import { leanStatusBucket } from "../../content/pipeline/render-latex.js";

export class PaperResolver {
  private outlineCache = new TtlCache<ContentOutline>();
  private chapterCache = new TtlCache<ChapterDetail>();
  private sectionCache = new TtlCache<ResolvedSection>();
  private documentCache = new TtlCache<ResolvedDocument & { branch: string }>();

  constructor(
    private repoRoot: string,
    private gitHelper: GitHelper,
    private feedbackStore: FeedbackStore,
  ) {}

  invalidateCache(itemId?: string): void {
    if (itemId) {
      const prefix = itemId + ":";
      this.outlineCache.invalidate(prefix);
      this.chapterCache.invalidate(prefix);
      this.sectionCache.invalidate(prefix);
      this.documentCache.invalidate(prefix);
    } else {
      this.outlineCache.invalidate();
      this.chapterCache.invalidate();
      this.sectionCache.invalidate();
      this.documentCache.invalidate();
    }
  }

  // ── Folio listing ──────────────────────────────────────────────

  async resolveFolio(branch?: string): Promise<{ title: string; papers: FolioItem[]; branch: string }> {
    const br = branch;
    const folioRel = "content/folio.ts";
    let folioData: { title: string; papers: Array<{ dir: string; title?: string; description?: string; tags?: string[] }> };

    if (this.gitHelper.fileExistsBranch(br, folioRel)) {
      folioData = await this.gitHelper.importTsBranch<Folio>(br, folioRel);
    } else {
      const dirs = this.gitHelper.listDirBranch(br, "content").filter((d) => {
        if (d === "schema" || d === "pipeline" || d === "node_modules") return false;
        return this.gitHelper.fileExistsBranch(br, `content/${d}/${d}.ts`);
      });
      folioData = { title: "Documents", papers: dirs.map((d) => ({ dir: d })) };
    }

    const items: FolioItem[] = [];
    for (const ref of folioData.papers) {
      try {
        const paperMod = await this.gitHelper.importTsBranch<Paper>(br, `content/${ref.dir}/${ref.dir}.ts`);
        let blockCount = 0, provedCount = 0, todoCount = 0, chapCount = 0;

        for (const chRef of paperMod.chapters || []) {
          const chRel = `content/${ref.dir}/${chRef.dir}/${chRef.dir}.ts`;
          if (!this.gitHelper.fileExistsBranch(br, chRel)) continue;
          chapCount++;
          const ch = await this.gitHelper.importTsBranch<Chapter>(br, chRel);
          for (const sec of ch.sections || []) {
            // Was `!("blocks" in sec)`, which also skipped inline sections
            // whose blocks all live in `subsections[]` — the very case
            // `sectionBlockNames` exists to flatten. Same fix as the MCP
            // resolver; both now use the one reference test.
            if (isSectionRef(sec)) continue;
            for (const rootName of sectionBlockNames(sec)) {
              const blkRel = `content/${ref.dir}/${chRef.dir}/${rootName}.ts`;
              if (!this.gitHelper.fileExistsBranch(br, blkRel)) continue;
              blockCount++;
              try {
                const blk = await this.gitHelper.importTsBranch<Block>(br, blkRel);
                // Was `blk.status === "proved" || "mathlib_ok"`. There is no
                // block-level `status`: the schema derives
                // `FormalizationStatus` at build time and does not store it
                // in manifests, so this counter was always 0. The block's
                // own `lean` field is the signal.
                if (leanStatusBucket(blockLean(blk)) === "compiled") provedCount++;
                const fb = this.feedbackStore.read(ref.dir, rootName);
                if (fb.length) todoCount += fb.filter((t) => t.status !== "resolved" && t.status !== "wontfix").length;
              } catch {}
            }
          }
        }

        items.push({
          id: ref.dir,
          title: ref.title || paperMod.title,
          description: ref.description,
          tags: ref.tags,
          authors: paperMod.authors,
          date: paperMod.date,
          stats: { chapters: chapCount, blocks: blockCount, proved: provedCount, todos: todoCount },
        });
      } catch {
        items.push({
          id: ref.dir,
          title: ref.title || ref.dir,
          description: ref.description,
          tags: ref.tags,
          authors: [],
          stats: { chapters: 0, blocks: 0, proved: 0, todos: 0 },
        });
      }
    }

    return { title: folioData.title, papers: items, branch: this.gitHelper.currentBranch() };
  }

  // ── Paper outline ──────────────────────────────────────────────

  async resolveOutline(id: string, branch?: string): Promise<ContentOutline | null> {
    const cacheKey = `${id}:${branch || "HEAD"}`;
    const cached = this.outlineCache.get(cacheKey);
    if (cached) return cached;

    const br = branch;
    const paperRel = `content/${id}/${id}.ts`;
    if (!this.gitHelper.fileExistsBranch(br, paperRel)) return null;

    const paperMod = await this.gitHelper.importTsBranch<Paper>(br, paperRel);
    const chapters: OutlineChapter[] = [];

    // Auto-number chapters from manifest order: skip unnumbered ones (tabLabel set)
    let autoNum = 1;
    for (const chRef of paperMod.chapters || []) {
      const chTsRel = `content/${id}/${chRef.dir}/${chRef.dir}.ts`;
      if (!this.gitHelper.fileExistsBranch(br, chTsRel)) continue;
      const ch = await this.gitHelper.importTsBranch<Chapter>(br, chTsRel);
      const chapterNumber = ch.tabLabel != null ? undefined : autoNum++;

      const sections: OutlineChapter["sections"] = [];
      for (const sec of ch.sections || []) {
        if (isSectionRef(sec)) continue;
        sections.push({ title: sec.title, label: sec.label, blockCount: sectionBlockNames(sec).length });
      }

      chapters.push({ number: chapterNumber, tabLabel: ch.tabLabel, title: ch.title, label: ch.label, dir: chRef.dir, sections });
    }

    const result: ContentOutline = {
      id,
      title: paperMod.title,
      authors: paperMod.authors,
      affiliations: paperMod.affiliations,
      date: paperMod.date,
      chapters,
      branch: this.gitHelper.currentBranch(),
    };

    this.outlineCache.set(cacheKey, result);
    return result;
  }

  // ── Chapter detail ─────────────────────────────────────────────

  async resolveChapterDetail(paperId: string, chapterDir: string, branch?: string): Promise<ChapterDetail | null> {
    const cacheKey = `${paperId}:${branch || "HEAD"}:ch:${chapterDir}`;
    const cached = this.chapterCache.get(cacheKey);
    if (cached) return cached;

    const br = branch;
    const chRel = `content/${paperId}/${chapterDir}`;
    const chTsRel = `${chRel}/${chapterDir}.ts`;
    if (!this.gitHelper.fileExistsBranch(br, chTsRel)) return null;

    const ch = await this.gitHelper.importTsBranch<Chapter>(br, chTsRel);
    const sections: SectionStub[] = [];

    for (const sec of ch.sections || []) {
      if (isSectionRef(sec)) continue;
      const section = sec;

      const blockStubs: SectionStub["blockStubs"] = [];
      for (const rootName of sectionBlockNames(section)) {
        const blkTsRel = `${chRel}/${rootName}.ts`;
        try {
          const blk = await this.gitHelper.importTsBranch<Block>(br, blkTsRel);
          const feedback = this.feedbackStore.read(paperId, rootName);
          const blkLean = blockLean(blk);
          blockStubs.push({
            rootName,
            kind: blk.kind,
            label: blk.label,
            title: blk.title,
            // `blk.status` again — derived, never stored. Bound once so TS
            // narrows the const rather than each repeated call.
            status: leanStatusBucket(blkLean),
            lean: blkLean ? { ref: blkLean.ref, validation: blkLean.validation } : undefined,
            todoCount: feedback.filter((t) => t.status === "open").length,
          });
        } catch {
          blockStubs.push({ rootName, kind: "error", todoCount: 0 });
        }
      }

      sections.push({ title: section.title, label: section.label, blockCount: sectionBlockNames(section).length, blockStubs });
    }

    // Auto-derive chapter number from its position in the paper manifest
    let chapterNumber: number | undefined;
    const outline = await this.resolveOutline(paperId, branch);
    if (outline) {
      const idx = outline.chapters.findIndex(c => c.dir === chapterDir);
      if (idx >= 0) chapterNumber = outline.chapters[idx].number;
    }

    const chTodos = this.feedbackStore.read(paperId, `__chapter:${chapterDir}`);
    const result: ChapterDetail = {
      number: chapterNumber,
      tabLabel: ch.tabLabel,
      title: ch.title,
      label: ch.label,
      dir: chapterDir,
      sections,
      todos: chTodos.length ? chTodos : undefined,
    };

    this.chapterCache.set(cacheKey, result);
    return result;
  }

  // ── Section (full blocks with md/lean) ─────────────────────────

  async resolveSection(paperId: string, chapterDir: string, sectionIndex: number, branch?: string): Promise<ResolvedSection | null> {
    const cacheKey = `${paperId}:${branch || "HEAD"}:sec:${chapterDir}:${sectionIndex}`;
    const cached = this.sectionCache.get(cacheKey);
    if (cached) return cached;

    const br = branch;
    const chRel = `content/${paperId}/${chapterDir}`;
    const chTsRel = `${chRel}/${chapterDir}.ts`;
    if (!this.gitHelper.fileExistsBranch(br, chTsRel)) return null;

    const ch = await this.gitHelper.importTsBranch<Chapter>(br, chTsRel);
    const realSections = (ch.sections || []).filter((s): s is Section => !isSectionRef(s));
    if (sectionIndex < 0 || sectionIndex >= realSections.length) return null;

    const sec = realSections[sectionIndex];
    const ownBlockNames = Array.isArray(sec.blocks) ? sec.blocks : [];
    const blocks = await this.resolveBlocks(paperId, chRel, ownBlockNames, br);

    let subsections: ResolvedSection[] | undefined;
    if (Array.isArray(sec.subsections)) {
      subsections = [];
      for (const sub of sec.subsections) {
        if (!sub) continue;
        // A bare `SectionRef` subsection is not resolvable at this level, so
        // it contributes no blocks — as before, when `sub.blocks` was absent.
        const inline = isSectionRef(sub) ? undefined : sub;
        const subBlocks = await this.resolveBlocks(paperId, chRel, inline?.blocks ?? [], br);
        subsections.push({ title: inline?.title ?? "", label: inline?.label, blocks: subBlocks });
      }
    }

    const result: ResolvedSection = { title: sec.title, label: sec.label, blocks, subsections };
    this.sectionCache.set(cacheKey, result);
    return result;
  }

  // ── Full document ──────────────────────────────────────────────

  async resolveDocument(id: string, branch?: string): Promise<(ResolvedDocument & { branch: string }) | null> {
    const cacheKey = `${id}:${branch || "HEAD"}`;
    const cached = this.documentCache.get(cacheKey);
    if (cached) return cached;

    const br = branch;
    const paperRel = `content/${id}/${id}.ts`;
    if (!this.gitHelper.fileExistsBranch(br, paperRel)) return null;

    const paperMod = await this.gitHelper.importTsBranch<Paper>(br, paperRel);
    const chapters: ResolvedChapter[] = [];

    // Auto-number chapters from manifest order
    let autoNum = 1;
    for (const chRef of paperMod.chapters || []) {
      const chRel = `content/${id}/${chRef.dir}`;
      const chTsRel = `${chRel}/${chRef.dir}.ts`;
      if (!this.gitHelper.fileExistsBranch(br, chTsRel)) continue;
      const ch = await this.gitHelper.importTsBranch<Chapter>(br, chTsRel);
      const chapterNumber = ch.tabLabel != null ? undefined : autoNum++;

      const sections: ResolvedSection[] = [];
      for (const sec of ch.sections || []) {
        if (isSectionRef(sec)) continue;
        const section = sec;
        const ownBlockNames = Array.isArray(section.blocks) ? section.blocks : [];
        const blocks = await this.resolveBlocks(id, chRel, ownBlockNames, br);

        let subsections: ResolvedSection[] | undefined;
        if (Array.isArray(section.subsections)) {
          subsections = [];
          for (const sub of section.subsections) {
            if (!sub) continue;
            const inline = isSectionRef(sub) ? undefined : sub;
            const subBlocks = await this.resolveBlocks(id, chRel, inline?.blocks ?? [], br);
            subsections.push({ title: inline?.title ?? "", label: inline?.label, blocks: subBlocks });
          }
        }

        sections.push({ title: section.title, label: section.label, blocks, subsections });
      }

      const chTodos = this.feedbackStore.read(id, `__chapter:${chRef.dir}`);
      chapters.push({
        number: chapterNumber,
        tabLabel: ch.tabLabel,
        title: ch.title,
        label: ch.label,
        sections,
        todos: chTodos.length ? chTodos : undefined,
      });
    }

    const blocksByName = new Map<string, ResolvedBlock>();
    for (const ch of chapters) {
      for (const sec of ch.sections) {
        for (const blk of sec.blocks) blocksByName.set(blk.rootName, blk);
        if (sec.subsections) {
          for (const sub of sec.subsections) {
            for (const blk of sub.blocks) blocksByName.set(blk.rootName, blk);
          }
        }
      }
    }

    const paperTodos = this.feedbackStore.read(id, "__paper");
    const result = {
      id,
      title: paperMod.title,
      authors: paperMod.authors,
      affiliations: paperMod.affiliations,
      date: paperMod.date,
      macros: paperMod.macros,
      chapters,
      todos: paperTodos.length ? paperTodos : undefined,
      branch: this.gitHelper.currentBranch(),
      blocksByName,
    };

    this.documentCache.set(cacheKey, result);
    return result;
  }

  // ── Block resolution (shared by section + document) ────────────

  private async resolveBlocks(
    paperId: string,
    chRel: string,
    blockNames: string[],
    branch?: string,
  ): Promise<ResolvedBlock[]> {
    const br = branch;
    const blocks: ResolvedBlock[] = [];

    for (const rootName of blockNames) {
      const blkTsRel = `${chRel}/${rootName}.ts`;
      const blkMdRel = `${chRel}/${rootName}.md`;
      try {
        const blk = await this.gitHelper.importTsBranch<Block>(br, blkTsRel);
        const md = this.gitHelper.readFileBranch(br, blkMdRel) || "";

        const feedback = this.feedbackStore.read(paperId, rootName);
        const blockTodos = feedback.length ? [...feedback] : undefined;

        // Read Lean source if available.  Resolution order:
        //   1. sibling .lean file (primary authoring convention)
        //   2. package-rooted path derived from parsed `lean.ref`
        //      (<lakeRoot>/<Decl/Path>.lean)
        //   3. grep the package's Lean source dir for the bare name
        let leanSource: string | undefined;
        const blkLean = blockLean(blk);
        if (blkLean) {
          const parsed = tryParseLeanRef(blk);
          leanSource = this.gitHelper.readFileBranch(br, `${chRel}/${rootName}.lean`) ?? undefined;
          if (!leanSource && parsed) {
            const pkg = leanPackageByName(parsed.package);
            if (pkg) {
              const parts = parsed.decl.split(".");
              for (let i = parts.length; i >= 2; i--) {
                const candidate = `${pkg.lakeRoot}/${parts.slice(0, i).join("/")}.lean`;
                leanSource = this.gitHelper.readFileBranch(br, candidate) ?? undefined;
                if (leanSource) break;
              }
            }
          }
          // Grep fallback for current branch only
          if (!leanSource && parsed && this.gitHelper.isCurrentBranch(br)) {
            const pkg = leanPackageByName(parsed.package);
            if (pkg) {
              try {
                const leanSrcDir = join(this.repoRoot, pkg.lakeRoot, pkg.lib);
                if (existsSync(leanSrcDir)) {
                  const result = Bun.spawnSync(["grep", "-rl", parsed.name, leanSrcDir]);
                  const files = result.stdout.toString().trim().split("\n").filter(Boolean);
                  if (files.length > 0 && existsSync(files[0])) {
                    leanSource = readFileSync(files[0], "utf-8");
                  }
                }
              } catch {}
            }
          }
        }

        const rendered = blk.rendered?.map(
          (r: { mime: string; url: string; blockIndex: number; hash?: string }) => ({
            ...r,
            url: `/api/content-asset/${paperId}/${chRel.split("/").pop()}/${r.url}`,
          }),
        );

        blocks.push({
          rootName,
          kind: blk.kind,
          label: blk.label,
          title: blk.title,
          uses: blk.uses,
          examples: blockExamples(blk),
          proofs: blockProofs(blk),
          lean: blkLean ? { ...blkLean, ref: blkLean.ref, source: leanSource } : undefined,
          // Derived from `lean`, never stored on the manifest — see `blockLean`.
          status: leanStatusBucket(blkLean),
          tex: blockTex(blk),
          caption: blockCaption(blk),
          tags: blk.tags,
          rendered,
          md,
          todos: blockTodos,
        });
      } catch (e) {
        blocks.push({ rootName, kind: "error", md: `Failed to load ${rootName}: ${e}` });
      }
    }

    return blocks;
  }
}
