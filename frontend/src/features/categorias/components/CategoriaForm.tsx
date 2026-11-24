import { useForm } from '@tanstack/react-form'

import { fieldError } from '@/shared/components/FieldError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'

import type { Categoria, CategoriaInput } from '../types/categoria.types'

interface Props {
  /** Categoría a editar; si es null, el formulario crea una nueva. */
  initial: Categoria | null
  onSubmit: (data: CategoriaInput) => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
}

export default function CategoriaForm({ initial, onSubmit, onCancel, isSaving, error }: Props) {
  const form = useForm({
    defaultValues: { nombre: initial?.nombre ?? '', descripcion: initial?.descripcion ?? '' },
    onSubmit: ({ value }) => onSubmit({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }),
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
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const n = value.trim().length
            if (n < 2) return 'El nombre debe tener al menos 2 caracteres'
            if (n > 100) return 'El nombre no puede superar los 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="categoria-nombre"
            label="Nombre"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={fieldError(field)}
          />
        )}
      </form.Field>
      <form.Field name="descripcion">
        {(field) => (
          <Input
            id="categoria-descripcion"
            label="Descripción"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
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
