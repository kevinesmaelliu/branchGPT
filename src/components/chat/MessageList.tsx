import { useEffect, useRef } from 'react'
import type { CodingAgentMessage } from '@/types/messages'
import { Message } from './Message'

interface MessageListProps {
  messages: CodingAgentMessage[]
  isLoading?: boolean
}

export const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">No messages yet</p>
          <p className="text-sm">Start a conversation by typing a message below</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => (
        <Message key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200" />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
