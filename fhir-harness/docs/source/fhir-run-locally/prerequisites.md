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

The layers come from the IG's `index.lock.json`, and you do not mount them by
hand. The IG's `cat` script is `bun .github/cat.ts`: on a fresh clone, the
first `bun run cat …` mounts every layer the lock pins, then runs the command.
It fetches the mounter at the commit the lock pins and checks each layer's
hash before keeping it. Later runs find the layers on disk and go straight to
the command.

After a re-pin, or to mount without running anything, run
`bash .github/mount-from-lock.sh` from the IG's root. It replaces a stale
mount and reports an intact one as `current`.

An IG set up before this has `"cat": "bun cat-harness-tools/scripts/run-script.ts"`
and no `.github/cat.ts`. Copy `cat.ts` and `mount-from-lock.sh` from
[`cat-harness-tools/templates/root-bootstrap/`](https://github.com/litlfred/cat-harness-tools/tree/main/templates/root-bootstrap)
into its `.github/` and set `"cat": "bun .github/cat.ts"`.
