import Card from '@/shared/ui/Card'

interface Props {
  titulo: string
  valor: string | number
  color?: string
}

export default function ResumenCard({ titulo, valor, color = 'text-slate-900' }: Props) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{valor}</p>
    </Card>
  )
}
