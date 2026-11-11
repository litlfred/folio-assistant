Publishing is the [command-line render](run-locally.html), run on a GitHub
runner and pushed to the IG repository's `gh-pages` branch. There is no
separate recipe: the workflow runs the same `stage-local.ts` command that
you run by hand.

GitHub workflows here are **started by hand** (`workflow_dispatch`). Nothing
publishes on push.
