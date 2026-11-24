import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="mt-4 text-2xl font-semibold">Sin permiso</h1>
      <p className="mt-2 text-slate-600">No tenés permisos para ver esta pantalla.</p>
      <Link to="/" className="mt-6 inline-block text-orange-600 underline">
        Volver al inicio
      </Link>
    </section>
  )
}
