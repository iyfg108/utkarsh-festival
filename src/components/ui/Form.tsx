import { useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'
import { CheckIcon, ChevronDownIcon } from '@/components/Icons'

const CONTROL =
  'w-full rounded-2xl border-2 border-night-950/10 bg-white px-4 py-3 text-[15px] text-night-950 shadow-sm outline-none transition placeholder:text-night-950/35 focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15 disabled:cursor-not-allowed disabled:bg-night-50/60 disabled:text-night-950/45'

const CONTROL_ERROR = 'border-rose-festival-400 focus:border-rose-festival-500 focus:ring-rose-festival-500/15'

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-sm font-semibold text-night-900"
        >
          {label}
          {required ? <span className="text-rose-festival-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[13px] font-medium text-rose-festival-600">{error}</p>
      ) : hint ? (
        <p className="text-[13px] leading-snug text-night-950/55">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({
  label,
  hint,
  error,
  required,
  className,
  wrapperClassName,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string | null
  wrapperClassName?: string
}) {
  const id = useId()
  const inputId = rest.id ?? id
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      <input
        {...rest}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, error && CONTROL_ERROR, className)}
      />
    </Field>
  )
}

export function Textarea({
  label,
  hint,
  error,
  required,
  className,
  wrapperClassName,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string | null
  wrapperClassName?: string
}) {
  const id = useId()
  const inputId = rest.id ?? id
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      <textarea
        {...rest}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'min-h-24 resize-y leading-relaxed', error && CONTROL_ERROR, className)}
      />
    </Field>
  )
}

export function Select({
  label,
  hint,
  error,
  required,
  className,
  wrapperClassName,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string | null
  wrapperClassName?: string
}) {
  const id = useId()
  const inputId = rest.id ?? id
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          {...rest}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(CONTROL, 'cursor-pointer appearance-none pr-11', error && CONTROL_ERROR, className)}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-night-950/45" />
      </div>
    </Field>
  )
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  className,
  disabled,
}: {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onChange: (next: boolean) => void
  className?: string
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-night-950/10 bg-white p-4 transition hover:border-marigold-300 hover:bg-marigold-50/40',
        checked && 'border-marigold-400 bg-marigold-50/70',
        disabled && 'pointer-events-none opacity-55',
        className,
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition',
          checked
            ? 'border-marigold-500 bg-marigold-500 text-white'
            : 'border-night-950/25 bg-white group-hover:border-marigold-400',
        )}
      >
        {checked ? <CheckIcon className="size-3.5" /> : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex-1">
        <span className="block text-sm font-semibold leading-snug text-night-950">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[13px] leading-snug text-night-950/60">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50',
        checked ? 'bg-emerald-500' : 'bg-night-950/20',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
