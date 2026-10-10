import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Los archivos de personalidad se leen del disco en el servidor.
  // Esto garantiza que se incluyan al desplegar (Vercel, Docker standalone, etc.).
  outputFileTracingIncludes: {
    "/api/chat": ["./persona/**/*"],
  },
  poweredByHeader: false,
};

export default nextConfig;
