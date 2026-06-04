# Resume Builder Rules

Hard rules for generating Joao's LaTeX resume. Follow every rule exactly — no exceptions.

---

## Format

- **1 page strictly** — if content overflows, cut projects or trim bullets, never go to page 2
- **Margins:** `\geometry{top=0.5in, bottom=0.5in, left=0.5in, right=0.5in}`
- **Font size:** 10pt or 10.5pt base
- **No photo, no address, no date of birth**
- **Contact line:** Name (large), then one line: email | phone | LinkedIn | GitHub | website

## LaTeX Structure

Use this document class and packages:
```latex
\documentclass[10pt]{article}
\usepackage[top=0.5in,bottom=0.5in,left=0.5in,right=0.5in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{multicol}  % for skills section only
```

Section command (bold + horizontal rule):
```latex
\titleformat{\section}{\bfseries\large}{}{0em}{}[\titlerule]
```

## Bullet Format

Every bullet: `\item \textbf{Verb} + context + metric/impact`

- Start with strong action verb: Built, Designed, Implemented, Reduced, Increased, Led, Published, Deployed
- Follow with what and for whom
- End with a concrete number or outcome
- Max 2 lines per bullet when rendered
- 2–4 bullets per experience entry, 1–2 per project

## Sections

### Experience (required, always show all 3)
Show all three experiences: Penn State Libraries, QLink/Blockchain Lab, LaunchBox
- Company, role, date range, location on one line
- 2–3 bullets per entry, tailored to job category

### Projects (required, show 2–3 most relevant)
Select from: ZorAi, Meridian, Cognitra, QLink (if not in experience), NFL 4th Down, B3, Insurance
- Project name (linked to URL if public), tech stack, date
- 1–2 bullets max per project

### Education (required, always show)
Penn State, B.S. Computer Science, Minor: Entrepreneurship and Innovation, Aug 2026
One line: GPA if above 3.5 (do not include if not in profile), relevant coursework (optional)

### Skills (required, always last)
Two-column or inline format using multicol or tabular
Grouped by: Languages | Frameworks | Tools | Platforms

## What to Never Include

- No "Objective" or "Summary" section
- No references or "References available upon request"
- No personal photo
- No full mailing address (city/state only is fine)
- No GPA unless it's in the profile doc
- No high school education
- No fabricated metrics or skills not in resume-profile.md

## Tailoring Logic by Job Category

| Category | Lead Experience | Top Projects |
|----------|----------------|--------------|
| blockchain_web3 | QLink, then ZorAi | ZorAi, B3, Meridian |
| ai_ml | QLink (AI aspects), Libraries | Cognitra, NFL, Insurance |
| backend_fullstack | Libraries (Rails), Meridian | Meridian, Cognitra |
| frontend | Libraries (UI work), ZorAi | ZorAi, Cognitra |
| research | QLink (first-author paper) | NFL, Insurance, QLink |
| data_engineering | Libraries (Pandas pipeline) | NFL, B3, Insurance |
| devops_infra | Libraries (systems) | Meridian (Docker/Redis) |
| startup_generalist | LaunchBox, then Libraries | ZorAi, Meridian |

Always include QLink publication line: "First-author: arXiv:2512.18488" under the QLink experience entry.
