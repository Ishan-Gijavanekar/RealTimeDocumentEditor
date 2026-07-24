import { createContext } from 'react'

export type SnackbarVariant = 'success' | 'error' | 'info' | 'warning'
export type SnackbarContextValue = { enqueueSnackbar: (message: string, options?: { variant?: SnackbarVariant }) => void }

export const SnackbarContext = createContext<SnackbarContextValue | null>(null)