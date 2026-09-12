-- Cobranças de clientes (arquitetura interna, sem gateway)
CREATE TABLE public.client_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  description text NOT NULL,
  charge_type text NOT NULL DEFAULT 'PROJETO'
    CHECK (charge_type IN ('PROJETO','MENSALIDADE','SERVICO_ADICIONAL','TRAFEGO_PAGO','OUTRO')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE','DISPONIVEL_PARA_PAGAMENTO','PROCESSANDO','PAGO','VENCIDO','CANCELADO','ESTORNADO')),
  due_date date,
  paid_at timestamptz,
  -- preparação para gateway futuro (não preenchidos nesta fase)
  payment_provider text,
  provider_charge_id text,
  payment_method text,
  checkout_url text,
  pix_code text,
  pix_qr_code text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_charges_client ON public.client_charges(client_id);
CREATE INDEX idx_client_charges_project ON public.client_charges(project_id);
CREATE INDEX idx_client_charges_status ON public.client_charges(status);
-- idempotência para webhooks/gateway futuros
CREATE UNIQUE INDEX uq_client_charges_provider_charge
  ON public.client_charges(payment_provider, provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;

CREATE TRIGGER trg_client_charges_updated_at
  BEFORE UPDATE ON public.client_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.client_charges TO authenticated;
GRANT ALL ON public.client_charges TO service_role;

ALTER TABLE public.client_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente visualiza as proprias cobrancas"
  ON public.client_charges FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_charges.client_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Admin visualiza todas as cobrancas"
  ON public.client_charges FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auditoria de eventos financeiros
CREATE TABLE public.client_charge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id uuid NOT NULL REFERENCES public.client_charges(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  amount numeric(12,2),
  actor_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_charge_events_charge ON public.client_charge_events(charge_id);

GRANT SELECT ON public.client_charge_events TO authenticated;
GRANT ALL ON public.client_charge_events TO service_role;

ALTER TABLE public.client_charge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin visualiza auditoria financeira"
  ON public.client_charge_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_client_charge_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_charge_events (charge_id, event_type, to_status, amount, actor_id)
    VALUES (NEW.id, 'CRIADA', NEW.status, NEW.amount, auth.uid());
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.amount IS DISTINCT FROM OLD.amount THEN
    INSERT INTO public.client_charge_events (charge_id, event_type, from_status, to_status, amount, actor_id)
    VALUES (NEW.id, 'ATUALIZADA', OLD.status, NEW.status, NEW.amount, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_client_charges_audit
  AFTER INSERT OR UPDATE ON public.client_charges
  FOR EACH ROW EXECUTE FUNCTION public.log_client_charge_event();