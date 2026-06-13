import axios from 'axios'
import { JobResult } from '@/types/jobs'

let indeedWarned = false
let ziprecruiterWarned = false

async function fetchIndeed(query: string, location: string): Promise<JobResult[]> {
  const publisherId = process.env.INDEED_PUBLISHER_ID
  if (!publisherId) {
    if (!indeedWarned) {
      console.warn('INDEED_PUBLISHER_ID is not set, skipping Indeed search')
      indeedWarned = true
    }
    return []
  }

  try {
    const response = await axios.get('https://api.indeed.com/ads/apisearch', {
      params: {
        publisher: publisherId,
        q: query,
        l: location,
        radius: 25,
        sort: 'date',
        format: 'json',
        v: 2,
        limit: 10,
      },
    })

    const results = response.data.results || []
    return results.map((job: any) => ({
      id: job.jobkey,
      title: job.jobtitle,
      company: job.company,
      location: job.formattedLocation,
      salary: job.formattedRelativeTime ?? null,
      source: 'Indeed' as const,
      url: job.url,
      posted_at: new Date().toISOString(),
      description: job.snippet || '',
      ats_keywords: [],
      remote:
        query.toLowerCase().includes('remote') || location === 'Remote',
    }))
  } catch (error) {
    console.error('Error fetching Indeed jobs:', error)
    return []
  }
}

async function fetchZipRecruiter(
  query: string,
  location: string,
): Promise<JobResult[]> {
  const apiKey = process.env.ZIPRECRUITER_API_KEY
  if (!apiKey) {
    if (!ziprecruiterWarned) {
      console.warn('ZIPRECRUITER_API_KEY is not set, skipping ZipRecruiter search')
      ziprecruiterWarned = true
    }
    return []
  }

  try {
    const response = await axios.get('https://api.ziprecruiter.com/jobs/v1', {
      params: {
        api_key: apiKey,
        search: query,
        location: location,
        radius_miles: 25,
        jobs_per_page: 10,
      },
    })

    const jobs = response.data.jobs || []
    return jobs.map((job: any) => ({
      id: job.id,
      title: job.name,
      company: job.hiring_company?.name || 'Unknown',
      location: job.location?.display_name || '',
      salary: job.salary_interval ?? null,
      source: 'ZipRecruiter' as const,
      url: job.url,
      posted_at: job.posted_time_friendly || new Date().toISOString(),
      description: job.job_description || '',
      ats_keywords: [],
      remote: query.toLowerCase().includes('remote') || location === 'Remote',
    }))
  } catch (error) {
    console.error('Error fetching ZipRecruiter jobs:', error)
    return []
  }
}

const TECH_VOCAB = [
  'Python', 'JavaScript', 'TypeScript', 'Ruby', 'Go', 'Golang', 'Rust', 'Java', 'C++', 'C#',
  'Kotlin', 'Swift', 'Scala', 'PHP', 'SQL', 'Solidity', 'R', 'Bash', 'Assembly',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'FastAPI', 'Flask',
  'Django', 'Ruby on Rails', 'Rails', 'Spring Boot', 'NestJS', 'Svelte', 'Nuxt.js',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Cassandra', 'DynamoDB',
  'Elasticsearch', 'Supabase', 'Firebase', 'Neo4j', 'ClickHouse', 'Snowflake', 'BigQuery',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CircleCI', 'GitHub Actions',
  'CI/CD', 'Lambda', 'EC2', 'S3', 'Vercel', 'Heroku',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'XGBoost', 'LangChain', 'OpenAI', 'LLM', 'LLMs',
  'Pandas', 'NumPy', 'Matplotlib', 'Hugging Face', 'RAG', 'NLP', 'Spark', 'Airflow', 'dbt',
  'machine learning', 'deep learning', 'computer vision', 'MLOps', 'data science',
  'Web3.js', 'Ethereum', 'EVM', 'IPFS', 'DeFi', 'smart contracts', 'blockchain',
  'Hardhat', 'Foundry', 'Solana', 'Polygon', 'Layer 2',
  'Tailwind CSS', 'GraphQL', 'REST API', 'WebSocket', 'React Native', 'Flutter',
  'shadcn/ui', 'Material UI',
  'Git', 'GitHub', 'Jira', 'Swagger', 'OpenAPI', 'gRPC', 'Kafka', 'RabbitMQ',
  'microservices', 'REST', 'API', 'DevOps', 'Agile', 'Scrum', 'Docker Compose',
  'SQLAlchemy', 'Prisma', 'Celery', 'Nginx', 'Linux',
]

export async function extractAtsKeywords(description: string): Promise<string[]> {
  if (!description || !description.trim()) return []
  const lower = description.toLowerCase()
  const found: string[] = []
  for (const kw of TECH_VOCAB) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase()
    if (new RegExp(`\\b${escaped}\\b`).test(lower) && !found.includes(kw)) {
      found.push(kw)
    }
  }
  return found.slice(0, 15)
}

export async function searchJobs(
  query: string,
  location: string,
  remote?: boolean,
): Promise<JobResult[]> {
  const [indeedResult, zipRecruiterResult] = await Promise.allSettled([
    fetchIndeed(query, location),
    fetchZipRecruiter(query, location),
  ])

  const jobs: JobResult[] = []

  if (indeedResult.status === 'fulfilled') {
    jobs.push(...indeedResult.value)
  }
  if (zipRecruiterResult.status === 'fulfilled') {
    jobs.push(...zipRecruiterResult.value)
  }

  const seen = new Set<string>()
  const deduplicated: JobResult[] = []

  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}+${job.company.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(job)
    }
  }

  const keywordExtractions = await Promise.allSettled(
    deduplicated.map((job) => extractAtsKeywords(job.description)),
  )

  const final: JobResult[] = []
  for (let i = 0; i < deduplicated.length; i++) {
    const job = deduplicated[i]
    const extraction = keywordExtractions[i]

    if (extraction.status === 'fulfilled') {
      job.ats_keywords = extraction.value
    } else {
      job.ats_keywords = []
    }

    final.push(job)
  }

  return final
}
