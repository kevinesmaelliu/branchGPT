// Workspace and conversation types for organizing multi-agent work

import type { CodingAgentMessage } from './messages'

// Workspace for organizing related agents
export interface Workspace {
  id: string
  name: string
  agentIds: string[]
  isolated: boolean // Whether agents in this workspace have isolated file access
  createdAt: number
  updatedAt: number
  metadata?: {
    branch?: string
    path?: string
    description?: string
    color?: string
  }
}

// Conversation with branching support
export interface Conversation {
  id: string
  workspaceId: string
  agentId: string
  messages: CodingAgentMessage[]
  parentId?: string // For branching - ID of parent conversation
  branchPoint?: number // Message index where branch occurred
  title?: string
  createdAt: number
  updatedAt: number
  metadata?: {
    summary?: string
    tags?: string[]
  }
}

// Conversation branch node for tree visualization
export interface ConversationNode {
  conversation: Conversation
  children: ConversationNode[]
  depth: number
}

// Workspace configuration for creation
export interface WorkspaceConfig {
  name: string
  isolated?: boolean
  branch?: string
  path?: string
  description?: string
}

// Conversation filter options
export interface ConversationFilter {
  workspaceId?: string
  agentId?: string
  parentId?: string
  searchTerm?: string
  startDate?: number
  endDate?: number
}

// Helper to check if workspace has agents
export function hasAgents(workspace: Workspace): boolean {
  return workspace.agentIds.length > 0
}

// Helper to build conversation tree
export function buildConversationTree(
  conversations: Conversation[]
): ConversationNode[] {
  const conversationMap = new Map<string, ConversationNode>(
    conversations.map(conv => [conv.id, { conversation: conv, children: [], depth: 0 }])
  )

  const roots: ConversationNode[] = []

  for (const node of conversationMap.values()) {
    if (node.conversation.parentId) {
      const parent = conversationMap.get(node.conversation.parentId)
      if (parent) {
        node.depth = parent.depth + 1
        parent.children.push(node)
      } else {
        // Parent not found, treat as root
        roots.push(node)
      }
    } else {
      // No parent, this is a root conversation
      roots.push(node)
    }
  }

  return roots
}

// Helper to get all ancestor conversations
export function getAncestors(
  conversationId: string,
  conversations: Conversation[]
): Conversation[] {
  const ancestors: Conversation[] = []
  const conversationMap = new Map(conversations.map(c => [c.id, c]))

  let current = conversationMap.get(conversationId)

  while (current?.parentId) {
    const parent = conversationMap.get(current.parentId)
    if (!parent) break
    ancestors.unshift(parent)
    current = parent
  }

  return ancestors
}

// Helper to get all descendant conversations
export function getDescendants(
  conversationId: string,
  conversations: Conversation[]
): Conversation[] {
  const descendants: Conversation[] = []
  const children = conversations.filter(c => c.parentId === conversationId)

  for (const child of children) {
    descendants.push(child)
    descendants.push(...getDescendants(child.id, conversations))
  }

  return descendants
}

// Helper to count total messages in conversation tree
export function countMessagesInTree(
  conversationId: string,
  conversations: Conversation[]
): number {
  const conversationMap = new Map(conversations.map(c => [c.id, c]))
  const conversation = conversationMap.get(conversationId)

  if (!conversation) return 0

  let count = conversation.messages.length
  const descendants = getDescendants(conversationId, conversations)

  for (const desc of descendants) {
    count += desc.messages.length
  }

  return count
}
