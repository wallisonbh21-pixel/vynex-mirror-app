import { createFileRoute } from '@tanstack/react-router'
import { FunnelLayout } from '@/components/funnel/FunnelLayout'
import { FunnelForm } from '@/components/funnel/FunnelForm'

export const Route = createFileRoute('/comece-seu-projeto/')({
  component: () => (
    <FunnelLayout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Comece seu Projeto
          </h1>
          <p className="text-lg text-slate-400">
            Transforme sua visão em realidade digital com a ScaleNexus.
          </p>
        </div>
        <FunnelForm />
      </div>
    </FunnelLayout>
  ),
})
