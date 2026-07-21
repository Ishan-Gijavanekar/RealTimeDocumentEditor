export const logger = {
  info(message: string, metadata?: unknown) {
    console.log(format('info', message, metadata))
  },
  warn(message: string, metadata?: unknown) {
    console.warn(format('warn', message, metadata))
  },
  error(message: string, metadata?: unknown) {
    console.error(format('error', message, metadata))
  },
}

function format(level: string, message: string, metadata?: unknown) {
  const prefix = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`
  return metadata ? `${prefix}\n${JSON.stringify(metadata, null, 2)}` : prefix
}