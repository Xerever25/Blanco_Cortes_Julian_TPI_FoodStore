import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primary' | 'secondary' | 'danger' | 'ghost'
type Tamano = 'md' | 'sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante
  size?: Tamano
}

const VARIANTES: Record<Variante, string> = {
  primary: 'bg-orange-600 text-white hover:bg-orange-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

const TAMANOS: Record<Tamano, string> = { md: 'px-4 py-2 text-sm', sm: 'px-2.5 py-1 text-xs' }

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variant]} ${TAMANOS[size]} ${className}`}
      {...rest}
    />
  )
}
