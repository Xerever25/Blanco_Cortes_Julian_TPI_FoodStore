import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'

import Button from '@/shared/ui/Button'

interface Props<T> {
  data: T[]
  columns: ColumnDef<T>[]
  /** Filas por página (paginación del lado del cliente). */
  pageSize?: number
  /** Texto accesible de la tabla. */
  caption?: string
}

/** Tabla genérica con TanStack Table y paginación del lado del cliente. */
export default function DataTable<T>({ data, columns, pageSize = 10, caption }: Props<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })

  const paginas = table.getPageCount()

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            {table.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 font-semibold">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((fila) => (
              <tr key={fila.id} className="border-t border-slate-200">
                {fila.getVisibleCells().map((celda) => (
                  <td key={celda.id} className="px-4 py-3 align-middle">
                    {flexRender(celda.column.columnDef.cell, celda.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginas > 1 ? (
        <nav aria-label="Paginación de la tabla" className="flex items-center justify-between pt-3 text-sm text-slate-600">
          <span>{data.length} registros</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
              Anterior
            </Button>
            <span>
              Página {table.getState().pagination.pageIndex + 1} de {paginas}
            </span>
            <Button variant="secondary" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              Siguiente
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  )
}
