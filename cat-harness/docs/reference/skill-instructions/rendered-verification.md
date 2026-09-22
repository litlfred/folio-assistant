---
layout: default
title: '/rendered-verification'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/rendered-verification.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/rendered-verification.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/rendered-verification.md){: .fa-edit-source }

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

Building the site is [`preview:site`](../../scripts/preview-site.sh), whose
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

## What this does NOT replace

The gate set. This is the layer **above** it: gates catch what is checkable
from the source, and this catches what is only true once a browser has laid
it out. A change that skips either is unverified, and the one that got
skipped is the one that shipped the defect.
{% endraw %}
