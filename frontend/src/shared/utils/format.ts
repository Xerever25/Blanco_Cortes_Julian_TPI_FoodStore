const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })
const fecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

export const formatMoneda = (valor: number): string => moneda.format(valor)

/** La API devuelve fechas ISO con zona horaria (UTC): se muestran en la hora local del navegador. */
export const formatFecha = (iso: string): string => fecha.format(new Date(iso))
