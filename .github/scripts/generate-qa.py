#!/usr/bin/env python3
"""generate-qa.py — build a QA report page from captured LaTeX build warnings.

Usage
-----
    python generate-qa.py WARNINGS_FILE OUTPUT_HTML [--branch BRANCH] [--repo OWNER/REPO] [--sha SHA]

The script reads a plain-text file of LaTeX warnings / errors (captured from
``pdflatex`` / ``bibtex`` stderr / log) and produces a self-contained HTML
page summarising them.  This page is deployed **only** on feature-branch
builds so authors can quickly triage issues before merging.

Requires only the Python 3 standard library (>=3.8).
"""

from __future__ import annotations

import argparse
import html as html_mod
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Warning parsing
# ---------------------------------------------------------------------------

_WARN_PATTERNS = [
    # LaTeX Warning: ...
    re.compile(r"^(LaTeX Warning:.+)$", re.MULTILINE),
    # Package <name> Warning: ...
    re.compile(r"^(Package \S+ Warning:.+)$", re.MULTILINE),
    # Underfull / Overfull
    re.compile(r"^((?:Underfull|Overfull) \\[hv]box .+)$", re.MULTILINE),
    # Undefined references / citations
    re.compile(r"^(.*(?:Reference|Citation) .+ undefined.*)$", re.MULTILINE),
    # BibTeX warnings
    re.compile(r"^(Warning--.+)$", re.MULTILINE),
    # Missing citations
    re.compile(r"^(.*Citation .+ undefined.*)$", re.MULTILINE),
]


def parse_warnings(text: str) -> list[dict]:
    """Extract warnings from a LaTeX build log, returning de-duplicated list."""
    seen: set[str] = set()
    warnings: list[dict] = []
    for pat in _WARN_PATTERNS:
        for m in pat.finditer(text):
            msg = m.group(1).strip()
            if msg in seen:
                continue
            seen.add(msg)
            # Try to classify
            if "Overfull" in msg or "Underfull" in msg:
                category = "Box"
            elif "undefined" in msg.lower():
                category = "Reference"
            elif "Citation" in msg:
                category = "Citation"
            elif "BibTeX" in msg or msg.startswith("Warning--"):
                category = "BibTeX"
            else:
                category = "LaTeX"
            warnings.append({"message": msg, "category": category})
    return warnings


# ---------------------------------------------------------------------------
# HTML generation
# ---------------------------------------------------------------------------

_QA_CSS = """
:root {
  --bg: #fff; --fg: #222; --hdr: #f0f0f0; --warn-bg: #fff8e1;
  --err-bg: #ffeaea; --ok-bg: #e8f5e9; --border: #ddd; --link: #0055cc;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #181a1b; --fg: #d4d4d4; --hdr: #23272a; --warn-bg: #3e3520;
    --err-bg: #3e2020; --ok-bg: #1e3e20; --border: #444; --link: #6cb4ff;
  }
}
[data-theme="dark"] {
  --bg: #181a1b; --fg: #d4d4d4; --hdr: #23272a; --warn-bg: #3e3520;
  --err-bg: #3e2020; --ok-bg: #1e3e20; --border: #444; --link: #6cb4ff;
}
body {
  max-width: 900px; margin: 0 auto; padding: 2rem 1.2rem;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--fg); background: var(--bg); line-height: 1.6;
}
h1 { font-size: 1.4rem; }
a { color: var(--link); }
.summary { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
.card {
  padding: 0.8rem 1.2rem; border-radius: 8px; min-width: 120px;
  text-align: center; font-size: 1.1rem; font-weight: 700;
}
.card small { display: block; font-weight: 400; font-size: 0.8rem; color: var(--fg); }
.card.warn { background: var(--warn-bg); }
.card.err  { background: var(--err-bg); }
.card.ok   { background: var(--ok-bg); }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border); }
th { background: var(--hdr); position: sticky; top: 0; }
tr:hover td { background: var(--warn-bg); }
.badge {
  display: inline-block; padding: 1px 7px; border-radius: 8px; font-size: 0.78rem;
  font-weight: 600; background: var(--hdr); margin-right: 0.3rem;
}
.gh-badge {
  display: inline-block; background: var(--hdr); color: var(--fg);
  padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; text-decoration: none;
  margin-right: 0.4rem;
}
"""


def generate_qa_html(
    warnings: list[dict],
    branch: str | None = None,
    repo: str | None = None,
    sha: str | None = None,
) -> str:
    """Return a self-contained QA HTML page."""
    total = len(warnings)
    cats: dict[str, int] = {}
    for w in warnings:
        cats[w["category"]] = cats.get(w["category"], 0) + 1

    lines: list[str] = []
    lines.append("<!DOCTYPE html>")
    lines.append('<html lang="en">')
    lines.append("<head>")
    lines.append('  <meta charset="utf-8">')
    lines.append('  <meta name="viewport" content="width=device-width,initial-scale=1">')
    lines.append("  <title>QA Report — Quantum Observable Universe</title>")
    lines.append(f"  <style>{_QA_CSS}</style>")
    lines.append("</head>")
    lines.append("<body>")
    lines.append("<h1>&#x1F50D; QA Report — Build Warnings</h1>")

    # GitHub links
    if branch and repo:
        repo_url = f"https://github.com/{repo}"
        lines.append('<div style="margin:0.5rem 0">')
        lines.append(f'  <a class="gh-badge" href="{repo_url}/tree/{branch}">&#x1F33F; {html_mod.escape(branch)}</a>')
        if sha:
            lines.append(f'  <a class="gh-badge" href="{repo_url}/commit/{sha}">&#x1F4DD; {sha[:7]}</a>')
        lines.append("</div>")

    # Summary cards
    lines.append('<div class="summary">')
    cls = "ok" if total == 0 else "warn"
    lines.append(f'  <div class="card {cls}">{total}<small>Total warnings</small></div>')
    for cat, count in sorted(cats.items()):
        lines.append(f'  <div class="card warn">{count}<small>{html_mod.escape(cat)}</small></div>')
    if total == 0:
        lines.append('  <div class="card ok">&#x2705;<small>No warnings!</small></div>')
    lines.append("</div>")

    # Table
    if warnings:
        lines.append("<table>")
        lines.append("  <thead><tr><th>#</th><th>Category</th><th>Message</th></tr></thead>")
        lines.append("  <tbody>")
        for i, w in enumerate(warnings, 1):
            msg = html_mod.escape(w["message"])
            lines.append(f'    <tr><td>{i}</td><td><span class="badge">{w["category"]}</span></td>'
                         f"<td>{msg}</td></tr>")
        lines.append("  </tbody>")
        lines.append("</table>")

    lines.append("</body>")
    lines.append("</html>")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description="Build QA report from LaTeX warnings")
    ap.add_argument("warnings_file", help="Path to captured warnings log")
    ap.add_argument("output_html", help="Output HTML path")
    ap.add_argument("--branch", default=None)
    ap.add_argument("--repo", default=None)
    ap.add_argument("--sha", default=None)
    args = ap.parse_args()

    text = Path(args.warnings_file).read_text(encoding="utf-8", errors="replace")
    warnings = parse_warnings(text)
    result = generate_qa_html(warnings, branch=args.branch, repo=args.repo, sha=args.sha)
    Path(args.output_html).write_text(result, encoding="utf-8")
    print(f"✓ QA report written to {args.output_html} ({len(warnings)} warnings)")


if __name__ == "__main__":
    main()
