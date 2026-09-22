export const CHUNK_RETRY_KEY = 'somos-brasil-chunk-retry'

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Loading chunk') ||
    /Failed to fetch.*\.(js|css)/i.test(message)
  )
}