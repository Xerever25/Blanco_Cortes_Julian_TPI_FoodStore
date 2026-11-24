import { api } from '@/shared/api/axiosInstance'

import type { Categoria, CategoriaInput } from '../types/categoria.types'

export async function getCategorias(): Promise<Categoria[]> {
  return (await api.get<Categoria[]>('/categorias')).data
}

export async function createCategoria(data: CategoriaInput): Promise<Categoria> {
  return (await api.post<Categoria>('/categorias', data)).data
}

export async function updateCategoria(id: number, data: CategoriaInput): Promise<Categoria> {
  return (await api.put<Categoria>(`/categorias/${id}`, data)).data
}

export async function deleteCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`)
}
