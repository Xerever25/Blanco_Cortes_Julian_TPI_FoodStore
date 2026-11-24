import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { handleApiError } from '@/shared/api/handleApiError'
import { fieldError } from '@/shared/components/FieldError'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Input from '@/shared/ui/Input'

import { registerRequest } from '../api/auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirmar: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await registerRequest({
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        })
        navigate('/login', { replace: true, state: { registrado: true } })
      } catch (e) {
        setError(handleApiError(e, 'No se pudo crear la cuenta'))
      }
    },
  })

  return (
    <section className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-4 text-2xl font-semibold">Crear cuenta</h1>
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
            validators={{
              onChange: ({ value }) => {
                const v = value.trim()
                if (v.length < 3) return 'El usuario debe tener al menos 3 caracteres'
                if (v.length > 50) return 'El usuario no puede superar los 50 caracteres'
                return undefined
              },
            }}
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
            name="full_name"
            validators={{ onChange: ({ value }) => (!value.trim() ? 'El nombre completo es obligatorio' : undefined) }}
          >
            {(field) => (
              <Input
                id="full_name"
                label="Nombre completo"
                autoComplete="name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={fieldError(field)}
              />
            )}
          </form.Field>
          <form.Field
            name="email"
            validators={{ onChange: ({ value }) => (EMAIL_REGEX.test(value.trim()) ? undefined : 'Ingresá un email válido') }}
          >
            {(field) => (
              <Input
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={fieldError(field)}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value.length < 8 ? 'La contraseña debe tener al menos 8 caracteres' : undefined) }}
          >
            {(field) => (
              <Input
                id="password"
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={fieldError(field)}
              />
            )}
          </form.Field>
          <form.Field
            name="confirmar"
            validators={{
              onChangeListenTo: ['password'],
              onChange: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue('password') ? 'Las contraseñas no coinciden' : undefined,
            }}
          >
            {(field) => (
              <Input
                id="confirmar"
                label="Repetir contraseña"
                type="password"
                autoComplete="new-password"
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
                {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-orange-600 underline">
            Iniciá sesión
          </Link>
        </p>
      </Card>
    </section>
  )
}
