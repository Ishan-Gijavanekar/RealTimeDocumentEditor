import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { SnackbarContext, type SnackbarVariant } from './snackbar-context-value'

type SnackbarItem = { id: string; message: string; variant: SnackbarVariant }

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([])

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const enqueueSnackbar = useCallback((message: string, options?: { variant?: SnackbarVariant }) => {
    const id = crypto.randomUUID()
    const item = { id, message, variant: options?.variant ?? 'info' }
    setItems((current) => [...current, item].slice(-4))
    window.setTimeout(() => remove(id), 4200)
  }, [remove])

  const value = useMemo(() => ({ enqueueSnackbar }), [enqueueSnackbar])

  return <SnackbarContext.Provider value={value}>
    {children}
    <div className="snackbar-stack" aria-live="polite" aria-atomic="false">
      {items.map((item) => <div className={`snackbar ${item.variant}`} key={item.id}><span>{item.message}</span><button onClick={() => remove(item.id)}>Dismiss</button></div>)}
    </div>
  </SnackbarContext.Provider>
}