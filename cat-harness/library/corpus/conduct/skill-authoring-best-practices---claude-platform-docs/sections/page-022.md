---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-022
section_title: "Page 22"
pages: 22-22
pdf_page: 22
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Advanced: Skills with executable code
The following sections focus on Skills that include executable scripts. If your Skill uses only
markdown instructions, skip to Checklist for effective Skills.
Solve, don't defer
When writing scripts for Skills, handle error conditions rather than deferring to Claude.
Good example: Handle errors explicitly:
Bad example: Defer to Claude:
**Bad example: Too many choices** (confusing):
"You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image, or..."
**Good example: Provide a default** (with escape hatch):
"Use pdfplumber for text extraction:
```python
import pdfplumber
```
For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."

def process_file(path):
    """Process a file, creating it if it doesn't exist."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        # Create file with default content instead of failing
        print(f"File {path} not found, creating default")
        with open(path, "w") as f:
            f.write("")
        return ""
    except PermissionError:
        # Provide alternative instead of failing
        print(f"Cannot access {path}, using default")
        return ""

def process_file(path):
    # Just fail and let Claude figure it out
    return open(path).read()

Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
22/32
