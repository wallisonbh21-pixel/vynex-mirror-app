import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentRoles } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/cliente")({
  beforeLoad: async ({ location }) => {
    const roles = await getCurrentRoles();
    const isCliente = roles.includes("cliente");
    const isAdmin = roles.includes("admin");

    if (!isCliente && !isAdmin) {
      throw redirect({ 
        to: "/cliente/login", 
        search: { redirect: location.href },
        replace: true 
      });
    }
  },
  component: () => <Outlet />,
});
