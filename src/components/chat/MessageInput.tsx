import { useState } from 'react'
import { Button } from '@/components/common/Button'

interface MessageInputProps {
  onSubmit: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export const MessageInput = ({
  onSubmit,
  disabled = false,
  placeholder = 'Type your message...'
}: MessageInputProps) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSubmit(input)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <Button
        type="submit"
        disabled={disabled || !input.trim()}
        className="h-fit self-end"
      >
        Send
      </Button>
    </form>
  )
}
