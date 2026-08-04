import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // skip beforeLoad during SSR since ssr: false is set
    return {};
  },
  component: () => <Outlet />,
});
