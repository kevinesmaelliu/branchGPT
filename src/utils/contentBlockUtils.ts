import type { ContentBlock, AgentTextBlock } from '@/types/messages'

/**
 * Extract all text content from a list of content blocks
 */
export const extractTextFromBlocks = (blocks: ContentBlock[]): string => {
  return blocks
    .filter((block): block is AgentTextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')
}

/**
 * Check if a content block is a text block
 */
export const isTextBlock = (block: ContentBlock): block is AgentTextBlock => {
  return block.type === 'text'
}

/**
 * Update a text block with new text content
 */
export const updateTextBlock = (block: AgentTextBlock, newText: string): AgentTextBlock => {
  return {
    ...block,
    text: newText
  }
}

/**
 * Count total characters in all text blocks
 */
export const countTextCharacters = (blocks: ContentBlock[]): number => {
  return blocks
    .filter((block): block is AgentTextBlock => block.type === 'text')
    .reduce((total, block) => total + block.text.length, 0)
}
