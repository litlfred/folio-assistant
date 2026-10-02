---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-007-skills-and-hooks
section_title: "Skills and hooks"
section_number: null
pages: 6-8
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
This pairing deserves separate treatment, because it is where guarantees are most often misplaced.
On its automatic path a skill is model-invoked and probabilistic; a hook is runtime-invoked and
6
who decides the run
strength of effect
model-decided
user-invoked
runtime-guaranteed
advisory
blocking
Skill
External tool
Subagent
Slash command
Memory file
Hook
Figure 4: Schematic positioning of the mechanisms by who decides the run, the model, the user, or the
runtime, and how strong the effect is, from advisory to blocking. The two tend to track together, since only
runtime-decided mechanisms can be made deterministic: a skill sits low and left, a hook high and right. A
memory file is the exception, always loaded by the runtime yet only advisory, so it sits low on the right.
Among these mechanisms only a hook can block an action. Positions are indicative.
deterministic. A hook is a shell command, or a prompt or agent handler among others, registered
against a lifecycle event in .claude/settings.json. It fires every time its event and matcher
conditions are met, whatever the model decides. These events occur at fixed points that the
runtime controls: at session start, around each tool call, and when the model finishes responding,
among others. A tool call is any action the agent takes through a tool, such as reading or writing
a file, running a shell command, or querying an external service. The PreToolUse event fires
immediately before such an action runs, while the agent waits, so a hook on it can inspect the
action and block it. The PostToolUse event fires immediately after the action completes, so a
hook on it can read the result. A PreToolUse hook blocks the pending action either by exiting
with code 2 or by returning a deny decision in its output, which makes it the place to stop a
dangerous command or protect a file [4].
Figure 5 shows where each acts during a session. A skill is read inside the model’s reasoning,
at a point the model chooses. A hook fires at fixed events that the runtime controls, around every
tool call and at the session and turn boundaries.
SessionStart
(hook)
Model reasoning
(may read a skill)
PreToolUse
(hook, can block)
Tool call
PostToolUse
(hook)
Stop
(hook)
loop
blue: model-invoked, probabilistic
red: runtime-invoked, deterministic
Figure 5: Where skills and hooks act during a session. The model reads a skill at a point of its own
choosing inside its reasoning. Hooks fire at fixed lifecycle events controlled by the runtime: SessionStart
at the beginning of a session, PreToolUse and PostToolUse immediately before and after each tool call,
with PreToolUse able to block the call, and Stop when the model finishes responding.
7
The decision rule follows directly. If a step depends on judgement, varies with context, or
encodes domain procedure, put it in a skill. If a step must happen every time the triggering
event occurs, put it in a hook. A standing instruction in a skill body, however firmly worded, is
something the model may read, defer, or skip. The same instruction expressed as a hook runs
unconditionally. When a guarantee matters, for example loading a specification file at session
start, running a validator before a commit, or formatting after every file write, write it as a hook
and do not rely on skill prose to enforce it.
9
