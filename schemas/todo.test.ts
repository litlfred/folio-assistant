/**
 * A todo's KG tags resolve, dangle, or are not checked — and the third is
 * never reported as either of the first two.
 *
 * The negative cases carry the weight. A resolver that returned "resolved" for
 * everything it could not check would pass a happy-path test and give a folio
 * a clean tag report over a graph it never read.
 *
 * @module schemas/todo.test
 */
import { describe, expect, test } from "bun:test";

import {
  TodoTagsSchema,
  TodoNodeSchema,
  TaskRefSchema,
  ExternalIdentitySchema,
  resolveTodoTags,
  danglingTags,
  TODO_SCHEMA_TAG,
  type KgIndex,
} from "./todo";

const KG: KgIndex = {
  roles: new Set(["editor", "author"]),
  processes: new Set(["Process_CRDM"]),
  tasks: new Map([["Process_CRDM", new Set(["A_Implement", "A_Summary"])]]),
  actors: new Set(["admin"]),
};

const tags = (o: Partial<Record<string, unknown>> = {}) =>
  TodoTagsSchema.parse({ roles: [], processes: [], tasks: [], identities: [], references: [], ...o });

describe("tag shapes", () => {
  test("a task reference is a PAIR, never a bare id", () => {
    // A BPMN activity id is unique only within its process. Accepting a bare
    // string would make the tag un-addressable the moment two diagrams share
    // an activity name.
    expect(() => TaskRefSchema.parse({ task: "A_Implement" })).toThrow();
    expect(TaskRefSchema.parse({ process: "Process_CRDM", task: "A_Implement" })).toBeTruthy();
  });

  test("an identity is provider-qualified", () => {
    // `litlfred` is not an identity; `github:litlfred` is.
    expect(() => ExternalIdentitySchema.parse({ id: "litlfred" })).toThrow();
    expect(ExternalIdentitySchema.parse({ provider: "github", id: "litlfred" })).toBeTruthy();
  });

  test("the actor link is optional — an outside person is still a person", () => {
    const i = ExternalIdentitySchema.parse({ provider: "github", id: "drive-by" });
    expect(i.actor).toBeUndefined();
  });

  test("every tag axis defaults to an empty array", () => {
    // `artefacts` joined the shape when the tags were lifted into
    // `schemas/carried-note.ts` and shared with agent memory: an issue, a PR
    // or a commit is neither a graph node nor a person, so neither existing
    // axis could hold one. Asserted as the whole object rather than per key —
    // a new axis SHOULD break this test, because a consumer reading the shape
    // needs to know it grew.
    const t = TodoTagsSchema.parse({});
    expect(t).toEqual({
      roles: [],
      processes: [],
      tasks: [],
      identities: [],
      references: [],
      artefacts: [],
    });
  });

  test("several people can be tagged on ONE todo", () => {
    // A question for two reviewers is one item. Splitting it would lose that
    // they are being asked the same thing.
    const t = TodoTagsSchema.parse({
      identities: [
        { provider: "github", id: "a" },
        { provider: "github", id: "b" },
      ],
    });
    expect(t.identities).toHaveLength(2);
  });

  test("references point at any node kind, including unregistered ones", () => {
    // The kind vocabulary is an open registry; a closed enum here would refuse
    // a reference to a kind a downstream instance added.
    const t = TodoTagsSchema.parse({
      references: [{ kind: "skill", id: "todo-review" }, { kind: "some-future-kind", id: "x", note: "why" }],
    });
    expect(t.references).toHaveLength(2);
    expect(t.references[1].note).toBe("why");
  });

  test("a todo file declares what it is", () => {
    // Same convention as the workflow instances: telling a directory's
    // contents apart by extension is a coincidence of the layout, not a
    // contract. A declaration inside the file is the contract.
    expect(() =>
      TodoNodeSchema.parse({
        id: "t1", summary: "s", status: "open", priority: "high",
        origin: "human", createdAt: "2026-09-18T00:00:00Z",
      }),
    ).toThrow();
    const ok = TodoNodeSchema.parse({
      $schema: TODO_SCHEMA_TAG,
      id: "t1", summary: "s", status: "open", priority: "high",
      origin: "human", createdAt: "2026-09-18T00:00:00Z",
    });
    expect(ok.tags.roles).toEqual([]);
  });
});

describe("resolution against the knowledge graph", () => {
  test("a known role, process and task all resolve", () => {
    const r = resolveTodoTags(
      tags({ roles: ["editor"], processes: ["Process_CRDM"], tasks: [{ process: "Process_CRDM", task: "A_Implement" }] }),
      KG,
    );
    expect(r.every((x) => x.state === "resolved")).toBe(true);
    expect(danglingTags(r)).toEqual([]);
  });

  test("an unknown role dangles", () => {
    const r = resolveTodoTags(tags({ roles: ["no-such-role"] }), KG);
    expect(r[0].state).toBe("dangling");
  });

  test("a task in a process the index does not know DANGLES, not not-checked", () => {
    // The index was read and does not contain that process — a real finding.
    const r = resolveTodoTags(tags({ tasks: [{ process: "Process_Ghost", task: "A_X" }] }), KG);
    expect(r[0].state).toBe("dangling");
  });

  test("a task that is not an activity of its named process dangles", () => {
    const r = resolveTodoTags(tags({ tasks: [{ process: "Process_CRDM", task: "A_Nope" }] }), KG);
    expect(r[0].state).toBe("dangling");
  });

  test("the task ref names its process, so the finding is actionable", () => {
    const r = resolveTodoTags(tags({ tasks: [{ process: "Process_CRDM", task: "A_Nope" }] }), KG);
    expect(r[0].ref).toContain("Process_CRDM");
    expect(r[0].ref).toContain("A_Nope");
  });
});

describe("not-checked is a third state and never collapses", () => {
  test("an unreadable role index reports not-checked, NOT dangling", () => {
    // A shallow checkout with no `skills/` must not produce a wall of false
    // dangling findings — that is how a check gets switched off.
    const r = resolveTodoTags(tags({ roles: ["editor", "ghost"] }), {});
    expect(r.map((x) => x.state)).toEqual(["not-checked", "not-checked"]);
    expect(danglingTags(r)).toEqual([]);
  });

  test("an unreadable task index reports not-checked", () => {
    const r = resolveTodoTags(tags({ tasks: [{ process: "P", task: "T" }] }), { roles: new Set() });
    expect(r[0].state).toBe("not-checked");
  });

  test("an EMPTY index is a determined empty, so its tags dangle", () => {
    // `new Set()` means "read it, nothing there". `undefined` means "could not
    // read". Conflating them loses the only distinction that matters.
    const r = resolveTodoTags(tags({ roles: ["editor"] }), { roles: new Set() });
    expect(r[0].state).toBe("dangling");
  });

  test("an UNLINKED identity is not checked and not dangling", () => {
    // Somebody outside the actor registry is a real person, not a broken
    // reference. Only a linked identity is checkable at all.
    const r = resolveTodoTags(
      tags({ identities: [{ provider: "github", id: "drive-by" }] }),
      KG,
    );
    expect(r).toEqual([]);
  });

  test("a LINKED identity naming an unknown actor dangles", () => {
    const r = resolveTodoTags(
      tags({ identities: [{ provider: "github", id: "x", actor: "no-such-actor" }] }),
      KG,
    );
    expect(r[0]).toEqual({ axis: "actor", ref: "no-such-actor", state: "dangling" });
  });
});
