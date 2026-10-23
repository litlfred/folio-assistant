---
# folio-assistant-qzex
$schema: bean/1.0.0
title: 'CONNECTED AGENT: run the IG AST measurement builds (W1, W2) WITH a terminology server on a machine that reaches packages.fhir.org and tx.fhir.org'
status: in-progress
type: task
priority: high
created_at: 2026-10-23T14:20:00Z
updated_at: 2026-10-23T14:45:00Z
parent: folio-assistant-a9tx
---

Owner, 2026-10-23: *"make a bean for connected agent ... agent is antigravity"*. The
owner also ruled the same day: **build with a terminology server**. Cloud sessions
get 403 from `tx.fhir.org` and `packages.fhir.org`, so this runs on the owner's
machine. It is Step 1 of a9tx's HANDOVER, nothing more. The cloud thread
"Publisher AST" does Step 2 and the rest from what you push.

**Read first:** bean `folio-assistant-a9tx`, section "HANDOVER — start here", and
its "Rules the owner set". They bind you too. In short:
- do not modify Publisher code;
- exact package versions only;
- no GitHub Actions;
- never merge anything;
- an AST is a cache, never an authority;
- XML and Turtle are excised everywhere for now (owner, 2026-10-23).

## 0. Claim

Set `status: in-progress` in this file. Add a line under "Log" with your agent
name and the start time, then commit it to the bean branch:

```sh
cd ~/space_cats/folio-assistant && git fetch origin cat/cat-harness/beans \
  && git worktree add ../fa-beans origin/cat/cat-harness/beans 2>/dev/null || true
cd ~/space_cats/fa-beans && git pull --ff-only origin cat/cat-harness/beans
# edit beans/defs/folio-assistant-qzex--*.md, then:
git commit -am "bean qzex: claimed by <agent>" && git push origin HEAD:cat/cat-harness/beans
```

**Bean edits are plain git commits on `cat/cat-harness/beans`. Never use `state:push`.**
Pull before every push. If a push is rejected, pull with rebase and push again.
Never force-push.

## 1. Set up

You need JDK 17+, Maven, `npm i -g fsh-sushi`, `gem install jekyll`, git and python3.
Record the version of each in the Log.

```sh
cd ~/space_cats
git clone https://github.com/litlfred/fhir-ig-publisher 2>/dev/null; cd fhir-ig-publisher \
  && git fetch origin && git switch claude/ast-export && git pull && cd ..
```

The branch head must be `f0b5dfa` or later (it fixes a crash after each build when run with `-ig .`). Record the commit you ran.

## 2. Run

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
curl -s -o /dev/null -w '%{http_code}\n' https://packages.fhir.org/hl7.fhir.uv.extensions.r5   # must print 200
curl -s -o /dev/null -w '%{http_code}\n' https://tx.fhir.org/r4/metadata                     # must print 200
bash scripts/run-real-igs.sh ~/space_cats/ast-real-igs --byte-identical 2>&1 | tee ~/space_cats/ast-real-igs/run.txt
```

**Do NOT pass `--no-tx`.** The default build uses `tx.fhir.org`, and that is the point
of this bean. The run takes 30 to 90 minutes. If a build fails, record the last 40
lines of `~/space_cats/ast-real-igs/<ig>.log` in the Log and go to step 4. Do not
patch around it.

## 3. Record

Add a section "Results <date>" below, with:

- **Provenance:** fork commit, the `smart-trust` and `smart-immunizations` commits
  (`git -C ~/space_cats/ast-real-igs/<ig> rev-parse HEAD`), tool versions,
  and "terminology server: tx.fhir.org".
- **W1, layout:** the line `sources under fsh-generated/resources/: N of M` for each IG.
- **W1, byte-identical:** the "files differing" count. Then classify every
  differing file as timestamp, `.xml`/`.ttl` (excised, so listed and not
  counted), or **finding**. A finding is anything else; list each one.
- **W2:** the per-type table (Library, PlanDefinition, Measure, TOTAL) for each IG,
  copied exactly. smart-immunizations' target is 458 of 458.
- **Security notice:** read
  https://www.fhir.org/guides/security-notices/2026-03-npm-dependencies.html
  (cloud sessions cannot reach it). Say in two or three lines what it says about
  `fhir.base.template`, which version is safe, and whether the build warned.

Tick no box in a9tx yourself. The cloud thread ticks them against your numbers.

Then push the ASTs so the cloud thread can run Step 2 (cross-language validity)
and W7/W8:

```sh
cd ~/space_cats/ast-real-igs
tar czf ast-results.tgz run.txt */output-ast smart-trust.log smart-immunizations.log
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F) origin/claude/ast-export \
  && mkdir -p ast-results && cp ~/space_cats/ast-real-igs/ast-results.tgz ast-results/ \
  && git add ast-results && git commit -m "ast-results: W1/W2 run with tx.fhir.org (bean qzex)" \
  && git push -u origin HEAD
```

If the tarball is over 90 MB, push `run.txt` and the two `output-ast/manifest.json`
and `dependencies.json` files only, and say so in the Log. Open **no** pull request.

## 4. Report back (coordination)

1. Set `status: completed` (or `status: todo` with a "BLOCKED:" line if a build
   failed). Commit and push this bean as in step 0.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first
   line is exactly `bean qzex: DONE` or `bean qzex: BLOCKED`, followed by the W2
   totals, the findings count, and the `ast-results/...` branch name. End with the
   line `_Posted by <agent name>_`.
3. Tell the owner in one line, so they can paste it into the "Publisher AST" thread:
   `qzex done, results on branch ast-results/<date>`.

## Done when
- [ ] Results section filled, with provenance and the security-notice summary
- [ ] ASTs pushed to an `ast-results/<date>` branch of litlfred/fhir-ig-publisher
- [ ] issue #222 comment posted

## Log

- `2026-10-23T14:24:00Z` — Claimed by `antigravity`.
- `2026-10-23T14:24:00Z` — Step 1 set up:
  - JDK: `openjdk version "21.0.3" 2024-04-16 LTS (Zulu21.34+19-CA)`
  - Maven: `Apache Maven 3.9.11 (3e54c93a704957b63ee3494413a2b544fd3d825b)`
  - SUSHI: `SUSHI v3.20.1 (implements FHIR Shorthand specification v3.0.0)`
  - Jekyll: `jekyll 4.3.2`
  - git: `git version 2.56.0`
  - python3: `Python 3.13.12`
  - `litlfred/fhir-ig-publisher` (`claude/ast-export`): `1b23e27058f83d409d7f124909250e6cc2fce503` (`1b23e27`)
  - Reachability: `https://packages.fhir.org/hl7.fhir.uv.extensions.r5` -> `200`, `https://tx.fhir.org/r4/metadata` -> `200`
