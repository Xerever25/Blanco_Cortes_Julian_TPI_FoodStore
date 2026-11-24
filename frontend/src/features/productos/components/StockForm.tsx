import { useForm } from '@tanstack/react-form'

import { fieldError } from '@/shared/components/FieldError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'

import type { Producto, StockInput } from '../types/producto.types'

interface Props {
  producto: Producto
  onSubmit: (data: StockInput) => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
}

/** Cambio rápido de stock y disponibilidad (PATCH /productos/{id}/stock). */
export default function StockForm({ producto, onSubmit, onCancel, isSaving, error }: Props) {
  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: ({ value }) => onSubmit({ stock: Number(value.stock), disponible: value.disponible }),
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <p className="text-sm text-slate-600">{producto.nombre}</p>
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => {
            const n = Number(value)
            if (value.trim() === '' || !Number.isInteger(n)) return 'El stock debe ser un número entero'
            return n < 0 ? 'El stock no puede ser negativo' : undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="stock-valor"
            label="Stock"
            type="number"
            min="0"
            step="1"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={fieldError(field)}
          />
        )}
      </form.Field>
      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} />
            Disponible para la venta
          </label>
        )}
      </form.Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => s.canSubmit}>
          {(canSubmit) => (
            <Button type="submit" disabled={!canSubmit || isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
