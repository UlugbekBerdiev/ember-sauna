ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "promoCode" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "promoDiscountCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "bookingId" TEXT,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PromoCode_percentOff_check" CHECK ("percentOff" BETWEEN 1 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_bookingId_key" ON "PromoCode"("bookingId");
