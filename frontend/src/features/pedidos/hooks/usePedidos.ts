import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getPedidos } from '../api/pedidos'
import type { PedidoFiltros } from '../types/pedido.types'

export const pedidosKey = ['pedidos'] as const

/** Pedidos propios (cliente) o todos (admin); lo decide el backend según el rol. */
export function usePedidos(filtros: PedidoFiltros) {
  return useQuery({
    queryKey: [...pedidosKey, 'lista', filtros],
    queryFn: () => getPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}
