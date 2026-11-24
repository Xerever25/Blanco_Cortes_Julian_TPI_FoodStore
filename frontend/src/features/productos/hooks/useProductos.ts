import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createProducto, deleteProducto, getProductos, updateProducto, updateStock } from '../api/productos'
import type { ProductoFiltros, ProductoInput, StockInput } from '../types/producto.types'

export const productosKey = ['productos'] as const

/** Listado paginado en el servidor; la queryKey incluye los filtros. */
export function useProductos(filtros: ProductoFiltros) {
  return useQuery({
    queryKey: [...productosKey, filtros],
    queryFn: () => getProductos(filtros),
    placeholderData: keepPreviousData, // mantiene la página anterior visible mientras llega la nueva
  })
}

export function useCrearProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductoInput) => createProducto(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productosKey }),
  })
}

export function useActualizarProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoInput }) => updateProducto(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productosKey }),
  })
}

export function useCambiarStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockInput }) => updateStock(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productosKey }),
  })
}

export function useEliminarProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProducto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productosKey }),
  })
}
