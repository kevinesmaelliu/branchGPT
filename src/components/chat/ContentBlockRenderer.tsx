import ReactMarkdown from 'react-markdown'
import type { ContentBlock } from '@/types/messages'

interface ContentBlockRendererProps {
  block: ContentBlock
}

export const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
  switch (block.type) {
    case 'text':
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              code: ({ inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : ''

                if (inline) {
                  return (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  )
                }

                return (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code className={`language-${language}`} {...props}>
                      {children}
                    </code>
                  </pre>
                )
              }
            }}
          >
            {block.text}
          </ReactMarkdown>
        </div>
      )

    case 'thinking':
      return (
        <details className="border-l-2 border-gray-400 pl-4 py-2 my-2 text-gray-700 dark:text-gray-300">
          <summary className="cursor-pointer font-semibold text-gray-600 dark:text-gray-400">
            💭 Thinking process
          </summary>
          <pre className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm whitespace-pre-wrap">
            {block.thinking}
          </pre>
        </details>
      )

    case 'tool_use':
      return (
        <div className="border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3 rounded my-2">
          <div className="font-mono text-sm text-amber-900 dark:text-amber-100">
            <div className="font-bold">🔧 Tool: {block.name}</div>
            <pre className="mt-2 text-xs overflow-x-auto">
              {JSON.stringify(block.input, null, 2)}
            </pre>
          </div>
        </div>
      )

    case 'tool_result':
      return (
        <div
          className={`border p-3 rounded my-2 font-mono text-sm ${
            block.is_error
              ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700 text-red-900 dark:text-red-100'
              : 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700 text-green-900 dark:text-green-100'
          }`}
        >
          <div className="font-bold">{block.is_error ? '❌' : '✅'} Tool Result</div>
          <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
            {typeof block.content === 'string'
              ? block.content
              : JSON.stringify(block.content, null, 2)}
          </pre>
        </div>
      )

    default:
      return null
  }
}
