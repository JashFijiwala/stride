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

  // Enforce flagged = true if self_harm > 0 (safety guarantee, regardless of Gemini output)
  if (parsed.phq9_signals?.self_harm > 0 && !parsed.flagged) {
    parsed.flagged = true
  }

  return parsed
}
