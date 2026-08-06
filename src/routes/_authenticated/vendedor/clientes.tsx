import { createFileRoute } from '@tanstack/react-router';
import { requireVendedor } from '@/lib/guard';

export const Route = createFileRoute('/_authenticated/vendedor/clientes')({
  beforeLoad: () => requireVendedor(),
});
