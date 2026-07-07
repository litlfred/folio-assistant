/**
 * Folio Assistant — Core types and ContentAdapter interface.
 *
 * Content adapters implement this interface to plug any content type
 * (papers, guidelines, documentation, etc.) into the folio platform.
 *
 * @module folio-assistant/types
 */

// ── Role-based access control ────────────────────────────────────

export type UserRole = "viewer" | "collaborator" | "owner";

export const ROLE_LEVELS: Record<UserRole, number> = {
  viewer: 1,
  collaborator: 2,
  owner: 3,
};

// ── Feedback types ───────────────────────────────────────────────

export interface FeedbackItem {
  id: string;
  summary: string;
  comment?: string;
  status: "open" | "in_progress" | "blocked" | "resolved" | "wontfix";
  priority: "low" | "medium" | "high" | "critical";
  origin: "human" | "agent";
  author: string;
  authorEmail: string;
  assignee: string;
  createdAt: string;
}

export interface NewFeedback {
  summary: string;
  comment?: string;
  priority?: string;
  assignee?: string;
}

// ── Content adapter interface ────────────────────────────────────

export interface FolioItem {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  authors: string[];
  date?: string;
  stats: Record<string, number>;
}

export interface OutlineSection {
  title: string;
  label?: string;
  blockCount: number;
}

export interface OutlineChapter {
  number?: number;
  tabLabel?: string;
  title: string;
  label?: string;
  dir: string;
  sections: OutlineSection[];
}

export interface ContentOutline {
  id: string;
  title: string;
  authors: string[];
  affiliations?: string[];
  date?: string;
  chapters: OutlineChapter[];
  branch: string;
}

export interface ResolvedBlock {
  rootName: string;
  kind: string;
  label?: string;
  title?: string;
  uses?: string[];
  examples?: string[];
  proofs?: string[];
  lean?: { ref: string; file?: string; validation?: string; source?: string };
  status?: string;
  tex?: string;
  caption?: string;
  tags?: string[];
  rendered?: Array<{ mime: string; url: string; blockIndex: number; hash?: string }>;
  md: string;
  todos?: unknown[];
}

export interface ResolvedSection {
  title: string;
  label?: string;
  blocks: ResolvedBlock[];
  subsections?: ResolvedSection[];
}

export interface ResolvedChapter {
  number?: number;
  tabLabel?: string;
  title: string;
  label?: string;
  sections: ResolvedSection[];
  todos?: unknown[];
}

export interface ResolvedDocument {
  id: string;
  title: string;
  authors: string[];
  affiliations?: string[];
  date?: string;
  macros?: Record<string, string>;
  chapters: ResolvedChapter[];
  todos?: unknown[];
  branch: string;
  /** Flattened O(1) lookup: rootName → block. */
  blocksByName?: Map<string, ResolvedBlock>;
}

export interface BlockDiff {
  rootName: string;
  kind: string;
  label?: string;
  title?: string;
  status: "added" | "removed" | "changed" | "unchanged";
  mdDiff?: { base: string; head: string };
  leanDiff?: { base: string; head: string };
  statusDiff?: { base: string; head: string };
  todos?: unknown[];
}

export interface DocumentDiff {
  base: string;
  head: string;
  documentId: string;
  blocks: BlockDiff[];
  summary: { added: number; removed: number; changed: number; unchanged: number };
  mergeBase?: string;
}

export interface BranchCharacterization {
  title: string;
  summary: string;
  categories: string[];
  impact: "minor" | "moderate" | "major";
  suggestions?: string[];
  error?: string;
}

export interface TriageResult {
  assessment: string;
  actionable: boolean;
  proposedEdit?: {
    description: string;
    newMd?: string;
    targetBranch?: string;
  };
  error?: string;
}

export interface SectionStub {
  title: string;
  label?: string;
  blockCount: number;
  blockStubs: Array<{
    rootName: string;
    kind: string;
    label?: string;
    title?: string;
    status?: string;
    lean?: { ref?: string; file?: string; validation?: string };
    todoCount: number;
  }>;
}

export interface ChapterDetail {
  number?: number;
  tabLabel?: string;
  title: string;
  label?: string;
  dir: string;
  sections: SectionStub[];
  todos?: unknown[];
}

/**
 * ContentAdapter — the interface each content type must implement.
 *
 * The folio server delegates all content-specific operations to adapters.
 * Generic operations (auth, feedback CRUD, git, branch management) are
 * handled by the core server.
 */
export interface ContentAdapter {
  /** Adapter type identifier (e.g. "paper", "guideline"). */
  readonly type: string;

  /** Human-readable name for logs/UI. */
  readonly name: string;

  /** Root directory of the content repo. */
  readonly repoRoot: string;

  // ── Discovery ────────────────────────────────────────────────

  /** List all content items (papers, guidelines, etc.) */
  listItems(branch?: string): Promise<{ title: string; papers: FolioItem[]; branch: string }>;

  /** Get lightweight outline (chapter/section stubs, no block content). */
  getOutline(itemId: string, branch?: string): Promise<ContentOutline | null>;

  /** Get chapter detail (section stubs with block metadata, no md/lean). */
  getChapterDetail(itemId: string, chapterDir: string, branch?: string): Promise<ChapterDetail | null>;

  /** Get full section with block content (md, lean source). */
  getSection(itemId: string, chapterDir: string, sectionIndex: number, branch?: string): Promise<ResolvedSection | null>;

  /** Get full resolved document tree. */
  getDocument(itemId: string, branch?: string): Promise<ResolvedDocument | null>;

  // ── Editing ──────────────────────────────────────────────────

  /** Save block markdown content. Returns the file path written. */
  saveBlock(itemId: string, rootName: string, md: string): Promise<string>;

  /** Invalidate caches for a document (call after edits). */
  invalidateCache(itemId?: string): void;

  // ── Diff ─────────────────────────────────────────────────────

  /** Compute diff between two branches for a document. */
  computeDiff(itemId: string, base: string, head: string): Promise<DocumentDiff>;

  // ── AI ───────────────────────────────────────────────────────

  /** Characterize branch changes via AI (or fallback heuristic). */
  characterizeChanges(diff: DocumentDiff): Promise<BranchCharacterization>;

  /** AI triage of feedback on a block. */
  triageFeedback(
    todo: FeedbackItem,
    blockContent: string,
    blockKind: string,
    itemId: string,
    rootName: string,
  ): Promise<TriageResult>;

  // ── Chat ─────────────────────────────────────────────────────

  /** Get chat tools for the embedded assistant. */
  getChatTools(): unknown[];

  /** Execute a chat tool call. Returns JSON string result. */
  executeChatTool(name: string, input: Record<string, unknown>, context?: Record<string, unknown>): Promise<string>;

  /** Get the system prompt for the chat assistant. */
  getChatSystemPrompt(mode: string, userRole: UserRole, userName: string, context?: Record<string, unknown>): string;

  // ── Content-specific routes ──────────────────────────────────

  /** Handle content-specific GET requests. Returns Response or null. */
  handleGet(url: URL): Promise<Response | null>;

  /** Handle content-specific POST requests. Returns Response or null. */
  handlePost(url: URL, req: Request): Promise<Response | null>;

  // ── Optional extensions ──────────────────────────────────────

  /** Register content-specific MCP tools on the server. */
  registerMcpTools?(server: unknown): void;
}

// ── Server config ────────────────────────────────────────────────

export interface FolioConfig {
  subscriptions: Array<{
    repo: string;
    type: string;
    branch?: string;
    label?: string;
    visibility?: "private" | "public";
  }>;
  domain?: string;
  auth?: {
    github?: { enabled: boolean };
    google?: { enabled: boolean; viewersWhitelist?: string };
  };
}
