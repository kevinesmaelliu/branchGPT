// Message type system adapted from AgentBase
// Provides comprehensive types for AI agent communication

// Core message roles
export type ChatRole = 'user' | 'assistant' | 'system'

// Text content block
export interface AgentTextBlock {
  type: 'text'
  text: string
  citations?: string[]
}

// Thinking/reasoning block (Claude's internal reasoning)
export interface AgentThinkingBlock {
  type: 'thinking'
  thinking: string
  signature?: string
}

// Tool use request block
export interface AgentToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

// Tool execution result block
export interface AgentToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string | AgentTextBlock[]
  is_error?: boolean
}

// Union type for all content blocks
export type ContentBlock =
  | AgentTextBlock
  | AgentThinkingBlock
  | AgentToolUseBlock
  | AgentToolResultBlock

// Main message structure
export interface CodingAgentMessage {
  id: string
  agentId?: string
  role: ChatRole
  content: ContentBlock[]
  timestamp: number
  metadata?: {
    model?: string
    tokens?: {
      input: number
      output: number
    }
    streaming?: boolean
    stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use'
  }
}

// Streaming event types
export type StreamEventType =
  | 'message_start'
  | 'content_block_start'
  | 'content_block_delta'
  | 'content_block_stop'
  | 'message_delta'
  | 'message_stop'

// Streaming chunk for real-time updates
export interface StreamingChunk {
  type: StreamEventType
  index?: number
  contentBlock?: {
    type: 'text' | 'thinking' | 'tool_use'
    id?: string
    name?: string
  }
  delta?: {
    type: 'text_delta' | 'thinking_delta' | 'input_json_delta'
    text?: string
    thinking?: string
    partial_json?: string
  }
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

// Convenience type for message creation
export interface CreateMessageParams {
  role: ChatRole
  content: string | ContentBlock[]
  agentId?: string
  metadata?: CodingAgentMessage['metadata']
}

// Helper to create a simple text message
export function createTextMessage(
  role: ChatRole,
  text: string,
  agentId?: string
): CodingAgentMessage {
  return {
    id: crypto.randomUUID(),
    role,
    agentId,
    content: [{ type: 'text', text }],
    timestamp: Date.now()
  }
}

// Helper to extract text from content blocks
export function extractTextFromContent(content: ContentBlock[]): string {
  return content
    .filter((block): block is AgentTextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')
}

// Helper to check if message has tool use
export function hasToolUse(message: CodingAgentMessage): boolean {
  return message.content.some(block => block.type === 'tool_use')
}

// Helper to get tool calls from message
export function getToolCalls(message: CodingAgentMessage): AgentToolUseBlock[] {
  return message.content.filter(
    (block): block is AgentToolUseBlock => block.type === 'tool_use'
  )
}
