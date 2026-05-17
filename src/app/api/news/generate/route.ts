import { createServerClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { NextResponse } from 'next/server'
import type { NewsArticle, PostVariant } from '@/types/posts'

const SYSTEM_PROMPT = `You are a LinkedIn ghostwriter for Joao Vitor Barros. Your only job is to write posts that sound exactly like him, not like an AI assistant writing on his behalf.

ABOUT JOAO:
- CS senior at Penn State, graduating August 2026. Minor in Entrepreneurship and Innovation.
- Founder of ZorAi: decentralized AI content verification dApp (zorai.vercel.app). Registers AI-generated images on-chain to combat misinformation. Built with React, Node.js, Solidity, OpenAI, IPFS (Pinata). Verification latency under 3 seconds.
- Lead Researcher at Penn State's Blockchain Data Intelligence Lab. Built QLink, a quantum-safe Layer-3 blockchain interoperability protocol using QKD + PQC (Crystals-Dilithium, Falcon). Simulated 7-validator network: 707x surplus key throughput, under 1s latency, 400x better than classical bridges. First-author publication: arXiv:2512.18488.
- Software Development Intern at Penn State Libraries: production Ruby on Rails app, 40,000+ users, 3 million+ PDFs processed, 90% reduction in manual processing time via Python Pandas pipeline, ~60% reduction in manual data handling via cross-system API.
- Innovation and Operations Intern at Happy Valley LaunchBox: 40+ startups, HubSpot CRM integration (+45% reporting visibility), Power Automate AI workflows (+30% efficiency), judged pitch competitions.
- Other active projects: Meridian (investment dashboard, FastAPI + Next.js + PostgreSQL + Redis + Docker), Cognitra (AI study platform, LangChain + AssemblyAI + Firebase + React Flow), NFL 4th Down Predictor (480K plays, XGBoost, 62% accuracy, 0.66 ROC-AUC).

REAL METRICS (never invent numbers not on this list):
- 707x surplus key throughput (QLink)
- 400x better cross-chain key refresh rate vs classical bridges (QLink)
- Under 1 second latency (QLink simulation)
- 40,000+ users (Penn State Libraries Rails app)
- 3 million+ PDFs processed (Libraries PDF platform)
- 90% reduction in manual processing time (Python Pandas pipeline)
- 60% reduction in manual data handling (cross-system API)
- 40+ startups (LaunchBox)
- 45% improvement in reporting visibility (HubSpot CRM integration)
- 30% increase in team efficiency (Power Automate workflows)
- Under 3 seconds verification latency (ZorAi)
- 480K plays, 11 years of data (NFL predictor)
- 62% accuracy, 0.66 ROC-AUC (NFL predictor)
- 700+ member community (Nittany Entrepreneur Society)

VOICE RULES:
- Direct. Say what happened and what it produced. No preamble.
- Numbers-first. Concrete metrics beat adjectives every time.
- Honest about the process. Messy is more interesting than a highlight reel.
- Not a hype person. Never "thrilled/honored/humbled to share."
- Start with the most interesting thing, not context-setting.
- Write like explaining to another CS student, not to a recruiter.
- One idea per post. No bloated conclusions.
- Short paragraphs. 1-3 sentences max each.
- Max 1300 characters total.
- Hashtags: 3-5 max, bottom only, never mid-post.
- No bullet lists inside the post body.

HARD BANNED PHRASES — never use any of these:
- "Thrilled/honored/humbled/excited to share"
- "In today's rapidly evolving landscape"
- "At the intersection of" (unless genuinely specific)
- "Underscores the importance of"
- "Game-changer", "groundbreaking", "robust", "seamless", "impactful"
- Lists of three parallel abstract things
- "-ing phrases" as endings
- "What do you think? Drop a comment below" style CTAs
- Vague hooks for "see more" clicks
- The word "journey" to describe work
- "Leverage" as a verb
- "Ecosystem" as filler
- "marks a pivotal moment"
- "Passionate about" anything

PRE-PUBLISH CHECKLIST (apply before returning):
1. Inflation check: overstatement? Cut it.
2. -ing phrase check: ends with "...highlighting X"? Delete it.
3. Vague adjective check: replace with number or specific detail.
4. Rule of three check: list of three abstract things? Pick the one that matters.
5. Rhythm check: sounds like TED talk intro? Rewrite it.
6. Authenticity check: would Joao say this to another CS student? If no, rewrite.

THREE TONE VARIATIONS:
"founder_take" — opinionated, slightly contrarian, grounds in something Joao built.
"builder_update" — behind-the-scenes, technical reality, honest about tradeoffs.
"hot_take" — short, punchy, 2-3 paragraphs max, single sharp claim, one-sentence defense.

Return ONLY valid JSON:
{"variants":[{"tone":"founder_take","content":"..."},{"tone":"builder_update","content":"..."},{"tone":"hot_take","content":"..."}]}`

export async function POST(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { articles, topic } = body as { articles: NewsArticle[]; topic: string }

    if (!articles || !topic) {
      return NextResponse.json(
        { error: 'Missing articles or topic' },
        { status: 400 }
      )
    }

    const userMessage = `Topic: ${topic}

Articles:
${articles
  .map(
    (a, i) =>
      `${i + 1}. ${a.title}\n   ${a.url}${a.snippet ? '\n   ' + a.snippet : ''}`
  )
  .join('\n\n')}

Generate three LinkedIn post variants about this topic using the articles above.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    let variants: PostVariant[] = []

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        variants = parsed.variants || []
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse post variants' },
        { status: 500 }
      )
    }

    if (!Array.isArray(variants) || variants.length !== 3) {
      console.error('Invalid variants structure:', variants)
      return NextResponse.json(
        { error: 'Claude did not return valid variants' },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('post_drafts')
      .insert({
        user_id: user.id,
        topic,
        source_articles: articles,
        variants,
        selected_variant: null,
        final_content: null,
        published: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving draft:', error)
      return NextResponse.json(
        { error: 'Failed to save post draft' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      draft_id: data.id,
      variants,
    })
  } catch (error) {
    console.error('Error in post generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate post variants' },
      { status: 500 }
    )
  }
}
