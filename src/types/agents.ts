// Agent domain types for multi-agent orchestration

// Agent execution status
export type AgentStatus =
  | 'idle'           // Agent is ready and waiting
  | 'thinking'       // Agent is processing a request
  | 'streaming'      // Agent is streaming a response
  | 'waiting_approval' // Agent needs user approval for an action
  | 'executing'      // Agent is executing an approved tool
  | 'error'          // Agent encountered an error
  | 'paused'         // Agent has been paused by user

// AI provider types
export type AIProvider = 'anthropic' | 'openai' | 'google'

// Available models per provider
export const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  anthropic: [
    'claude-sonnet-4-5-20250929',
    'claude-opus-4-6',
    'claude-haiku-4-5-20251001',
    'claude-3-7-sonnet-20250219'
  ],
  openai: [
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ],
  google: [
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ]
}

// Main agent entity
export interface Agent {
  id: string
  name: string
  status: AgentStatus
  workspaceId: string
  conversationId: string
  model: string
  provider: AIProvider
  createdAt: number
  updatedAt: number
  metadata?: {
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    color?: string // For visual identification
    icon?: string
  }
}

// Agent action types that require user input
export type AgentActionType = 'clarifying_question' | 'tool_approval'

// Base action interface
export interface AgentAction {
  id: string
  agentId: string
  type: AgentActionType
  timestamp: number
  status: 'pending' | 'approved' | 'denied'
}

// Clarifying question action
export interface ClarifyingQuestionAction extends AgentAction {
  type: 'clarifying_question'
  data: {
    question: string
    options: string[]
    multiSelect: boolean
  }
  response?: string | string[]
}

// Tool approval action
export interface ToolApprovalAction extends AgentAction {
  type: 'tool_approval'
  data: {
    toolName: string
    command?: string
    description: string
    riskLevel: 'low' | 'medium' | 'high'
    parameters?: Record<string, unknown>
  }
  decision?: ToolApprovalDecision
}

// User's decision on tool approval
export type ToolApprovalDecision =
  | 'allow'      // Allow this one time
  | 'allow_all'  // Allow this and all future similar actions
  | 'deny'       // Deny this action

// Agent configuration for creation
export interface AgentConfig {
  name?: string
  workspaceId: string
  model: string
  provider: AIProvider
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  color?: string
}

// Agent activity log entry
export interface AgentActivity {
  id: string
  agentId: string
  type: 'message' | 'tool_call' | 'status_change' | 'error'
  timestamp: number
  data: unknown
  description: string
}

// Helper to check if agent can execute
export function canExecute(agent: Agent): boolean {
  return agent.status === 'idle' || agent.status === 'waiting_approval'
}

// Helper to check if agent is busy
export function isBusy(agent: Agent): boolean {
  return agent.status === 'thinking' ||
         agent.status === 'streaming' ||
         agent.status === 'executing'
}

// Helper to get default model for provider
export function getDefaultModel(provider: AIProvider): string {
  return PROVIDER_MODELS[provider]?.[0] ?? ''
}

// Helper to validate if model exists for provider
export function isValidModelForProvider(provider: AIProvider, model: string): boolean {
  return PROVIDER_MODELS[provider]?.includes(model) ?? false
}
