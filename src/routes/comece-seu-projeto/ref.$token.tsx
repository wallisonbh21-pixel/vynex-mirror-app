import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/comece-seu-projeto/ref/$token')({
  component: () => {
    const { token } = Route.useParams()
    const navigate = useNavigate()

    useEffect(() => {
      if (token) {
        // Marca que esta é uma jornada iniciada por indicação
        localStorage.setItem('sn_referral_token', token)
        localStorage.setItem('sn_referral_active_session', 'true')
      }
      // Redireciona para o formulário principal
      navigate({ to: '/comece-seu-projeto' })
    }, [token, navigate])

    return null
  },
})
