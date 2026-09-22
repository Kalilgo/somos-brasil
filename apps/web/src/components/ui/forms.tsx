import { useId } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const fieldBase =
  'w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 font-medium outline-none ' +
  'transition-colors placeholder:text-ink/30 focus:border-coral ' +
  'focus-visible:ring-2 focus-visible:ring-coral/40 ' +
  'disabled:opacity-50 aria-invalid:border-danger'

interface FieldShellProps {
  label?: string
  hint?: string
  error?: string
  fieldId?: string
  children: React.ReactNode
}

function FieldShell({ label, hint, error, fieldId, children }: FieldShellProps) {
  const errorId = fieldId ? `${fieldId}-error` : undefined
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5">
      {label && (
        <span className="font-display text-sm font-semibold text-ink">{label}</span>
      )}
      {children}
      {error ? (
        <span id={errorId} className="text-sm font-medium text-danger" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-soft">{hint}</span>
      ) : null}
    </label>
  )
}

function errorProps(id: string, error?: string) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, ...rest }: InputProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} fieldId={id}>
      <input id={id} className={cn(fieldBase, className)} {...errorProps(id, error)} {...rest} />
    </FieldShell>
  )
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function TextArea({ label, hint, error, className, ...rest }: TextAreaProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} fieldId={id}>
      <textarea
        id={id}
        className={cn(fieldBase, 'min-h-24 resize-y', className)}
        {...errorProps(id, error)}
        {...rest}
      />
    </FieldShell>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export function Select({ label, hint, error, className, children, ...rest }: SelectProps) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} fieldId={id}>
      <select
        id={id}
        className={cn(fieldBase, 'cursor-pointer appearance-none', className)}
        {...errorProps(id, error)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  )
}