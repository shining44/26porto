import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/26porto",
  assetPrefix: "/26porto",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
