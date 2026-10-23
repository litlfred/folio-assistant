---
# folio-assistant-w7r3
$schema: bean/1.0.0
title: 'CONNECTED AGENT: W7 round 3, the incremental rebuild after the temporary-IG fixes, and W8, on smart-immunizations with tx.fhir.org'
status: in-progress
type: task
priority: high
created_at: 2026-10-23T20:40:00Z
updated_at: 2026-10-23T22:29:00Z
parent: folio-assistant-a9tx
---

Follows bean `folio-assistant-wv7r`. That round got further than any before it. The base was
clean, the plan was `incremental`, and the temporary IG's Publisher run reached Jekyll. Two
things then failed:
- Jekyll stopped: `Could not locate the included file 'menu.xml'`;
- the script exited before W8.

The fork fixes them:
- `e3c7119`: the temporary IG gets `input/includes/` and `fsh-generated/includes/`, and
  `w7-round.sh` runs W8 even when W7 fails;
- `d2d4bfe`: every `path-*` directory exists in the temporary IG, which fixes the
  `input/cql is not a valid directory` error in the `fml` probe.

The rules are as in wv7r:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`;
- **do not tick W7 or W8 in a9tx.** Report numbers only.

The plan line that `w7-round.sh` prints comes from `AstPlanCli`, which takes no
`-verify-incremental`, so it reads `decision: full  computed: incremental`. That is
expected. The decision that was acted on is in `$W/w7*/work/plan.json`.

## 0. Claim

Set `status: in-progress` and add a Log line. Commit and push.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be d2d4bfe or later; record it
cd ast-export && mvn -q compile && mvn -q test    # 65 tests, all must pass
```

## 2. Check the base (do not rebuild it)

wv7r's clean base is still the base. Check that it is still there and still clean:

```sh
W=~/space_cats/ast-real-igs; I=$W/smart-immunizations
python3 -c "import json;m=json.load(open('$I/output-ast/manifest.json'));print(m['inputs']['sourceRevision'], 'notAtRevision' if 'inputsNotAtRevision' in m else 'clean')"
```

It must print `bd7fa726... clean`. If it doesn't, run wv7r step 2 first.

## 3. Run both probes

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
for P in cql fml; do bash scripts/w7-round.sh $W $P 2>&1 | tee $W/w7r3-$P.txt; done
```

Do not pass `-tx`.

## 4. Record and push

Add a section "Results <date>". For each probe, give:
- `changing:`;
- the `decision` from `$W/w7*/work/plan.json` and its `rebuild` and `loadFromCache` counts;
- every `Round N:` line;
- `Converged` or `Did not converge`;
- `incremental exit N`;
- the last 30 lines of the incremental build;
- `w8 <probe> exit N`.

If the incremental build fails again, give the first `Exception`, or the first `Liquid
Exception` or `Jekyll has failed` line, with its 10 lines before.

```sh
cd $W && tar czf w7r3.tgz w7r3-*.txt w8-*.log w8-*/ smart-immunizations/output-ast/manifest.json \
  $(ls -d w7/plan.json w7/work/plan.json w7/ast w7-fml/plan.json w7-fml/work/plan.json w7-fml/ast 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w7r3 origin/claude/ast-export \
  && mkdir -p ast-results && cp $W/w7r3.tgz ast-results/ && git add ast-results \
  && git commit -m "ast-results: W7 round 3 and W8 on smart-immunizations (bean w7r3)" \
  && git push -u origin HEAD
```

Leave out `w7*/work/r*` and `w7*/pkg-cache`. If the tarball is over 90 MB, push only the
`.txt` and `.log` files, the `plan.json` files and the manifests, and say so.

## 5. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean w7r3: DONE` or `bean w7r3: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `w7r3 done, results on branch ast-results/<date>-w7r3`

## Done when
- [ ] base checked clean
- [ ] both probes run (plan, incremental, W8) and results recorded
- [ ] results pushed to an `ast-results/<date>-w7r3` branch
- [ ] issue #222 comment posted

## Log
- 2026-10-23T22:29:00+02:00 Claimed bean `folio-assistant-w7r3` (`status: in-progress`); starting Steps 1–5 on `~/space_cats/fhir-ig-publisher` (`claude/ast-export`) and `~/space_cats/ast-real-igs` (Antigravity).
