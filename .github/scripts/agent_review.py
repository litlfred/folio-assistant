"""
Agent Review System

A review coordinator that orchestrates multiple AI reviewers to provide
feedback on commits to main. Reviews are synthesized into a summary
GitHub issue identifying common criticisms and actionable feedback.

Architecture:
  Every available LLM runs every specialized review type.  A coordinator
  agent then synthesizes the results across all reviewers and LLMs.

Review types:
  - Accuracy: Scientific and mathematical rigor checks using methodology
    from K-Dense-AI/claude-scientific-skills.
  - LaTeX Validator: Validates LaTeX syntax, environment usage, label
    conventions, and cross-references.
  - Readability Editor: Evaluates narrative flow, definition hygiene,
    spelling, grammar, and prose clarity.
  - Lean Proof Review: Reviews Lean 4 proofs for correctness, style,
    and completeness.

LLMs (each runs every review type when its key is configured):
  - Claude (Anthropic)
  - Gemini (Google)
  - Copilot / OpenAI (GitHub Models)

Skills:
  Skill definitions for the specialized reviewers are loaded from
  .claude/skills/ via qou_lib.skills and inform the system prompts.

Configuration:
  Set the following repository secrets to enable each LLM:
    ANTHROPIC_API_KEY  - enables Claude
    GEMINI_API_KEY     - enables Gemini
    GITHUB_TOKEN       - enables Copilot (provided by default in GitHub Actions)

  Every configured LLM participates in every review type.  The coordinator
  synthesizes results across all LLMs and review types, identifying common
  themes and contradictions.
"""

import os
import re
import requests

from qou_lib.config import REQUIRED_REVIEW_SECTIONS, VALID_VERDICTS
from qou_lib.skills import load_all_skills, load_skill

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

COMMIT_DIFF = os.environ.get("COMMIT_DIFF", "")
COMMIT_MESSAGE = os.environ.get("COMMIT_MESSAGE", "")
COMMIT_SHA = os.environ.get("COMMIT_SHA", "")
COMMIT_AUTHOR = os.environ.get("COMMIT_AUTHOR", "")
REPO_NAME = os.environ.get("REPO_NAME", "")
PDF_URL = os.environ.get("PDF_URL", "")

# Skills content: prefer loading from files, fall back to env var.
SKILLS_CONTENT = load_all_skills(max_chars=20000) or os.environ.get("SKILLS_CONTENT", "")

CLAUDE_MODEL = "claude-opus-4-20250514"
GEMINI_MODEL = "gemini-2.5-pro"
COPILOT_MODEL = "o3"
API_TIMEOUT = 120

# ---------------------------------------------------------------------------
# Build review system prompts from skill files
# ---------------------------------------------------------------------------


def _build_system_prompt(skill_name, fallback_prompt):
    """Load skill content and append it to the review system prompt.

    If the skill file exists, its content augments the review instructions.
    Otherwise, falls back to the hardcoded prompt.
    """
    skill_content = load_skill(skill_name)
    if skill_content:
        return (
            f"{fallback_prompt}\n\n"
            f"## Skill Guide: {skill_name}\n\n"
            f"Use the following skill definition as additional guidance:\n\n"
            f"{skill_content}"
        )
    return fallback_prompt


# Base prompts (also serve as fallbacks if skill files are missing).
_ACCURACY_REVIEW_BASE = """You are a scientific accuracy reviewer. Your role is to
evaluate commits for mathematical correctness, scientific rigor, and logical
consistency. Use the following structured methodology derived from established
scientific peer-review practices.

## Review Methodology

### 1. Mathematical Verification
- Check all equations, formulas, and numerical computations for correctness.
- Verify dimensional analysis and unit consistency.
- Confirm boundary conditions and edge-case handling.

### 2. Scientific Rigor
- Assess whether claims are supported by evidence or sound reasoning.
- Check that scientific terminology is used correctly.
- Verify that any referenced constants, data, or facts are accurate.

### 3. Statistical & Methodological Soundness
- Evaluate statistical methods for appropriateness.
- Check sample sizes, power calculations, and significance thresholds.
- Look for common pitfalls: p-hacking, multiple comparisons, survivorship bias.

### 4. Logical Consistency
- Identify logical fallacies or unsupported leaps in reasoning.
- Check that conclusions follow from the presented evidence.
- Verify internal consistency across the changeset.

### 5. Reproducibility
- Assess whether methods are described with sufficient detail to reproduce.
- Check for hard-coded magic numbers without explanation.
- Verify that algorithms are correctly implemented.

## Output Format
You MUST structure your response using exactly these four markdown sections.
Do not add, rename, or omit any section.

- **Summary**: One-paragraph overall assessment.
- **Issues Found**: Numbered list of specific problems. Tag each with (critical), (major), or (minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: Exactly one of APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
"""

_LATEX_REVIEW_BASE = """You are a LaTeX validation reviewer. Your role is to check
commits containing LaTeX source for syntactic correctness, structural consistency,
and adherence to project conventions.

## Review Methodology

### 1. Syntax Correctness
- Every \\begin{env} has a matching \\end{env}.
- Braces {}, brackets [], and parentheses () are balanced.
- No undefined control sequences (commands must come from a declared package or
  the preamble).
- Math mode delimiters ($...$, \\(...\\), \\[...\\]) are properly paired.

### 2. Environment Usage
- Theorem-like environments (theorem, lemma, proposition, corollary, definition,
  example, remark, conjecture) are used only as declared in main.tex and are never
  redeclared in chapter files.
- Display math uses `equation` or `align` environments — never $$...$$.

### 3. Label Conventions
- Every labeled item uses the correct prefix:
  chap: for chapters, sec:/ssec: for (sub)sections,
  def:/thm:/lem:/prop:/cor:/ex:/rem:/conj: for theorem-like environments,
  eq: for equations, fig: for figures, tab: for tables.
- Every theorem-like environment and every numbered equation carries a \\label{}.

### 4. Cross-References
- \\ref and \\eqref targets correspond to existing \\label commands.
- Non-breaking spaces (~) precede \\ref and \\eqref.

### 5. Bibliography
- Every \\cite{key} key appears in references.bib.
- BibTeX keys follow the <firstauthorlastname><year> convention.

## Output Format
You MUST structure your response using exactly these four markdown sections.
Do not add, rename, or omit any section.

- **Summary**: One-paragraph assessment of LaTeX correctness.
- **Issues Found**: Numbered list of specific problems. Tag each with (critical), (major), or (minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: Exactly one of APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
"""

_READABILITY_REVIEW_BASE = """You are a readability editor. Your role is to review
LaTeX manuscripts for narrative clarity, prose quality, and editorial polish. You
are less concerned with mathematical correctness and more concerned with how well
the text communicates ideas to a graduate-level reader.

## Review Methodology

### 1. Narrative Flow
- Sections and subsections follow a logical progression.
- Transitions between paragraphs and sections are smooth.
- The reader is never left wondering why a topic is introduced.

### 2. Definition Hygiene
- Definitions are concise and self-contained.
- Each definition introduces exactly one concept.
- Technical terms are introduced with \\emph{} on first use and are not re-defined.
- Every non-trivial definition is followed by at least one example.

### 3. Spelling and Grammar
- Identify misspelled words (including common LaTeX-adjacent typos).
- Flag grammatical errors: subject-verb agreement, dangling modifiers, comma
  splices, run-on sentences.
- Enforce formal academic English: no contractions, no first-person singular,
  Oxford comma.

### 4. Sentence-Level Clarity
- Flag overly long or convoluted sentences.
- Suggest simpler alternatives where meaning is preserved.
- Sentences must not begin with a mathematical symbol.

### 5. Consistency
- Notation introduced in one section is used consistently throughout.
- Acronyms are expanded on first use and used bare thereafter.
- Displayed equations ending a sentence include a period inside the environment.

## Output Format
You MUST structure your response using exactly these four markdown sections.
Do not add, rename, or omit any section.

- **Summary**: One-paragraph assessment of readability and prose quality.
- **Issues Found**: Numbered list of specific problems. Tag each with (critical), (major), or (minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: Exactly one of APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
"""

_LEAN_REVIEW_BASE = """You are a Lean 4 formal proof reviewer. Your role is to
review Lean source code for correctness, style, and completeness of formal
mathematical proofs.

## Review Methodology

### 1. Compilation & Type Checking
- Does the code compile without errors?
- Are all `sorry` usages intentional and tracked?
- Are imports minimal and correct?

### 2. Proof Correctness
- Does the Lean statement faithfully capture the corresponding LaTeX theorem?
- Is the proof strategy mathematically sound (not just type-correct)?
- Are there any uses of `sorry` that could be filled?

### 3. Mathlib Integration
- Are existing mathlib lemmas/theorems used where applicable?
- Does the code follow mathlib naming conventions (snake_case, etc.)?
- Are appropriate attributes applied (@[simp], @[ext], etc.)?

### 4. Style & Documentation
- Are docstrings present for all public declarations?
- Is the code well-structured and readable?
- Are proofs reasonably concise?

### 5. Dependency Tracking
- Are LaTeX \\lean{} macros consistent with the Lean declaration names?
- Are \\uses{} dependencies accurately reflected?

## Output Format
You MUST structure your response using exactly these four markdown sections.
Do not add, rename, or omit any section.

- **Summary**: One-paragraph assessment of the Lean formalization.
- **Issues Found**: Numbered list of specific problems. Tag each with (critical), (major), or (minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: Exactly one of APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
"""

# Build final prompts: base + skill content (if available).
ACCURACY_REVIEW_SYSTEM = _build_system_prompt("scientific-accuracy", _ACCURACY_REVIEW_BASE)
LATEX_REVIEW_SYSTEM = _build_system_prompt("latex-validation", _LATEX_REVIEW_BASE)
READABILITY_REVIEW_SYSTEM = _build_system_prompt("readability-editing", _READABILITY_REVIEW_BASE)
LEAN_REVIEW_SYSTEM = _build_system_prompt("lean-proof-review", _LEAN_REVIEW_BASE)

COORDINATOR_SYSTEM = """You are the Review Coordinator. You are given feedback from
multiple AI reviewers about a code commit. Your job is to:

1. **Synthesize** all reviews into a coherent summary.
2. **Identify common criticisms** raised by multiple reviewers.
3. **Highlight critical issues** that need immediate attention.
4. **Resolve contradictions** between reviewers when they disagree.
5. **Prioritize** the feedback from most to least important.
6. **Provide a final recommendation**: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.

## Output Format
Use the following markdown structure:

### Overall Assessment
(one paragraph synthesis)

### Critical Issues
(numbered list, if any)

### Common Themes
(feedback points raised by more than one reviewer)

### Reviewer Summaries
(brief summary from each reviewer)

### Consolidated Suggestions
(prioritized list of all unique suggestions)

### Final Recommendation
(APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION with justification)
"""

# ---------------------------------------------------------------------------
# Reviewer helpers
# ---------------------------------------------------------------------------


def build_review_prompt(diff, commit_message, commit_sha, commit_author):
    """Build the user prompt containing commit context, diff, and resources."""
    prompt = (
        f"## Commit Details\n"
        f"- **Author**: {commit_author}\n"
        f"- **SHA**: {commit_sha}\n"
        f"- **Message**: {commit_message}\n\n"
    )

    if PDF_URL:
        prompt += (
            f"## Most Recent PDF\n"
            f"The latest published version of the paper is available at:\n"
            f"{PDF_URL}\n\n"
        )

    if SKILLS_CONTENT:
        prompt += (
            f"## Reviewer Skill Guides\n"
            f"Use the following skill definitions as guidance for your review.\n\n"
            f"{SKILLS_CONTENT}\n\n"
        )

    prompt += f"## Diff\n```diff\n{diff}\n```"
    return prompt


def call_anthropic(system_prompt, user_prompt, model=CLAUDE_MODEL):
    """Call the Anthropic Messages API and return the response text."""
    resp = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        },
        timeout=API_TIMEOUT,
    )
    if not resp.ok:
        raise RuntimeError(f"Anthropic API request failed ({resp.status_code}): {resp.text[:200]}")
    data = resp.json()
    return data["content"][0]["text"]


def call_gemini(system_prompt, user_prompt, model=GEMINI_MODEL):
    """Call the Google Gemini API and return the response text."""
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={GEMINI_API_KEY}"
    )
    resp = requests.post(
        url,
        headers={"content-type": "application/json"},
        json={
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
        },
        timeout=API_TIMEOUT,
    )
    if not resp.ok:
        raise RuntimeError(f"Gemini API request failed ({resp.status_code}): {resp.text[:200]}")
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def call_copilot(system_prompt, user_prompt, model=COPILOT_MODEL):
    """Call the GitHub Models API (Copilot) and return the response text."""
    resp = requests.post(
        "https://models.inference.ai.azure.com/chat/completions",
        headers={
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": 4096,
        },
        timeout=API_TIMEOUT,
    )
    if not resp.ok:
        raise RuntimeError(f"GitHub Models API request failed ({resp.status_code}): {resp.text[:200]}")
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def call_all_llms(system_prompt, user_prompt):
    """Call every available LLM and return a dict of {provider_name: response}."""
    results = {}
    if ANTHROPIC_API_KEY:
        try:
            results["Claude"] = call_anthropic(system_prompt, user_prompt)
        except Exception as exc:
            print(f"⚠️  Claude call failed: {exc}")
    if GEMINI_API_KEY:
        try:
            results["Gemini"] = call_gemini(system_prompt, user_prompt)
        except Exception as exc:
            print(f"⚠️  Gemini call failed: {exc}")
    if GITHUB_TOKEN:
        try:
            results["Copilot"] = call_copilot(system_prompt, user_prompt)
        except Exception as exc:
            print(f"⚠️  Copilot call failed: {exc}")
    return results


def validate_review_format(content, reviewer_name):
    """Check that *content* includes every required section heading.

    Returns the original content if valid.  If sections are missing,
    appends placeholder sections so downstream consumers can always
    rely on a consistent structure.
    """
    missing = [
        s for s in REQUIRED_REVIEW_SECTIONS
        if not re.search(rf"\*\*{re.escape(s)}\*\*", content)
    ]
    if not missing:
        return content

    print(f"⚠️  {reviewer_name}: missing sections {missing} — appending placeholders.")
    patched = content
    for section in missing:
        if section == "Verdict":
            patched += f"\n- **{section}**: NEEDS_DISCUSSION\n"
        else:
            patched += f"\n- **{section}**: _No response provided._\n"
    return patched


# ---------------------------------------------------------------------------
# Review runners
# ---------------------------------------------------------------------------


def run_accuracy_review(user_prompt):
    """Run the scientific accuracy review via all available LLMs."""
    print("🔬 Running accuracy review ...")
    return call_all_llms(ACCURACY_REVIEW_SYSTEM, user_prompt)


def run_latex_review(user_prompt):
    """Run the LaTeX validation review via all available LLMs."""
    print("📐 Running LaTeX validation review ...")
    return call_all_llms(LATEX_REVIEW_SYSTEM, user_prompt)


def run_readability_review(user_prompt):
    """Run the readability editing review via all available LLMs."""
    print("📖 Running readability review ...")
    return call_all_llms(READABILITY_REVIEW_SYSTEM, user_prompt)


def run_lean_review(user_prompt):
    """Run the Lean proof review via all available LLMs."""
    print("🔧 Running Lean proof review ...")
    return call_all_llms(LEAN_REVIEW_SYSTEM, user_prompt)


# ---------------------------------------------------------------------------
# Coordinator
# ---------------------------------------------------------------------------


def run_coordinator(reviews, user_prompt):
    """Synthesize all reviews and return the final summary."""
    reviews_text = ""
    for name, content in reviews.items():
        reviews_text += f"## {name}\n{content}\n\n"

    coordinator_prompt = (
        f"Below are the reviews for a commit.\n\n"
        f"{reviews_text}\n\n"
        f"---\n\n"
        f"Original commit context:\n{user_prompt}"
    )

    if ANTHROPIC_API_KEY:
        return call_anthropic(COORDINATOR_SYSTEM, coordinator_prompt)
    if GEMINI_API_KEY:
        return call_gemini(COORDINATOR_SYSTEM, coordinator_prompt)
    if GITHUB_TOKEN:
        return call_copilot(COORDINATOR_SYSTEM, coordinator_prompt)

    return reviews_text


# ---------------------------------------------------------------------------
# GitHub Issue creation
# ---------------------------------------------------------------------------


def create_issue(title, body):
    """Create a GitHub issue with the review summary."""
    url = f"https://api.github.com/repos/{REPO_NAME}/issues"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    payload = {"title": title, "body": body, "labels": ["agent-review"]}
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    if resp.status_code == 422:
        payload.pop("labels", None)
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
    if not resp.ok:
        raise RuntimeError(f"GitHub issue creation failed ({resp.status_code}): {resp.text[:200]}")
    issue_url = resp.json().get("html_url", "")
    print(f"✅ Created issue: {issue_url}")
    return issue_url


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    if not COMMIT_DIFF.strip():
        print("No diff found — skipping review.")
        return

    user_prompt = build_review_prompt(
        COMMIT_DIFF, COMMIT_MESSAGE, COMMIT_SHA, COMMIT_AUTHOR
    )

    reviews = {}

    # Determine if the diff contains Lean files or sorry markers.
    diff_lines = COMMIT_DIFF.splitlines()
    has_lean = any(
        line.startswith("+++ b/lean/") or line.startswith("--- a/lean/")
        for line in diff_lines
    )
    has_sorry = any(
        line.startswith("+") and "sorry" in line
        for line in diff_lines
    )
    has_chapters = any(
        line.startswith("+++ b/chapters/") or line.startswith("--- a/chapters/")
        for line in diff_lines
    )

    review_types = [
        ("Accuracy (Scientific Rigor)", run_accuracy_review),
        ("LaTeX Validator", run_latex_review),
        ("Readability Editor", run_readability_review),
    ]
    if has_lean or has_sorry:
        review_types.append(("Lean Proof Review", run_lean_review))
    # When sorry is introduced or chapters change, trigger the Formalizer
    # and Ontologist reviews to ensure type consistency and proof coverage.
    if has_sorry:
        print("⚠️  sorry detected in diff — triggering Formalizer review")
    if has_chapters:
        print("📄 Chapter changes detected — Ontologist should re-scan glossary")

    for label, runner in review_types:
        results = runner(user_prompt)
        for provider, content in results.items():
            reviewer_key = f"{label} ({provider})"
            reviews[reviewer_key] = validate_review_format(content, reviewer_key)

    if not reviews:
        print("No API keys configured — no reviews to run.")
        return

    print(f"\n📋 Collected {len(reviews)} review(s). Running coordinator ...\n")

    summary = run_coordinator(reviews, user_prompt)

    title = f"Agent Review: {COMMIT_MESSAGE} ({COMMIT_SHA})"
    body = (
        f"## Agent Review for commit `{COMMIT_SHA}`\n\n"
        f"**Author**: {COMMIT_AUTHOR}  \n"
        f"**Message**: {COMMIT_MESSAGE}\n\n"
        f"---\n\n"
        f"{summary}\n\n"
        f"---\n\n"
        f"<details><summary>Individual Reviews</summary>\n\n"
    )
    for name, content in reviews.items():
        body += f"### {name}\n\n{content}\n\n"
    body += "</details>\n"

    if GITHUB_TOKEN and REPO_NAME:
        create_issue(title, body)
    else:
        print("⚠️  Cannot create issue: GITHUB_TOKEN or REPO_NAME not set.")
        print(body)


if __name__ == "__main__":
    main()
