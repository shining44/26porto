import type { NextConfig } from "next";

const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGitHubPages ? "/26porto" : "",
  assetPrefix: isGitHubPages ? "/26porto" : "",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
