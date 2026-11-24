import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ItemCarrito {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  /** Stock conocido al agregar: limita la cantidad que se puede pedir desde el carrito. */
  stock: number
  imagen_url: string | null
}

export type NuevoItem = Omit<ItemCarrito, 'cantidad'>

interface CartState {
  items: ItemCarrito[]
  agregar: (item: NuevoItem, cantidad?: number) => void
  quitar: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  vaciar: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (item, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === item.producto_id)
          if (existente) {
            const nueva = Math.min(existente.cantidad + cantidad, item.stock)
            return {
              items: state.items.map((i) =>
                i.producto_id === item.producto_id ? { ...i, ...item, cantidad: nueva } : i,
              ),
            }
          }
          const inicial = Math.min(cantidad, item.stock)
          return inicial > 0 ? { items: [...state.items, { ...item, cantidad: inicial }] } : state
        }),

      quitar: (productoId) => set((state) => ({ items: state.items.filter((i) => i.producto_id !== productoId) })),

      cambiarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items:
            cantidad < 1
              ? state.items.filter((i) => i.producto_id !== productoId)
              : state.items.map((i) =>
                  i.producto_id === productoId ? { ...i, cantidad: Math.min(cantidad, i.stock) } : i,
                ),
        })),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((suma, i) => suma + i.precio_unitario * i.cantidad, 0),
    }),
    { name: 'cart-storage', partialize: (state) => ({ items: state.items }) },
  ),
)
