import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/ai/**/*": ["../data/**/*", "./data/**/*"],
    "/api/admin/**/*": ["../data/**/*", "./data/**/*"],
    "/api/cron/**/*": ["../data/**/*", "./data/**/*"],
  },
};

export default nextConfig;