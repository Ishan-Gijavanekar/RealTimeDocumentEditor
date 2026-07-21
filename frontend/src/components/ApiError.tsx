export function ApiError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null
  return <div className="api-error" role="alert"><strong>API error</strong><span>{message}</span><button onClick={onDismiss}>Dismiss</button></div>
}