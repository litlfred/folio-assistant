"""Utilities for loading skill definitions from .claude/skills/."""

from pathlib import Path

from .config import SKILLS_DIR


def load_skill(name, package="local"):
    """Load a single skill markdown file and return its contents.

    Args:
        name: Skill name (without .md extension).
        package: Package directory under skills/ (default: "local").

    Returns:
        The skill file contents as a string, or None if not found.
    """
    path = SKILLS_DIR / package / f"{name}.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def load_all_skills(max_chars=None):
    """Load all skill files and return a concatenated string.

    Args:
        max_chars: Optional character limit for the combined output.

    Returns:
        Concatenated skill contents with file headers.
    """
    parts = []
    for md_file in sorted(SKILLS_DIR.rglob("*.md")):
        rel = md_file.relative_to(SKILLS_DIR)
        content = md_file.read_text(encoding="utf-8")
        parts.append(f"--- {rel} ---\n{content}\n")

    combined = "\n".join(parts)
    if max_chars and len(combined) > max_chars:
        combined = combined[:max_chars]
    return combined


def load_skill_for_review(review_type):
    """Load the skill file corresponding to a review type.

    Maps review type names to skill files:
        scientific-accuracy -> local/scientific-accuracy.md
        latex-validation    -> local/latex-validation.md
        readability-editing -> local/readability-editing.md
        lean-proof-review   -> local/lean-proof-review.md
        lean-generation     -> local/lean-generation.md
        proof-status-tracking -> local/proof-status-tracking.md
    """
    return load_skill(review_type)
