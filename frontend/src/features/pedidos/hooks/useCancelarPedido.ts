import { useMutation, useQueryClient } from '@tanstack/react-query'

import { patchCancelar } from '../api/pedidos'
import { pedidosKey } from './usePedidos'

export function useCancelarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => patchCancelar(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: pedidosKey }),
        queryClient.invalidateQueries({ queryKey: ['productos'] }),
      ]),
  })
}
