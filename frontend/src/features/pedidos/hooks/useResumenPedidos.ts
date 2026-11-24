import { useQuery } from '@tanstack/react-query'

import { getResumen } from '../api/pedidos'
import { pedidosKey } from './usePedidos'

export function useResumenPedidos() {
  return useQuery({ queryKey: [...pedidosKey, 'resumen'], queryFn: getResumen })
}
