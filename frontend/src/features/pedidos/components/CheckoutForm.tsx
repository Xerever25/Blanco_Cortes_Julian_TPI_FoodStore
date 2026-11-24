import { useForm } from '@tanstack/react-form'

import { fieldError } from '@/shared/components/FieldError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'

import type { FormaPago } from '../types/pedido.types'

export interface DatosCheckout {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string | null
}

interface Props {
  onSubmit: (datos: DatosCheckout) => void
  isSaving: boolean
}

export default function CheckoutForm({ onSubmit, isSaving }: Props) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: ({ value }) =>
      onSubmit({
        direccion_entrega: value.direccion_entrega.trim(),
        forma_pago: value.forma_pago,
        notas: value.notas.trim() || null,
      }),
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
      <form.Field
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const n = value.trim().length
            if (n < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (n > 200) return 'La dirección no puede superar los 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="direccion"
            label="Dirección de entrega"
            autoComplete="street-address"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={fieldError(field)}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <div>
            <label htmlFor="forma-pago" className="mb-1 block text-sm font-medium text-slate-700">
              Forma de pago
            </label>
            <select
              id="forma-pago"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value as FormaPago)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
        )}
      </form.Field>

      <form.Field name="notas">
        {(field) => (
          <div>
            <label htmlFor="notas" className="mb-1 block text-sm font-medium text-slate-700">
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              rows={3}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.canSubmit}>
        {(canSubmit) => (
          <Button type="submit" className="w-full" disabled={!canSubmit || isSaving}>
            {isSaving ? 'Confirmando…' : 'Confirmar pedido'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
