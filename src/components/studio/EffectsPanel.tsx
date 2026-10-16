import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EFFECTS, type EffectConfig, type EffectKey } from '@/lib/studio/effects';
import { FX_REPLAY_EVENT } from './EffectWrapper';

/** Painel "Efeitos visuais": cada efeito é ligado individualmente; só mostra controles do efeito aberto. */
export function EffectsPanel({ effects, onChange }: { effects: Record<string, any> | undefined; onChange: (next: Record<string, any>) => void }) {
  const [open, setOpen] = useState<EffectKey | null>(null);
  const current = effects ?? {};

  const set = (key: EffectKey, cfg: EffectConfig | undefined) => {
    const next = { ...current };
    if (cfg) next[key] = cfg; else delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">Ative só o que quiser. Visitantes que preferem menos movimento verão a versão estática.</p>
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={() => window.dispatchEvent(new Event(FX_REPLAY_EVENT))}>
        <Play className="size-3.5" /> Reproduzir prévia das entradas
      </Button>
      {EFFECTS.map((meta) => {
        const cfg: EffectConfig | undefined = current[meta.key];
        const enabled = cfg?.enabled === true;
        const value = cfg ?? meta.defaults;
        return (
          <div key={meta.key} className="rounded-lg border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 p-3">
              <button type="button" className="flex-1 text-left" onClick={() => setOpen(open === meta.key ? null : meta.key)}>
                <p className="text-xs font-medium text-slate-200">{meta.label}</p>
                <p className="text-[10px] text-slate-500">{meta.description}</p>
              </button>
              <Switch
                checked={enabled}
                aria-label={`Ativar ${meta.label}`}
                onCheckedChange={(on) => {
                  set(meta.key, on ? { ...value, enabled: true } : undefined);
                  if (on) setOpen(meta.key);
                }}
              />
            </div>
            {enabled && open === meta.key && (
              <div className="space-y-3 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-400">{meta.intensityLabel}: {value.intensity}</Label>
                  <Slider min={1} max={10} step={1} value={[value.intensity]} onValueChange={([v]) => set(meta.key, { ...value, intensity: v ?? value.intensity })} />
                </div>
                {meta.duration && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-slate-400">Duração: {value.duration.toFixed(1)}s</Label>
                    <Slider min={meta.duration[0]} max={meta.duration[1]} step={0.1} value={[value.duration]} onValueChange={([v]) => set(meta.key, { ...value, duration: v ?? value.duration })} />
                  </div>
                )}
                {meta.direction && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['left', 'right'] as const).map((d) => (
                      <Button key={d} size="sm" variant={value.direction === d ? 'secondary' : 'outline'} onClick={() => set(meta.key, { ...value, direction: d })}>
                        {d === 'left' ? 'Da esquerda' : 'Da direita'}
                      </Button>
                    ))}
                  </div>
                )}
                <Button size="sm" variant="ghost" className="w-full" onClick={() => set(meta.key, { ...meta.defaults })}>
                  <RotateCcw className="size-3.5" /> Restaurar padrão
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
