import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  emoji?: string
}

interface ToastState {
  toasts: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: `toast_${Date.now()}_${counter++}` }],
    })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toastSuccess(message: string, emoji = '✅') {
  useToastStore.getState().push({ message, type: 'success', emoji })
}

export function toastError(message: string) {
  useToastStore.getState().push({ message, type: 'error', emoji: '😬' })
}

export function toastInfo(message: string, emoji = '💬') {
  useToastStore.getState().push({ message, type: 'info', emoji })
}