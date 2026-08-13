import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { submitLeadForm } from '@/lib/funnel.functions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

type Step = 'service' | 'contact' | 'details' | 'success'

export function FunnelForm() {
  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    whatsapp: '',
    city: '',
    state: '',
    segment: '',
    serviceId: '',
    details: {
      objective: '',
      needs: '',
      observations: '',
      references: '',
      socialMedia: '',
      currentWebsite: '',
    }
  })

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services_catalog_public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_catalog')
        .select('id, name, description, category')
        .eq('is_active', true)
      if (error) throw error
      return data
    }
  })

  const handleNext = () => {
    if (step === 'service' && !formData.serviceId) {
      toast.error('Por favor, selecione um serviço.')
      return
    }
    if (step === 'contact' && (!formData.name || !formData.email || !formData.whatsapp)) {
      toast.error('Por favor, preencha os campos obrigatórios.')
      return
    }
    
    if (step === 'service') setStep('contact')
    else if (step === 'contact') setStep('details')
  }

  const handleBack = () => {
    if (step === 'contact') setStep('service')
    else if (step === 'details') setStep('contact')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const referralToken = localStorage.getItem('sn_referral_token') || undefined
      
      const result = await submitLeadForm({
        ...formData,
        referralToken
      })

      if (result.success) {
        setStep('success')
        localStorage.removeItem('sn_referral_token')
      }
    } catch (error: any) {
      toast.error('Erro ao enviar formulário: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <Card className="p-8 border-white/5 bg-white/5 backdrop-blur-sm text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">Solicitação Recebida!</h2>
        <p className="text-slate-400 mb-8">
          Obrigado pelo seu interesse. Nossa equipe comercial analisará suas informações e entrará em contato via WhatsApp ou E-mail em breve.
        </p>
        <Button onClick={() => window.location.href = '/'} className="w-full bg-blue-600 hover:bg-blue-700">
          Voltar para Home
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-white/5 bg-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: step === 'service' ? '33%' : step === 'contact' ? '66%' : '100%' }}
        />
      </div>

      <div className="space-y-6 pt-4">
        {step === 'service' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-semibold mb-2">O que você precisa hoje?</h3>
            <div className="grid grid-cols-1 gap-3">
              {servicesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                services?.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setFormData(prev => ({ ...prev, serviceId: service.id }))}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      formData.serviceId === service.id
                        ? 'border-blue-600 bg-blue-600/10 ring-1 ring-blue-600'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium text-white">{service.name}</div>
                    <div className="text-sm text-slate-400 mt-1">{service.description}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 'contact' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-semibold mb-2">Conte-nos quem é você</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input 
                  id="company" 
                  value={formData.company} 
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail corporativo *</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input 
                  id="whatsapp" 
                  value={formData.whatsapp} 
                  onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input 
                  id="city" 
                  value={formData.city} 
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Sua cidade"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input 
                  id="state" 
                  value={formData.state} 
                  onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Seu estado"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="segment">Segmento de Atuação</Label>
                <Input 
                  id="segment" 
                  value={formData.segment} 
                  onChange={e => setFormData(prev => ({ ...prev, segment: e.target.value }))}
                  placeholder="Ex: Varejo, Tecnologia, Imobiliário..."
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-semibold mb-2">Fale sobre o projeto</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objective">Qual o objetivo principal?</Label>
                <Textarea 
                  id="objective" 
                  value={formData.details.objective} 
                  onChange={e => setFormData(prev => ({ ...prev, details: { ...prev.details, objective: e.target.value } }))}
                  placeholder="O que você espera alcançar com este projeto?"
                  className="bg-white/5 border-white/10 min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="needs">Principais necessidades ou problemas</Label>
                <Textarea 
                  id="needs" 
                  value={formData.details.needs} 
                  onChange={e => setFormData(prev => ({ ...prev, details: { ...prev.details, needs: e.target.value } }))}
                  placeholder="Descreva o que não está funcionando hoje ou o que precisa ser construído."
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="references">Referências visuais ou sites que gosta</Label>
                <Input 
                  id="references" 
                  value={formData.details.references} 
                  onChange={e => setFormData(prev => ({ ...prev, details: { ...prev.details, references: e.target.value } }))}
                  placeholder="Links de sites que você admira"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social">Redes Sociais (Instagram/LinkedIn)</Label>
                  <Input 
                    id="social" 
                    value={formData.details.socialMedia} 
                    onChange={e => setFormData(prev => ({ ...prev, details: { ...prev.details, socialMedia: e.target.value } }))}
                    placeholder="@suaempresa"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current">Site Atual (se houver)</Label>
                  <Input 
                    id="current" 
                    value={formData.details.currentWebsite} 
                    onChange={e => setFormData(prev => ({ ...prev, details: { ...prev.details, currentWebsite: e.target.value } }))}
                    placeholder="www.suaempresa.com.br"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          {step !== 'service' && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              disabled={loading}
              className="flex-1 border-white/10 hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
          
          {step !== 'details' ? (
            <Button 
              type="button" 
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
                </>
              ) : (
                'Finalizar e Enviar'
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
