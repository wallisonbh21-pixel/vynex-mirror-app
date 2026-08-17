import { QueryCliente } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryCliente = new QueryCliente();

  const router = createRouter({
    routeTree,
    context: { queryCliente },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
