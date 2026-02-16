// Chat store for managing conversations and messages with Zustand

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { CodingAgentMessage, ContentBlock } from '@/types/messages'
import type { Conversation } from '@/types/workspace'

interface ChatState {
  // State
  conversations: Map<string, Conversation>
  activeConversationId: string | null

  // Actions - Conversation Management
  createConversation: (
    workspaceId: string,
    agentId: string,
    parentId?: string,
    branchPoint?: number
  ) => string
  deleteConversation: (conversationId: string) => void
  setActiveConversation: (conversationId: string | null) => void
  getConversation: (conversationId: string) => Conversation | undefined
  updateConversationTitle: (conversationId: string, title: string) => void

  // Actions - Message Management
  addMessage: (conversationId: string, message: CodingAgentMessage) => void
  updateMessage: (
    conversationId: string,
    messageId: string,
    update: Partial<CodingAgentMessage>
  ) => void
  appendToLastMessage: (conversationId: string, content: ContentBlock) => void
  updateLastMessageContent: (
    conversationId: string,
    contentIndex: number,
    content: ContentBlock
  ) => void
  getMessages: (conversationId: string) => CodingAgentMessage[]

  // Actions - Branching
  branchConversation: (
    conversationId: string,
    fromMessageIndex: number,
    newMessage?: CodingAgentMessage
  ) => string

  // Actions - Utility
  clearAllConversations: () => void
  getConversationsByWorkspace: (workspaceId: string) => Conversation[]
  getConversationsByAgent: (agentId: string) => Conversation[]
}

// IndexedDB storage for large conversation data
const indexedDBStorage = {
  getItem: async (name: string) => {
    const value = await idbGet(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value)
  },
  removeItem: async (name: string) => {
    await idbDel(name)
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: new Map(),
      activeConversationId: null,

      // Create a new conversation
      createConversation: (workspaceId, agentId, parentId, branchPoint) => {
        const id = crypto.randomUUID()
        const now = Date.now()

        const conversation: Conversation = {
          id,
          workspaceId,
          agentId,
          messages: [],
          parentId,
          branchPoint,
          createdAt: now,
          updatedAt: now
        }

        // If branching, copy messages up to branch point
        if (parentId && branchPoint !== undefined) {
          const parent = get().conversations.get(parentId)
          if (parent) {
            conversation.messages = parent.messages.slice(0, branchPoint + 1)
          }
        }

        set(state => ({
          conversations: new Map(state.conversations).set(id, conversation),
          activeConversationId: id
        }))

        return id
      },

      // Delete a conversation
      deleteConversation: conversationId => {
        set(state => {
          const newConversations = new Map(state.conversations)
          newConversations.delete(conversationId)

          return {
            conversations: newConversations,
            activeConversationId:
              state.activeConversationId === conversationId
                ? null
                : state.activeConversationId
          }
        })
      },

      // Set active conversation
      setActiveConversation: conversationId => {
        set({ activeConversationId: conversationId })
      },

      // Get a conversation by ID
      getConversation: conversationId => {
        return get().conversations.get(conversationId)
      },

      // Update conversation title
      updateConversationTitle: (conversationId, title) => {
        const conversation = get().conversations.get(conversationId)
        if (!conversation) return

        const updated = {
          ...conversation,
          title,
          updatedAt: Date.now()
        }

        set(state => ({
          conversations: new Map(state.conversations).set(conversationId, updated)
        }))
      },

      // Add a message to a conversation
      addMessage: (conversationId, message) => {
        const conversation = get().conversations.get(conversationId)
        if (!conversation) return

        const updated = {
          ...conversation,
          messages: [...conversation.messages, message],
          updatedAt: Date.now()
        }

        set(state => ({
          conversations: new Map(state.conversations).set(conversationId, updated)
        }))
      },

      // Update a specific message
      updateMessage: (conversationId, messageId, update) => {
        const conversation = get().conversations.get(conversationId)
        if (!conversation) return

        const updated = {
          ...conversation,
          messages: conversation.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...update } : msg
          ),
          updatedAt: Date.now()
        }

        set(state => ({
          conversations: new Map(state.conversations).set(conversationId, updated)
        }))
      },

      // Append content to the last message (for streaming)
      appendToLastMessage: (conversationId, content) => {
        const conversation = get().conversations.get(conversationId)
        if (!conversation || conversation.messages.length === 0) return

        const messages = [...conversation.messages]
        const lastMessage = messages[messages.length - 1]

        if (!lastMessage) return

        messages[messages.length - 1] = {
          ...lastMessage,
          content: [...lastMessage.content, content]
        }

        const updated = {
          ...conversation,
          messages,
          updatedAt: Date.now()
        }

        set(state => ({
          conversations: new Map(state.conversations).set(conversationId, updated)
        }))
      },

      // Update content block in last message (for streaming deltas)
      updateLastMessageContent: (conversationId, contentIndex, content) => {
        const conversation = get().conversations.get(conversationId)
        if (!conversation || conversation.messages.length === 0) return

        const messages = [...conversation.messages]
        const lastMessage = messages[messages.length - 1]

        if (!lastMessage) return

        const newContent = [...lastMessage.content]
        newContent[contentIndex] = content

        messages[messages.length - 1] = {
          ...lastMessage,
          content: newContent
        }

        const updated = {
          ...conversation,
          messages,
          updatedAt: Date.now()
        }

        set(state => ({
          conversations: new Map(state.conversations).set(conversationId, updated)
        }))
      },

      // Get messages from a conversation
      getMessages: conversationId => {
        const conversation = get().conversations.get(conversationId)
        return conversation?.messages ?? []
      },

      // Branch a conversation from a specific message
      branchConversation: (conversationId, fromMessageIndex, newMessage) => {
        const newConvId = get().createConversation(
          get().conversations.get(conversationId)?.workspaceId ?? '',
          get().conversations.get(conversationId)?.agentId ?? '',
          conversationId,
          fromMessageIndex
        )

        if (newMessage) {
          get().addMessage(newConvId, newMessage)
        }

        return newConvId
      },

      // Clear all conversations
      clearAllConversations: () => {
        set({
          conversations: new Map(),
          activeConversationId: null
        })
      },

      // Get all conversations in a workspace
      getConversationsByWorkspace: workspaceId => {
        return Array.from(get().conversations.values()).filter(
          conv => conv.workspaceId === workspaceId
        )
      },

      // Get all conversations for an agent
      getConversationsByAgent: agentId => {
        return Array.from(get().conversations.values()).filter(
          conv => conv.agentId === agentId
        )
      }
    }),
    {
      name: 'branchgpt-chat-storage',
      version: 1,
      storage: createJSONStorage(() => indexedDBStorage),
      // Custom serialization to handle Map
      partialize: state => ({
        conversations: Array.from(state.conversations.entries()),
        activeConversationId: state.activeConversationId
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          conversations: Array.isArray(persistedState?.conversations)
            ? new Map(persistedState.conversations as [string, Conversation][])
            : new Map()
        }
      }
    }
  )
)
