import type { Instrumentation } from "next";
import { reportServerError, type ErrorSource } from "@/lib/observability/report";

// RT-64: Next.js calls this for every uncaught server error (render, route handler, server action, proxy). Only the
// route pattern and a sanitized message are logged: never headers, cookies, query strings or bodies.
const SOURCE_BY_TYPE: Record<string, ErrorSource> = { render: "render", route: "route_handler", action: "server_action", proxy: "route_handler" };

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  reportServerError({ source: SOURCE_BY_TYPE[context.routeType] ?? "render", where: `${context.routeType}:${context.routePath}`, error, path: request.path });
};
