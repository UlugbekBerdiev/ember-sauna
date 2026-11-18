import type { Metadata } from "next";
import "./globals.css";
import { BookingProvider } from "@/lib/booking-store";

export const metadata: Metadata = {
  title: { default: "Ember Sauna Co.", template: "%s | Ember Sauna Co." },
  description: "A premium mobile sauna experience near Damascus, Maryland.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <BookingProvider>{children}</BookingProvider>
      </body>
    </html>
  );
}
