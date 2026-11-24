import Button from '@/shared/ui/Button'

interface Props {
  /** Página actual, empezando en 1. */
  pagina: number
  total: number
  porPagina: number
  onCambiar: (pagina: number) => void
}

export default function Paginacion({ pagina, total, porPagina, onCambiar }: Props) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  if (total === 0) return null
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 pt-4 text-sm text-slate-600">
      <span>
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
          Anterior
        </Button>
        <span>
          Página {pagina} de {paginas}
        </span>
        <Button variant="secondary" size="sm" disabled={pagina >= paginas} onClick={() => onCambiar(pagina + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
