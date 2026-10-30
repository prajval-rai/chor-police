import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";

// Rewrites are baked in at build time, so a Vercel build without API_ORIGIN
// would silently point every API call at localhost.
if (process.env.VERCEL && !process.env.API_ORIGIN) {
  throw new Error("Set the API_ORIGIN environment variable to your Django API URL (e.g. https://chor-police-api.onrender.com).");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Proxy the Django REST API so the browser talks to one origin (no CORS).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
