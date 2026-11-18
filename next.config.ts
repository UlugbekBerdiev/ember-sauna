import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  outputFileTracingIncludes: {
    "/admin/**": ["./prisma/migrations/**/*"],
    "/admin/login": ["./prisma/migrations/**/*"],
    "/admin/setup": ["./prisma/migrations/**/*"],
  },
};

export default nextConfig;
