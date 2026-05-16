import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function classifyEmailThread(emailContent: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a job application email classifier. Given an email thread, return ONLY valid JSON with no preamble...`,
      },
    ],
  })

  return message.content[0].type === 'text' ? JSON.parse(message.content[0].text) : null
}
