---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s010-runnable-example-csv-insights-skill-skill
section_title: "Runnable example: `csv_insights_skill` Skill"
cells: 20-32
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
## Runnable example: `csv_insights_skill` Skill

This walkthrough creates files on disk and then runs Python snippets; it is not a notebook to execute with **Run All**. Save the script below as `csv_insights_skill/run.py`.

Prerequisites: Python 3.10 or later, `curl`, `zip`, and an `OPENAI_API_KEY` environment variable for a project with access to `gpt-6-astra` and hosted shell. Install the current Python SDK with `python -m pip install --upgrade openai`.

The upload commands create a skill in your API project. Responses API calls incur [model and container charges](https://developers.openai.com/api/docs/pricing). The Python API examples are disabled unless you set `RUN_SKILLS_API=1`. Run the local checks first, then opt in when you are ready to make API requests.

**1) Create the skill folder and sample input.**

```bash
mkdir -p csv_insights_skill/assets
```

The finished folder should contain:

```text
csv_insights_skill/
├── SKILL.md
├── requirements.txt
├── run.py
└── assets/
    └── example.csv
```

Save these dependencies as `csv_insights_skill/requirements.txt`. `tabulate` is required by pandas' `to_markdown()` method.

```text
pandas
matplotlib
tabulate
```

Save this synthetic input as `csv_insights_skill/assets/example.csv`:

```csv
quantity,price,category
2,10,books
3,15,games
,20,books
```

**2) Create your `SKILL.md`**

```
---
name: csv-insights
description: Summarize a CSV, compute basic stats, and produce a markdown report + a plot image.
---

# CSV Insights Skill

## When to use this
Use this skill when the user provides a CSV file and wants:
- a quick summary (row/col counts, missing values)
- basic numeric statistics
- a simple visualization
- results packaged into an output folder (or zip)

## Inputs
- A CSV file path (local) or a file mounted in the container.

## Outputs
- `output/report.md`
- `output/plot.png` (when the CSV has a numeric column)

## How to run

Run from the directory containing this SKILL.md. The environment must have
pandas, matplotlib, and tabulate installed. If a dependency is unavailable,
report it rather than attempting an unapproved network install.

python run.py --input assets/example.csv --outdir output

Use the output directory requested by the user when one is provided.
Check that report.md exists and that plot.png exists for numeric input.

```

**3) Create your `run.py`**

```python
import argparse
from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt


def write_report(df: pd.DataFrame, outpath: Path) -> None:
    lines = []
    lines.append(f"# CSV Insights Report\n")
    lines.append(f"**Rows:** {len(df)}  \n**Columns:** {len(df.columns)}\n")
    lines.append("\n## Columns\n")
    lines.append("\n".join([f"- `{c}` ({df[c].dtype})" for c in df.columns]))

    missing = df.isna().sum()
    if missing.any():
        lines.append("\n## Missing values\n")
        for col, count in missing[missing > 0].items():
            lines.append(f"- `{col}`: {int(count)}")
    else:
        lines.append("\n## Missing values\nNo missing values detected.\n")

    numeric = df.select_dtypes(include="number")
    if not numeric.empty:
        lines.append("\n## Numeric summary (describe)\n")
        lines.append(numeric.describe().to_markdown())

    outpath.write_text("\n".join(lines), encoding="utf-8")


def make_plot(df: pd.DataFrame, outpath: Path) -> None:
    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        # No numeric columns → skip plotting
        return

    # Plot the first numeric column as a simple histogram
    col = numeric.columns[0]
    plt.figure()
    df[col].dropna().hist(bins=30)
    plt.title(f"Histogram: {col}")
    plt.xlabel(col)
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(outpath)
    plt.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to input CSV")
    parser.add_argument("--outdir", required=True, help="Directory for outputs")
    args = parser.parse_args()

    inpath = Path(args.input)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(inpath)

    write_report(df, outdir / "report.md")
    make_plot(df, outdir / "plot.png")


if __name__ == "__main__":
    main()
```

**4) Test locally, then zip the skill.**

From the directory containing `csv_insights_skill`, install dependencies and run the script:

```bash
python -m pip install -r csv_insights_skill/requirements.txt
python csv_insights_skill/run.py --input csv_insights_skill/assets/example.csv --outdir local-output
```

`local-output/report.md` should report three rows, three columns, and one missing `quantity` value. `local-output/plot.png` should contain a histogram of `quantity`.

Package only the skill files, not the generated output:

```bash
zip -r csv_insights_skill.zip csv_insights_skill/SKILL.md csv_insights_skill/requirements.txt csv_insights_skill/run.py csv_insights_skill/assets
```

**5) Upload the skill (live API request).**

Run this command only when you are ready to create the skill. It saves the response to `skill.json` for the next step.

```bash
curl --fail-with-body 'https://api.openai.com/v1/skills' \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F 'files=@./csv_insights_skill.zip;type=application/zip' \
  -o skill.json
```

**6) Run the skill via hosted shell (live API request).**

Set `RUN_SKILLS_API=1`, then run this snippet from the same directory as `skill.json`. It pins the uploaded skill's default version and analyzes the CSV bundled inside the skill. No separate CSV upload is needed.

Hosted shell uses its installed dependencies; outbound network access is disabled by default. The skill reports missing dependencies rather than enabling network access automatically. Save downloadable artifacts under `/mnt/data`, as described in the [Shell guide](https://developers.openai.com/api/docs/guides/tools-shell#hosted-runtime-details).

```python
import json
import os
from pathlib import Path

from openai import OpenAI

if os.environ.get("RUN_SKILLS_API") == "1":
    client = OpenAI()
    skill = json.loads(Path("skill.json").read_text())
    response = client.responses.create(
        model="gpt-6-astra",
        tools=[
            {
                "type": "shell",
                "environment": {
                    "type": "container_auto",
                    "skills": [
                        {
                            "type": "skill_reference",
                            "skill_id": skill["id"],
                            "version": str(skill["default_version"]),
                        }
                    ],
                },
            }
        ],
        input=(
            "Use the csv-insights skill to analyze its bundled assets/example.csv. "
            "Run the skill's run.py and write outputs to /mnt/data/csv-insights-output. "
            "Verify the row count and missing values, and link to report.md and plot.png."
        ),
    )
    print(response.output_text)
else:
    print("Skipped live API request. Set RUN_SKILLS_API=1 to run.")
```

**7) Request a local shell call (optional, live API request).**

Local shell uses the files you created above, without uploading or referencing a hosted skill. Run this snippet from the directory containing `csv_insights_skill` in your execution environment.

This snippet only requests and displays commands. It does not execute them or complete the analysis. To complete the workflow, your application must review and execute `shell_call` commands in a sandbox, capture stdout, stderr, and the exit outcome, and return `shell_call_output` with the matching `call_id`. Continue until the model returns its final answer. See [Local shell mode](https://developers.openai.com/api/docs/guides/tools-shell#local-shell-mode) for the execution loop and output format.

```python
import os
from pathlib import Path

from openai import OpenAI

if os.environ.get("RUN_SKILLS_API") == "1":
    client = OpenAI()
    skill_path = Path("csv_insights_skill").resolve()
    response = client.responses.create(
        model="gpt-6-astra",
        tools=[
            {
                "type": "shell",
                "environment": {
                    "type": "local",
                    "skills": [
                        {
                            "name": "csv-insights",
                            "description": (
                                "Summarize a CSV, compute basic stats, and produce "
                                "a markdown report + a plot image."
                            ),
                            "path": str(skill_path),
                        }
                    ],
                },
            }
        ],
        input=(
            "Use the csv-insights skill to analyze its bundled assets/example.csv "
            "and write outputs to local-output."
        ),
    )
    for item in response.output:
        if item.type == "shell_call":
            print(item.action.commands)
    print(response.output_text)
else:
    print("Skipped live API request. Set RUN_SKILLS_API=1 to run.")
```
