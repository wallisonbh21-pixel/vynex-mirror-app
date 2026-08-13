import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/comece-seu-projeto/ref/$token')({
  component: () => {
    const { token } = Route.useParams()
    const navigate = useNavigate()

    useEffect(() => {
      if (token) {
        // Armazena o token de indicação para uso posterior no formulário
        localStorage.setItem('sn_referral_token', token)
      }
      // Redireciona para o formulário principal
      navigate({ to: '/comece-seu-projeto' })
    }, [token, navigate])

    return null
  },
})
