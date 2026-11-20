import { NextResponse } from "next/server";
import { listOpenStays } from "@/lib/open-stays";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stays = await listOpenStays();
    return NextResponse.json({
      stays: stays.map((stay) => ({
        checkInAt: stay.checkInAt.toISOString(),
        checkOutAt: stay.checkOutAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "database" }, { status: 503 });
  }
}
