---
$schema: folio-fsh-guts/v1
title: "bootstrap and bootstrap-tools as staged here — superseded by their own repositories"
kind: staged-copies
movedOn: 2026-09-30
movedFrom: "bootstrap/ and bootstrap-tools/"
bean: folio-assistant-xsqm
summary: >-
  The two directories as they stood in folio-assistant at commit 3aa7917,
  before each became its own repository, packed as one archive beside this
  file (`bootstrap-split.tar.gz`, made by `git archive` from that commit). Owner, 2026-09-30: "seed the repos
  ... then mv this repo's copies to fsh-guts". They now live at
  litlfred/bootstrap (seeded at f70a56c) and litlfred/bootstrap-tools
  (ff39c76), and folio-assistant carries them as submodules at the same
  paths. Kept, not deleted, so the staged state stays reachable; packed
  rather than loose, so the copies are not mistaken for live files by the
  scanners that read every file in the checkout.
---

# bootstrap and bootstrap-tools, as staged

`bootstrap-split.tar.gz` beside this file holds `bootstrap/` and
`bootstrap-tools/` as they were developed inside folio-assistant until
2026-09-30 — list it with `tar -tzf bootstrap-split.tar.gz`, or read the same
files at commit `3aa7917`. The live versions are the
repositories [litlfred/bootstrap](https://github.com/litlfred/bootstrap) and
[litlfred/bootstrap-tools](https://github.com/litlfred/bootstrap-tools), seeded
from these files with one commit each and no history (owner: "I dont want all
the clutter in git history on bootstrap (still retained in folio-assistant)").
Their history is this repository's history up to that commit.

What changed on the way out — licence files, `livesAt` removed, links and prose
made self-contained, a README-sections command — is in each repository's own
log and QA report. Do not unpack it back into place: change the repositories.
