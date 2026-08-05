import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStudioData } from '@/lib/studio/hooks';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertCircle, Globe, ExternalLink, MessageSquare, Send, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { shortDate } from '@/lib/format';

export const Route = createFileRoute('/aprovacao/$token')({
  component: ClientApprovalPage,
  head: () => ({
    meta: [{ title: 'Aprovação de Projeto — ScaleNexus' }],
  }),
});

function ClientApprovalPage() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const [adjustNote, setAdjustNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['public-project', token],
    queryFn: async () => {
      // Use the new secure RPC to get project data by token
      const { data, error: rpcError } = await supabase
        .rpc('get_project_public_data_by_token', { p_client_token: token });

      if (rpcError || !data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Link de aprovação inválido ou expirado.');
      }

      const projectData = data[0];
      if (!projectData) {
        throw new Error('Link de aprovação inválido ou expirado.');
      }
      
      // Map back to expected structure for the component
      return {
        ...projectData,
        clients: {
          company: projectData.client_company,
          contact_name: projectData.client_contact_name
        }
      } as any;
    },
    retry: false
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, message }: { status: string; message?: string }) => {
      // Update status directly using token for identification
      const { data, error } = await supabase
        .from('projects')
        .update({ status } as any)
        .eq('client_token', token)
        .select()
        .single();
      
      if (error) throw error;

      // Log event
      await supabase.from('project_approval_events').insert({
        project_id: data.id,
        event_type: status === 'aprovado' ? 'client_approval' : 'client_adjustment',
        previous_status: project?.status || null,
        new_status: status,
        actor_label: 'Cliente',
        message: message || (status === 'aprovado' ? 'Projeto aprovado pelo cliente.' : 'Cliente solicitou ajustes.')
      } as any);

      // Notification logic (internal system)
      await supabase.from('notifications').insert({
        user_id: data.creator_id || data.owner_id,
        title: status === 'aprovado' ? 'Site Aprovado! 🎉' : 'Ajustes Solicitados 🔴',
        body: status === 'aprovado' 
          ? `O cliente aprovou o projeto ${data.title}.` 
          : `Novos ajustes para ${data.title}: ${message?.substring(0, 50)}...`,
        category: 'project',
        project_id: data.id,
        link: `/projetos/${data.id}`
      } as any);

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['public-project', token], (old: any) => ({ ...old, status: data.status }));
      toast.success(data.status === 'aprovado' ? 'Site aprovado com sucesso!' : 'Solicitação enviada.');
      setShowConfirm(false);
      setShowAdjustForm(false);
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-48 bg-slate-800 rounded-lg"></div>
          <div className="h-6 w-64 bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="size-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Link Inválido</h1>
          <p className="text-slate-400">
            {error instanceof Error ? error.message : 'Este link de aprovação não existe mais ou expirou.'}
          </p>
          <Button variant="outline" className="text-white" asChild>
            <a href="/">Ir para ScaleNexus</a>
          </Button>
        </div>
      </div>
    );
  }

  const { data: studioData } = useStudioData(project?.id || '', token);

  const isAwaiting = project.status === 'aguardando_aprovacao';
  const isAdjusting = project.status === 'ajustes';
  const isApproved = project.status === 'aprovado' || project.status === 'entregue';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-primary/30">
      {/* HEADER */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center font-black text-white italic">V</div>
            <span className="font-bold text-xl tracking-tight text-white uppercase">ScaleNexus</span>
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Portal de Aprovação</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* CONTENT */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Seu site está pronto! 🎉
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Preparamos uma prévia do seu novo site. Confira o projeto e nos diga se está tudo certo para a entrega final.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-sm">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</span>
                  <p className="text-xl font-semibold text-white">{(project.clients as any)?.company}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Projeto</span>
                  <p className="text-xl font-semibold text-white">{project.site_type || 'Site Profissional'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enviado em</span>
                  <p className="text-xl font-semibold text-white">{shortDate(project.submitted_at)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Atual</span>
                  <div className="pt-1">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        <CheckCircle2 className="size-3" /> APROVADO
                      </span>
                    ) : isAdjusting ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                        <MessageSquare className="size-3" /> EM AJUSTE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        <Globe className="size-3" /> AGUARDANDO REVISÃO
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Globe className="size-6 text-primary" /> Visualização do Projeto
              </h2>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
                  {project.delivery_link ? (
                    <div className="p-8 text-center space-y-6">
                      <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                        <Globe className="size-8 text-primary" />
                      </div>
                      <p className="text-slate-300 font-medium">O link de pré-visualização está disponível abaixo:</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 rounded-2xl" asChild>
                          <a href={project.delivery_link} target="_blank">
                            🖥️ Visualizar meu site
                          </a>
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold gap-2 rounded-2xl border-slate-700 hover:bg-slate-800" asChild>
                          <a href={project.delivery_link} target="_blank">
                            <ExternalLink className="size-5" /> Abrir em nova aba
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500 italic">
                      Link de pré-visualização não disponível no momento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR ACTIONS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="sticky top-28 space-y-6">
              {isApproved ? (
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-4">
                  <div className="size-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="size-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white italic">Site Aprovado!</h3>
                  <p className="text-slate-400">
                    Obrigado! O projeto foi aprovado e nossa equipe dará continuidade à entrega final.
                  </p>
                </div>
              ) : isAdjusting ? (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-4">
                  <div className="size-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="size-8 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Em Ajuste</h3>
                  <p className="text-slate-400">
                    Nossa equipe já recebeu suas solicitações e está trabalhando nelas. Você receberá um aviso assim que a nova versão estiver pronta.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 space-y-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white">Sua Decisão</h3>
                    
                    {!showConfirm && !showAdjustForm && (
                      <div className="grid gap-4">
                        <Button 
                          onClick={() => setShowConfirm(true)}
                          className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg gap-2 rounded-2xl shadow-lg shadow-emerald-500/10"
                        >
                          🟢 APROVAR MEU SITE
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => setShowAdjustForm(true)}
                          className="w-full h-16 text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-lg gap-2 rounded-2xl"
                        >
                          🔴 SOLICITAR AJUSTES
                        </Button>
                      </div>
                    )}

                    {showConfirm && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                          <p className="font-bold text-emerald-400">Você confirma que o site está aprovado?</p>
                        </div>
                        <div className="grid gap-3">
                          <Button 
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl"
                            onClick={() => updateStatus.mutate({ status: 'aprovado' })}
                            disabled={updateStatus.isPending}
                          >
                            Sim, aprovar
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full h-14 border-slate-700 font-bold rounded-xl"
                            onClick={() => setShowConfirm(false)}
                            disabled={updateStatus.isPending}
                          >
                            Voltar
                          </Button>
                        </div>
                      </div>
                    )}

                    {showAdjustForm && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="size-4" /> O que gostaria de alterar?
                          </label>
                          <Textarea 
                            placeholder="Descreva aqui os ajustes que você gostaria que nossa equipe realizasse..."
                            className="min-h-[160px] bg-slate-800 border-slate-700 rounded-2xl focus-visible:ring-primary/50 text-base"
                            value={adjustNote}
                            onChange={(e) => setAdjustNote(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-3">
                          <Button 
                            className="w-full h-14 font-bold rounded-xl gap-2"
                            disabled={!adjustNote.trim() || updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ status: 'ajustes', message: adjustNote })}
                          >
                            <Send className="size-4" /> Enviar solicitação
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full h-14 text-slate-500 font-bold rounded-xl"
                            onClick={() => setShowAdjustForm(false)}
                            disabled={updateStatus.isPending}
                          >
                            Voltar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
                    <div className="flex gap-4">
                      <div className="size-10 shrink-0 bg-primary/20 rounded-xl flex items-center justify-center">
                        <AlertCircle className="size-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm italic">Ajuda?</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Se tiver qualquer dúvida antes de aprovar, você pode entrar em contato diretamente com seu consultor comercial.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-12 text-center text-slate-600 text-sm">
        <p>© {new Date().getFullYear()} ScaleNexus — Inteligência e Tecnologia para Negócios Locais</p>
      </footer>
    </div>
  );
}
