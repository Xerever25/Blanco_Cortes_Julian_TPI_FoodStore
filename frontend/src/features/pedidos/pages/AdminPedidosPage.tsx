import { useCallback, useState } from 'react'

import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Paginacion from '@/shared/components/Paginacion'
import { SkeletonRows } from '@/shared/components/Skeleton'
import AdminNav from '@/shared/layout/AdminNav'
import { ETIQUETA_ESTADO } from '@/shared/ui/BadgeEstado'
import Modal from '@/shared/ui/Modal'

import PedidoDetalle from '../components/PedidoDetalle'
import PedidosTable from '../components/PedidosTable'
import { useCambiarEstadoPedido } from '../hooks/useCambiarEstadoPedido'
import { usePedidos } from '../hooks/usePedidos'
import { ESTADOS, type EstadoPedido, type Pedido } from '../types/pedido.types'

const POR_PAGINA = 10

export default function AdminPedidosPage() {
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [pagina, setPagina] = useState(1)
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = usePedidos({
    skip: (pagina - 1) * POR_PAGINA,
    limit: POR_PAGINA,
    estado: estado || undefined,
  })
  const cambiarEstado = useCambiarEstadoPedido()

  const onCambiarEstado = useCallback(
    (pedido: Pedido, destino: EstadoPedido) => {
      const mensaje =
        destino === 'CANCELADO'
          ? `¿Cancelar el pedido #${pedido.id}? El stock se restituye.`
          : `¿Pasar el pedido #${pedido.id} a «${ETIQUETA_ESTADO[destino]}»?`
      if (!window.confirm(mensaje)) return
      setErrorAccion(null)
      cambiarEstado.mutate(
        { id: pedido.id, estado: destino },
        { onError: (e) => setErrorAccion(handleApiError(e, 'No se pudo cambiar el estado')) },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cambiarEstado.mutate],
  )
  const onVer = useCallback((pedido: Pedido) => setDetalle(pedido), [])

  return (
    <section>
      <AdminNav />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <div>
          <label htmlFor="filtro-estado" className="mb-1 block text-sm font-medium text-slate-700">
            Filtrar por estado
          </label>
          <select
            id="filtro-estado"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoPedido | '')
              setPagina(1)
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errorAccion && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorAccion}
        </p>
      )}
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error, 'No se pudieron cargar los pedidos')} onReintentar={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EstadoVacio titulo="No hay pedidos" descripcion={estado ? 'No hay pedidos en ese estado.' : undefined} />
      ) : (
        <>
          <PedidosTable
            pedidos={data.items}
            pageSize={POR_PAGINA}
            onVer={onVer}
            onCambiarEstado={onCambiarEstado}
            ocupado={cambiarEstado.isPending}
          />
          <Paginacion pagina={pagina} total={data.total} porPagina={POR_PAGINA} onCambiar={setPagina} />
        </>
      )}
      <Modal open={detalle !== null} title={detalle ? `Pedido #${detalle.id}` : 'Pedido'} onClose={() => setDetalle(null)} size="lg">
        {detalle && <PedidoDetalle pedido={detalle} />}
      </Modal>
    </section>
  )
}
