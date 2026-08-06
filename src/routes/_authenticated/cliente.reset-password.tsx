import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/cliente/reset-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/cliente/reset-password"!</div>
}
