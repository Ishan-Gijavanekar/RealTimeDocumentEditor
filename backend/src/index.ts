import { startServer } from './server.js'

try {
  await startServer()
} catch {
  process.exit(1)
}