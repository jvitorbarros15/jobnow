# Joao Vitor Barros — Resume Profile

Source of truth for the resume builder. The AI agent reads this before generating any resume. It never fabricates skills, metrics, companies, or bullets not present here.

---

## Personal

| Field | Value |
|-------|-------|
| Name | Joao Vitor Barros da Silva |
| Email | jvitorbarros15@gmail.com |
| Phone | 814-308-3273 |
| Location | State College, PA (relocating Aug 2026) |
| GitHub | github.com/jvitorbarros15 |
| LinkedIn | linkedin.com/in/joaovi |
| Website | zorai.vercel.app |

---

## Education

**The Pennsylvania State University, University Park**
B.S. in Computer Science — Minor: Entrepreneurship and Innovation
Graduation: August 2026

---

## Experience

### Library Strategic Technologies, Penn State University Libraries
**Software Development Intern** | Oct 2025 – Present | State College, PA

- Develop and maintain enterprise full-stack Ruby on Rails applications supporting 40,000+ users across multiple active repositories in a Scrum-based cycle using Docker and RSpec.
- Member of the development team for a large-scale PDF remediation and accessibility platform built with AWS and Adobe, supporting uploads of over 3 million PDFs via Adobe APIs and AWS S3.
- Designed and implemented a cross-system data integration API using a Rails controller to POST JSON between independent websites, with JSON-to-XML importers and Swagger docs, reducing manual data handling by ~60%.
- Built a Python Pandas data pipeline integrated into the Rails platform, cleaning and standardizing faculty data from 17.7K to 9.8K valid entries and cutting manual processing time by over 90%.
- Solve engineering tickets, perform code reviews, and validate builds for production readiness using CircleCI for CI.

---

### Blockchain Data Intelligence Lab, Penn State University
**Lead Researcher** | Feb 2025 – Present | State College, PA

- Developing QLink, a quantum-safe Layer-3 interoperability protocol integrating QKD and PQC schemes (Crystals-Dilithium, Falcon) to secure cross-chain blockchain bridges.
- Simulated a 7-validator QLink network over 5–50 km QKD fiber links, achieving up to 707x surplus key throughput and under 1 second latency, outperforming classical bridges by over 400x in cross-chain key refresh rate.
- Published: "QLink: A Quantum Safe Layer 3 Interoperability Protocol for Blockchain Networks," arXiv:2512.18488, 2025.

---

### Happy Valley LaunchBox, Penn State Startup Accelerator
**Innovation and Operations Intern** | May 2023 – Jul 2024 | State College, PA

- Spearheaded integration of HubSpot CRM with a new internal UI, centralizing engagement data for 40+ active startups and improving reporting visibility by 45%.
- Automated email replies, data entry, and data-fetching workflows using AI in Power Automate, increasing team efficiency by 30%.
- Judged multiple startup pitch competitions and provided strategic feedback to early-stage founders.

---

## Projects

### ZorAi — `zorai.vercel.app` *(always include, always first)*
**Tech:** React, Node.js, Solidity, OpenAI, IPFS (Pinata), BNB Testnet | Mar 2025 – Present

- Built a platform to register and verify AI-generated images on the blockchain to combat misinformation.
- Deployed a BNB testnet dApp integrating OpenAI API for content analysis and Pinata (IPFS) for decentralized storage, achieving consistent verification latency under 3 seconds across tested images.
- Built an image detection layer linking online media to on-chain AI records; validated against a test set of AI-generated and real images with strong classification results.

---

### Meridian *(backend, full-stack, fintech)*
**Tech:** FastAPI, Next.js, React, PostgreSQL, Redis, SQLAlchemy, Docker, yfinance, Tailwind CSS, Recharts | 2025 – Present

- Built a personal investment dashboard tracking Brazilian stocks (B3), FIIs, US equities, and crypto in one place.
- Designed a FastAPI + SQLAlchemy async backend with PostgreSQL and Redis, exposing a REST API with auto-generated docs.
- Integrated yfinance for real-time market data across B3, US equities, and crypto pairs with a live price refresh endpoint recalculating portfolio returns on demand.
- Containerized the full stack with Docker Compose for consistent local and production environments.

---

### Cognitra *(AI, full-stack, EdTech)*
**Tech:** React 19, Next.js 16, Firebase, OpenAI, LangChain, AssemblyAI, Tailwind CSS, React Flow | 2025 – Present

- Built a full-stack AI-powered study platform with AI-assisted note-taking, flashcard generation, lecture recording with time tracking, and visual concept mind mapping via React Flow.
- Integrated OpenAI and LangChain for AI features, AssemblyAI for lecture transcription, and Firebase for auth and cloud storage.
- Supported English and Portuguese via next-i18next internationalization.

---

### NFL 4th Down Conversion Predictor *(ML, data science)*
**Tech:** Python, Pandas, XGBoost, Seaborn, Matplotlib | Oct 2025 – Present

- Built a machine learning model predicting 4th down conversion probabilities using 11 years of NFL play-by-play data (480K plays).
- Achieved 62% accuracy, 0.66 ROC-AUC, and 0.23 Brier Score with well-calibrated probability predictions.

---

### Insurance Cost Prediction *(ML roles only — regression/prediction modeling required)*
**Tech:** Python, Scikit-learn, XGBoost, Seaborn, Matplotlib | Jun 2025 – Jul 2025

- Designed an end-to-end ML pipeline covering data loading, cleaning, and model evaluation.
- Benchmarked XGBoost, Random Forest, Ridge, and Lasso with GridSearchCV. Top performance with XGBoost (R² = 0.868), reducing MAE and MSE by 35% vs baselines.

---

### B3 Stock Clustering *(data science, quant roles only)*
**Tech:** Python, PCA, K-Means, GMM | May 2025 – Jun 2025

- Clustered 60+ Brazilian stocks by price behavior using K-Means and GMM on normalized financial metrics.
- Applied PCA for dimensionality reduction, revealing four clusters: growth, income, small-cap, and blue-chip.

---

### NittanyAuction *(database-heavy backend, multi-role auth, auction/marketplace only)*
**Tech:** Python, Flask, SQLite, HTML/CSS, JavaScript | Spring 2026

- Built a full-stack auction platform supporting three user roles (Bidders, Sellers, HelpDesk) with role-specific dashboards.
- Implemented a fully database-driven multi-level category tree and bidding logic enforcing increment rules, turn-taking constraints, and bid-count-based auction close.
- Secured auth with salted SHA-256 hashing, role-based routing, and full payment flow with transaction recording.

---

## Technical Skills

| Category | Skills |
|----------|--------|
| Languages | Python, JavaScript, Ruby, Solidity, C, Assembly, SQL |
| Frameworks | Ruby on Rails, React.js, Next.js, Node.js, Flask, FastAPI |
| ML / AI | TensorFlow, PyTorch, LangChain, Scikit-learn, XGBoost, Pandas, NumPy, LLMs |
| Blockchain | Solidity, IPFS (Pinata), BNB Chain, EVM, Web3.js |
| Cloud / Infra | AWS S3, Docker, Docker Compose, CircleCI, Redis, PostgreSQL, SQLite, Firebase |
| Frontend | Tailwind CSS, shadcn/ui, Recharts, React Flow, HTML/CSS |
| Tools | Git/GitHub, Figma, Jira, Notion, Swagger, REST APIs |

---

## Publications

**QLink: A Quantum Safe Layer 3 Interoperability Protocol for Blockchain Networks**
arXiv:2512.18488, 2025 — First author
[https://arxiv.org/abs/2512.18488](https://arxiv.org/abs/2512.18488)

*Include for: `research`, `blockchain_web3`, deep tech / protocol roles. Omit for pure product engineering.*

---

## Certifications

| Certification | Issuer | Date |
|---------------|--------|------|
| AI Agents with RAG & LangChain | IBM | Jun 2025 |
| Deep Learning & Neural Networks | IBM | Jun 2025 |
| Machine Learning with Python | IBM | Jun 2025 |
| AI & Blockchain Certificate | Google | May 2025 |
| ML Web App with Streamlit | Coursera | Jun 2025 |
| Fake News Detection (ML) | Coursera | May 2025 |

---

## Leadership

**Nittany Entrepreneur Society** | Web Development Team & Outreach | Jan 2024 – Present
- Built and maintained the club site (WordPress to React) for a 700+ member community.
- Led outreach, organized workshops, and coordinated guest speaker events.

---

## Resume selection rules (for the AI agent)

### Which projects to include by job category

| Category | Primary | Secondary | Never include |
|----------|---------|-----------|---------------|
| `blockchain_web3` | ZorAi | Meridian | NFL, Insurance, B3, NittanyAuction |
| `ai_ml` | ZorAi | NFL | Meridian, B3, NittanyAuction |
| `backend_fullstack` | ZorAi | Meridian | NFL, Insurance, NittanyAuction |
| `frontend` | ZorAi | Cognitra | NFL, Insurance, NittanyAuction |
| `research` | ZorAi | — (QLink in experience) | NFL, Insurance |
| `data_engineering` | ZorAi | NFL or B3 | Cognitra, NittanyAuction |
| `devops_infra` | Meridian | ZorAi | NFL, Insurance, NittanyAuction |
| `startup_generalist` | ZorAi | Cognitra or Meridian | NFL, Insurance, B3 |

**NittanyAuction** — only if JD explicitly mentions database design, multi-role auth, or auction/marketplace.
**B3 Clustering** — only for data science / quant roles.
**Insurance Cost Prediction** — only for ML roles where regression/prediction is a specific requirement.

### Which experience to include

- **Libraries internship** — always included. Bullet selection varies by category.
- **QLink research** — always for `blockchain_web3` and `research`; optional otherwise.
- **LaunchBox** — only for `startup_generalist`. Omit for all engineering roles.
