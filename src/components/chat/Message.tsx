import type { CodingAgentMessage } from '@/types/messages'
import { ContentBlockRenderer } from './ContentBlockRenderer'

interface MessageProps {
  message: CodingAgentMessage
}

export const Message = ({ message }: MessageProps) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-4 py-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">AI</span>
        </div>
      )}

      <div
        className={`max-w-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg rounded-tl-none'
        } p-4`}
      >
        {message.content.length === 0 ? (
          <span className="text-gray-500 italic">Empty message</span>
        ) : (
          <div className="space-y-3">
            {message.content.map((block, index) => (
              <div key={index}>
                <ContentBlockRenderer block={block} />
              </div>
            ))}
          </div>
        )}

        {message.metadata?.streaming && (
          <div className="mt-2 text-xs opacity-75">
            <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-700 text-sm font-bold">👤</span>
        </div>
      )}
    </div>
  )
}
