# ATS & SEO Optimization Guide

Rules for making Joao's resume pass automated applicant tracking systems and surface in recruiter searches.

---

## Keyword Placement Priority

1. **Job title line** — match the exact title from the job posting (e.g., "Software Engineer" not "SWE")
2. **First bullet of each experience** — put the most relevant keyword in the opening verb phrase
3. **Skills section** — list every technology keyword from the JD that Joao actually used
4. **Project names/descriptions** — include domain keywords (e.g., "blockchain", "machine learning", "distributed systems")

## Formatting Rules (ATS-safe)

- No tables, no multi-column layouts — parse as single column only
- No headers/footers with contact info — put contact info in the body
- No text boxes or graphics of any kind
- Standard section headers only: Education, Experience, Projects, Skills (no creative naming)
- Bullet character: plain hyphen or standard bullet (•) — no custom symbols
- File format: PDF compiled from LaTeX (ATS-safe, not scanned)
- Font: standard serif or sans-serif (Computer Modern, Helvetica, Arial) — no decorative fonts

## Section Order (ATS standard)

1. Contact info + links
2. Education
3. Experience (reverse chronological)
4. Projects (reverse chronological by most recent)
5. Skills (categorized: Languages, Frameworks, Tools, Platforms)

No "Summary" or "Objective" section — wastes space, ATS filters often ignore it.

## Keyword Density

- Each hard skill from the JD should appear at least once in the resume body
- Don't stuff — 1–2 natural placements per keyword is enough
- Use exact matches where possible: "Next.js" not "NextJS", "PostgreSQL" not "Postgres" (unless JD uses that form)
- Acronyms: spell out on first use if the JD uses the spelled form (e.g., "Large Language Model (LLM)")

## Quantify Everything

- Every bullet must have a metric or scale indicator
- If no metric: use scope (team size, users, data volume, time saved)
- Never use vague adjectives ("significantly improved", "highly scalable") without a number
- Use the real metrics from resume-profile.md — never fabricate

## Skills Section Format

Group by category, comma-separated:
```
Languages: Python, TypeScript, Ruby, Solidity, Java
Frameworks: Next.js, Rails, FastAPI, React, Node.js
Tools: Git, Docker, PostgreSQL, Redis, Supabase, Firebase
Platforms: AWS, Vercel, IPFS/Pinata, Ethereum/Base
```

Include every technology keyword from the JD that maps to something Joao has used.
