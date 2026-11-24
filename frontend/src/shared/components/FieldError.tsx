import type { AnyFieldApi } from '@tanstack/react-form'

/** Primer error de validación de un campo de TanStack Form (una vez que el campo fue tocado). */
export function fieldError(field: AnyFieldApi): string | undefined {
  const { isTouched, errors } = field.state.meta
  if (!isTouched || errors.length === 0) return undefined
  const mensaje = errors
    .map((e) => (typeof e === 'string' ? e : ((e as { message?: string } | undefined)?.message ?? '')))
    .filter(Boolean)
    .join(', ')
  return mensaje || undefined
}

export default function FieldError({ field }: { field: AnyFieldApi }) {
  const mensaje = fieldError(field)
  return mensaje ? <p className="mt-1 text-sm text-red-600">{mensaje}</p> : null
}
