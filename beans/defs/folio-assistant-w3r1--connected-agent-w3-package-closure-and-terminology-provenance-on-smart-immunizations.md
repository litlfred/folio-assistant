---
# folio-assistant-w3r1
$schema: bean/1.0.0
title: 'CONNECTED AGENT: W3 and W4, package, terminology and page-fragment provenance, on smart-immunizations'
status: todo
type: task
priority: high
created_at: 2026-10-24T10:20:00Z
updated_at: 2026-10-24T10:45:00Z
parent: folio-assistant-a9tx
---

W7 and W8 passed in bean `folio-assistant-w7r6`, and the owner lifted the incremental guard
(fork `1fffc3e`). Fork `2924904` adds W3. The AST manifest now carries two new objects:
- `packages`, the pinned package closure;
- `terminology`, the tx server and what each ValueSet expansion was built from.

Fork `0c3b0ca` adds W4 at fragment level (owner, option A). `pages.json`, beside the manifest,
records which source produced which page fragment, and which page includes which fragment.

This round checks that all three are filled on a real build, and that an incremental round carries
them the same as a full build does.

The rules are as in w7r6:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`;
- **do not tick anything in a9tx.** Report numbers only.

`-verify-incremental` is no longer needed. `w7-round.sh` no longer passes it.

## 0. Claim

Set `status: in-progress` and add a Log line. Commit and push.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be 0c3b0ca or later; record it
cd ast-export && mvn -q compile && mvn -q test    # 72 tests, all must pass
```

## 2. Rebuild the base

The old base has no `packages`, `terminology` or `pages.json`, so rebuild it.

```sh
W=~/space_cats/ast-real-igs; I=$W/smart-immunizations
cd ~/space_cats/fhir-ig-publisher/ast-export; CP="$PWD/target/classes:$(cat $W/cp.txt)"
git -C $I fetch -q && git -C $I reset -q --hard "@{u}" && git -C $I clean -fdq
rm -rf $I/output-ast
(cd $I && java -Xmx8g -cp "$CP" org.hl7.fhir.igtools.ast.AstExportCli -ig . > $W/base-w3.log 2>&1); echo "base exit $?"
grep -c "WARNING: .*differ from the committed revision" $W/base-w3.log    # must print 0
```

## 3. Run the CQL probe

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
bash scripts/w7-round.sh $W cql 2>&1 | tee $W/w3r1-cql.txt
```

## 4. Record and push

Run this, and paste its whole output into a section "Results <date>":

```sh
cd $W && python3 - <<'PY'
import json
def load(p):
    try: return json.load(open(p))
    except Exception as e: return {"_error": str(e)}
for name, p in [("base", "smart-immunizations/output-ast/manifest.json"), ("incremental", "w7/ast/manifest.json"), ("full", "w8-cql/ast/manifest.json")]:
    m = load(p); print("==", name, p, m.get("_error", ""))
    for k in ("packagesUnknown", "terminologyUnknown"):
        if k in m: print("  ", k, m[k])
    pk = m.get("packages", []); print("  packages:", len(pk))
    for x in pk[:3]: print("    ", x.get("id"), x.get("version"), "deps", len(x.get("dependencies", [])))
    t = m.get("terminology", {}); e = t.get("expansions", [])
    print("  server:", t.get("server")); print("  expansions:", len(e))
    print("  with used-codesystem:", sum(1 for x in e if x.get("builtFrom", {}).get("used-codesystem")))
    for x in e[:2]: print("    ", json.dumps(x)[:300])
inc, full = load("w7/ast/manifest.json"), load("w8-cql/ast/manifest.json")
for k in ("packages", "terminology"):
    print("incremental == full for", k, ":", inc.get(k) == full.get(k))
a = {x["valueSet"]: x for x in inc.get("terminology", {}).get("expansions", [])}
b = {x["valueSet"]: x for x in full.get("terminology", {}).get("expansions", [])}
print("expansions only in incremental:", len(set(a) - set(b)), "only in full:", len(set(b) - set(a)),
      "different:", sum(1 for k in set(a) & set(b) if a[k] != b[k]))
for k in sorted(set(a) ^ set(b))[:5]: print("   ", k)
for name, d in [("base", "smart-immunizations/output-ast"), ("incremental", "w7/ast"), ("full", "w8-cql/ast")]:
    pg = load(d + "/pages.json"); print("== pages.json", name, pg.get("_error", ""), pg.get("unknown", ""))
    fr, pa = pg.get("fragments", {}), pg.get("pages", {})
    print("  fragments:", len(fr), " pages:", len(pa), " with a source:", sum(1 for v in pa.values() if "source" in v),
          " unresolvedIncludes:", pg.get("unresolvedIncludes"))
    print("  pages with no fragments:", sum(1 for v in pa.values() if not v.get("fragments")))
    for k in ("Library-IMMZAgeConcepts.html", "index.html"):
        if k in pa: print("   ", k, json.dumps(pa[k])[:300])
    for k in list(fr)[:2]: print("   ", k, json.dumps(fr[k])[:200])
pi, pf = load("w7/ast/pages.json"), load("w8-cql/ast/pages.json")
for sec in ("fragments", "pages"):
    x, y = pi.get(sec, {}), pf.get(sec, {})
    print("pages.json", sec, "only in incremental:", len(set(x) - set(y)), "only in full:", len(set(y) - set(x)),
          "different:", sum(1 for k in set(x) & set(y) if x[k] != y[k]))
    for k in sorted(set(x) ^ set(y))[:5]: print("   ", k)
PY
```

Also give `incremental exit N`, `w8 cql exit N`, and the `Converged` line from `w3r1-cql.txt`. If a
build fails, give the first `Exception` with its 10 lines before.

```sh
cd $W && tar czf w3r1.tgz w3r1-*.txt base-w3.log w8-cql.log smart-immunizations/output-ast/manifest.json smart-immunizations/output-ast/pages.json \
  $(ls w7/plan.json w7/work/plan.json w7/ast/manifest.json w7/ast/pages.json w8-cql/ast/manifest.json w8-cql/ast/pages.json 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w3r1 origin/claude/ast-export \
  && mkdir -p ast-results && cp $W/w3r1.tgz ast-results/ && git add ast-results \
  && git commit -m "ast-results: W3 and W4 on smart-immunizations (bean w3r1)" \
  && git push -u origin HEAD
```

## 5. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean w3r1: DONE` or `bean w3r1: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `w3r1 done, results on branch ast-results/<date>-w3r1`

## Done when
- [ ] base rebuilt clean
- [ ] CQL probe run (plan, incremental, W8) and the provenance output recorded
- [ ] results pushed to an `ast-results/<date>-w3r1` branch
- [ ] issue #222 comment posted

## Log
