import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { AIProvider } from '@/types/agents'
import { getApiKey } from '@/utils/config'

/**
 * Get an AI SDK provider instance for the given provider type and model.
 * Uses VITE_* env vars (e.g. VITE_ANTHROPIC_API_KEY) so keys work in the browser.
 */
export const getProvider = (provider: AIProvider, model: string) => {
  const apiKey = getApiKey(provider)
  switch (provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey })
      return anthropic(model)
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey })
      return openai(model)
    }
    // case 'google':
    //   return google(model) // TODO: Add Google Gemini support
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
