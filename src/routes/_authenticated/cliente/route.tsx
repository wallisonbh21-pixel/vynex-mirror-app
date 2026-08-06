import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentRoles } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/cliente")({
  beforeLoad: async () => {
    const roles = await getCurrentRoles();
    if (!roles.includes("cliente") && !roles.includes("admin")) {
      throw redirect({ to: "/painel", replace: true });
    }
  },
  component: () => <Outlet />,
});
