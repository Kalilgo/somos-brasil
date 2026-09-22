import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const fieldBase =
  'w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 font-medium outline-none ' +
  'transition-colors placeholder:text-ink/30 focus:border-coral ' +
  'disabled:opacity-50 aria-invalid:border-danger'

interface FieldShellProps {
  label?: string
  hint?: string
  error?: string
  children: React.ReactNode
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="font-display text-sm font-semibold text-ink">{label}</span>
      )}
      {children}
      {error ? (
        <span className="text-sm font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-soft">{hint}</span>
      ) : null}
    </label>
  )
}

function errorProps(error?: string) {
  return { 'aria-invalid': error ? true : undefined }
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, ...rest }: InputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <input className={cn(fieldBase, className)} {...errorProps(error)} {...rest} />
    </FieldShell>
  )
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function TextArea({ label, hint, error, className, ...rest }: TextAreaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <textarea className={cn(fieldBase, 'min-h-24 resize-y', className)} {...errorProps(error)} {...rest} />
    </FieldShell>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export function Select({ label, hint, error, className, children, ...rest }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <select className={cn(fieldBase, 'cursor-pointer appearance-none', className)} {...errorProps(error)} {...rest}>
        {children}
      </select>
    </FieldShell>
  )
}