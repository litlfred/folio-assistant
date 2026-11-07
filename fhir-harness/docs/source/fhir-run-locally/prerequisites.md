| Tool | Needed for | Notes |
|---|---|---|
| `bun` | every step | the harness's runtime; use the version in `cat-harness/.bun-version` |
| `git`, `bash`, `curl` | every step | |
| Java 17, `mvn` | building the AST | Maven compiles `AstExportCli` from the Publisher fork |
| Node 20, `npm` | building the AST | for SUSHI `3.21.0`, which the build script installs if missing |
| Ruby, `gem` | building the AST and rendering | Jekyll, which the build script installs if missing |
| `python3` with `venv` | rendering | checked by `stage-local.ts` before it starts |
| Docker | bare route only | when the IG's own workflow runs the Publisher in a container image |

Building the AST also needs network access to `packages.fhir.org`, the
terminology server (default `http://tx.fhir.org`) and Maven Central. If
`packages.fhir.org` is refused, see the `fhir-validation` skill, §"When a
package host refuses you".

The layers come from the IG's `index.lock.json`. From the IG repository's
root, mount them the way the publish workflow does:

```bash
ref=$(python3 -c "import json;print(next(m['ref'] for m in json.load(open('index.lock.json'))['mounts'] if m['harness']=='cat-harness-tools'))")
M=$(mktemp -d) && git -C "$M" init -q
git -C "$M" fetch -q --depth 1 https://github.com/litlfred/cat-harness-tools.git "$ref"
git -C "$M" checkout -q FETCH_HEAD
bun run "$M/scripts/mount-from-lock.ts" --root .
```
