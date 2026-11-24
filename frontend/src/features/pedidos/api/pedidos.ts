import { api } from '@/shared/api/axiosInstance'

import type { EstadoPedido, Pedido, PedidoCreate, PedidoFiltros, PedidosPaginados, ResumenPedidos } from '../types/pedido.types'

export async function getPedidos(filtros: PedidoFiltros): Promise<PedidosPaginados> {
  return (await api.get<PedidosPaginados>('/pedidos', { params: filtros })).data
}

export async function createPedido(data: PedidoCreate): Promise<Pedido> {
  return (await api.post<Pedido>('/pedidos', data)).data
}

export async function patchEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
  return (await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado })).data
}

export async function patchCancelar(id: number): Promise<Pedido> {
  return (await api.patch<Pedido>(`/pedidos/${id}/cancelar`)).data
}

export async function getResumen(): Promise<ResumenPedidos> {
  return (await api.get<ResumenPedidos>('/pedidos/resumen')).data
}
