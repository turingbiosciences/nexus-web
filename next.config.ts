import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  distDir: "_static",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
