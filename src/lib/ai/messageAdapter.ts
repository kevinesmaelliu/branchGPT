import type { CodingAgentMessage, AgentTextBlock } from '@/types/messages'

/**
 * Convert our CodingAgentMessage format to AI SDK's message format
 * Handles text content extraction and simplification for API compatibility
 */
export const toAISDKMessages = (messages: CodingAgentMessage[]): Array<{ role: string; content: string }> => {
  return messages.map(msg => {
    // Extract text content from content blocks
    const textContent = msg.content
      .filter((block): block is AgentTextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    return {
      role: msg.role,
      content: textContent || ''
    }
  })
}

/**
 * Create an initial assistant message structure for streaming
 * Used when starting to receive a response from the AI
 */
export const createStreamingMessage = (
  messageId: string,
  agentId: string
): CodingAgentMessage => {
  return {
    id: messageId,
    role: 'assistant',
    agentId,
    content: [],
    timestamp: Date.now(),
    metadata: {
      streaming: true
    }
  }
}

/**
 * Convert a text delta from AI SDK stream into a content block
 * Accumulates text into our AgentTextBlock format
 */
export const createTextBlock = (text: string): AgentTextBlock => {
  return {
    type: 'text',
    text
  }
}

/**
 * Merge text deltas into a single text block
 * Used when accumulating streaming text updates
 */
export const mergeTextDelta = (existing: AgentTextBlock, delta: string): AgentTextBlock => {
  return {
    type: 'text',
    text: existing.text + delta
  }
}
