import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/aprovacao/$token')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/aprovacao/$token"!</div>
}
