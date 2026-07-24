import { useContext } from 'react'
import { SnackbarContext } from './snackbar-context-value'

export function useSnackbar() {
  const value = useContext(SnackbarContext)
  if (!value) throw new Error('useSnackbar must be used inside SnackbarProvider')
  return value
}