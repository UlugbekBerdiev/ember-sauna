import { listPromoCodes } from "@/lib/promo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo codes" };

const errors: Record<string, string> = {
  percent: "Choose a discount from 1 to 100 percent.",
  code: "Use 4 to 24 letters or numbers. That code may already exist.",
  database: "The admin database is unavailable. Reload and try again.",
  retry: "Reload the page and try again.",
};

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; retired?: string }>;
}) {
  const params = await searchParams;
  const codes = await listPromoCodes();
  const created = params.created?.slice(0, 32) ?? "";
  const notice = params.error ? errors[params.error] ?? errors.database : "";

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Promo codes</h1>
        </div>
        <span>{codes.length} codes</span>
      </div>
      <section className="admin-panel">
        <h2>New one-time code</h2>
        <p>Each code can be used once, for 1% to 100% off the amount due after the multi-day discount. A 100% code confirms the booking. A smaller code waits until card payment can collect the rest.</p>
        {created && <p>Created <strong>{created}</strong>. Share it once. It cannot be used again after checkout.</p>}
        {params.retired === "1" && <p>That unused code is retired.</p>}
        {notice && <p className="field-error">{notice}</p>}
        <form className="form-grid" action="/admin/promo/create" method="post">
          <div className="field">
            <label htmlFor="code">Code (optional)</label>
            <input className="input" id="code" name="code" maxLength={32} placeholder="Leave blank to generate one" />
          </div>
          <div className="field">
            <label htmlFor="percent">Percent off</label>
            <input className="input" id="percent" name="percent" type="number" min={1} max={100} defaultValue={100} required />
          </div>
          <div className="full"><button className="button" type="submit">Create code</button></div>
        </form>
      </section>
      <section className="admin-panel">
        <div className="admin-promo-head"><span>Code</span><span>Off</span><span>Status</span><span></span></div>
        {codes.length === 0 && <p className="admin-empty">No promo codes yet.</p>}
        {codes.map((promo) => (
          <div className="admin-promo-row" key={promo.id}>
            <strong>{promo.code}</strong>
            <span>{promo.percentOff}%</span>
            <span>
              {promo.redeemedAt
                ? promo.bookingReference
                  ? `Used · ${promo.bookingReference}`
                  : "Retired"
                : "Available"}
            </span>
            {!promo.redeemedAt && (
              <form action="/admin/promo/retire" method="post">
                <input type="hidden" name="id" value={promo.id} />
                <button type="submit">Retire</button>
              </form>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
