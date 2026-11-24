import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createPedido } from '../api/pedidos'
import type { PedidoCreate } from '../types/pedido.types'
import { pedidosKey } from './usePedidos'

export function useCrearPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PedidoCreate) => createPedido(data),
    // El pedido descontó stock: se refrescan también los productos.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: pedidosKey }),
        queryClient.invalidateQueries({ queryKey: ['productos'] }),
      ]),
  })
}
