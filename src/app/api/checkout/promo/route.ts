import { NextResponse } from "next/server";
import { promoResponse, readBody, readDates } from "@/lib/checkout-body";
import { rejectsCrossSitePost } from "@/lib/form-post";
import { quotePromoCode } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) {
    return NextResponse.json({ error: "retry" }, { status: 403 });
  }
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const quote = await quotePromoCode(
      String(body.code ?? ""),
      readDates(body.dates),
      String(body.checkInTime ?? ""),
      String(body.checkOutTime ?? ""),
    );
    return NextResponse.json(quote);
  } catch (error) {
    return promoResponse(error);
  }
}
