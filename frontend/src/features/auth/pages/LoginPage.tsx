import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { handleApiError } from '@/shared/api/handleApiError'
import { fieldError } from '@/shared/components/FieldError'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Input from '@/shared/ui/Input'
import { useAuthStore } from '@/store/authStore'

interface EstadoNavegacion {
  from?: string
  registrado?: boolean
}

export default function LoginPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const estado = useLocation().state as EstadoNavegacion | null
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await login(value.username.trim(), value.password)
        const { usuario: actual } = useAuthStore.getState()
        navigate(estado?.from ?? (actual?.role === 'admin' ? '/admin/resumen' : '/'), { replace: true })
      } catch (e) {
        setError(handleApiError(e, 'No se pudo iniciar sesión'))
      }
    },
  })

  if (usuario) return <Navigate to="/" replace />

  return (
    <section className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-4 text-2xl font-semibold">Iniciar sesión</h1>
        {estado?.registrado && (
          <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Cuenta creada. Ya podés iniciar sesión.
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (!value.trim() ? 'El usuario es obligatorio' : undefined) }}
          >
            {(field) => (
              <Input
                id="username"
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={fieldError(field)}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (!value ? 'La contraseña es obligatoria' : undefined) }}
          >
            {(field) => (
              <Input
                id="password"
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={fieldError(field)}
              />
            )}
          </form.Field>
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Ingresando…' : 'Ingresar'}
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-orange-600 underline">
            Registrate
          </Link>
        </p>
      </Card>
    </section>
  )
}
