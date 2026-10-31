# Merge reviews — as-is intent

## Covers

- Declared visualiser (cat-harness `visualisers`, `renderedBy: state-viewer`, `covers: ["merge-reviews"]`): `cat-harness/merge-reviews` (bean `w8jq`, 2026-10-23).
- Generator: the tools layer's `state:visualizer` — one page at `<base>/cat-harness/merge-reviews/`, built at publish from the mounted `cat/cat-harness/merge-reviews` branch.
- Drawn from the generated page with one sample verdict in the store.

## Who it is for, and what they need to do

- **Reader:** the owner, a merge steward or an agent asking which pull request heads have an adversarial review, what it said, and who gave it.
- **Tasks:** find a pull request's verdict; read its result and its open blocking flags; open the pull request to see whether the head it names is still current.

## What it must show (read off the generator)

- an `h1` "Merge reviews" and a subtitle with the path and kind
- a "Verdicts — N verdict(s)" heading, counting unreadable files apart
- one row per `<head sha>.json`, newest review first: the pull request (linked when the verdict names its `repository`), head and base (12 characters), the latest review's result and how many earlier reviews there are, the reviewer (by, session, model), when, and the open blocking flags
- a file that is not a valid verdict listed with the reason, never dropped; a head that disagrees with the file's name said so
- an empty store says none; an unmounted store says the verdicts are unknown, not none
- the registry of the harness's state graphs below, as on every dashboard
- `render_with_liquid: false`, so session ids and reasons cannot break the build

## Findings

1. Whether the head is still the pull request's head is not shown: it is GitHub's fact, and a copy committed into the page would be stale on the next push. The reader opens the pull request.
2. A verdict written before `repository` was recorded shows its number unlinked.
3. The flags themselves are counted, not listed; their text is in the verdict file.
