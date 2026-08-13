import React from 'react'

export function FunnelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-blue-500/30">
      <header className="border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              S
            </div>
            <span className="font-bold text-xl tracking-tight">ScaleNexus</span>
          </div>
          <div className="hidden sm:block text-sm text-slate-400">
            Expertise em Soluções Digitais
          </div>
        </div>
      </header>
      <main className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
        </div>
        
        {children}
      </main>
      <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ScaleNexus. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
