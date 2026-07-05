/**
 * Folio Assistant — Generic HTTP/MCP server skeleton.
 *
 * Handles all content-agnostic routes (auth, feedback, branches, chat, static files)
 * and delegates content-specific requests to the active ContentAdapter.
 *
 * @module folio-assistant/server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { existsSync, readFileSync } from "fs";
import { join, resolve, extname } from "path";

import type { ContentAdapter } from "./types.js";
import { FeedbackStore } from "./core/feedback.js";
import { GitHelper } from "./core/git.js";
import { log, logDebug } from "./core/logging.js";
import { getUserRole, getUserName, getUserEmail, hasRole, forbidden } from "./core/rbac.js";
import { handleBranchGet, handleBranchPost } from "./routes/branches.js";
import { handleFeedbackGet, handleFeedbackPost } from "./routes/feedback.js";
import { handleChatPost } from "./routes/chat.js";
import { handleGlossaryGet, handleGlossaryPost } from "./routes/glossary.js";
import { registerBeansTools } from "./tools/beans-prime.js";

// ── MIME types for static serving ────────────────────────────────

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function serveFile(path: string): Response | null {
  if (!existsSync(path)) return null;
  return new Response(readFileSync(path), {
    headers: {
      "Content-Type": MIME[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ── Server configuration ─────────────────────────────────────────

export interface FolioServerConfig {
  /** Root directory of the content repo. */
  repoRoot: string;
  /** Directory for feedback storage (gitignored). */
  feedbackDir: string;
  /** Directory for the assistant UI static files. */
  assistantDir: string;
  /** Content adapter instance. */
  adapter: ContentAdapter;
  /** Server name for MCP protocol. */
  serverName?: string;
  /** Viewer HTTP port (stdio mode). Read from lean-mcp.config.json. */
  viewerPort?: number;
}

// ── Main server class ────────────────────────────────────────────

export class FolioServer {
  private mcpServer: McpServer;
  private gitHelper: GitHelper;
  private feedbackStore: FeedbackStore;
  private adapter: ContentAdapter;
  private config: FolioServerConfig;

  constructor(config: FolioServerConfig) {
    this.config = config;
    this.adapter = config.adapter;
    this.gitHelper = new GitHelper(config.repoRoot);
    this.feedbackStore = new FeedbackStore(config.feedbackDir);

    this.mcpServer = new McpServer(
      {
        name: config.serverName || "folio-assistant",
        version: "0.1.0",
      },
      { capabilities: { tools: {} } },
    );

    // Wrap server.tool with logging
    const origTool = this.mcpServer.tool.bind(this.mcpServer);
    this.mcpServer.tool = function (...args: Parameters<typeof origTool>) {
      const toolName = args[0] as string;
      const handler = args[args.length - 1] as (...a: unknown[]) => Promise<unknown>;
      args[args.length - 1] = async (...handlerArgs: unknown[]) => {
        const start = Date.now();
        log("mcp", `→ ${toolName}`, JSON.stringify(handlerArgs[0] || {}).slice(0, 120));
        try {
          const result = await (handler as Function)(...handlerArgs);
          log("mcp", `← ${toolName}`, `ok (${Date.now() - start}ms)`);
          return result;
        } catch (e) {
          log("mcp", `✗ ${toolName}`, `error: ${e instanceof Error ? e.message : String(e)} (${Date.now() - start}ms)`);
          throw e;
        }
      };
      return origTool(...args);
    } as typeof origTool;

    // Core, adapter-independent MCP tools (agent-generic work-plan priming).
    registerBeansTools(this.mcpServer, config.repoRoot);

    // Register adapter-specific MCP tools
    if (this.adapter.registerMcpTools) {
      this.adapter.registerMcpTools(this.mcpServer);
    }
  }

  /** Expose internals for the adapter. */
  getGitHelper(): GitHelper {
    return this.gitHelper;
  }
  getFeedbackStore(): FeedbackStore {
    return this.feedbackStore;
  }

  // ── GET request handler ──────────────────────────────────────

  private async handleGet(url: URL): Promise<Response | null> {
    const path = url.pathname;

    // Folio SPA
    if (path === "/folio" || path === "/folio/" || path === "/folio/index.html") {
      return serveFile(join(this.config.assistantDir, "index.html"));
    }
    if (path.startsWith("/folio/")) {
      return serveFile(join(this.config.assistantDir, path.slice("/folio/".length)));
    }

    // Branch routes
    const branchRes = handleBranchGet(url, this.gitHelper);
    if (branchRes) return branchRes;

    // Feedback routes
    const feedbackRes = handleFeedbackGet(url, this.feedbackStore);
    if (feedbackRes) return feedbackRes;

    // Glossary curator routes
    const glossaryRes = await handleGlossaryGet(url, { repoRoot: this.config.repoRoot });
    if (glossaryRes) return glossaryRes;

    // Content adapter routes
    const adapterRes = await this.adapter.handleGet(url);
    if (adapterRes) return adapterRes;

    return null;
  }

  // ── POST request handler ─────────────────────────────────────

  private async handlePost(url: URL, req: Request): Promise<Response | null> {
    // Branch operations
    const branchRes = await handleBranchPost(url, req, this.gitHelper);
    if (branchRes) return branchRes;

    // Feedback operations
    const feedbackRes = await handleFeedbackPost(url, req, this.feedbackStore, this.adapter);
    if (feedbackRes) return feedbackRes;

    // Glossary curator operations
    const glossaryRes = await handleGlossaryPost(url, req, { repoRoot: this.config.repoRoot });
    if (glossaryRes) return glossaryRes;

    // Chat
    const chatRes = await handleChatPost(url, req, this.adapter, this.feedbackStore);
    if (chatRes) return chatRes;

    // Content adapter routes
    const adapterRes = await this.adapter.handlePost(url, req);
    if (adapterRes) return adapterRes;

    return null;
  }

  // ── HTTP request dispatcher ──────────────────────────────────

  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const start = Date.now();
    logDebug("http", `${req.method} ${url.pathname}`);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", version: "0.1.0", adapter: this.adapter.type });
    }

    // Root → redirect to folio
    if (url.pathname === "/" || url.pathname === "") {
      const port = url.port ? `:${url.port}` : "";
      return Response.redirect(`${url.protocol}//${url.hostname}${port}/folio/`, 302);
    }

    // POST/DELETE
    if (req.method === "POST" || req.method === "DELETE") {
      const postRes = await this.handlePost(url, req);
      if (postRes) {
        logDebug("http", `${req.method} ${url.pathname}`, `→ ${postRes.status} (${Date.now() - start}ms)`);
        return postRes;
      }
    }

    // GET
    const getRes = await this.handleGet(url);
    if (getRes) {
      logDebug("http", `${req.method} ${url.pathname}`, `→ ${getRes.status} (${Date.now() - start}ms)`);
      return getRes;
    }

    logDebug("http", `${req.method} ${url.pathname}`, `→ 404 (${Date.now() - start}ms)`);
    return new Response("Not found", { status: 404 });
  }

  // ── Start methods ────────────────────────────────────────────

  async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);

    const viewerPort = parseInt(process.env.VIEWER_PORT || String(this.config.viewerPort ?? 3200), 10);
    const self = this;

    Bun.serve({
      port: viewerPort,
      async fetch(req) {
        return self.handleRequest(req);
      },
    });

    log("init", `MCP server started (stdio, repo: ${this.config.repoRoot})`);
    log("init", `Folio: http://localhost:${viewerPort}/folio/`);
  }

  async startHttp(): Promise<void> {
    const port = parseInt(process.env.MCP_PORT || "8080", 10);
    // Use the Web-Standard transport (Request/Response), not the Node
    // Express/http one: Bun.serve's `fetch` speaks the fetch API, and this
    // transport's `handleRequest(req: Request): Promise<Response>` matches it
    // directly. The Node `StreamableHTTPServerTransport` expects
    // `(IncomingMessage, ServerResponse)` and returns `void`, which is
    // incompatible with Bun.serve.
    const { WebStandardStreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
    );

    const httpTransport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await this.mcpServer.connect(httpTransport);

    const self = this;

    Bun.serve({
      port,
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/mcp") {
          return httpTransport.handleRequest(req);
        }
        return self.handleRequest(req);
      },
    });

    log("init", `Folio assistant started (HTTP :${port}, repo: ${this.config.repoRoot})`);
    log("init", `MCP: http://localhost:${port}/mcp`);
    log("init", `Folio: http://localhost:${port}/folio/`);
  }
}
