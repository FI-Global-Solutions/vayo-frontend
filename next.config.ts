import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — enable only for Docker/self-hosted deploys, not Vercel
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8084",
  },
};

export default nextConfig;
