import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import type { AIProvider } from '@/types/agents'

/**
 * Get an AI SDK provider instance for the given provider type and model
 * @param provider - The AI provider (anthropic, openai, google)
 * @param model - The model name/ID
 * @returns Configured AI SDK provider instance
 */
export const getProvider = (provider: AIProvider, model: string) => {
  switch (provider) {
    case 'anthropic':
      return anthropic(model)
    case 'openai':
      return openai(model)
    // case 'google':
    //   return google(model) // TODO: Add Google Gemini support
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
