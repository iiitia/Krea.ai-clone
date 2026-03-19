import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// ✅ Only protect important/private routes
const isProtectedRoute = createRouteMatcher([
  '/builder(.*)',
  '/api/nodes/(.*)',     // AI / paid / sensitive APIs
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// ✅ Run middleware on all routes EXCEPT static files
export const config = {
  matcher: [
    /*
      Match all routes except:
      - static files (_next, images, etc.)
    */
    '/((?!_next|.*\\..*).*)',
  ],
};