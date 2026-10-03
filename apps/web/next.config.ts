import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The registry is consumed as raw TypeScript source rather than a built
  // package — it is the source of truth that also gets served to the shadcn
  // CLI, so compiling it twice would let the two drift.
  transpilePackages: ["@craftly/registry"],
};

export default nextConfig;
