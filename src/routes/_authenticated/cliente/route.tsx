import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentRoles } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/cliente")({
  beforeLoad: async () => {
    const roles = await getCurrentRoles();
    if (!roles.includes("cliente")) {
      // Allow admin to view but primary role should be cliente for this area
      if (!roles.includes("admin")) {
        throw redirect({ to: "/auth", replace: true });
      }
    }
  },
  component: () => <Outlet />,
});
