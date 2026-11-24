import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from '../api/categorias'
import type { CategoriaInput } from '../types/categoria.types'

export const categoriasKey = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: categoriasKey, queryFn: getCategorias })
}

export function useCrearCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoriaInput) => createCategoria(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriasKey }),
  })
}

export function useActualizarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaInput }) => updateCategoria(id, data),
    // Los productos incluyen su categoría: también se refrescan.
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: categoriasKey }),
      queryClient.invalidateQueries({ queryKey: ['productos'] }),
    ]),
  })
}

export function useEliminarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriasKey }),
  })
}
