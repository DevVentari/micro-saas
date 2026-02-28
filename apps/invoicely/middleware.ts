import { createProtectedMiddleware } from "@repo/auth";

export const middleware = createProtectedMiddleware(["/dashboard"]);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
