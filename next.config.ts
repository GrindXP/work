import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment - no static export needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
