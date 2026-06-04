import type { JobCategory } from '@/types/jobs'

export const RESUME_PROFILE = {
  personal: {
    name: "Joao Vitor Barros da Silva",
    email: "jvitorbarros15@gmail.com",
    phone: "814-308-3273",
    location: "State College, PA (relocating Aug 2026)",
    github: "github.com/jvitorbarros15",
    linkedin: "linkedin.com/in/joaovi",
    website: "zorai.vercel.app",
  },
  education: [{
    school: "The Pennsylvania State University, University Park",
    degree: "B.S. in Computer Science",
    minor: "Entrepreneurship and Innovation",
    graduation: "August 2026",
    gpa: null,
  }],
  experience: [
    {
      company: "Library Strategic Technologies, Penn State University Libraries",
      title: "Software Development Intern",
      start: "2025-10", end: "present", location: "State College, PA",
      bullets: [
        "Develop and maintain enterprise full-stack Ruby on Rails applications supporting 40,000+ users across multiple active repositories in a Scrum-based cycle using Docker and RSpec.",
        "Member of the development team for a large-scale PDF remediation and accessibility platform built with AWS and Adobe, supporting uploads of over 3 million PDFs via Adobe APIs and AWS S3.",
        "Designed and implemented a cross-system data integration API using a Rails controller to POST JSON between independent websites, with JSON-to-XML importers and Swagger docs, reducing manual data handling by ~60%.",
        "Built a Python Pandas data pipeline integrated into the Rails platform, cleaning and standardizing faculty data from 17.7K to 9.8K valid entries and cutting manual processing time by over 90%.",
        "Solve engineering tickets, perform code reviews, and validate builds for production readiness using CircleCI for CI.",
      ],
    },
    {
      company: "Blockchain Data Intelligence Lab, Penn State University",
      title: "Lead Researcher",
      start: "2025-02", end: "present", location: "State College, PA",
      bullets: [
        "Developing QLink, a quantum-safe Layer-3 interoperability protocol integrating QKD and PQC schemes (Crystals-Dilithium, Falcon) to secure cross-chain blockchain bridges.",
        "Simulated a 7-validator QLink network over 5–50 km QKD fiber links, achieving up to 707x surplus key throughput and under 1 second latency, outperforming classical bridges by over 400x in cross-chain key refresh rate.",
        "Published: 'QLink: A Quantum Safe Layer 3 Interoperability Protocol for Blockchain Networks,' arXiv:2512.18488, 2025.",
      ],
    },
    {
      company: "Happy Valley LaunchBox, Penn State Startup Accelerator",
      title: "Innovation and Operations Intern",
      start: "2023-05", end: "2024-07", location: "State College, PA",
      bullets: [
        "Spearheaded integration of HubSpot CRM with a new internal UI, centralizing engagement data for 40+ active startups and improving reporting visibility by 45%.",
        "Automated email replies, data entry, and data-fetching workflows using AI in Power Automate, increasing team efficiency by 30%.",
        "Judged multiple startup pitch competitions and provided strategic feedback to early-stage founders.",
      ],
    },
  ],
  projects: [
    { name: "ZorAi", url: "zorai.vercel.app", priority: 1, alwaysInclude: true, tech: ["React", "Node.js", "Solidity", "OpenAI", "IPFS (Pinata)", "BNB Testnet"], dates: "Mar 2025 – Present", bullets: ["Built a platform to register and verify AI-generated images on the blockchain to combat misinformation.", "Deployed a BNB testnet dApp integrating OpenAI API for content analysis and Pinata (IPFS) for decentralized storage, achieving consistent verification latency under 3 seconds across tested images.", "Built an image detection layer linking online media to on-chain AI records; validated against a test set of AI-generated and real images with strong classification results."] },
    { name: "Meridian", priority: 2, note: "Use for backend, full-stack, fintech", tech: ["FastAPI", "Next.js", "React", "PostgreSQL", "Redis", "SQLAlchemy", "Docker", "yfinance", "Tailwind CSS", "Recharts"], dates: "2025 – Present", bullets: ["Built a personal investment dashboard tracking Brazilian stocks (B3), FIIs, US equities, and crypto in one place.", "Designed a FastAPI + SQLAlchemy async backend with PostgreSQL and Redis, exposing a REST API with auto-generated docs.", "Integrated yfinance for real-time market data across B3, US equities, and crypto pairs with a live price refresh endpoint recalculating portfolio returns on demand.", "Containerized the full stack with Docker Compose for consistent local and production environments."] },
    { name: "Cognitra", priority: 3, note: "Use for AI, full-stack, EdTech", tech: ["React 19", "Next.js 16", "Firebase", "OpenAI", "LangChain", "AssemblyAI", "Tailwind CSS", "React Flow"], dates: "2025 – Present", bullets: ["Built a full-stack AI-powered study platform with AI-assisted note-taking, flashcard generation, lecture recording with time tracking, and visual concept mind mapping via React Flow.", "Integrated OpenAI and LangChain for AI features, AssemblyAI for lecture transcription, and Firebase for auth and cloud storage.", "Supported English and Portuguese via next-i18next internationalization."] },
    { name: "NFL 4th Down Conversion Predictor", priority: 4, note: "Use for ML/data science", tech: ["Python", "Pandas", "XGBoost", "Seaborn", "Matplotlib"], dates: "Oct 2025 – Present", bullets: ["Built a machine learning model predicting 4th down conversion probabilities using 11 years of NFL play-by-play data (480K plays).", "Achieved 62% accuracy, 0.66 ROC-AUC, and 0.23 Brier Score with well-calibrated probability predictions."] },
    { name: "NittanyAuction", priority: 7, note: "Only for database-heavy backend, multi-role auth, auction/marketplace", tech: ["Python", "Flask", "SQLite", "HTML/CSS", "JavaScript"], dates: "Spring 2026", bullets: ["Built a full-stack auction platform supporting three user roles (Bidders, Sellers, HelpDesk) with role-specific dashboards.", "Implemented a fully database-driven multi-level category tree and bidding logic enforcing increment rules, turn-taking constraints, and bid-count-based auction close.", "Secured auth with salted SHA-256 hashing, role-based routing, and full payment flow with transaction recording."] },
  ],
  skills: {
    languages: ["Python", "JavaScript", "Ruby", "Solidity", "C", "Assembly", "SQL"],
    frameworks: ["Ruby on Rails", "React.js", "Next.js", "Node.js", "Flask", "FastAPI"],
    ml_ai: ["TensorFlow", "PyTorch", "LangChain", "Scikit-learn", "XGBoost", "Pandas", "NumPy", "LLMs"],
    blockchain: ["Solidity", "IPFS (Pinata)", "BNB Chain", "EVM", "Web3.js"],
    cloud_infra: ["AWS S3", "Docker", "Docker Compose", "CircleCI", "Redis", "PostgreSQL", "SQLite", "Firebase"],
    frontend: ["Tailwind CSS", "shadcn/ui", "Recharts", "React Flow", "HTML/CSS"],
    tools: ["Git/GitHub", "Figma", "Jira", "Notion", "Swagger", "REST APIs"],
  },
  publications: [{
    title: "QLink: A Quantum Safe Layer 3 Interoperability Protocol for Blockchain Networks",
    venue: "arXiv", id: "arXiv:2512.18488", year: "2025",
    url: "https://arxiv.org/abs/2512.18488", role: "First author",
  }],
}

interface ResumeSubset {
  experience: typeof RESUME_PROFILE.experience
  projects: typeof RESUME_PROFILE.projects
  skills: string[]
  includePublications: boolean
}

export function selectResumeSubset(category: JobCategory, jdKeywords: string[]): ResumeSubset {
  // Normalize keywords to lowercase for comparison
  const normalizedKeywords = jdKeywords.map(k => k.toLowerCase())

  // Select experience
  const experience = selectExperience(category)

  // Select projects
  const projects = selectProjects(category)

  // Select skills
  const skills = selectSkills(category, normalizedKeywords)

  // Include publications
  const includePublications = category === 'research' || category === 'blockchain_web3'

  return { experience, projects, skills, includePublications }
}

function selectExperience(category: JobCategory) {
  const allExperience = RESUME_PROFILE.experience
  const librariesInternship = allExperience[0]
  const qlink = allExperience[1]
  const launchbox = allExperience[2]

  // Always include Libraries internship with category-specific bullets
  const librariesWithBullets = {
    ...librariesInternship,
    bullets: selectLibrariesBullets(category),
  }

  const result = [librariesWithBullets]

  // Add QLink if blockchain or research
  if (category === 'blockchain_web3' || category === 'research') {
    result.push(qlink)
  }

  // Add LaunchBox only for startup_generalist
  if (category === 'startup_generalist') {
    result.push(launchbox)
  }

  return result
}

function selectLibrariesBullets(category: JobCategory): string[] {
  const allBullets = RESUME_PROFILE.experience[0].bullets

  switch (category) {
    case 'backend_fullstack':
      return [allBullets[0], allBullets[2], allBullets[3]]
    case 'ai_ml':
      return [allBullets[1], allBullets[3]]
    case 'blockchain_web3':
      return [allBullets[0], allBullets[2]]
    case 'devops_infra':
      return [allBullets[0], allBullets[1], allBullets[4]]
    case 'research':
      return [allBullets[1], allBullets[2]]
    case 'startup_generalist':
    case 'frontend':
      return allBullets
    case 'data_engineering':
    default:
      return [allBullets[0], allBullets[2], allBullets[3]]
  }
}

function selectProjects(category: JobCategory) {
  const allProjects = RESUME_PROFILE.projects
  const zorAi = allProjects[0]
  const meridian = allProjects[1]
  const cognitra = allProjects[2]
  const nfl = allProjects[3]

  switch (category) {
    case 'blockchain_web3':
      return [zorAi, meridian]
    case 'ai_ml':
      return [zorAi, nfl]
    case 'backend_fullstack':
      return [zorAi, meridian]
    case 'frontend':
      return [zorAi, cognitra]
    case 'research':
      return [zorAi]
    case 'data_engineering':
      return [zorAi, nfl]
    case 'devops_infra':
      return [meridian, zorAi]
    case 'startup_generalist':
      return [zorAi, cognitra]
    default:
      return [zorAi]
  }
}

function selectSkills(category: JobCategory, normalizedKeywords: string[]): string[] {
  // Flatten all skills
  const allSkills = [
    ...RESUME_PROFILE.skills.languages,
    ...RESUME_PROFILE.skills.frameworks,
    ...RESUME_PROFILE.skills.ml_ai,
    ...RESUME_PROFILE.skills.blockchain,
    ...RESUME_PROFILE.skills.cloud_infra,
    ...RESUME_PROFILE.skills.frontend,
    ...RESUME_PROFILE.skills.tools,
  ]

  // Filter to keywords that match
  const matchedSkills = allSkills.filter(skill =>
    normalizedKeywords.some(keyword =>
      skill.toLowerCase().includes(keyword) || keyword.includes(skill.toLowerCase())
    )
  )

  // If fewer than 10 matched, supplement with category-relevant skills
  if (matchedSkills.length < 10) {
    const supplemental = getSupplementalSkills(category, allSkills, matchedSkills)
    matchedSkills.push(...supplemental)
  }

  // Return up to 20 skills
  return matchedSkills.slice(0, 20)
}

function getSupplementalSkills(
  category: JobCategory,
  allSkills: string[],
  existingSkills: string[]
): string[] {
  const existing = new Set(existingSkills.map(s => s.toLowerCase()))
  const available = allSkills.filter(s => !existing.has(s.toLowerCase()))

  const categoryPriorities: Record<JobCategory, string[]> = {
    blockchain_web3: ['Solidity', 'Web3.js', 'EVM', 'BNB Chain', 'IPFS (Pinata)', 'Node.js', 'React.js'],
    ai_ml: ['Python', 'TensorFlow', 'PyTorch', 'LangChain', 'Pandas', 'NumPy', 'XGBoost'],
    backend_fullstack: ['Ruby on Rails', 'FastAPI', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs'],
    frontend: ['React.js', 'Next.js', 'Tailwind CSS', 'shadcn/ui', 'HTML/CSS', 'JavaScript'],
    research: ['Python', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Matplotlib'],
    data_engineering: ['Python', 'PostgreSQL', 'Redis', 'Docker', 'Pandas', 'SQLAlchemy'],
    devops_infra: ['Docker', 'Docker Compose', 'AWS S3', 'PostgreSQL', 'Redis', 'CircleCI'],
    startup_generalist: ['React.js', 'Node.js', 'Firebase', 'Next.js', 'Python', 'Docker'],
  }

  const priorities = categoryPriorities[category] || []
  const result: string[] = []

  for (const skill of priorities) {
    if (!existing.has(skill.toLowerCase()) && available.some(s => s.toLowerCase() === skill.toLowerCase())) {
      result.push(available.find(s => s.toLowerCase() === skill.toLowerCase())!)
    }
  }

  return result
}

// ── Rule-based helpers (no API calls) ──────────────────────────────────────

const CATEGORY_SIGNALS: Record<JobCategory, string[]> = {
  blockchain_web3: ['solidity', 'smart contract', 'defi', 'evm', 'web3', 'on-chain', 'blockchain', 'crypto', 'ipfs', 'ethereum', 'polygon', 'layer 2', 'nft', 'dapp'],
  ai_ml: ['machine learning', ' ml ', 'llm', 'deep learning', 'nlp', 'model training', 'inference', 'data science', 'pytorch', 'tensorflow', 'neural network', 'ai engineer', 'mlops', 'hugging face'],
  backend_fullstack: ['rest api', 'microservices', 'backend', 'full-stack', 'fullstack', 'ruby on rails', 'fastapi', 'flask', 'postgresql', 'redis', 'docker', 'api development', 'server-side'],
  frontend: ['react', 'next.js', 'frontend', 'front-end', 'component library', 'typescript', 'user interface', 'ui/ux', 'css', 'html', 'angular', 'vue'],
  research: ['research', 'phd', 'protocol design', 'publication', 'quantum', 'cryptography', 'empirical', 'arxiv', 'paper', 'literature review'],
  data_engineering: ['data pipeline', 'etl', 'spark', 'data warehouse', 'airflow', 'dbt', 'data engineer', 'analytics engineering', 'bigquery', 'snowflake'],
  devops_infra: ['kubernetes', 'ci/cd', 'terraform', 'infrastructure', 'devops', 'sre', 'helm', 'k8s', 'platform engineer', 'cloud engineer'],
  startup_generalist: ['startup', 'early-stage', 'founding engineer', 'generalist', 'seed stage', 'series a', 'scrappy', 'fast-paced startup'],
}

export function classifyJobCategory(description: string): JobCategory {
  const lower = description.toLowerCase()
  const scores = Object.entries(CATEGORY_SIGNALS).map(([cat, signals]) => ({
    cat: cat as JobCategory,
    score: signals.reduce((n, s) => n + (lower.includes(s) ? 1 : 0), 0),
  }))
  scores.sort((a, b) => b.score - a.score)
  return scores[0].score > 0 ? scores[0].cat : 'backend_fullstack'
}

export function checkVisaWarning(description: string): { visa_warning: boolean; reason: string | null } {
  const patterns: [RegExp, string][] = [
    [/no\s+visa\s+sponsorship/i, 'No visa sponsorship'],
    [/not\s+(able\s+to|currently)\s+sponsor/i, 'Cannot sponsor visas'],
    [/must\s+be\s+(authorized|eligible)\s+to\s+work\s+without\s+sponsorship/i, 'Must be authorized without sponsorship'],
    [/us\s+citizen(ship)?\s+(only|required)/i, 'US citizenship required'],
    [/security\s+clearance\s+required/i, 'Security clearance required'],
    [/active\s+(secret|top\s*secret|ts\/sci)/i, 'Active security clearance required'],
    [/sponsorship\s+(is\s+)?(not|unavailable)/i, 'No sponsorship available'],
    [/we\s+(do\s+not|don'?t)\s+offer\s+(visa\s+)?sponsorship/i, 'No sponsorship offered'],
  ]
  for (const [pattern, reason] of patterns) {
    if (pattern.test(description)) return { visa_warning: true, reason }
  }
  return { visa_warning: false, reason: null }
}

// ── LaTeX assembler ─────────────────────────────────────────────────────────

function esc(text: string): string {
  return text.replace(/[%~&$#_^{}\\]/g, (c) => (({
    '%': '\\%', '~': '\\textasciitilde{}', '&': '\\&', '$': '\\$',
    '#': '\\#', '_': '\\_', '^': '\\textasciicircum{}',
    '{': '\\{', '}': '\\}', '\\': '\\textbackslash{}',
  } as Record<string, string>)[c] ?? c))
}

function fmtDate(d: string): string {
  if (d === 'present') return 'Present'
  const [yr, mo] = d.split('-')
  if (!mo) return yr
  return `${'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[+mo - 1]} ${yr}`
}

function fmtRange(start: string, end: string): string {
  return `${fmtDate(start)} -- ${fmtDate(end)}`
}

function buildPreamble(): string {
  return `%-------------------------
% Resume — Joao Vitor Barros da Silva
% Based on Jake Gutierrez template (MIT License)
%------------------------
\\documentclass[letterpaper,11pt]{article}
\\usepackage{lmodern}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.75in}
\\addtolength{\\evensidemargin}{-0.75in}
\\addtolength{\\textwidth}{1.5in}
\\addtolength{\\topmargin}{-0.9in}
\\addtolength{\\textheight}{1.75in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-6pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-6pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{#1 \\vspace{-2pt}}}
}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`
}

function buildHeader(): string {
  const p = RESUME_PROFILE.personal
  return `\\begin{center}
    {\\Huge \\scshape ${esc(p.name)}} \\\\ \\vspace{5pt}
    \\small ${esc(p.phone)} ~ ${esc(p.email)} ~ \\href{https://${p.linkedin}}{${esc(p.linkedin)}} ~ \\href{https://${p.github}}{${esc(p.github)}}
\\end{center}`
}

function buildEducation(): string {
  const edu = RESUME_PROFILE.education[0]
  return `\\resumeSubHeadingListStart
  \\resumeSubheading
    {${esc(edu.school)}}{${esc(edu.graduation)}}
    {${esc(edu.degree)}, Minor in ${esc(edu.minor || '')}  }{}
\\resumeSubHeadingListEnd`
}

function buildSkills(selectedSkills: string[]): string {
  const selectedSet = new Set(selectedSkills.map(s => s.toLowerCase()))
  const { skills } = RESUME_PROFILE
  const groups = [
    { label: 'Languages', s: skills.languages },
    { label: 'Frameworks', s: skills.frameworks },
    { label: 'ML / AI', s: skills.ml_ai },
    { label: 'Blockchain', s: skills.blockchain },
    { label: 'Cloud / Infra', s: skills.cloud_infra },
    { label: 'Frontend', s: skills.frontend },
    { label: 'Tools', s: skills.tools },
  ]
  const lines: string[] = []
  for (const { label, s } of groups) {
    const matched = s.filter(x => selectedSet.has(x.toLowerCase()))
    if (matched.length > 0) lines.push(`\\textbf{${label}:} ${matched.map(esc).join(', ')}`)
  }
  return lines.join(' \\\\ \\vspace{2pt}\n')
}

function buildExperience(experience: typeof RESUME_PROFILE.experience): string {
  const items = experience.map(exp => {
    const bullets = exp.bullets.map(b => `    \\resumeItem{${esc(b)}}`).join('\n')
    return `  \\resumeSubheading
    {${esc(exp.company)}}{${fmtRange(exp.start, exp.end)}}
    {${esc(exp.title)}}{${esc(exp.location)}}
  \\resumeItemListStart
${bullets}
  \\resumeItemListEnd`
  }).join('\n\n')
  return `\\resumeSubHeadingListStart
${items}
\\resumeSubHeadingListEnd`
}

function buildProjects(projects: typeof RESUME_PROFILE.projects): string {
  const items = projects.map(proj => {
    const techDisplay = proj.tech.slice(0, 5).map(esc).join(', ')
    const nameDisplay = proj.name === 'ZorAi'
      ? `\\textbf{\\href{https://zorai.vercel.app/}{ZorAi}, AI Content Verification Platform} $|$ \\emph{${techDisplay}}`
      : `\\textbf{${esc(proj.name)}} $|$ \\emph{${techDisplay}}`
    const dates = proj.dates.replace(/–/g, '--').replace(/—/g, '---')
    const bullets = proj.bullets.map(b => `    \\resumeItem{${esc(b)}}`).join('\n')
    return `  \\resumeProjectHeading
    {${nameDisplay}}{${dates}}
  \\resumeItemListStart
${bullets}
  \\resumeItemListEnd`
  }).join('\n\\vspace{-13pt}\n\n')
  return `\\resumeSubHeadingListStart
${items}
\\resumeSubHeadingListEnd`
}

function buildPublication(): string {
  const pub = RESUME_PROFILE.publications[0]
  return `\\resumeSubHeadingListStart
  \\resumeItem{\\textbf{Barros da Silva, J.V.} et al. \`\`${esc(pub.title)}.\\'\\' \\href{${pub.url}}{${esc(pub.id)}}, ${pub.year}. \\textit{(First author.)}}
\\resumeSubHeadingListEnd`
}

function buildCertifications(): string {
  return `\\begin{tabularx}{\\textwidth}{@{}X@{\\hspace{3em}}X@{}}
\\textbf{\\href{https://www.coursera.org/account/accomplishments/verify/N9TRFRQ7MN8I}{AI Agents with RAG \\& LangChain}}, IBM, 2025 &
\\textbf{\\href{https://www.coursera.org/account/accomplishments/verify/ICLX31A58IMM}{Deep Learning \\& Neural Networks}}, IBM, 2025 \\\\
\\textbf{\\href{https://www.coursera.org/account/accomplishments/verify/F4VKG7G8L2VD}{Machine Learning with Python}}, IBM, 2025 &
\\textbf{\\href{https://www.coursera.org/account/accomplishments/verify/JN1AOYIY9IJ3}{AI \\& Blockchain Certificate}}, Google, 2025 \\\\
\\end{tabularx}`
}

export function generateLatexResume(
  subset: ResumeSubset,
  category: JobCategory,
  _keywords: string[],
): string {
  const isResearch = category === 'research'
  const expLabel = isResearch ? 'Research Experience' : 'Experience'
  const skillsLabel = isResearch ? 'Research \\& Technical Skills' : 'Technical Skills'

  const pubSection = subset.includePublications
    ? `\n\\section{Publication}\n${buildPublication()}\n\\vspace{-4pt}\n`
    : ''

  return `${buildPreamble()}

\\begin{document}

${buildHeader()}
\\vspace{-12pt}

\\section{Education}
${buildEducation()}
\\vspace{-6pt}

\\section{${skillsLabel}}
${buildSkills(subset.skills)}

\\section{${expLabel}}
${buildExperience(subset.experience)}
\\vspace{-15pt}

\\section{Projects}
${buildProjects(subset.projects)}
\\vspace{-7pt}
${pubSection}
\\section{Certifications}
${buildCertifications()}

\\end{document}`
}

// ── Legacy template constant (kept for reference) ───────────────────────────

export const LATEX_BASE_TEMPLATE = `\\documentclass[letterpaper,11pt]{article}
\\usepackage[left=0.5in,right=0.5in,top=0.5in,bottom=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{6pt}{4pt}
\\newcommand{\\resumeItem}[1]{\\item\\small{#1}\\vspace{-2pt}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item[]
  \\begin{tabular*}{\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
    \\textbf{#1} & \\small#2 \\\\
    \\textit{\\small#3} & \\textit{\\small#4}
  \\end{tabular*}\\vspace{-6pt}
}
\\begin{document}
% Content generated by Claude
\\end{document}`
