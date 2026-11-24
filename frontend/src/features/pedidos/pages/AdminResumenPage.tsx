import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import Skeleton from '@/shared/components/Skeleton'
import AdminNav from '@/shared/layout/AdminNav'
import { formatMoneda } from '@/shared/utils/format'

import ResumenCard from '../components/ResumenCard'
import { useResumenPedidos } from '../hooks/useResumenPedidos'

export default function AdminResumenPage() {
  const { data, isLoading, isError, error, refetch } = useResumenPedidos()

  return (
    <section>
      <AdminNav />
      <h1 className="mb-4 text-2xl font-semibold">Resumen del negocio</h1>
      {isLoading ? (
        <div role="status" aria-label="Cargando" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError || !data ? (
        <EstadoError mensaje={handleApiError(error, 'No se pudo cargar el resumen')} onReintentar={() => void refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResumenCard titulo="Pendientes" valor={data.pendientes} color="text-amber-600" />
          <ResumenCard titulo="En preparación" valor={data.en_preparacion} color="text-blue-600" />
          <ResumenCard titulo="Entregados" valor={data.entregados} color="text-emerald-600" />
          <ResumenCard titulo="Cancelados" valor={data.cancelados} color="text-red-600" />
          <ResumenCard titulo="Pedidos de hoy" valor={data.pedidos_hoy} />
          <ResumenCard titulo="Ingresos (entregados)" valor={formatMoneda(data.ingresos_entregados)} color="text-emerald-700" />
        </div>
      )}
    </section>
  )
}
