import { useForm } from '@tanstack/react-form'

import type { Categoria } from '@/features/categorias/types/categoria.types'
import { fieldError } from '@/shared/components/FieldError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'

import type { Producto, ProductoInput } from '../types/producto.types'

interface Props {
  initial: Producto | null
  categorias: Categoria[]
  onSubmit: (data: ProductoInput) => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
}

export default function ProductoForm({ initial, categorias, onSubmit, onCancel, isSaving, error }: Props) {
  const form = useForm({
    // Los números se editan como texto y se convierten al enviar.
    defaultValues: {
      categoria_id: String(initial?.categoria_id ?? categorias[0]?.id ?? ''),
      nombre: initial?.nombre ?? '',
      descripcion: initial?.descripcion ?? '',
      precio_base: initial ? String(initial.precio_base) : '',
      imagen_url: initial?.imagen_url ?? '',
      stock: initial ? String(initial.stock) : '0',
      disponible: initial?.disponible ?? true,
    },
    onSubmit: ({ value }) =>
      onSubmit({
        categoria_id: Number(value.categoria_id),
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim() || null,
        stock: Number(value.stock),
        disponible: value.disponible,
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
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value === '' ? 'Elegí una categoría' : undefined) }}
      >
        {(field) => (
          <div>
            <label htmlFor="producto-categoria" className="mb-1 block text-sm font-medium text-slate-700">
              Categoría
            </label>
            <select
              id="producto-categoria"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {fieldError(field) && <p className="mt-1 text-sm text-red-600">{fieldError(field)}</p>}
          </div>
        )}
      </form.Field>
      <form.Field
        name="nombre"
        validators={{ onChange: ({ value }) => (!value.trim() ? 'El nombre es obligatorio' : undefined) }}
      >
        {(field) => (
          <Input
            id="producto-nombre"
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
            id="producto-descripcion"
            label="Descripción"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) => {
              const n = Number(value)
              if (value.trim() === '' || !Number.isFinite(n)) return 'Ingresá un precio válido'
              return n < 0 ? 'El precio no puede ser negativo' : undefined
            },
          }}
        >
          {(field) => (
            <Input
              id="producto-precio"
              label="Precio"
              type="number"
              min="0"
              step="0.01"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              error={fieldError(field)}
            />
          )}
        </form.Field>
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
              id="producto-stock"
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
      </div>
      <form.Field name="imagen_url">
        {(field) => (
          <Input
            id="producto-imagen"
            label="URL de la imagen (opcional)"
            type="url"
            placeholder="https://…"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
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
            <Button type="submit" disabled={!canSubmit || isSaving || categorias.length === 0}>
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
