import type { ReactNode } from 'react'

interface Props {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export default function EstadoVacio({ titulo, descripcion, accion }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-lg font-medium text-slate-700">{titulo}</p>
      {descripcion ? <p className="mt-1 text-sm text-slate-500">{descripcion}</p> : null}
      {accion ? <div className="mt-4">{accion}</div> : null}
    </div>
  )
}
