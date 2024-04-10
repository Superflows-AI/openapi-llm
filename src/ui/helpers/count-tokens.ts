import openaiTokenCounter from 'openai-gpt-token-counter'

export default function countTokens(text: string): number {
  const tokenCount = openaiTokenCounter.text(text, 'gpt-4')
  
  // Assuming encoded returns an array of tokens
  // Adjust based on the actual structure returned by tiktoken
  return tokenCount;
}