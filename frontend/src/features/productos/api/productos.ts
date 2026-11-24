import { api } from '@/shared/api/axiosInstance'

import type { Producto, ProductoFiltros, ProductoInput, ProductosPaginados, StockInput } from '../types/producto.types'

export async function getProductos(filtros: ProductoFiltros): Promise<ProductosPaginados> {
  return (await api.get<ProductosPaginados>('/productos', { params: filtros })).data
}

export async function createProducto(data: ProductoInput): Promise<Producto> {
  return (await api.post<Producto>('/productos', data)).data
}

export async function updateProducto(id: number, data: ProductoInput): Promise<Producto> {
  return (await api.put<Producto>(`/productos/${id}`, data)).data
}

export async function updateStock(id: number, data: StockInput): Promise<Producto> {
  return (await api.patch<Producto>(`/productos/${id}/stock`, data)).data
}

export async function deleteProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`)
}
