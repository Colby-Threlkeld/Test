export { default } from "next-auth/middleware";

export const config = {
  // Protect all routes under (main). Auth routes are public.
  matcher: [
    "/home/:path*",
    "/messages/:path*",
    "/communities/:path*",
    "/planning/:path*",
    "/settings/:path*",
  ],
};
