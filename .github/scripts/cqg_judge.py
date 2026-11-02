#!/usr/bin/env python3
"""Judge a code-quality-gates job by "no new failures compared with main".

Owner card Q-PIPE-1 A (2026-11-01), issue #2899. CI only; `cqg-step.sh`
calls `record` after each judged step, and the job's last step calls
`verdict`.

## What a job records

Every step after the job's `begin` step is a judged step. `record` writes one
line per step to `$RUNNER_TEMP/cqg/steps.jsonl`: an id (a hash of the step's
script, comments and blank lines left out), a label (its first command) and
its exit code. A step that writes a JUnit report (`CQG_JUNIT`, with
`CQG_TESTS` = `bun` or `playwright`) is recorded by its failing tests
instead, each test by file and title. When the report and the runner's own
summary do not agree, the step is recorded as "could not determine".

## The verdict

`verdict` prints the job's record into the job log, on one line starting
`CQG-REPORT-V1 `, so a later run can read it back through the Actions API.
The record goes into the log, not into an artifact, because two judged jobs
end with a gate that must stay their last step (`check:red-gate-is-last`),
so no upload step can follow it.

- On `pull_request`, a failure passes only when the same job's record from
  the newest completed push run on `main` that has one lists it as failing
  too. A failure that passes on main, or that main did not record, is NEW and
  fails the job.
- On every other event (push, merge_group, workflow_dispatch) any failure
  fails the job, so `main` stays honestly red.
- Could-not-determine is never green: an incomplete record on head, a step
  that could not be determined, or no readable record from main fails the job.

`reuse-check` is for the `verdict-reuse` job: a PR run that passed only
because its failures were also main's must not stand in for main's own run.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import zlib
import xml.etree.ElementTree as ET

MARKER = "CQG-REPORT-V1 "
WORKFLOW = "code-quality-gates.yml"
# The jobs verdict-reuse skips on main; the same list as verdict-reuse.sh.
SKIPPABLE = re.compile(
    r"^(TypeScript — bun test, shard [0-9]+/4|End-to-end \+ accessibility, shard [0-9]+/3"
    r"|Repository gates — cat-harness standalone ratchet \(hard\))$"
)
RUNS_SCANNED = 30
ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


def state_dir():
    return os.environ.get("CQG_DIR") or os.path.join(os.environ.get("RUNNER_TEMP", "/tmp"), "cqg")


def script_lines(text):
    """A step's script without comments and blank lines, each line trimmed."""
    return [ln.strip() for ln in text.splitlines() if ln.strip() and not ln.strip().startswith("#")]


def step_id(text):
    return hashlib.sha256("\n".join(script_lines(text)).encode()).hexdigest()[:16]


def step_label(text):
    lines = [ln for ln in script_lines(text) if not re.match(r"^set\s+-", ln)]
    return (lines[0] if lines else "(empty step)")[:160]


# ---------------------------------------------------------------- test reports


def junit_failures(path, kind):
    """The ids of the failing test cases in a JUnit file."""
    root = ET.parse(path).getroot()
    out = []

    def walk(node, trail):
        for child in node:
            if child.tag == "testsuite":
                walk(child, trail + [child.get("name", "")])
            elif child.tag == "testcase":
                if any(c.tag in ("failure", "error") for c in child):
                    if kind == "playwright":
                        out.append(f"{child.get('classname', '')} > {child.get('name', '')}")
                    else:
                        out.append(" > ".join([t for t in trail if t] + [child.get("name", "")]))

    walk(root if root.tag == "testsuites" else [root], [])
    return out


TEST_FILE = r"(\S.*?(?:\.|_)(?:test|spec)\.[a-z]+)"
# `a.test.ts:` as bun prints it, or `::group::a.test.ts[:]` under GitHub Actions.
FILE_HEADER = re.compile(rf"^(?:::group::{TEST_FILE}:?|{TEST_FILE}:)\s*$")


def bun_log(log):
    """(unhandled-error ids by file, fail count, error count) from bun test's output."""
    current, unhandled, fail_n, err_n = "(unknown file)", [], None, 0
    for raw in log.splitlines():
        line = ANSI.sub("", raw).rstrip()
        m = FILE_HEADER.match(line)
        if m:
            current = m.group(1) or m.group(2)
            continue
        if line.strip() == "# Unhandled error between tests":
            unhandled.append(f"{current} > (unhandled error between tests)")
            continue
        m = re.match(r"^\s*(\d+) fail$", line)
        if m:
            fail_n = int(m.group(1))
        m = re.match(r"^\s*(\d+) errors?$", line)
        if m:
            err_n = int(m.group(1))
    return unhandled, fail_n, err_n


def judge_tests(kind, junit, log, exit_code):
    """(failing test ids, None) or (None, why it could not be determined)."""
    if exit_code == 0:
        return [], None
    if not junit or not os.path.isfile(junit):
        return None, f"exit {exit_code} and no JUnit report at {junit}"
    try:
        failing = junit_failures(junit, kind)
    except (ET.ParseError, OSError) as e:
        return None, f"exit {exit_code} and the JUnit report does not parse: {e}"
    if kind == "bun":
        unhandled, fail_n, err_n = bun_log(log)
        if fail_n is None:
            return None, f"exit {exit_code} and no `N fail` summary in bun's output"
        if fail_n != len(failing) + len(unhandled) or err_n != len(unhandled):
            return None, (f"bun reported {fail_n} fail / {err_n} error, the JUnit report names "
                          f"{len(failing)} failing test(s) and the output {len(unhandled)} unhandled error(s)")
        failing += unhandled
    elif kind == "playwright":
        text = ANSI.sub("", log)
        if re.search(r"were not a part of any test|was not a part of any test", text):
            return None, "Playwright reported errors outside any test"
        if re.search(r"^\s*\d+ interrupted\s*$", text, re.M):
            return None, "Playwright reported interrupted tests"
        counts = re.findall(r"^\s*(\d+) failed\s*$", text, re.M)
        if counts and int(counts[-1]) != len(failing):
            return None, f"Playwright reported {counts[-1]} failed, the JUnit report names {len(failing)}"
    else:
        return None, f"unknown CQG_TESTS kind {kind!r}"
    if not failing:
        return None, f"exit {exit_code} and no failing test recorded"
    return sorted(set(failing)), None


# ---------------------------------------------------------------- the record


def cmd_record(args):
    script_path, exit_code, log_path = args[0], int(args[1]), args[2]
    text = open(script_path, encoding="utf-8", errors="replace").read()
    entry = {"id": step_id(text), "label": step_label(text), "exit": exit_code}
    kind = os.environ.get("CQG_TESTS")
    if kind:
        log = open(log_path, encoding="utf-8", errors="replace").read() if os.path.isfile(log_path) else ""
        tests, why = judge_tests(kind, os.environ.get("CQG_JUNIT", ""), log, exit_code)
        if why:
            entry["undetermined"] = why
        else:
            entry["tests"] = tests
    if exit_code != 0:
        entry["tail"] = tail_of(log_path)
    with open(os.path.join(state_dir(), "steps.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return 0


def tail_of(path, lines=15):
    if not os.path.isfile(path):
        return ""
    with open(path, encoding="utf-8", errors="replace") as f:
        return "\n".join(ANSI.sub("", ln.rstrip()) for ln in f.readlines()[-lines:])[-2000:]


def build_report():
    """The job's record from steps.jsonl: {complete, items, undetermined}."""
    d = state_dir()
    begun = os.path.isfile(os.path.join(d, "phase"))
    status = os.environ.get("CQG_JOB_STATUS", "success")
    report = {"complete": begun and status == "success", "items": {}, "undetermined": []}
    if not begun:
        report["undetermined"].append({"label": "(job)", "why": "the judged steps never began; an earlier step failed"})
    elif status != "success":
        report["undetermined"].append({"label": "(job)", "why": f"a step outside the judged ones concluded {status}"})
    path = os.path.join(d, "steps.jsonl")
    for line in open(path, encoding="utf-8") if os.path.isfile(path) else []:
        e = json.loads(line)
        if e.get("undetermined"):
            report["undetermined"].append({"label": e["label"], "why": e["undetermined"]})
        elif e.get("tests") is not None and e["exit"] != 0:
            for t in e["tests"]:
                report["items"][f"test:{t}"] = {"label": t, "exit": 1}
        else:
            item = {"label": e["label"], "exit": e["exit"]}
            if e["exit"] != 0 and e.get("tail"):
                item["tail"] = e["tail"]
            report["items"][f"step:{e['id']}"] = item
    return report


def encode(report):
    slim = {"complete": report["complete"], "undetermined": report["undetermined"],
            "items": {k: {"label": v["label"], "exit": v["exit"]} for k, v in report["items"].items()}}
    return MARKER + base64.b64encode(zlib.compress(json.dumps(slim, sort_keys=True).encode(), 9)).decode()


RECORD_LINE = re.compile(r"(?:^|\s)" + re.escape(MARKER) + r"([A-Za-z0-9+/=]+)\s*$")


def record_from_log(text):
    """The last well-formed record in a job log, or None."""
    for line in reversed(text.splitlines()):
        m = RECORD_LINE.search(line)
        if not m:
            continue
        try:
            rec = json.loads(zlib.decompress(base64.b64decode(m.group(1), validate=True)))
        except (ValueError, zlib.error):
            continue
        if isinstance(rec, dict) and isinstance(rec.get("items"), dict):
            return rec
    return None


def failing(report):
    return sorted(k for k, v in report["items"].items() if v["exit"] != 0)


def compare(head, main):
    """(new, inherited): head's failures that main passed or lacks, and those it fails too."""
    new, inherited = [], []
    for k in failing(head):
        (inherited if main["items"].get(k, {}).get("exit", 0) != 0 else new).append(k)
    return new, inherited


# ---------------------------------------------------------------- the API


def gh(path, raw=False):
    r = subprocess.run(["gh", "api", path], capture_output=True, text=True)
    if r.returncode != 0 and "--allow-escape-sequences" in r.stderr:
        # Job logs carry colour codes; newer gh refuses them unless asked.
        r = subprocess.run(["gh", "api", "--allow-escape-sequences", path], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"gh api {path}: {r.stderr.strip()[:300]}")
    return r.stdout if raw else json.loads(r.stdout)


def main_record(repo, job_name):
    """(record, run url) from the newest completed push run on main with a complete record, or (None, why)."""
    runs = gh(f"repos/{repo}/actions/workflows/{WORKFLOW}/runs?event=push&branch=main&status=completed"
              f"&per_page={RUNS_SCANNED}")["workflow_runs"]
    seen = []
    for run in runs:
        jobs = gh(f"repos/{repo}/actions/runs/{run['id']}/jobs?per_page=100")["jobs"]
        job = next((j for j in jobs if j["name"] == job_name and j.get("conclusion") in ("success", "failure")), None)
        if not job:
            continue
        rec = record_from_log(gh(f"repos/{repo}/actions/jobs/{job['id']}/logs", raw=True))
        if rec and rec.get("complete"):
            return rec, run["html_url"]
        seen.append(str(run["id"]))
    return None, (f"none of the {len(runs)} newest completed push runs on main holds a complete record for "
                  f"`{job_name}` (job logs read: {', '.join(seen) or 'none'})")


# ---------------------------------------------------------------- verdict


def summary(lines):
    text = "\n".join(lines) + "\n"
    print(text)
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(text)


def cell(text):
    return text.replace("|", "/").replace("<", "&lt;")


def rows(report, keys):
    return [f"| {cell(report['items'][k]['label'])} |" for k in keys]


def cmd_verdict(_args):
    head = build_report()
    os.makedirs(state_dir(), exist_ok=True)
    with open(os.path.join(state_dir(), "report.json"), "w", encoding="utf-8") as f:
        json.dump(head, f, indent=1)
    print(encode(head))
    fails = failing(head)
    title = "### Q-PIPE-1: no new failures compared with main"
    if head["undetermined"]:
        summary([title, "", "**Could not determine, so this job fails** (never a pass):", "",
                 *[f"- `{u['label']}`: {u['why']}" for u in head["undetermined"]],
                 "", *([f"Also failing: {len(fails)}."] if fails else [])])
        return 1
    if not fails:
        summary([title, "", "No failures in the judged steps."])
        return 0
    event = os.environ.get("GITHUB_EVENT_NAME", "")
    if event != "pull_request":
        summary([title, "", f"`{event}` run: every failure counts, so main stays honestly red.", "",
                 "| failing |", "| --- |", *rows(head, fails)])
        return 1
    repo, job_name = os.environ.get("GITHUB_REPOSITORY", ""), os.environ.get("CQG_JOB_NAME", "")
    try:
        main, where = main_record(repo, job_name) if repo and job_name else (None, "CQG_JOB_NAME or the repository is unset")
    except (RuntimeError, ValueError, KeyError) as e:
        main, where = None, f"the Actions API could not be read: {e}"
    if main is None:
        summary([title, "", f"**Could not determine main's record, so every failure counts:** {where}", "",
                 "| failing |", "| --- |", *rows(head, fails)])
        return 1
    new, inherited = compare(head, main)
    out = [title, "", f"Compared with main's record from {where}.", ""]
    if new:
        out += [f"**{len(new)} new failure(s)** — failing here, passing or not recorded on main:", "",
                "| new failure |", "| --- |", *rows(head, new), ""]
        for k in new:
            if head["items"][k].get("tail"):
                out += [f"<details><summary>{cell(head['items'][k]['label'])}</summary>", "", "```",
                        head["items"][k]["tail"], "```", "</details>", ""]
    if inherited:
        out += [f"{len(inherited)} failure(s) failing on main too — main's to fix, not counted here:", "",
                "| failing on main too |", "| --- |", *rows(head, inherited)]
    summary(out)
    return 1 if new else 0


def cmd_reuse_check(_args):
    """Writes reuse=true only when every skippable job of RUN_ID recorded no failure."""
    repo, run_id = os.environ.get("REPO", ""), os.environ.get("RUN_ID", "")
    out = os.environ.get("GITHUB_OUTPUT")

    def answer(value, why):
        if out:
            with open(out, "a", encoding="utf-8") as f:
                f.write(f"reuse={value}\n")
        summary([f"### Q-PIPE-1: reuse {'kept' if value == 'true' else 'refused'}", "", why])
        return 0

    try:
        jobs = [j for j in gh(f"repos/{repo}/actions/runs/{run_id}/jobs?per_page=100")["jobs"] if SKIPPABLE.match(j["name"])]
        if not jobs:
            return answer("false", f"run {run_id} has none of the jobs a reuse would skip.")
        for j in jobs:
            rec = record_from_log(gh(f"repos/{repo}/actions/jobs/{j['id']}/logs", raw=True))
            if rec is None or not rec.get("complete") or rec.get("undetermined"):
                return answer("false", f"`{j['name']}` in run {run_id} left no complete record, so every job runs.")
            if failing(rec):
                return answer("false", f"`{j['name']}` in run {run_id} passed only because its "
                                       f"{len(failing(rec))} failure(s) were main's too, so main runs it again.")
    except (RuntimeError, ValueError, KeyError) as e:
        return answer("false", f"could not determine ({e}), so every job runs.")
    return answer("true", f"every skippable job of run {run_id} recorded no failure.")


def main(argv):
    cmds = {"record": cmd_record, "verdict": cmd_verdict, "reuse-check": cmd_reuse_check}
    if len(argv) < 2 or argv[1] not in cmds:
        print(f"usage: cqg_judge.py {{{'|'.join(cmds)}}} ...", file=sys.stderr)
        return 2
    return cmds[argv[1]](argv[2:])


if __name__ == "__main__":
    sys.exit(main(sys.argv))
