import { useMutation, useQueryClient } from '@tanstack/react-query'

import { patchEstado } from '../api/pedidos'
import type { EstadoPedido } from '../types/pedido.types'
import { pedidosKey } from './usePedidos'

export function useCambiarEstadoPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => patchEstado(id, estado),
    // Cancelar restituye stock: se refrescan también los productos. Invalidar ['pedidos'] incluye el resumen.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: pedidosKey }),
        queryClient.invalidateQueries({ queryKey: ['productos'] }),
      ]),
  })
}
