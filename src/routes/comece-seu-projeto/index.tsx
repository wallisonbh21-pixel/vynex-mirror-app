import { createFileRoute } from '@tanstack/react-router'
import { FunnelLayout } from '@/components/funnel/FunnelLayout'
import { FunnelForm } from '@/components/funnel/FunnelForm'

export const Route = createFileRoute('/comece-seu-projeto/')({
  component: () => (
    <FunnelLayout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Vamos entender o que você quer criar
          </h1>
          <p className="text-lg text-slate-400">
            Conte para a ScaleNexus qual solução sua empresa precisa. Escolha o serviço que mais combina com o seu objetivo e, nas próximas etapas, vamos montar seu projeto junto com você.
          </p>
        </div>
        <FunnelForm />
      </div>
    </FunnelLayout>
  ),
})
