---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: '/rendered-verification'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/rendered-verification.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/rendered-verification.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/rendered-verification.md){: .fa-edit-source }

{% raw %}
# /rendered-verification — look at it, then send the picture

[`continual-progress`](continual-progress.md) argues that **a human cannot
assess a rendered artefact from a description of it.** This skill is the
other half: *neither can the agent that wrote it.* A stylesheet is not a
rendering, a generator's output is not a page, and a green gate set is not
a screenshot.

Owner, 2026-09-22: *"use playwright to confirm UI changes and share
screenshots back to me/user."*

## The rule

> **A change to a rendered surface is not done until you have looked at it
> in a browser and sent the author the picture.**

Not "ran the tests". Not "checked the CSS". Opened it, measured the
computed result, and attached the image to the turn.

Sending the screenshot is **part of the rule, not a courtesy**. A verdict
in prose asks the author to trust a description of the very thing they
could have seen; an image lets them disagree with you in one glance. That
is the whole of `continual-progress`'s argument applied to the reply rather
than to the PR.

## Why a green gate set does not cover this

Four classes of defect this repository has actually shipped, none of which
any test caught:

| what happened | why the suite was green |
|---|---|
| `gjli` — a generator emitted raw `<h3>`, kramdown assigned no ids, and **all 22 headings on a page shared one anchor** | the generator's own output looked right |
| `sjic` — the rail rested at 40px and the sidebar at 56px, called "the same navbar" | each file had a test asserting **its own copy** |
| the harness dividers rendered with **no colour and no stripe** | an invalid custom-property substitution fails *silently* — no parse error, no console warning, just the initial value |
| home laid out at **y=1510 in a 900px viewport**, rendered and unreachable | the markup was correct; a `!important` in the theme made the flex column inert |

The common shape: **the source was right and the rendering was not.** A
test that reads the source cannot see that, and a test that asserts one
file's copy of a shared number cannot see disagreement with the other copy.

## Measure the COMPUTED result, never the stylesheet

`getComputedStyle` and `getBoundingClientRect` are the instruments. Reading
the CSS tells you what was authored; only the browser tells you what won.

Three things worth measuring every time, because each has bitten here:

- **`display`, `flex`, `min-height`** on a region you believe is a flex
  child. A `!important` from a theme utility class silently makes every
  flex value below it inert.
- **`scrollHeight` against `clientHeight`.** A region that "does not
  scroll" and a region whose content is ten times its height look
  identical in a screenshot of the top of it.
- **the resolved colour**, not the declaration. A custom property holding
  a *hue* substituted into `color-mix()` yields `rgba(0,0,0,0)` and no
  error.

**Use a control.** When you suspect a value is invalid, build the minimal
element in the page and read it back, rather than reasoning from the spec:

```js
const probe = document.createElement("div");
probe.style.cssText = "--h:268;background:color-mix(in oklab, var(--h) 28%, transparent)";
document.body.appendChild(probe);
getComputedStyle(probe).backgroundColor;   // rgba(0, 0, 0, 0) -> invalid
```

That took one round. Reasoning from the CSS spec would have been a claim.

## A before/after pair beats an after

Build the base branch too and shoot the same element. Without it "the
dividers have colour now" is unfalsifiable and the author has to take your
word for what it looked like. `git worktree add <dir> origin/main --detach`
is the cheap way; symlink `node_modules` and the docs `vendor`/`.bundle`
into it rather than re-installing.

## Running it here

Building the site is [`preview:site`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/preview-site.sh), whose
header carries the two things that make a naive `bundle exec jekyll` fail
in this repo. **It is not what CI builds** — CI uses the pinned
`remote_theme`, this uses the gem — so read a *theme-chrome* question off
the staging preview, not off this. Liquid and kramdown are identical, and
so is our own stylesheet, which is where these defects live.

Two environment facts that each cost a round:

1. **Serve it under its `baseurl`.** `_config.yml` pins
   `baseurl: "/folio-assistant"`, so every stylesheet is requested at
   `/folio-assistant/assets/…`. Serving the build directory at `/` returns
   200 for the HTML and 404 for **every** stylesheet — and an unstyled page
   renders, so the failure looks like a CSS bug rather than a 404. Symlink
   `<serve>/folio-assistant -> <build>` and serve the parent.
2. **Pin the browser.** Chromium is pre-installed but its build number
   will not match whatever `playwright-core` resolves to, and
   `playwright install` is not available. Launch with
   `executablePath: "/opt/pw-browsers/chromium"`.

**Drive the control a reader would drive.** `page.click(".fa-nav-toggle")`,
not `element.classList.add(…)`. A state you set by hand is a state you have
not tested the way in to.

**And check that the state actually changed.** This session set
`data-fa-scheme="light"` directly, measured the page still dark, and was
one step from reporting a contrast failure that did not exist — the real
toggle is `jtd.setTheme(name)`. *A test that silently does nothing reports
the old state as the new one.* Assert the switch landed (here: the sidebar
background changed) before reading anything off it.

And know what that toggle DOES: `setTheme` swaps the theme's first stylesheet,
so for the moment the new file is in flight the page has no ground but the
browser's white canvas. That was the owner's *"flashes white before goignt o
dark mode"* (2026-09-24). A scheme check that only reads the SETTLED page
cannot see it — hold the new sheet in flight with `page.route` and read the
ground then, as `first-paint-scheme.e2e.ts` does. The rule itself lives in
[`theme-artefacts`](theme-artefacts.md) §"The page ground: the
first paint is DARK".

## The REAL build is reachable — take it off `gh-pages`

The section above says to read a theme-chrome question off the staging
preview rather than off `preview:site`. Until 2026-09-23 that was advice with
no method: this environment's proxy refuses `litlfred.github.io`, so the
preview could be named and not opened.

**It is committed.** `feature-staging.yml` deploys each preview into
`STAGING/<slug>/` on the `gh-pages` branch, and git reaches what HTTP cannot:

```sh
git fetch origin gh-pages
S=claude-my-branch-slug              # the deploy comment names it
mkdir -p "/tmp/rv/folio-assistant/STAGING/$S"
git archive "FETCH_HEAD:STAGING/$S" | tar -x -C "/tmp/rv/folio-assistant/STAGING/$S"
cd /tmp/rv && nohup python3 -m http.server 8091 >/dev/null 2>&1 &
# → http://127.0.0.1:8091/folio-assistant/STAGING/$S/<page>.html
```

That is the pinned `remote_theme`, the composed tree, the mounted instances
and the post-Jekyll steps — the thing CI publishes, not an approximation of
it. A whole preview is ~90 MB; `git archive FETCH_HEAD:STAGING/$S page.html
assets` takes just what a page needs.

**Mount it at the STAGING path, not at the site root.** This is the baseurl
trap one level deeper, and it is worth restating because knowing the rule did
not stop it happening: a staged page requests
`/folio-assistant/STAGING/<slug>/assets/…`, so serving the extract at
`/folio-assistant/` 404s **every** stylesheet.

## Assert the CONDITIONS, or the check passes over nothing

An unstyled page still renders. It still answers `elementFromPoint`. It still
returns PASS.

Measured 2026-09-23: a first run mounted at the wrong path reported **both
pages passing** — over a page with **zero stylesheets loaded**. The verdict
was green and meaningless. What gave it away was not the verdict but the
numbers beside it: `fullwidth=false` where the page auto-expands 4 of 5
figures, `z-index: auto` where the rule says 100, a 1164px sidebar where the
open width is 264.

So every rendered check reports, beside its verdict:

- `document.styleSheets.length` — zero or one means the page is bare;
- a count of responses with `status >= 400`, collected from `page.on("response")`;
- **the precondition the defect needs** — the class, the state, the element
  count. If the bug only appears when `fa-has-fullwidth` is set, a run where
  it is unset has not tested anything.

A check that cannot tell a styled page from a bare one is not a check. This
is `dh4f` in a browser: could-not-determine rendered as a pass.

## Visible is not usable — hit-test the control's CENTRE

The usability half of this skill, and the one a computed-style read cannot
reach. A control can have the right size, the right colour and the right
label, and still be un-clickable because something is painted over it.

```js
const b = el.getBoundingClientRect();
const hit = document.elementFromPoint(
  Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2));
const usable = hit && (hit === el || el.contains(hit) || hit.contains(el));
```

Found this way on 2026-09-23 (bean `tcq2`): the search field had the right
width, the right height and the right colours, and a hit test at its centre
returned `P.fa-search-notice`. `.search` computed to **height 0** — its only
child is `position: absolute` — so a flow sibling painted across the field.
Nothing in the stylesheet says that, and no screenshot at a glance says it
either.

**Two ways this test lies, both met the same day:**

- **It resolves INSIDE the control.** `elementFromPoint` returns the deepest
  element, often an `<svg>` or `<span>` within a button. `hit === el` alone
  reports a working control as covered — which is what the `contains` pair
  above is for. A `covered` verdict was traced to this, not to the page.
- **It reports a preview-only overlay.** The same run found the corner
  magnifier covered by a `<div>` with no class, `z-index: 9999`, a child of
  `<body>` — the staging banner, which exists only on previews. Identify the
  coverer (`document.elementsFromPoint(x, y).slice(0, 3)`) before calling it
  a defect: *what* is on top decides whether it ships.

And the reason this is a usability check rather than a nicety: where the
covered control is the ONLY route back to a state — the magnifier that
reopens a collapsed search — being un-clickable is `l4zi`, an action whose
inverse is not reachable.

## Two environment facts that cost cycles rather than correctness

- **Never `pkill -f "http.server"` from the shell running one.** The pattern
  matches your own process group and kills the command issuing it — exit 144,
  no output, looks like the tool failed. Start each server on a fresh port in
  its own invocation instead. (Done twice in one session, the second time
  immediately after noticing the first.)
- **Probe scripts belong outside the repository root.** `check:undeclared-files`
  fails the gate set on a stray `probe.mjs`, and the failure arrives long after
  the probe stopped being interesting. Playwright needs the script where
  `playwright` resolves, so write it to the repo root, run it, and delete it in
  the same command.

## What to send

Not everything. The frames that answer a question the author would
otherwise have to ask:

- **before and after** of the same element, same viewport;
- the surface in **both colour schemes**, if the change touches colour;
- the state that is hard to describe — a region **scrolled to its end**,
  a menu open, an empty case.

Caption them with what to look at, not with what they are. "The nav
crushed to a 64px sliver, no home link" is a caption; "navbar screenshot"
is a filename.

`SendUserFile` is the mechanism; a file the author cannot open is not a
deliverable, so write into the working directory or the scratchpad.

## Accessibility is measured here too

`gjli` is the standing rule and the 3:1 bar for meaningful non-text content
is `y8cm`'s. Both are *rendered* facts: compute the contrast from the two
resolved colours rather than from the tokens, because the token you
authored and the colour that won are different questions.

## Listen for `pageerror`, or a crash reads as a missing feature

Two in one session, neither visible in a screenshot:

- `mountInstanceGraphs` **moved** `.site-nav`, so a later `insertBefore` got a
  reference node that was no longer a child, threw `NotFoundError`, and took
  **the rest of `init()`** with it. The symptom was that the document index
  simply was not there — which looks exactly like a feature that did not mount.
- The same throw, from a different function, reproduced on a build of
  `origin/main`: it had been eating `inlineDiagrams` and `mountFigures` on
  every page load, which is why no figure on the front page had zoom. **Nobody
  had noticed**, because a swallowed init is silent.

So: attach the listener, and assert zero.

```js
page.on("pageerror", (e) => errors.push(e.stack || e.message));
```

**And check the base branch before you claim a crash is yours** — or before you
claim it is not. One run against a build of `origin/main` is what turned
"something I just broke" into "a live defect nobody had reported", and it is
the same measurement either way.

## A STATIC read of a client-rendered page is not verification — in either direction

This skill is usually reached for to stop a false **green**. It stops a false
**red** just as often, and that failure is less obvious because being wrong
about a defect feels like diligence.

> **Grepping a page's committed HTML for content the page fetches at runtime
> proves nothing.** The content is absent whether the page works or not.

### The failure this is written from

2026-09-23, bean `yag0`. The owner reported a library viewer as broken. A
session "confirmed" it by grepping
`cat-harness/docs/cat-harness/library/who-iris/index.html` for the entry names,
finding none, and reporting the page as *"a shell"* — 20,160 bytes, committed
and built identically, holding none of its subject's three entries.

The viewer is client-rendered. It carries
`DATA_HREF = "../../../assets/library/index.json"`, fetches it, and filters by
`inScope(x) { return !SCOPE || x.instance === SCOPE }`. **The names could not
have been in that file.** The test could not have returned any other answer,
for a working page or a broken one.

Loading it in Chromium took one command and settled it:
`who-iris · 3 entries · 84,292 words · 404 sections`, data `200`, no console
errors, all three entries present.

### The cost of a false red

A false green ships a defect. A false red files a bug against working code,
sends the next agent to rewrite a generator that is correct, and — because the
report carries measurements and a file size — reads as thoroughly evidenced.
The bean was filed with a "where to look first" list, every item pointing at
code with nothing wrong with it.

### The rule

**If a page assembles any of its content after load, open it.** The tell is
cheap to check: a `fetch`, an `XMLHttpRequest`, a `DATA_HREF`, a `<script>`
that writes into the DOM. Finding one means a static read cannot answer the
question, and `§"Running it here"` above is how to answer it instead.

## What this does NOT replace

The gate set. This is the layer **above** it: gates catch what is checkable
from the source, and this catches what is only true once a browser has laid
it out. A change that skips either is unverified, and the one that got
skipped is the one that shipped the defect.
{% endraw %}
