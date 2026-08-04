import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        throw redirect({ to: "/auth" });
      }
      return { user: data.user };
    } catch (e) {
      if (e instanceof Response || (typeof e === 'object' && e !== null && 'status' in e)) {
        throw e;
      }
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
