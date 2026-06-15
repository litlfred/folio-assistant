#!/usr/bin/env python3
"""generate-folio-index.py — build a root index.html that links to per-paper viewers.

Usage
-----
    python generate-folio-index.py OUTPUT_HTML \\
        --papers-json PAPERS_JSON \\
        [--base-url BASE_URL] \\
        [--repo OWNER/REPO] \\
        [--branch BRANCH] [--sha SHA]

The PAPERS_JSON is a JSON array (as produced by extract-folio.py) with
at least `dir` and `title` per entry.

For each paper, the generated page links to:
    papers/<dir>/              paper viewer (index.html, embeds the PDF)
    papers/<dir>/<dir>.pdf     direct PDF download

It also links to shared resources: Blueprint, API Docs, Axiom Report, etc.
"""

from __future__ import annotations

import argparse
import html as html_mod
import json
import sys
from pathlib import Path

_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{folio_title}</title>
<style>
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
:root {{
  --bg: #ffffff; --fg: #1a1a1a; --link: #0055cc;
  --header-bg: #1b1f23; --header-fg: #e0e0e0;
  --card-bg: #f8f9fa; --card-border: #e1e4e8; --card-hover: #edf2f7;
  --badge-bg: #e8e8e8; --badge-fg: #333;
  --muted: #6b7280; --accent: #0055cc;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --bg: #0d1117; --fg: #c9d1d9; --link: #58a6ff;
    --header-bg: #161b22; --header-fg: #e0e0e0;
    --card-bg: #161b22; --card-border: #30363d; --card-hover: #1c2128;
    --badge-bg: #30363d; --badge-fg: #c9d1d9;
    --muted: #8b949e; --accent: #58a6ff;
  }}
}}
[data-theme="dark"] {{
  --bg: #0d1117; --fg: #c9d1d9; --link: #58a6ff;
  --header-bg: #161b22; --header-fg: #e0e0e0;
  --card-bg: #161b22; --card-border: #30363d; --card-hover: #1c2128;
  --badge-bg: #30363d; --badge-fg: #c9d1d9;
  --muted: #8b949e; --accent: #58a6ff;
}}
body {{
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  color: var(--fg); background: var(--bg);
  transition: background 0.25s, color 0.25s;
}}
a {{ color: var(--link); text-decoration: none; }}
a:hover {{ text-decoration: underline; }}

.site-header {{
  background: var(--header-bg); color: var(--header-fg);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.2rem; height: 52px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.15);
  font-size: 0.95rem; position: sticky; top: 0; z-index: 100;
}}
.site-header .title {{
  font-weight: 700; font-size: 1.05rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}}
.site-header .controls {{ display: flex; gap: 0.5rem; align-items: center; }}
.gh-badge {{
  display: inline-block; background: var(--badge-bg); color: var(--badge-fg);
  padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; text-decoration: none;
}}
.gh-badge:hover {{ filter: brightness(0.85); text-decoration: none; }}
.theme-toggle {{
  background: none; border: 1px solid rgba(255,255,255,0.2);
  color: var(--header-fg); padding: 4px 8px; border-radius: 4px;
  cursor: pointer; font-size: 1rem; line-height: 1;
}}

.content {{
  max-width: 900px; margin: 2rem auto; padding: 0 1.2rem;
}}
.content h2 {{
  font-size: 1.3rem; margin-bottom: 1rem; color: var(--fg);
}}

.paper-card {{
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 10px; padding: 20px 24px; margin-bottom: 16px;
  transition: background 0.15s, box-shadow 0.15s;
}}
.paper-card:hover {{
  background: var(--card-hover);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}}
.paper-title {{
  font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;
}}
.paper-title a {{ color: var(--fg); }}
.paper-title a:hover {{ color: var(--accent); text-decoration: none; }}
.paper-description {{
  color: var(--muted); font-size: 0.9rem; margin-bottom: 12px;
  line-height: 1.5;
}}
.paper-links {{
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}}
.paper-link {{
  display: inline-block; padding: 5px 14px; border-radius: 6px;
  font-size: 0.82rem; font-weight: 500; text-decoration: none;
  border: 1px solid var(--card-border); color: var(--fg);
  transition: background 0.15s;
}}
.paper-link:hover {{ background: var(--card-hover); text-decoration: none; }}
.paper-link.primary {{
  background: var(--accent); color: #fff; border-color: var(--accent);
}}
.paper-link.primary:hover {{ opacity: 0.85; }}
.paper-link.pdf {{
  background: #d73a49; color: #fff; border-color: #d73a49;
}}
.paper-link.pdf:hover {{ background: #bf2a3a; }}

.paper-tags {{
  display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 10px;
}}
.tag {{
  display: inline-block; background: var(--badge-bg); color: var(--badge-fg);
  padding: 2px 8px; border-radius: 10px; font-size: 0.72rem;
}}

.resources-section {{
  margin-top: 2rem;
}}
.resources-grid {{
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}}
.resource-link {{
  display: block; padding: 12px 16px;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 8px; font-size: 0.88rem; text-decoration: none;
  color: var(--fg); transition: background 0.15s;
}}
.resource-link:hover {{ background: var(--card-hover); text-decoration: none; }}
.resource-label {{ font-weight: 600; }}
.resource-desc {{ color: var(--muted); font-size: 0.78rem; margin-top: 2px; }}

{source_bar_css}
</style>
</head>
<body>

<header class="site-header">
  <span class="title">{folio_title}</span>
  <span class="controls">
    {header_badges}
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">&#x1F319;</button>
  </span>
</header>

{source_bar}

<div class="content">
  <h2>Papers</h2>
  {paper_cards}

  <div class="resources-section">
    <h2>Formalization Resources</h2>
    <div class="resources-grid">
      <a class="resource-link" href="blueprint/">
        <div class="resource-label">Blueprint</div>
        <div class="resource-desc">Interactive dependency graph</div>
      </a>
      <a class="resource-link" href="blueprint.pdf">
        <div class="resource-label">Blueprint PDF</div>
        <div class="resource-desc">Print version</div>
      </a>
      <a class="resource-link" href="docs/">
        <div class="resource-label">API Documentation</div>
        <div class="resource-desc">doc-gen4 Lean docs</div>
      </a>
      <a class="resource-link" href="axiom-report.txt">
        <div class="resource-label">Axiom Report</div>
        <div class="resource-desc">Sorry audit &amp; axiom deps</div>
      </a>
      <a class="resource-link" href="dependency-graph.svg">
        <div class="resource-label">Dependency Graph</div>
        <div class="resource-desc">Visual proof dependencies</div>
      </a>
      <a class="resource-link" href="lean/">
        <div class="resource-label">Lean Source</div>
        <div class="resource-desc">Raw Lean 4 files</div>
      </a>
      <a class="resource-link" href="schema-docs/">
        <div class="resource-label">Schema Docs</div>
        <div class="resource-desc">Content-object type reference</div>
      </a>
    </div>
  </div>
</div>

<script>
(function(){{
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var saved = localStorage.getItem('folio-assistant-theme');
  if (saved) root.setAttribute('data-theme', saved);
  btn.addEventListener('click', function(){{
    var cur = root.getAttribute('data-theme');
    var next;
    if (!cur) {{
      next = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    }} else {{
      next = cur === 'dark' ? 'light' : 'dark';
    }}
    root.setAttribute('data-theme', next);
    localStorage.setItem('folio-assistant-theme', next);
    btn.textContent = next === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }});
  var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  btn.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
}})();
</script>
</body>
</html>
"""


def _render_paper_card(paper: dict, is_feature: bool = False) -> str:
    d = html_mod.escape(paper["dir"])
    title = html_mod.escape(paper.get("title", paper["dir"]))
    desc = html_mod.escape(paper.get("description", ""))
    prefix = f"papers/{d}"

    tags_html = ""
    if paper.get("tags"):
        tags_html = '<div class="paper-tags">' + "".join(
            f'<span class="tag">{html_mod.escape(t)}</span>' for t in paper["tags"]
        ) + "</div>"

    return f"""<div class="paper-card">
  <div class="paper-title"><a href="{prefix}/">{title}</a></div>
  <div class="paper-description">{desc}</div>
  <div class="paper-links">
    <a class="paper-link primary" href="{prefix}/">View Paper</a>
    <a class="paper-link pdf" href="{prefix}/{d}.pdf">PDF</a>
  </div>
  {tags_html}
</div>"""


def generate_folio_index(
    papers: list[dict],
    folio_title: str = "litlfred's Papers",
    repo: str | None = None,
    branch: str | None = None,
    sha: str | None = None,
) -> str:
    is_main = branch is None or branch == "main"

    # Header badges
    badges = []
    if repo:
        repo_url = f"https://github.com/{repo}"
        badges.append(f'<a class="gh-badge" href="{repo_url}" target="_blank">GitHub</a>')
        if branch and not is_main:
            badges.append(
                f'<a class="gh-badge" href="{repo_url}/tree/{html_mod.escape(branch)}" '
                f'target="_blank">{html_mod.escape(branch)}</a>'
            )
    header_badges = "\n    ".join(badges)

    # Source bar
    source_bar = ""
    source_bar_css = ""
    if not is_main and repo and branch:
        source_bar_css = """.source-bar {
  display: flex; align-items: center; justify-content: center;
  gap: 0.6rem; padding: 8px 1rem;
  background: var(--card-bg); border-bottom: 1px solid var(--card-border);
  font-size: 0.82rem;
}"""
        repo_url = f"https://github.com/{repo}"
        parts = ['<div class="source-bar">']
        parts.append(f'  <a class="gh-badge" href="{repo_url}/tree/{html_mod.escape(branch)}" target="_blank">Branch: {html_mod.escape(branch)}</a>')
        if sha:
            parts.append(f'  <a class="gh-badge" href="{repo_url}/commit/{sha}" target="_blank">{sha[:7]}</a>')
        parts.append("</div>")
        source_bar = "\n".join(parts)

    # Paper cards
    paper_cards = "\n".join(_render_paper_card(p, not is_main) for p in papers)

    return _TEMPLATE.format(
        folio_title=html_mod.escape(folio_title),
        header_badges=header_badges,
        source_bar=source_bar,
        source_bar_css=source_bar_css,
        paper_cards=paper_cards,
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate folio root index.html")
    ap.add_argument("output_html", help="Output path for index.html")
    ap.add_argument("--papers-json", required=True, help="Path to papers JSON (from extract-folio.py)")
    ap.add_argument("--folio-title", default="litlfred's Papers", help="Folio title")
    ap.add_argument("--repo", default=None, help="GitHub owner/repo")
    ap.add_argument("--branch", default=None, help="Git branch name")
    ap.add_argument("--sha", default=None, help="Git commit SHA")
    args = ap.parse_args()

    papers = json.loads(Path(args.papers_json).read_text(encoding="utf-8"))
    result = generate_folio_index(
        papers=papers,
        folio_title=args.folio_title,
        repo=args.repo,
        branch=args.branch,
        sha=args.sha,
    )
    Path(args.output_html).write_text(result, encoding="utf-8")
    print(f"Folio index written to {args.output_html}")


if __name__ == "__main__":
    main()
