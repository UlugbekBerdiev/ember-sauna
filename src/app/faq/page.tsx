import Link from "next/link";
import { PageFrame } from "@/components/page-frame";

export const metadata = { title: "FAQ" };

const faqs = [
  ["Where do you deliver?", "The current service-area direction is approximately a 30-minute drive from Damascus, Maryland. Your exact address will be checked when delivery zones are configured."],
  ["How long is a rental day?", "Choose an hourly check-in time from 8:00 AM through 10:00 PM. A one-day 5:00 PM check-in checks out at 4:00 PM the next day. For a multi-day rental, check-out is one hour earlier on the final selected day—for example, Nov 15–16 checks out Nov 16 at 4:00 PM."],
  ["Can I rent for more than one day?", "Yes. Select consecutive or individual dates in the booking calendar. The current placeholder discount schedule applies 20% for 2 days, 30% for 3 days, and 40% for 4 or more days."],
  ["What is included?", "The final equipment and inclusion list is still awaiting owner confirmation. It will be shown here and during booking before launch."],
  ["How do I pay?", "The first release will support card payments through Stripe's secure Payment Element. This phase includes the checkout shell but does not collect or confirm payment."],
  ["What is the cancellation policy?", "Cancellation and rescheduling terms are not yet approved. We will publish them only after owner and legal review, and before accepting a booking."],
];

export default function FAQPage() {
  return (
    <PageFrame eyebrow="Good to know" title="Frequently asked" intro="Straightforward answers about the current Ember booking experience.">
      <section className="section">
        <div className="narrow">
          {faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          <div style={{marginTop: "42px"}}><p className="eyebrow">Still curious?</p><Link className="button button-outline" href="/contact">Contact us</Link></div>
        </div>
      </section>
    </PageFrame>
  );
}
