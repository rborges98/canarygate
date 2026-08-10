export type ParsedSseEvent = {
  event: string
  data: string
  retryMs?: number
}

export function parseSseEventBlock(block: string): ParsedSseEvent | null {
  let event = 'message'
  const dataLines: string[] = []
  let retryMs: number | undefined

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const value =
      separatorIndex === -1 ? '' : line.slice(separatorIndex + 1).trimStart()

    if (field === 'event') {
      event = value || 'message'
      continue
    }

    if (field === 'data') {
      dataLines.push(value)
      continue
    }

    if (field === 'retry') {
      const parsedRetryMs = Number.parseInt(value, 10)
      if (Number.isFinite(parsedRetryMs) && parsedRetryMs > 0) {
        retryMs = parsedRetryMs
      }
    }
  }

  if (dataLines.length === 0 && retryMs === undefined) {
    return null
  }

  return { event, data: dataLines.join('\n'), retryMs }
}
