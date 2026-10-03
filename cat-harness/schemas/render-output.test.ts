/**
 * Each row of `RENDER_AS`'s table, held to `renderToolOutput` — bean `q2wm`.
 * The hostile inputs are the ones a renderer meets: a script tag, an event
 * attribute, a `javascript:` link, and the TAB-split bypass `safeHref`'s own
 * history records.
 */
import { describe, expect, it } from "bun:test";

import { renderToolOutput } from "./render-output.js";
import { ToolOutputSchema, ToolRenderSchema } from "./tool.js";

const SCRIPT = `<script>alert(1)</script><img src=x onerror="alert(2)">`;

describe("renderToolOutput", () => {
  it("text — the default — escapes everything, so no markup survives", () => {
    for (const out of [renderToolOutput(SCRIPT), renderToolOutput(SCRIPT, { as: "text" })]) {
      expect(out).not.toContain("<script");
      expect(out).not.toContain("<img");
      expect(out).toContain("&lt;script&gt;");
    }
  });

  it("url — links a safe scheme, and SHOWS a refused one as text", () => {
    expect(renderToolOutput("https://example.org/a", { as: "url" })).toContain('href="https://example.org/a"');
    for (const bad of ["javascript:alert(1)", "java\tscript:alert(1)", "data:text/html,<b>x</b>"]) {
      const out = renderToolOutput(bad, { as: "url" });
      expect(out).not.toContain("<a");
      expect(out).not.toContain("href=");
    }
  });

  it("markdown — renders markup, but raw HTML and a javascript: link do not survive", () => {
    const out = renderToolOutput(`# Title\n\n**bold** [ok](https://example.org) [bad](javascript:alert(1))\n\n${SCRIPT}`, {
      as: "markdown",
    });
    expect(out).toContain("<h1>Title</h1>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain('href="https://example.org"');
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onerror");
  });

  it("json — shown escaped in a <pre>, never injected", () => {
    const out = renderToolOutput(`{"a":"${"</pre><script>x</script>"}"}`, { as: "json" });
    expect(out.startsWith("<pre>")).toBe(true);
    expect(out).not.toContain("<script");
    expect(out.match(/<\/pre>/g)).toHaveLength(1);
  });
});

describe("the hint's own rules", () => {
  const port = (schema: string, render?: object) => ({ name: "o", schema: `https://x.test/tool-types.schema.json#/$defs/${schema}`, ...(render ? { render } : {}) });

  it("absent is allowed, and means text", () => {
    expect(ToolOutputSchema.safeParse(port("Markdown")).success).toBe(true);
  });

  it("anything but text needs a stated reason", () => {
    expect(ToolRenderSchema.safeParse({ as: "markdown" }).success).toBe(false);
    expect(ToolRenderSchema.safeParse({ as: "markdown", reason: "a report a reader reads" }).success).toBe(true);
    expect(ToolRenderSchema.safeParse({ as: "text" }).success).toBe(true);
  });

  it("url and markdown only on an output whose schema IS Url / Markdown", () => {
    expect(ToolOutputSchema.safeParse(port("Url", { as: "url", reason: "r" })).success).toBe(true);
    expect(ToolOutputSchema.safeParse(port("Text", { as: "url", reason: "r" })).success).toBe(false);
    expect(ToolOutputSchema.safeParse(port("Text", { as: "markdown", reason: "r" })).success).toBe(false);
  });
});
