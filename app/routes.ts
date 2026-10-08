import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/IndexRoute.tsx"),
  route("admin", "routes/AdminRoute.tsx"),
  route(
    "authentication",
    "routes/AuthenticationRoute.tsx",
  ),
] satisfies RouteConfig;
