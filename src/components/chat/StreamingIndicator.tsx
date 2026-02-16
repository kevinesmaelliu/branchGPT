import { Spinner } from '@/components/common/Spinner'

interface StreamingIndicatorProps {
  isStreaming: boolean
  message?: string
}

export const StreamingIndicator = ({
  isStreaming,
  message = 'Waiting for response...'
}: StreamingIndicatorProps) => {
  if (!isStreaming) return null

  return (
    <div className="flex items-center gap-2 text-gray-600 text-sm italic">
      <Spinner size="sm" />
      <span>{message}</span>
    </div>
  )
}
