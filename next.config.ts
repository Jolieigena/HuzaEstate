import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      // MinIO (see MINIO_PUBLIC_ENDPOINT/PORT in the backend's .env) — next/image refuses
      // to load any hostname not explicitly listed here, so this must track that same
      // value. Keep the localhost entry for local dev; add/replace with a real domain +
      // https entry once MinIO sits behind one.
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: '139.84.231.149',
        port: '9000',
      },
    ],
  },
};

export default nextConfig;
