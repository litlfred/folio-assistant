/-
Formal-edge extractor — TEMPLATE. `content/pipeline/formal-edges.ts` fills in the
imports below and runs the result with `lake env lean` inside the folio's own
Lake project, so it elaborates against exactly the code the folio builds.

For every TAGGED declaration (the folio's `lean.ref` targets, listed one per
line in the file named by `FORMAL_EDGES_TAGGED`) it writes one JSONL line to
the file named by `FORMAL_EDGES_OUT`:

  {"decl": "...", "type_deps": [...], "value_deps": [...], "kind": "theorem" | ...}

The dependency rule is LeanArchitect's `collectUsed`
(hanwenzhu/LeanArchitect, `Architect/CollectUsed.lean`), with the tagged SET in
place of its `@[blueprint]` attribute: walk the constants a term uses, recurse
THROUGH untagged ones (type and value both), stop AT tagged ones. Statement
deps come from the declaration's type; proof deps are what the value reaches
minus the statement set. So the edges run block-to-block, with helper lemmas
collapsed, and no attribute is added to the folio's Lean.

Measured against LeanArchitect v4.25.0 on a 691-declaration cluster of qou
(folio-assistant#1492): 1,400 of 1,404 edges agree with every declaration
tagged and 172 of 174 with 30 % tagged. Every difference is a `structure`
whose field types LeanArchitect omits and this rule keeps.

Uses only core `Lean` APIs, so it needs no Lake dependency beyond what the
folio already has.
-/
-- FORMAL_EDGES_IMPORTS
import Lean
open Lean Elab Command

namespace FormalEdges

/-- LeanArchitect's traversal, with `tagged` for the attribute. -/
partial def collect (env : Environment) (tagged : NameSet) (root : Name) (c : Name) :
    StateM (NameSet × Array Name) Unit := do
  let (vis, _) ← get
  unless vis.contains c do
    modify fun (v, u) => (v.insert c, u)
    if c != root && tagged.contains c then
      modify fun (v, u) => (v, u.push c)
    else
      match env.find? c with
      | some (.defnInfo v) | some (.thmInfo v) | some (.opaqueInfo v) =>
        for d in v.type.getUsedConstants do collect env tagged root d
        for d in v.value.getUsedConstants do collect env tagged root d
      | some (.ctorInfo v) | some (.recInfo v) =>
        for d in v.type.getUsedConstants do collect env tagged root d
      | some (.inductInfo v) =>
        for d in v.type.getUsedConstants do collect env tagged root d
        for d in v.ctors do collect env tagged root d
      | _ => pure ()

/-- (statement deps, proof deps) of `c`, disjoint. -/
def edges (env : Environment) (tagged : NameSet) (c : Name) : Array Name × Array Name := Id.run do
  let some ci := env.find? c | return (#[], #[])
  let mut st : NameSet × Array Name := ({}, #[])
  for d in ci.type.getUsedConstants do st := ((collect env tagged c d).run st).2
  let ty := st.2
  st := ((collect env tagged c c).run st).2
  let tyS := NameSet.ofArray ty
  return (ty, st.2.filter (!tyS.contains ·))

def kindOf : ConstantInfo → String
  | .thmInfo _ => "theorem" | .defnInfo _ => "def" | .inductInfo _ => "inductive"
  | .axiomInfo _ => "axiom" | .opaqueInfo _ => "opaque" | _ => "other"

def names (a : Array Name) : Json :=
  Json.arr ((a.map (·.toString)).toList.eraseDups.toArray.map Json.str)

end FormalEdges

open FormalEdges in
run_cmd do
  let env ← getEnv
  let some taggedPath ← IO.getEnv "FORMAL_EDGES_TAGGED" | throwError "FORMAL_EDGES_TAGGED is not set"
  let some outPath ← IO.getEnv "FORMAL_EDGES_OUT" | throwError "FORMAL_EDGES_OUT is not set"
  let wanted := ((← IO.FS.readFile taggedPath).splitOn "\n").filter (· ≠ "") |>.map String.toName
  -- A tagged name the environment does not hold is REPORTED, never dropped:
  -- a missing declaration would otherwise read as one with no dependencies.
  let (present, missing) := wanted.partition (env.contains ·)
  let tagged := NameSet.ofList present
  let mut lines : Array String := #[]
  for c in present do
    let (ty, val) := edges env tagged c
    lines := lines.push (Json.compress (Json.mkObj [
      ("decl", Json.str c.toString), ("kind", Json.str (kindOf (env.find? c).get!)),
      ("type_deps", names ty), ("value_deps", names val)]))
  for c in missing do
    lines := lines.push (Json.compress (Json.mkObj [
      ("decl", Json.str c.toString), ("missing", Json.bool true)]))
  IO.FS.writeFile outPath (String.intercalate "\n" lines.toList ++ "\n")
  logInfo m!"formal-edges: {present.length} tagged declarations, {missing.length} not found"
