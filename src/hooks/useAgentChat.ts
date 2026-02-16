import { useCallback, useRef, useState } from 'react'
import { streamText } from 'ai'
import { useAgentStore } from '@/stores/agentStore'
import { useChatStore } from '@/stores/chatStore'
import { createTextMessage } from '@/types/messages'
import { getProvider } from '@/lib/ai/providers'
import { toAISDKMessages, createStreamingMessage, createTextBlock, mergeTextDelta } from '@/lib/ai/messageAdapter'

/**
 * Main hook for AI chat using Vercel AI SDK
 * Handles message streaming, store updates, and agent status management
 */
export const useAgentChat = (agentId?: string) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | undefined>(undefined)

  const sendMessage = useCallback(
    async (conversationId: string, userText: string) => {
      if (!agentId || !userText.trim()) return

      const agent = useAgentStore.getState().getAgent(agentId)
      if (!agent) {
        setError(new Error('Agent not found'))
        return
      }

      setError(null)
      setIsStreaming(true)

      try {
        // Update agent status to thinking
        useAgentStore.getState().updateAgentStatus(agentId, 'thinking')

        // Add user message to store
        const userMessage = createTextMessage('user', userText, agentId)
        useChatStore.getState().addMessage(conversationId, userMessage)

        // Get all messages from store for context
        const conversation = useChatStore.getState().getConversation(conversationId)
        if (!conversation) {
          throw new Error('Conversation not found')
        }

        // Get AI SDK provider
        const model = getProvider(agent.provider, agent.model)

        // Convert our messages to AI SDK format
        const aiMessages = toAISDKMessages([
          ...conversation.messages,
          userMessage // Include the user message just added
        ])

        // Create message ID for the assistant response
        const messageId = crypto.randomUUID()

        // Create and add initial assistant message with empty content
        const assistantMessage = createStreamingMessage(messageId, agentId)
        useChatStore.getState().addMessage(conversationId, assistantMessage)

        // Update agent status to streaming
        useAgentStore.getState().updateAgentStatus(agentId, 'streaming')

        // Create abort controller for this stream
        abortControllerRef.current = new AbortController()

        // Stream the response
        const { textStream } = await streamText({
          model,
          messages: aiMessages as any,
          abortSignal: abortControllerRef.current?.signal
        })

        // Process stream and accumulate text
        let accumulatedText = ''

        for await (const chunk of textStream) {
          accumulatedText += chunk

          // Update the last message in the store with accumulated text
          const existingMessage = useChatStore
            .getState()
            .getConversation(conversationId)
            ?.messages.find(m => m.id === messageId)

          if (existingMessage && existingMessage.content.length > 0) {
            // Update existing text block
            const lastBlock = existingMessage.content[existingMessage.content.length - 1]
            if (lastBlock && lastBlock.type === 'text') {
              const updatedBlock = mergeTextDelta(lastBlock as any, chunk)
              useChatStore.getState().updateMessage(conversationId, messageId, {
                content: [...existingMessage.content.slice(0, -1), updatedBlock]
              })
            }
          } else {
            // Add first text block
            useChatStore.getState().updateMessage(conversationId, messageId, {
              content: [createTextBlock(accumulatedText)]
            })
          }
        }

        // Finalize the message
        useChatStore.getState().updateMessage(conversationId, messageId, {
          metadata: {
            streaming: false,
            stopReason: 'end_turn'
          }
        })

        // Update agent status back to idle
        useAgentStore.getState().updateAgentStatus(agentId, 'idle')
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        useAgentStore.getState().updateAgentStatus(agentId, 'error')
        console.error('Chat error:', errorObj)
      } finally {
        setIsStreaming(false)
      }
    },
    [agentId]
  )

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return {
    sendMessage,
    isStreaming,
    error,
    cancelStream
  }
}
