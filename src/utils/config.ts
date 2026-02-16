import type { AIProvider } from '@/types/agents'

/**
 * Get the API key for a specific AI provider from environment variables
 */
export const getApiKey = (provider: AIProvider): string => {
  const keys: Record<AIProvider, string | undefined> = {
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY,
    openai: import.meta.env.VITE_OPENAI_API_KEY,
    google: import.meta.env.VITE_GOOGLE_API_KEY
  }

  const key = keys[provider]
  if (!key) {
    throw new Error(
      `API key not found for ${provider}. Please set VITE_${provider.toUpperCase()}_API_KEY in your .env file`
    )
  }

  return key
}

/**
 * Get the default model for a specific AI provider
 */
export const getDefaultModel = (provider: AIProvider): string => {
  const models: Record<AIProvider, string> = {
    anthropic: import.meta.env.VITE_DEFAULT_MODEL || 'claude-sonnet-4-5-20250929',
    openai: import.meta.env.VITE_OPENAI_DEFAULT_MODEL || 'gpt-4o',
    google: import.meta.env.VITE_GOOGLE_DEFAULT_MODEL || 'gemini-pro'
  }

  return models[provider]
}
