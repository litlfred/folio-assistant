---
part-of: bib-qa
description: >
  Detail for `bib-qa`, split out of it so the parent stays a short entry
  point. NOT a skill of its own — reached through the parent.
---

# bib-qa — the QA tag vocabulary

Every tag a reference can carry, with what it means and when to apply it. A
lookup table: you come here to check one tag, not to read it through.

## QA Tags (per reference)

| # | Tag              | Auto? | Description |
|---|------------------|-------|-------------|
| 1 | `has_url`        | ✓     | Entry has a URL or DOI-derived URL |
| 2 | `url_resolves`   | ✓*    | URL responds with HTTP 2xx AND page contains expected title/author (`--check-urls` flag) |
| 3 | `metadata_ok`    | ✓     | Title, author(s), year present; type-specific fields complete |
| 4 | `cited_in_paper` | ✓     | Referenced by `\cite{}` in .md/.tex or a `-- Ref:` comment in a formal-proof file |
| 5 | `has_screenshot` | ✓     | Screenshot exists in `content/bib-qa-images/<id>.*` |
| 6 | `has_local_pdf`  | ✓     | Full paper PDF / data file present at `uploads/<id>*.{pdf,txt}` for offline verification |
| 7 | `verification_status` | ✓ | Per-paper verification record exists in `content/bib-qa-verifications.json` with status ∈ {`verified-clean`, `partial`, `fixed`}. Pending/uncited/unfetchable/paper-mismatch all warn. |

\* ✓* = automated but requires `--check-urls` flag (makes network requests).

Each tag resolves to `pass`, `fail`, `warn`, or `unchecked`.
The **score** is the count of passing tags.

### Verification status model (`bib-qa-verifications.json`)

`content/bib-qa-verifications.json` is the hand-curated sidecar
recording per-paper verification metadata. Loaded by `bib-qa.ts`
and surfaced both as the `verification_status` QA tag and in
each entry's `.verification` field of `bib-qa.json` (which
flows through to the standalone `bib-qa.html` dashboard).

Verification is orthogonal to bibliographic correctness —
"verified" means **someone has read the PDF and confirmed the
citation sites' descriptions match the cited paper's content**:

```json
{
  "entries": [
    {
      "id": "boyd-vandenberghe-2004",
      "status": "partial",
      "local_pdf": "uploads/boyd-vandenberghe-2004-convex-optimization.pdf",
      "verified_at": "2026-05-19T05:50:00Z",
      "verified_by": "<reviewer>",
      "fixes_applied": 4,
      "fix_commit": "66b3caf7f",
      "note": "§5.5.3→§5.5.2, ..."
    }
  ]
}
```

Status values: `pending` (not yet examined), `verified-clean`
(every citation site checked, no fix needed), `partial` (some
sites verified + fixed, others remain), `fixed` (misattributions
resolved), `pending-placement` (author wants to keep the
reference but hasn't decided where to cite it yet; tag passes the
verification_status QA check), `uncited` (bib entry has zero
consumers AND author hasn't claimed it; decision pending),
`paper-mismatch` (local PDF ≠ references.ts metadata; escalate),
`unfetchable` (not in `uploads/`).

The distinction `pending-placement` vs `uncited` matters: both
have 0 citation sites, but `pending-placement` says "keep this
entry, I'll find a citation site later" while `uncited` says
"unclaimed orphan — may be removable". Author triage moves
entries from `uncited` → `pending-placement` (or
`verified-clean` if a citation gets added in the same triage).

The `verification_status` tag passes for `verified-clean` /
`partial` / `fixed`, warns for `pending` / `uncited` /
`unfetchable`, and fails for `paper-mismatch`.

When verifying a paper:
1. Update the entry's `status`, `verified_at`, `verified_by`,
   `fixes_applied`, `fix_commit` in
   `content/bib-qa-verifications.json`.
2. Append a row to the markdown ledger's "Verification log" table
   (`docs/coordination/<date>-bib-verification-ledger.md`).
3. Commit both files alongside any `-- Ref:` fixes (one commit
   per paper is the suggested granularity).
4. Re-run `cd content && bun run pipeline/bib-qa.ts` to regenerate
   `bib-qa.json` (gitignored — but useful for the dashboard).

### Intake & local evidence (`uploads/` workflow)

The `uploads/` directory holds full-paper PDFs and data tables for
offline verification of citation correctness. Once a paper is in
`uploads/`, the `has_local_pdf` tag passes, and reviewers can verify:

- That the `-- Ref: [<id>]` comment's free-text description (e.g.
  "Theorem 3.2 (Pieri rule for SYT)") actually matches the cited
  paper's content,
- That the entry's `title`, `author`, `issued.year` resolve to the
  same work the citation comments describe (catches wrong-work
  mismatches where the metadata names a different paper than the
  citation intends).

#### Batch intake pipeline

| Tool | Purpose |
|------|---------|
| `cat-harness/scripts/gen-bib-papers-list.py` | Scan `content/schema/references.ts` for entries with publicly-downloadable URLs (arxiv, numdam, archive.org, OEIS, faculty pages); emit `scripts/bib-papers-list.txt` |
| `scripts/bib-papers-list.txt` | Generated list, one entry per line: `<url>\|<target>\|<description>` |
| `cat-harness/scripts/upload-bib-papers.sh` | Read the list, download each file (idempotent by file existence), commit per-paper to a fresh `claude/upload-bib-papers-<utc-ymd>` branch via SSH; optional `--pr` to auto-open PR |
| `scripts/upload-to-uploads.sh` | Single-file intake for ad-hoc additions (manual sources, scans, guidelines etc.) |

Run from any clone with network access:

```bash
python3 cat-harness/scripts/gen-bib-papers-list.py     # regenerate the list
bash cat-harness/scripts/upload-bib-papers.sh --dry-run # preview
bash cat-harness/scripts/upload-bib-papers.sh --pr      # download + commit + push + open PR
```

The script uses `git push --force-with-lease` so re-runs after a fix
(URL pattern update, etc.) cleanly replace the prior branch tip
without manual force-push intervention.

#### MCP services for intake + reaudit

If `.mcp.json` ships paper/scholar MCP servers, the bib-QA agent
should leverage them when they are live (i.e. the session's network
policy allows `arxiv.org` / `api.openalex.org`). Such servers fail
soft in sandboxed sessions whose allowlist only permits
`github.com` — in those sessions, fall back to the offline pipeline
above and hand the download step to a normal-network machine.

| Server (`.mcp.json` key) | Tools (most useful) | Use for |
|--------------------------|---------------------|---------|
| `paper-search-mcp` | `search_arxiv`, `search_pubmed`, `search_biorxiv`, `search_medrxiv`, `search_google_scholar`, `download_arxiv`, `read_arxiv_paper` | Find arxiv preprints by title for URL-missing entries; bulk-download to `uploads/`; pull parsed paper text for `validate-bib --cross-check` cross-references |
| `openalex-paper-search` | OpenAlex `get_work`, `search_works`, `get_work_citations`, `get_work_references`, author disambiguation | Fill metadata gaps for DOI-only refs (canonical title/author/year/venue); resolve wrong-work mismatches via author IDs; citation-network mapping |

**Workflows that gain leverage from these servers**

1. **URL backfill for no-URL entries** (offline-prep, network-only
   step is the actual fetch):

   ```python
   # Pseudo-code; run from a session with arxiv.org allowed.
   for entry in references.ts where entry.url is None and entry.type in {"article-journal","article"}:
     hits = paper_search_mcp.search_arxiv(query=entry.title, max_results=3)
     if best_match(hits, entry).confidence > 0.8:
       propose entry.url = hits[0].url   # human reviewer accepts
   ```

2. **Verification cross-check** — for any entry in
   `bib-qa-verifications.json` whose status is `partial` or
   `pending`, `read_arxiv_paper(arxiv_id)` returns the parsed
   body. Grep the cited `-- Ref: [<id>] <description>` keywords
   against that body to confirm the description anchors a real
   passage. Beats opening the PDF in a viewer.

3. **Author-ID-based wrong-work resolution** — when a single
   bib key citation-splits across two unrelated works, OpenAlex
   author IDs cleanly disambiguate them.

4. **Metadata enrichment for paywalled entries** — for `doi.org`
   URLs we can't fetch, OpenAlex `get_work(doi=…)` returns
   canonical title/author/year/venue without paywall. Useful for
   filling `references.ts` gaps without ever downloading the PDF.

**When the new MCP services are NOT available**: drop back to the
offline pipeline (`gen-bib-papers-list.py` + `upload-bib-papers.sh`
on a normal-network machine). The new services are an
accelerator, not a replacement.

**Local CLI wrapper for both paths**: a CLI such as
`cat-harness/adapters/bib-mcp-cli.py` can drive the same `paper-search-mcp` /
`pyalex` libraries as a normal Python CLI — no MCP server needed.
Designed to run from a normal-network machine when the sandbox
allowlist blocks arxiv/openalex/scholar:

```bash
# Prereqs (one-time):
pip install paper-search-mcp pyalex
pip install playwright && playwright install chromium  # for scholar-snapshot

# Status — probes network, lists what's possible:
cat-harness/adapters/bib-mcp-cli.py status

# Backfill URLs for no-URL entries (dry-run by default):
cat-harness/adapters/bib-mcp-cli.py backfill-urls          # propose
cat-harness/adapters/bib-mcp-cli.py backfill-urls --apply  # write to references.ts

# Download missing arxiv PDFs:
cat-harness/adapters/bib-mcp-cli.py download --apply

# Enrich DOI-only entries with OpenAlex canonical metadata:
cat-harness/adapters/bib-mcp-cli.py enrich-doi --apply

# Capture HTTP 'as-viewed-on' evidence pages (HTML/PDF + SHA-256):
cat-harness/adapters/bib-mcp-cli.py snapshot --apply

# Capture Google Scholar / Books preview PDFs via headless Chromium:
cat-harness/adapters/bib-mcp-cli.py scholar-snapshot --apply

# Run all of the above in dry-run mode:
cat-harness/adapters/bib-mcp-cli.py audit
```

Each subcommand is idempotent: re-running skips entries already
done. Network probes fail-fast with a friendly error when the
required host is in the deny-list. The `snapshot` /
`scholar-snapshot` outputs land in `content/bib-qa-evidence/<refid>/`
as `<utc>-<source>.{html,pdf}` + `<utc>-<source>.meta.json` (the
"as-viewed-on" provenance record) — humans can review the
snapshot to validate the citation without re-fetching.

#### `validate-bib` — comprehensive correctness audit

`content/pipeline/validate-bib.ts` is the umbrella correctness audit
(complement to `validate-refs` which is just key-resolution). Five
selectable modes:

| Flag | Mode | Network? |
|------|------|---------|
| `--doi` | HEAD/GET each DOI via doi.org with proper User-Agent; expect 301/302 (success redirect) or 200; warn on 4xx/5xx | ✓ doi.org |
| `--cross-check` | Parse `-- Ref: [<id>] <desc>` comments in formal-proof files; warn when neither the entry's author surname nor any significant title word appears in the description | ✗ |
| `--crossref` | Fetch `api.crossref.org/works/<DOI>` per entry; compare canonical title/author/year against the entry | ✓ api.crossref.org |
| `--arxiv` | Resolve arxiv.org URLs for entries whose URL field is on arxiv.org | ✓ arxiv.org |
| `--pandoc` | Pipe a sample LaTeX citation through pandoc-citeproc; verify the rendered output is well-formed (catches missing CSL fields) | ✗ (needs pandoc binary) |
| `--all` | Run all five | ✓ |
| `--strict` | Exit non-zero on any failure (default: warn-only) | n/a |

Network requirement: `--doi` / `--crossref` / `--arxiv` modes need
outbound HTTPS to doi.org / api.crossref.org / arxiv.org respectively.
Sandboxed environments with whitelist-only egress cannot run these —
the script reports uniform 403s and the bib remains genuinely
unvalidated. Run from a normal-network machine.

The `--cross-check` heuristic uses a small set of tunable parameters
(prose word threshold, title-word length threshold, stopword list)
documented inline in `validate-bib.ts` to keep false-positives low.

