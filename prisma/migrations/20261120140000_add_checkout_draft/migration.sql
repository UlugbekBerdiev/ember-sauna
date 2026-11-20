CREATE UNIQUE INDEX IF NOT EXISTS "Booking_stripeReference_key" ON "Booking" ("stripeReference");

CREATE TABLE IF NOT EXISTS "CheckoutDraft" (
    "paymentIntentId" TEXT NOT NULL,
    payload JSONB NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "promoCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutDraft_pkey" PRIMARY KEY ("paymentIntentId")
);
