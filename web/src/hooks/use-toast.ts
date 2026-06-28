'use client'

import { useState, useCallback } from 'react'

type Toast = {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((type: Toast['type'], message: string) => {
    const id = String(++toastId)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const success = useCallback((msg: string) => show('success', msg), [show])
  const error = useCallback((msg: string) => show('error', msg), [show])

  return { toasts, success, error }
}
