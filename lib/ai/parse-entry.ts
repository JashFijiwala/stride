import { runLocalParser } from './local-parser'
import { buildDailyParsePrompt } from './prompts'
import { callGemini, extractJSON } from './gemini'
import type { AIParseResult } from '@/lib/types'

export async function parseJournalEntry(rawText: string, futureHabitNames?: string[], goalsContext?: string): Promise<AIParseResult> {
  // Layer 1: local parser (free, no API call)
  const localResult = runLocalParser(rawText)

  // Layer 2: Gemini
  const prompt = buildDailyParsePrompt(rawText, localResult, futureHabitNames, goalsContext)
  const rawResponse = await callGemini(prompt)
  const parsed = extractJSON(rawResponse) as AIParseResult

  // Apply any corrections from Gemini back on top of local parser
  if (parsed.corrections) {
    if (parsed.corrections.wake_time && !localResult.wake_time) {
      // Gemini found a wake time the local parser missed — no action needed,
      // the API route will use the AI result directly.
    }
  }

  return parsed
}
