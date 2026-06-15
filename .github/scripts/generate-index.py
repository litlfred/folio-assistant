#!/usr/bin/env python3
"""generate-index.py — build a gh-pages index.html with paper/visualizer toggle.

Usage
-----
    python generate-index.py OUTPUT_HTML PAPER_EMBED \\
        --pdf PDF_NAME [--md MD_NAME] \\
        [--visualizer VISUALIZER_HTML] \\
        [--builds-json BUILDS_JSON] \\
        [--branch BRANCH] [--repo OWNER/REPO] [--sha SHA] \\
        [--diff-pdf DIFF_PDF_NAME]

Produces a single-page shell that lets the user toggle between:
  - the paper (PAPER_EMBED rendered in an <iframe>; typically the PDF,
    which modern browsers render inline as application/pdf)
  - the interactive visualizer (Bring's surface / Three.js)
  - recent feature builds (main builds only, read from builds.json)
"""

from __future__ import annotations

import argparse
import html as html_mod
import json
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Template
# ---------------------------------------------------------------------------

_INDEX_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quantum Observable Universe{title_suffix}</title>
<style>
/* ── Reset & base ────────────────────────────────────────────── */
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
:root {{
  --bg: #ffffff; --fg: #1a1a1a; --link: #0055cc;
  --header-bg: #1b1f23; --header-fg: #e0e0e0;
  --tab-bg: #f0f0f0; --tab-active: #ffffff; --tab-hover: #e0e0e0;
  --card-bg: #f8f9fa; --card-border: #e1e4e8; --card-hover: #edf2f7;
  --badge-bg: #e8e8e8; --badge-fg: #333;
  --muted: #6b7280;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --bg: #0d1117; --fg: #c9d1d9; --link: #58a6ff;
    --header-bg: #161b22; --header-fg: #e0e0e0;
    --tab-bg: #21262d; --tab-active: #0d1117; --tab-hover: #30363d;
    --card-bg: #161b22; --card-border: #30363d; --card-hover: #1c2128;
    --badge-bg: #30363d; --badge-fg: #c9d1d9;
    --muted: #8b949e;
  }}
}}
[data-theme="dark"] {{
  --bg: #0d1117; --fg: #c9d1d9; --link: #58a6ff;
  --header-bg: #161b22; --header-fg: #e0e0e0;
  --tab-bg: #21262d; --tab-active: #0d1117; --tab-hover: #30363d;
  --card-bg: #161b22; --card-border: #30363d; --card-hover: #1c2128;
  --badge-bg: #30363d; --badge-fg: #c9d1d9;
  --muted: #8b949e;
}}
body {{
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  color: var(--fg); background: var(--bg);
  transition: background 0.25s, color 0.25s;
}}
a {{ color: var(--link); text-decoration: none; }}
a:hover {{ text-decoration: underline; }}

/* ── Header ──────────────────────────────────────────────────── */
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

/* ── Tabs ─────────────────────────────────────────────────────── */
.tab-bar {{
  display: flex; background: var(--tab-bg);
  border-bottom: 1px solid var(--card-border);
  padding: 0 1rem; gap: 0;
}}
.tab-btn {{
  padding: 12px 20px; border: none; background: transparent;
  color: var(--fg); font-size: 0.9rem; cursor: pointer;
  border-bottom: 2px solid transparent; font-weight: 500;
  transition: all 0.15s;
}}
.tab-btn:hover {{ background: var(--tab-hover); }}
.tab-btn.active {{
  background: var(--tab-active);
  border-bottom-color: var(--link); color: var(--link); font-weight: 600;
}}
.tab-panel {{ display: none; }}
.tab-panel.active {{ display: block; }}

/* ── Paper iframe ─────────────────────────────────────────────── */
.paper-frame, .viz-frame {{
  width: 100%; border: none;
  height: calc(100vh - 100px);
}}

/* ── Feature builds ───────────────────────────────────────────── */
.builds-section {{
  max-width: 900px; margin: 2rem auto; padding: 0 1.2rem;
}}
.builds-section h2 {{
  font-size: 1.3rem; margin-bottom: 1rem; color: var(--fg);
}}
.build-card {{
  display: flex; align-items: center; justify-content: space-between;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 8px; padding: 14px 18px; margin-bottom: 10px;
  transition: background 0.15s;
}}
.build-card:hover {{ background: var(--card-hover); }}
.build-info {{ flex: 1; min-width: 0; }}
.build-branch {{
  font-weight: 600; font-size: 0.95rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}}
.build-meta {{ color: var(--muted); font-size: 0.8rem; margin-top: 2px; }}
.build-links {{ display: flex; gap: 0.5rem; flex-shrink: 0; margin-left: 1rem; }}
.build-link {{
  display: inline-block; padding: 4px 12px; border-radius: 6px;
  font-size: 0.8rem; font-weight: 500; text-decoration: none;
  border: 1px solid var(--card-border); color: var(--fg);
}}
.build-link:hover {{ background: var(--tab-hover); text-decoration: none; }}
.build-link.pdf {{ background: #d73a49; color: #fff; border-color: #d73a49; }}
.build-link.pdf:hover {{ background: #bf2a3a; }}
.build-link.html-link {{ background: var(--link); color: #fff; border-color: var(--link); }}
.build-link.html-link:hover {{ opacity: 0.85; }}
.no-builds {{ color: var(--muted); font-style: italic; padding: 2rem 0; text-align: center; }}

/* ── Source bar (feature builds) ──────────────────────────────── */
.source-bar {{
  display: flex; align-items: center; justify-content: center;
  gap: 0.6rem; padding: 8px 1rem;
  background: var(--card-bg); border-bottom: 1px solid var(--card-border);
  font-size: 0.82rem;
}}

/* ── Download bar ─────────────────────────────────────────────── */
.download-bar {{
  display: flex; align-items: center; justify-content: center;
  gap: 1rem; padding: 10px 1rem;
  background: var(--card-bg); border-bottom: 1px solid var(--card-border);
  font-size: 0.85rem;
}}
</style>
</head>
<body>

<!-- Header -->
<header class="site-header">
  <span class="title">Quantum Observable Universe</span>
  <span class="controls">
    {header_badges}
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">&#x1F319;</button>
  </span>
</header>

{source_bar}

<!-- Download bar -->
<div class="download-bar">
  <a href="{pdf_name}">&#x1F4C4; Download PDF</a>
  {md_link}
  {extra_downloads}
</div>

<!-- Tab bar -->
<div class="tab-bar">
  <button class="tab-btn active" data-tab="paper">Paper</button>
  {visualizer_tab}
  {builds_tab}
</div>

<!-- Paper panel -->
<div id="panel-paper" class="tab-panel active">
  <iframe class="paper-frame" src="{paper_embed_src}" title="Paper"></iframe>
</div>

{visualizer_panel}

{builds_panel}

<script>
// Theme toggle
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

// Tab switching
document.querySelectorAll('.tab-btn').forEach(function(btn){{
  btn.addEventListener('click', function(){{
    document.querySelectorAll('.tab-btn').forEach(function(b){{ b.classList.remove('active'); }});
    document.querySelectorAll('.tab-panel').forEach(function(p){{ p.classList.remove('active'); }});
    btn.classList.add('active');
    var panel = document.getElementById('panel-' + btn.getAttribute('data-tab'));
    if (panel) panel.classList.add('active');
  }});
}});

{builds_js}
</script>
</body>
</html>
"""


def _builds_js_main(builds_json_url: str) -> str:
    """JS to fetch builds.json and render the 5 most recent feature builds."""
    return f"""
// Load feature builds
(function(){{
  fetch('{builds_json_url}')
    .then(function(r){{ return r.ok ? r.json() : []; }})
    .then(function(builds){{
      var container = document.getElementById('builds-list');
      if (!container) return;
      if (!builds || builds.length === 0) {{
        container.innerHTML = '<div class="no-builds">No feature builds yet.</div>';
        return;
      }}
      // Sort by timestamp descending, take 5
      builds.sort(function(a,b){{ return (b.timestamp||'').localeCompare(a.timestamp||''); }});
      var recent = builds.slice(0, 5);
      var html = '';
      recent.forEach(function(b){{
        var links = '';
        if (b.pdf_url) links += '<a class="build-link pdf" href="' + b.pdf_url + '">PDF</a>';
        if (b.diff_pdf_url) links += '<a class="build-link" href="' + b.diff_pdf_url + '">Diff</a>';
        if (b.html_url) links += '<a class="build-link html-link" href="' + b.html_url + '">HTML</a>';
        if (b.source_url) links += '<a class="build-link" href="' + b.source_url + '">Source</a>';
        var meta = '';
        if (b.sha) meta += b.sha.substring(0,7);
        if (b.timestamp) meta += ' &middot; ' + b.timestamp.substring(0,10);
        html += '<div class="build-card">'
          + '<div class="build-info">'
          + '<div class="build-branch">&#x1F33F; ' + (b.branch||'unknown') + '</div>'
          + '<div class="build-meta">' + meta + '</div>'
          + '</div>'
          + '<div class="build-links">' + links + '</div>'
          + '</div>';
      }});
      container.innerHTML = html;
    }})
    .catch(function(){{
      var c = document.getElementById('builds-list');
      if (c) c.innerHTML = '<div class="no-builds">Could not load feature builds.</div>';
    }});
}})();
"""


def generate_index(
    paper_embed_src: str,
    pdf_name: str,
    md_name: str,
    visualizer_name: str | None = None,
    builds_json: str | None = None,
    branch: str | None = None,
    repo: str | None = None,
    sha: str | None = None,
    diff_pdf: str | None = None,
) -> str:
    """Generate the index.html content."""
    is_main = branch is None or branch == "main"

    # Title suffix
    title_suffix = "" if is_main else f" — {branch}"

    # Header badges
    badges = []
    if repo:
        repo_url = f"https://github.com/{repo}"
        badges.append(f'<a class="gh-badge" href="{repo_url}" target="_blank">GitHub</a>')
        if branch and not is_main:
            badges.append(
                f'<a class="gh-badge" href="{repo_url}/tree/{html_mod.escape(branch)}" '
                f'target="_blank">&#x1F33F; {html_mod.escape(branch)}</a>'
            )
    header_badges = "\n    ".join(badges)

    # Source bar (feature branches only)
    source_bar = ""
    if not is_main and repo and branch:
        repo_url = f"https://github.com/{repo}"
        parts = [f'<div class="source-bar">']
        parts.append(f'  <a class="gh-badge" href="{repo_url}/tree/{html_mod.escape(branch)}" target="_blank">&#x1F33F; Branch: {html_mod.escape(branch)}</a>')
        if sha:
            parts.append(f'  <a class="gh-badge" href="{repo_url}/commit/{sha}" target="_blank">&#x1F4DD; {sha[:7]}</a>')
        parts.append('</div>')
        source_bar = "\n".join(parts)

    # Extra downloads
    extra_parts = []
    if diff_pdf:
        extra_parts.append(f'<a href="{html_mod.escape(diff_pdf)}">&#x1F504; Diff PDF</a>')
    extra_downloads = "  ".join(extra_parts)

    # Visualizer tab/panel
    if visualizer_name:
        visualizer_tab = '<button class="tab-btn" data-tab="visualizer">Visualizer</button>'
        visualizer_panel = f"""<!-- Visualizer panel -->
<div id="panel-visualizer" class="tab-panel">
  <iframe class="viz-frame" src="{html_mod.escape(visualizer_name)}" title="Bring\'s Surface Visualizer"></iframe>
</div>"""
    else:
        visualizer_tab = ""
        visualizer_panel = ""

    # Builds tab/panel (main only)
    if is_main and builds_json:
        builds_tab = '<button class="tab-btn" data-tab="builds">Feature Builds</button>'
        builds_panel = """<!-- Feature builds panel -->
<div id="panel-builds" class="tab-panel">
  <div class="builds-section">
    <h2>Recent Feature Builds</h2>
    <div id="builds-list"><div class="no-builds">Loading...</div></div>
  </div>
</div>"""
        builds_js = _builds_js_main(builds_json)
    elif not is_main:
        # Feature builds also get a builds tab with their own artifacts
        builds_tab = ""
        builds_panel = ""
        builds_js = ""
    else:
        builds_tab = ""
        builds_panel = ""
        builds_js = ""

    return _INDEX_TEMPLATE.format(
        title_suffix=title_suffix,
        header_badges=header_badges,
        source_bar=source_bar,
        pdf_name=html_mod.escape(pdf_name),
        paper_embed_src=html_mod.escape(paper_embed_src),
        md_link=f'<a href="{html_mod.escape(md_name)}">&#x1F4DD; Markdown</a>' if md_name else "",
        extra_downloads=extra_downloads,
        visualizer_tab=visualizer_tab,
        visualizer_panel=visualizer_panel,
        builds_tab=builds_tab,
        builds_panel=builds_panel,
        builds_js=builds_js,
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate gh-pages index.html with paper/visualizer toggle")
    ap.add_argument("output_html", help="Output path for index.html")
    ap.add_argument(
        "paper_embed",
        help="Filename to embed in the Paper tab's <iframe> "
             "(typically the PDF; modern browsers render application/pdf inline).",
    )
    ap.add_argument("--pdf", required=True, help="PDF filename (used in download links)")
    ap.add_argument("--md", default=None, help="Markdown filename (optional)")
    ap.add_argument("--visualizer", default=None, help="Visualizer HTML filename")
    ap.add_argument("--builds-json", default=None, help="URL or path to builds.json")
    ap.add_argument("--branch", default=None, help="Git branch name")
    ap.add_argument("--repo", default=None, help="GitHub owner/repo")
    ap.add_argument("--sha", default=None, help="Git commit SHA")
    ap.add_argument("--diff-pdf", default=None, help="Diff PDF filename")
    args = ap.parse_args()

    result = generate_index(
        paper_embed_src=args.paper_embed,
        pdf_name=args.pdf,
        md_name=args.md,
        visualizer_name=args.visualizer,
        builds_json=args.builds_json,
        branch=args.branch,
        repo=args.repo,
        sha=args.sha,
        diff_pdf=args.diff_pdf,
    )
    Path(args.output_html).write_text(result, encoding="utf-8")
    print(f"✓ Index HTML written to {args.output_html}")


if __name__ == "__main__":
    main()
