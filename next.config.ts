import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  outputFileTracingIncludes: {
    "/admin/**": ["./prisma/migrations/**/*"],
    "/admin/login": ["./prisma/migrations/**/*"],
    "/admin/setup": ["./prisma/migrations/**/*"],
    "/admin/promo": ["./prisma/migrations/**/*"],
    "/admin/promo/create": ["./prisma/migrations/**/*"],
    "/admin/promo/retire": ["./prisma/migrations/**/*"],
    "/api/checkout/promo": ["./prisma/migrations/**/*"],
    "/api/checkout/redeem": ["./prisma/migrations/**/*"],
  },
};

export default nextConfig;
