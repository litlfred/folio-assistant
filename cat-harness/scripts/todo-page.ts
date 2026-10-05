/**
 * One todo's RENDERING — a thin page at `<site>/todos/<id>/` that loads the
 * todo's published JSON-LD. Issue #1908.
 *
 * @module scripts/todo-page
 *
 * The page is {@link thinPageHtml}, the shell shared with the library's
 * per-entry pages (#1899). What is todo-specific is only the skeleton the
 * script fills and the config it reads: the todo's id, where its JSON-LD and
 * the whole graph are, and — when the todo is attached to a block — the href
 * of that block's RENDERING, so the page can link a reader to the sentence the
 * todo is about. That href is a fact about renderings, so it lives on this
 * page and never on the todo (*"asset doesnt know about its renderings"*).
 *
 * The script and stylesheet are static assets under `assets/todos/`, shared
 * by every todo page, so a page is a few hundred bytes of identity.
 */
import type { TodoIndexItem } from "../schemas/todo-index.js";
import { escHtml, thinPageConfigOf, thinPageHtml } from "./thin-page.ts";
import { segment } from "./todo-graph.ts";
import { builtDocsRoute, upFromDocs } from "./docs-route.ts";

/** The config block's id — how a todo page names itself, and how its generator recognises it. */
export const TODO_PAGE_CONFIG_ID = "fa-todo-page-config";

/** The shared script and stylesheet, site-relative. */
export const TODO_PAGE_SCRIPT = "assets/todos/todo-page.js";
export const TODO_PAGE_STYLESHEET = "assets/todos/todo-page.css";

/** What the page needs to know about where it sits. */
export interface TodoPageOptions {
  /**
   * The href of the attached block's RENDERING, relative to the todo page,
   * or `undefined` when the todo is attached to nothing this build renders.
   */
  targetHref?: string;
}

/** The page, for a todo at `<docs>/todos/<id>/` — every href to the docs tree is two levels up; the todo's own document is at the site root. */
export function todoPageHtml(item: TodoIndexItem, opts: TodoPageOptions = {}): string {
  const toRoot = "../../";
  const id = segment(item.id);
  // The todo's DOCUMENT is published at the SITE root its `@id` names
  // (`hoist-addressed-documents.ts`), while this page is under the docs route
  // since 2026-10-05 (issue #2188) — so its link climbs out of the docs tree.
  const own = `${toRoot}${upFromDocs(builtDocsRoute("cat-harness"))}/todos/${id}.jsonld`;
  return thinPageHtml({
    title: `Todo: ${item.id}`,
    jsonld: own,
    script: `${toRoot}${TODO_PAGE_SCRIPT}`,
    stylesheet: `${toRoot}${TODO_PAGE_STYLESHEET}`,
    configId: TODO_PAGE_CONFIG_ID,
    config: {
      id: item.id,
      jsonld: own,
      graph: `${toRoot}todos.jsonld`,
      pages: "../",
      ...(opts.targetHref ? { targetHref: opts.targetHref } : {}),
    },
    noscriptLead: "This todo",
    body: `<main class="fa-todo-page" id="fa-todo-page">
<p class="fa-todo-page-up"><a href="../">All todos</a></p>
<h1 id="fa-todo-summary">${escHtml(item.id)}</h1>
<p class="fa-todo-page-status" id="fa-todo-status" role="status">loading…</p>
<dl class="fa-todo-page-meta" id="fa-todo-meta"></dl>
<div class="fa-todo-page-body" id="fa-todo-body"></div>
<ul class="fa-todo-page-edges" id="fa-todo-edges"></ul>
<section class="fa-todo-page-siblings" id="fa-todo-siblings" hidden>
<h2>Other todos on this block</h2>
<ul id="fa-todo-sibling-list"></ul>
</section>
</main>`,
  });
}

/** Is this file a todo page — by its own declaration, not by its path? */
export function isTodoPage(content: string): boolean {
  return thinPageConfigOf(content, TODO_PAGE_CONFIG_ID) !== undefined;
}
