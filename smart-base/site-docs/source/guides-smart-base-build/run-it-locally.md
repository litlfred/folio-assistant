From a checkout of `litlfred/smart-base`, mount the layers that
`index.lock.json` pins (the commands are on the FHIR IG layer's page,
§"What you need installed"), then:

```bash
# See what would be built and where
bun run cat stage:local --repo . --plan

# Build the site and compose the publish commit; push nothing
bun run cat stage:local --repo . --dry-run

# Or write a bundle you can open as a page
bun run cat stage:local --repo . --artifact ./_preview
```

The render restores the AST from the cache branch
`cat/fhir-harness/fhir-ast/smart.who.int.base`, which already holds one.

**When the AST is stale** (you changed `input/`, `sushi-config.yaml` or
`ig.ini`), rebuild it with the DAK pre-processing by starting the
repository's **IG AST refresh** workflow (`.github/workflows/ig-ast-refresh.yml`)
on your branch. Running `bun run cat prepare:fhir-harness` on your machine
builds an AST **without** the DAK pre-processing, because that script does not
run a `pre-export` step. Use it only to check that the FSH compiles.

To run the DAK pre-processing on its own, for example to inspect what it
writes: `bun run cat smart-base:dak-pre-export`. It changes files under
`input/`; restore them with `git checkout -- input sushi-config.yaml` before
you commit.
