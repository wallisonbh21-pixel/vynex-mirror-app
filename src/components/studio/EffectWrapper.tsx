import React, { useEffect, useRef, useState } from 'react';
import { effectLayers, hasActiveEffects } from '@/lib/studio/effects';
import { cn } from '@/lib/utils';

export const FX_REPLAY_EVENT = 'studio-fx-replay';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Aplica efeitos visuais sem alterar o elemento quando nenhum efeito está ativo. */
export function EffectWrapper({
  effects,
  inline,
  className,
  children,
}: {
  effects: unknown;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (!hasActiveEffects(effects)) return <>{children}</>;
  return <ActiveEffects effects={effects} inline={inline} className={className}>{children}</ActiveEffects>;
}

function ActiveEffects({ effects, inline, className, children }: { effects: unknown; inline?: boolean; className?: string; children: React.ReactNode }) {
  const layers = effectLayers(effects);
  const outerRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const display = inline ? 'inline-block' : 'block';
  const hasEntrance = layers.entrance.length > 0;

  useEffect(() => {
    if (!hasEntrance) return;
    const el = outerRef.current;
    if (!el) return;
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    const replay = () => {
      setVisible(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    };
    window.addEventListener(FX_REPLAY_EVENT, replay);
    return () => { io.disconnect(); window.removeEventListener(FX_REPLAY_EVENT, replay); };
  }, [hasEntrance]);

  useEffect(() => {
    const factor = layers.parallax;
    const el = midRef.current;
    if (!factor || !el) return;
    const unsuitable = reducedMotion() || window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768;
    if (unsuitable) { el.style.transform = ''; return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -factor;
      el.style.transform = `translate3d(0, ${Math.max(-80, Math.min(80, offset)).toFixed(1)}px, 0)`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [layers.parallax]);

  let node = (
    <div
      className={cn(layers.visual, className)}
      style={{ display, ...(layers.visualStyle as React.CSSProperties) }}
      tabIndex={layers.fx.hoverZoom || layers.fx.hoverGlow ? -1 : undefined}
    >
      {children}
    </div>
  );
  if (layers.parallax) node = <div ref={midRef} className="fx-parallax" style={{ display }}>{node}</div>;
  if (hasEntrance) {
    node = (
      <div
        ref={outerRef}
        className={cn(layers.entrance, visible && 'fx-in')}
        style={{ display, ...(layers.entranceStyle as React.CSSProperties) }}
      >
        {node}
      </div>
    );
  }
  return node;
}
