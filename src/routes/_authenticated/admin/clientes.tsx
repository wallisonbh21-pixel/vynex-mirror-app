import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/guard';

export const Route = createFileRoute('/_authenticated/admin/clientes')({
  beforeLoad: () => requireAdmin(),
});
