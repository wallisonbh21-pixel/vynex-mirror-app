import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white font-sans selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>
        
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            VYNEXA Studio V1.0 Disponível
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            A nova era da criação <br /> de sites profissionais
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            Implementamos a V1 FUNCIONAL do VYNEXA Studio. Construa experiências digitais de alta conversão sem sair da plataforma.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/auth" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
              Começar a Criar
            </a>
            <a href="#studio" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all">
              Conhecer o Studio
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="studio" className="py-24 bg-slate-900/50 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors text-primary text-xl">🎨</div>
              <h3 className="text-xl font-bold mb-4">Editor Visual</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Transforme o canvas em um editor visual funcional. Adicione blocos, edite propriedades e visualize em tempo real.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors text-primary text-xl">🧱</div>
              <h3 className="text-xl font-bold mb-4">Blocos Prontos</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Utilize blocos profissionais de Hero, Serviços, Depoimentos e FAQ para acelerar sua entrega.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors text-primary text-xl">📱</div>
              <h3 className="text-xl font-bold mb-4">100% Responsivo</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Controle total sobre a visualização em Desktop, Tablet e Mobile sem quebrar o layout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Info */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto p-1 rounded-3xl bg-gradient-to-r from-primary/20 to-blue-500/20 border border-white/10">
            <div className="bg-slate-950 p-8 md:p-12 rounded-[22px] flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-6">Segurança e Integridade</h2>
                <ul className="space-y-4">
                  {[
                    "Manter rigorosamente as RLS existentes.",
                    "Somente o Criador atribuído pode editar o Studio.",
                    "Não permitir alteração de comissão ou valores financeiros.",
                    "Utilizar a estrutura existente de project_studio_data."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-400">
                      <span className="text-primary font-bold">✓</span>
                      {item}
                    </li>
                  ))}

              </div>
              <div className="size-48 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-20"></div>
                <span className="text-5xl">🛡️</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="container mx-auto px-4">
          <p className="text-slate-500 text-sm">
            © 2026 VYNEXA. Ambiente profissional para criar experiências digitais.
          </p>
        </div>
      </footer>
    </div>
  )
}
