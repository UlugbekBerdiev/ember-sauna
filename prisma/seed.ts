import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, BookingStatus, PaymentStatus } from "../src/generated/prisma/client";
import { calculateBookingSchedule } from "../src/lib/booking-time";
import { calculateRentalPrice, fromDateKey } from "../src/lib/pricing";
import { hashAdminPassword } from "../src/lib/admin-auth";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type SampleBooking = {
  reference: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  city: string;
  postalCode: string;
  deliveryNotes?: string;
  dateKeys: string[];
  checkInTime: string;
  status: BookingStatus;
  stripeReference: string;
};

const samples: SampleBooking[] = [
  {
    reference: "ES-2041",
    customerName: "Jordan Hale",
    phone: "(301) 555-0142",
    email: "jordan.hale@example.test",
    deliveryAddress: "21401 Stringtown Rd",
    city: "Clarksburg",
    postalCode: "20871",
    deliveryNotes: "Fake sample: gate code 4821 — gravel pad near barn.",
    dateKeys: ["2026-11-18", "2026-11-19"],
    checkInTime: "17:00",
    status: BookingStatus.ACTIVE_ON_SITE,
    stripeReference: "pi_fake_ember_2041",
  },
  {
    reference: "ES-2048",
    customerName: "Priya Nair",
    phone: "(240) 555-0198",
    email: "priya.nair@example.test",
    deliveryAddress: "18901 Crystal Rock Dr",
    city: "Germantown",
    postalCode: "20874",
    dateKeys: ["2026-11-22", "2026-11-23"],
    checkInTime: "10:00",
    status: BookingStatus.AWAITING_DELIVERY,
    stripeReference: "pi_fake_ember_2048",
  },
  {
    reference: "ES-2056",
    customerName: "Maya Ortiz",
    phone: "(301) 555-0163",
    email: "maya.ortiz@example.test",
    deliveryAddress: "12 Summit Ave",
    city: "Gaithersburg",
    postalCode: "20877",
    dateKeys: ["2026-11-29", "2026-11-30"],
    checkInTime: "13:00",
    status: BookingStatus.CONFIRMED,
    stripeReference: "pi_fake_ember_2056",
  },
  {
    reference: "ES-2033",
    customerName: "Alex Kim",
    phone: "(301) 555-0177",
    email: "alex.kim@example.test",
    deliveryAddress: "9800 Main St",
    city: "Damascus",
    postalCode: "20872",
    dateKeys: ["2026-11-08"],
    checkInTime: "14:00",
    status: BookingStatus.COMPLETED,
    stripeReference: "pi_fake_ember_2033",
  },
];

async function main() {
  for (const sample of samples) {
    const schedule = calculateBookingSchedule(
      sample.dateKeys,
      sample.checkInTime,
      new Date("2026-11-01T12:00:00Z"),
    );
    if (!schedule) throw new Error(`Invalid fake schedule for ${sample.reference}.`);
    const pricing = calculateRentalPrice(sample.dateKeys.map(fromDateKey));
    const perDayPriceSnapshot = pricing.lineItems.map((item) => ({
      date: item.date.toISOString().slice(0, 10),
      amountCents: item.amount,
    }));

    await prisma.booking.upsert({
      where: { reference: sample.reference },
      update: {},
      create: {
        reference: sample.reference,
        customerName: sample.customerName,
        phone: sample.phone,
        email: sample.email,
        deliveryAddress: sample.deliveryAddress,
        city: sample.city,
        postalCode: sample.postalCode,
        deliveryNotes: sample.deliveryNotes,
        selectedDates: sample.dateKeys.map((date) => new Date(`${date}T12:00:00-05:00`)),
        checkInAt: new Date(`${schedule.checkInAt}-05:00`),
        checkOutAt: new Date(`${schedule.checkOutAt}-05:00`),
        durationDays: sample.dateKeys.length,
        perDayPriceSnapshot,
        subtotalCents: pricing.subtotal,
        discountCents: pricing.discount,
        totalCents: pricing.total,
        paymentStatus: PaymentStatus.PAID,
        stripeReference: sample.stripeReference,
        status: sample.status,
      },
    });
  }

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) {
    await prisma.adminUser.upsert({
      where: { username },
      update: {},
      create: {
        username,
        email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || null,
        passwordHash: await hashAdminPassword(password),
      },
    });
    console.info("Seeded the configured admin user.");
  } else {
    console.info("No admin credentials supplied; /admin/setup remains available.");
  }

  console.info(`Seeded ${samples.length} clearly fake sample bookings.`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
