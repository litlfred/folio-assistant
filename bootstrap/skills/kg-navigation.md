---
name: kg-navigation
description: >
  Read and navigate a knowledge graph with nothing installed — no MCP server,
  no tools, no harness. The first skill bootstrap hands you, because the second
  step of the handoff cannot be followed without it.
---

# Reading a knowledge graph before you have anything

**This skill assumes a text editor and nothing else.** No MCP server, no
`skill_fetch`, no `beans`, no build. If those exist they are not yours to rely
on yet — see [`AGENTS.md`](AGENTS.md).

That constraint is the reason this skill exists rather than a pointer to the
harness's own navigation tooling: an agent here may have no connected server,
and a bootstrap that required one would fail in exactly the cold-start case it
exists for.

## You probably do not need most of this yet

**On the bootstrap path you are pointed at READMEs.** `bootstrap/README.md`
names the process; the process names a harness; that harness keeps its own
instructions at one fixed path. Every one of those is a file you open and read
in order, and **reading a README needs none of the graph machinery below**.

So take the rest of this page as the reference it is. The sections on
declarations, on git as a data store and on what "could not determine" means are
here because this is the only skill an Initiator has, and the moment it needs
one of them there is nowhere else to look. Needing one is not a sign you are
behind; needing all of them before you have read a README is a sign you are
reading ahead.

## A graph is files that declare what they are

Three facts carry the whole model, and every one of them is checkable by
reading:

1. **An instance declares the directories it scans**, in `harness.json` at its
   root. Each entry is an id, a path, and the **kinds of graph** found there.
2. **A directory is a place to look, not a type.** One may hold more than one
   part of a graph, so the directory does not say what its files are —
   **the files do**, in their own front matter or `$schema`.
3. **Ids are stable across a relocation; paths are not.** An override matches
   on an entry's `id`, never its `path`. Matching on path turns one relocated
   graph into two, and every consumer then scans a directory that is not there.

## Do this, in order

1. **Read the root `harness.json`.** If there is none, this repository is not
   an instance yet, and that is the case bootstrap exists for.
2. **Find the entry whose `graphs` name the kind you want.** For skills,
   workflows and roles that kind is `cat-harness`. The entry's `path` is
   relative to the instance root.
3. **Read the files in that directory.** A markdown file declaring `name:` and
   `description:` in front matter is a **skill** — its body is the instruction
   you were looking for. A file declaring `$schema:` is stating that it is
   **something else**, and is not a skill however it is named.
4. **Follow a reference by id, not by path.** A node that names another names
   it by id; resolve it through the declaration rather than guessing a filename.

## What "I could not determine" means here

**An absent declaration and an unreadable one are different**, and collapsing
them is the mistake this section exists to prevent:

| what you found | what it means | what to do |
|---|---|---|
| no `harness.json` | not an instance yet | this is bootstrap's case — continue |
| a `harness.json` that parses, **at a location you were about to initialize** | it is ALREADY an instance | **stop**; `initialize-harness` logs it and ends. Re-initialising over content, history and dependents is not undone by running anything again |
| `harness.json` that will not parse | an instance asserting something broken | **stop and say so**; do not fall back |
| a declared directory that is not there | the declaration is wrong | **stop and say so** — scanning nothing and reporting a clean run is the defect |
| no declaration for a kind you want | this instance has none of it | that is an answer, not a failure |

A declared-but-absent directory is the one to be loudest about. Every consumer
that scans it finds nothing and reports success, so the failure is silent and
looks exactly like a clean result.

## Git is the data store, and it is a role rather than a technology

A **Knowledge Graph Data Store** is the thing a graph is read from and written
to. In practice it is a git repository. It is `actedUpon`: it holds and serves,
and takes no part in deciding what should happen, which is why it carries no
skills of its own and why *this* skill — the reader's — is where its use is
described.

Two mechanisms reach the same store, and **which one you have is a fact about
your environment, not a preference**. Establish it before you plan around it.

### Through the git CLI — a working tree you can read

You have this when `git` runs and a checkout exists. It is the one to prefer,
for a reason that is about correctness rather than convenience: a checkout gives
you the **whole tree at one commit**, so a declaration and the directories it
names are consistent with each other. Fetching files one at a time from an API
can mix revisions, and a declaration read at one commit against a directory read
at another is exactly the "declared but absent" report this skill tells you to
be loudest about — arrived at without anything being wrong.

| you want | the CLI answer |
|---|---|
| a store you do not have | `git clone <url> <dir>` — add `--depth 1` when history is not the point |
| to know where you are | `git rev-parse --show-toplevel`, and `git rev-parse HEAD` for the commit |
| the current state of a file | read it from the working tree; it is an ordinary file |
| a file at a known revision | `git show <rev>:<path>` |
| what is actually there | `git ls-files <dir>` — **what is tracked**, which is the graph, rather than whatever else is on disk |
| whether you are looking at a stale copy | `git fetch && git status -sb` |

Prefer `git ls-files` to a directory listing when you are enumerating a declared
directory. An untracked scratch file is on disk and is **not** part of the
graph, and a listing cannot tell you which is which.

**Writing is the same store and a different posture.** Reading a store you were
pointed at is always in order. Writing to one is not: commit and push only to a
location that was confirmed, and never invent a branch, a remote or a repository
because one was missing. A missing location is something to report, per
§"What 'I could not determine' means here".

### Through a forge's API — addresses, not a tree

You have this when there is no checkout but there is network and a token: a
GitHub or GitLab API, an MCP server wrapping one, or a raw-content URL. It is
the fallback, and it is a real one — an Initiator asked about a repository it
has not cloned has no other way in.

| you want | the API answer |
|---|---|
| one file | the contents endpoint for `<owner>/<repo>` at `<path>`, or a raw-content URL |
| what is in a directory | the same endpoint pointed at the directory |
| which revision you got | the commit sha the response carries — **record it** |

Three things it does **not** give you, and each has bitten somebody:

- **No atomic view.** Every request may land on a different commit. Pin the
  revision if the API lets you, and say which one you read if it does not.
- **A 404 is ambiguous.** Absent, private, or renamed all look identical from
  outside. It is never on its own evidence that a declared directory is missing.
- **Rate limits and truncation are silent-ish.** A truncated listing looks like
  a short one. A short listing of a directory a declaration named is worth a
  second look before you report on it.

### If you have neither

**Say so and stop.** An Initiator with no checkout, no network and a repository
to read has not failed at a step — it is missing a precondition, and that is a
thing to report rather than to work around. Guessing at a store's contents
produces a harness configured against a repository nobody looked at.

## What this skill is NOT

It is not the content model. A folio, a block, a voice, a profile and a QA
verdict are all concepts of the harness you have not loaded yet, and a
description of them here would be a second one, free to disagree with the first.

If you find yourself needing one of them to finish bootstrap, **that is a sign
the boundary is in the wrong place** — say so rather than importing the
definition.
