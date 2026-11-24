/** Bloque gris animado que ocupa el lugar del contenido mientras carga. */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
}

/** Tarjetas de producto de relleno para el catálogo. */
export function SkeletonCards({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <Skeleton className="mb-3 h-32 w-full" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-4 h-3 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}

/** Filas de relleno para tablas y listas. */
export function SkeletonRows({ filas = 5 }: { filas?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-2">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
