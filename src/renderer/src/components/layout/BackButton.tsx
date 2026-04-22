import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'

interface BackButtonProps {
  to?: string
  label?: string
}

export default function BackButton({ to, label = '← Back' }: BackButtonProps): JSX.Element {
  const navigate = useNavigate()
  return (
    <Button
      variant="ghost"
      className="!py-1.5 !px-3"
      onClick={() => (to ? navigate(to) : navigate(-1))}
    >
      {label}
    </Button>
  )
}
