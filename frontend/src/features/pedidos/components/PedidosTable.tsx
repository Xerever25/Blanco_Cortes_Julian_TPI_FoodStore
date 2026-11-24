import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import DataTable from '@/shared/components/DataTable'
import BadgeEstado, { ETIQUETA_ESTADO } from '@/shared/ui/BadgeEstado'
import Button from '@/shared/ui/Button'
import { formatFecha, formatMoneda } from '@/shared/utils/format'

import { TRANSICIONES, type EstadoPedido, type Pedido } from '../types/pedido.types'

interface Props {
  pedidos: Pedido[]
  pageSize: number
  onVer: (pedido: Pedido) => void
  onCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void
  /** true mientras se procesa un cambio de estado (deshabilita los botones). */
  ocupado: boolean
}

const ACCION: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparar',
  ENTREGADO: 'Entregar',
  CANCELADO: 'Cancelar',
}

/** Tabla de pedidos del panel: los botones salen de la máquina de estados (TRANSICIONES). */
export default function PedidosTable({ pedidos, pageSize, onVer, onCambiarEstado, ocupado }: Props) {
  const columnas = useMemo<ColumnDef<Pedido>[]>(
    () => [
      { header: '#', cell: ({ row }) => <span className="font-medium">#{row.original.id}</span> },
      { header: 'Fecha', cell: ({ row }) => formatFecha(row.original.created_at) },
      { header: 'Cliente (id)', cell: ({ row }) => row.original.usuario_id },
      { header: 'Pago', cell: ({ row }) => (row.original.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia') },
      { header: 'Total', cell: ({ row }) => formatMoneda(row.original.total) },
      { header: 'Estado', cell: ({ row }) => <BadgeEstado estado={row.original.estado} /> },
      {
        header: 'Acciones',
        cell: ({ row }) => {
          const pedido = row.original
          return (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onVer(pedido)}>
                Ver
              </Button>
              {TRANSICIONES[pedido.estado].map((destino) => (
                <Button
                  key={destino}
                  size="sm"
                  variant={destino === 'CANCELADO' ? 'danger' : 'primary'}
                  disabled={ocupado}
                  title={`Pasar a ${ETIQUETA_ESTADO[destino]}`}
                  onClick={() => onCambiarEstado(pedido, destino)}
                >
                  {ACCION[destino]}
                </Button>
              ))}
            </div>
          )
        },
      },
    ],
    [onVer, onCambiarEstado, ocupado],
  )
  return <DataTable data={pedidos} columns={columnas} pageSize={pageSize} caption="Pedidos" />
}
