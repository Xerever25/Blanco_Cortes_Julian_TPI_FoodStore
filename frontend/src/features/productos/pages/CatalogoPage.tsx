import { useEffect, useState } from 'react'

import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Paginacion from '@/shared/components/Paginacion'
import { SkeletonCards } from '@/shared/components/Skeleton'
import Button from '@/shared/ui/Button'

import ProductoCard from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const POR_PAGINA = 8

export default function CatalogoPage() {
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [pagina, setPagina] = useState(1)

  // Espera a que el usuario deje de escribir antes de consultar al servidor.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(texto.trim())
      setPagina(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [texto])

  const { data: categorias = [] } = useCategorias()
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useProductos({
    skip: (pagina - 1) * POR_PAGINA,
    limit: POR_PAGINA,
    search: busqueda || undefined,
    categoria_id: categoriaId,
    disponible: soloDisponibles ? true : undefined,
  })

  const hayFiltros = busqueda !== '' || categoriaId !== undefined || soloDisponibles
  const limpiar = () => {
    setTexto('')
    setBusqueda('')
    setCategoriaId(undefined)
    setSoloDisponibles(false)
    setPagina(1)
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold">Catálogo</h1>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="buscar" className="mb-1 block text-sm font-medium text-slate-700">
            Buscar
          </label>
          <input
            id="buscar"
            type="search"
            placeholder="Nombre del producto…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <div>
          <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-slate-700">
            Categoría
          </label>
          <select
            id="categoria"
            value={categoriaId ?? ''}
            onChange={(e) => {
              setCategoriaId(e.target.value === '' ? undefined : Number(e.target.value))
              setPagina(1)
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={soloDisponibles}
            onChange={(e) => {
              setSoloDisponibles(e.target.checked)
              setPagina(1)
            }}
          />
          Solo disponibles
        </label>
      </div>

      {isLoading ? (
        <SkeletonCards cantidad={POR_PAGINA} />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error, 'No se pudo cargar el catálogo')} onReintentar={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos productos"
          descripcion={hayFiltros ? 'Probá con otra búsqueda o quitá los filtros.' : 'Todavía no hay productos cargados.'}
          accion={hayFiltros ? <Button variant="secondary" onClick={limpiar}>Quitar filtros</Button> : undefined}
        />
      ) : (
        <>
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${isPlaceholderData ? 'opacity-60' : ''}`}>
            {data.items.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
          <Paginacion pagina={pagina} total={data.total} porPagina={POR_PAGINA} onCambiar={setPagina} />
        </>
      )}
    </section>
  )
}
