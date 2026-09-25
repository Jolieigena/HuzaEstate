import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles a minimal server (.next/standalone/server.js) plus only the
  // node_modules the built app actually needs — what the Docker image below copies and runs,
  // instead of shipping the full node_modules tree into the runtime image.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      // Property photos/videos uploaded through property-service are served straight from
      // MinIO (see MINIO_PUBLIC_ENDPOINT/PORT/USE_SSL in the backend's .env) — next/image
      // refuses to load any hostname/protocol/port not explicitly listed here, so this must
      // track that same value. Keep the localhost entry for local dev.
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      // Production: MinIO is reverse-proxied at /huza-properties/ under the app's own HTTPS
      // domain (see nginx's location /huza-properties/ block) rather than a raw IP:9000 — both
      // the www and bare-domain hostnames are valid since nginx proxies MinIO on each.
      {
        protocol: 'https',
        hostname: 'www.huzaestate.com',
      },
      {
        protocol: 'https',
        hostname: 'huzaestate.com',
      },
      // Legacy — kept so photos uploaded before the domain-based MinIO URL fix still render.
      {
        protocol: 'http',
        hostname: '139.84.231.149',
        port: '9000',
      },
    ],
  },
};

export default nextConfig;
