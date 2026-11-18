import Link from "next/link";
import { PageFrame } from "@/components/page-frame";

export const metadata = { title: "Pricing" };

const rates = [
  ["Monday–Thursday", "$350", "per day"],
  ["Friday", "$400", "per day"],
  ["Saturday–Sunday", "$450", "per day"],
];

const discounts = [
  ["2 days", "20% off"],
  ["3 days", "30% off"],
  ["4+ days", "40% off"],
];

export default function PricingPage() {
  return (
    <PageFrame eyebrow="Simple daily rentals" title="Rates" intro="Choose one day or stay in the heat longer. The calendar shows each day's rate before you continue.">
      <section className="section">
        <div className="container">
          <p className="placeholder-note">Local development pricing — approved as placeholders, not final published business rates.</p>
          <div className="price-grid">{rates.map(([label, price, unit]) => <div className="price-block" key={label}><p>{label}</p><p className="price">{price}</p><p>{unit}</p></div>)}</div>
          <p>Select an hourly check-in from 8:00 AM through 10:00 PM. Check-out is one hour earlier: the next day for a one-day rental, or on the last selected day for a multi-day rental.</p>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container split">
          <div><p className="eyebrow">Stay longer</p><h2 className="title">Multi-day savings</h2><p>Discounts apply automatically to the combined daily-rate subtotal.</p></div>
          <div>{discounts.map(([days, discount]) => <div className="summary-line price-block" key={days}><strong>{days}</strong><span className="price" style={{fontSize: "30px"}}>{discount}</span></div>)}</div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <h2 className="title">Before you book</h2>
          <p className="lead">Service is planned within roughly 30 minutes of Damascus, Maryland. Delivery fees, taxes, deposits, extras, and final service-zone rules have not been approved and are not included in this phase.</p>
          <p>Any applicable amounts will be itemized before payment once configured. No cancellation, deposit, or legal policy is implied here.</p>
          <Link className="button" href="/book">Choose your dates</Link>
        </div>
      </section>
    </PageFrame>
  );
}
