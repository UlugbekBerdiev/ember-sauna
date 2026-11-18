"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BookingDetails = {
  dates: string[];
  checkInTime: string;
  checkInAt: string;
  checkOutAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

const initialDetails: BookingDetails = {
  dates: [],
  checkInTime: "08:00",
  checkInAt: "",
  checkOutAt: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
};

type BookingContextValue = {
  booking: BookingDetails;
  setBooking: (booking: BookingDetails) => void;
  updateBooking: (patch: Partial<BookingDetails>) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBooking] = useState(initialDetails);

  useEffect(() => {
    let stored: Partial<BookingDetails> | null = null;
    try {
      const raw = sessionStorage.getItem("ember-booking");
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      sessionStorage.removeItem("ember-booking");
    }
    if (!stored) return;
    const timer = window.setTimeout(() => {
      setBooking({ ...initialDetails, ...stored });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (booking.dates.length || booking.email) {
      sessionStorage.setItem("ember-booking", JSON.stringify(booking));
    }
  }, [booking]);

  const value = useMemo(
    () => ({
      booking,
      setBooking,
      updateBooking: (patch: Partial<BookingDetails>) =>
        setBooking((current) => ({ ...current, ...patch })),
    }),
    [booking],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
}
