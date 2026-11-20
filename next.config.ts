import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "stripe"],
  outputFileTracingIncludes: {
    "/admin/**": ["./prisma/migrations/**/*"],
    "/admin/login": ["./prisma/migrations/**/*"],
    "/admin/setup": ["./prisma/migrations/**/*"],
    "/admin/promo": ["./prisma/migrations/**/*"],
    "/admin/promo/create": ["./prisma/migrations/**/*"],
    "/admin/promo/retire": ["./prisma/migrations/**/*"],
    "/api/availability": ["./prisma/migrations/**/*"],
    "/api/checkout/promo": ["./prisma/migrations/**/*"],
    "/api/checkout/redeem": ["./prisma/migrations/**/*"],
    "/api/checkout/payment-intent": ["./prisma/migrations/**/*"],
    "/api/checkout/complete": ["./prisma/migrations/**/*"],
    "/api/stripe/webhook": ["./prisma/migrations/**/*"],
  },
};

export default nextConfig;
