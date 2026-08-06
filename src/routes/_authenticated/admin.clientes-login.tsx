import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/clientes-login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/admin/clientes-login"!</div>
}
