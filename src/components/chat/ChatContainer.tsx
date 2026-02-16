import { useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAgentStore } from '@/stores/agentStore'
import { useChatStore } from '@/stores/chatStore'
import { useAgentChat } from '@/hooks/useAgentChat'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { StreamingIndicator } from './StreamingIndicator'
import { Button } from '@/components/common/Button'

export const ChatContainer = () => {
  const activeConversationId = useChatStore(state => state.activeConversationId)
  const conversationsMap = useChatStore(state => state.conversations)
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)

  // Get active conversation
  const conversation = useMemo(() => {
    if (!activeConversationId) return null
    return conversationsMap.get(activeConversationId) ?? null
  }, [activeConversationId, conversationsMap])

  // Get agent for active conversation
  const agent = useMemo(() => {
    if (!conversation) return null
    const agentsMap = useAgentStore.getState().agents
    return conversation.agentId ? agentsMap.get(conversation.agentId) ?? null : null
  }, [conversation])

  // Use the chat hook for streaming
  const { sendMessage, isStreaming, error, cancelStream } = useAgentChat(agent?.id)

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId || !agent) return
    await sendMessage(activeConversationId, text)
  }

  if (!activeWorkspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Please select or create a workspace first</p>
      </div>
    )
  }

  if (!conversation || !agent) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Please create an agent to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {agent.name}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {agent.provider} • {agent.model}
        </p>
        {error && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded text-sm">
            Error: {error.message}
          </div>
        )}
      </div>

      {/* Messages */}
      <MessageList messages={conversation.messages} isLoading={isStreaming} />

      {/* Streaming Indicator */}
      <div className="px-4 py-2">
        <StreamingIndicator isStreaming={isStreaming} message="Agent is thinking..." />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <MessageInput
          onSubmit={handleSendMessage}
          disabled={isStreaming}
          placeholder={isStreaming ? 'Waiting for response...' : 'Type your message...'}
        />
        {isStreaming && (
          <div className="px-4 pb-2">
            <Button size="sm" variant="danger" onClick={cancelStream}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
