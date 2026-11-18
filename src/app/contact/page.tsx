"use client";

import { FormEvent, useState } from "react";
import { PageFrame } from "@/components/page-frame";

export default function ContactPage() {
  const [status, setStatus] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Thanks — this local placeholder form is not connected to a messaging service yet.");
  }

  return (
    <PageFrame eyebrow="Questions or special plans?" title="Get in touch" intro="Tell us what you are planning and we will help determine whether Ember is a fit.">
      <section className="section">
        <div className="container contact-grid">
          <form className="form-grid" onSubmit={submit}>
            <div className="field"><label htmlFor="name">Name</label><input className="input" id="name" autoComplete="name" required /></div>
            <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" type="email" autoComplete="email" required /></div>
            <div className="field full"><label htmlFor="phone">Phone (optional)</label><input className="input" id="phone" type="tel" autoComplete="tel" /></div>
            <div className="field full"><label htmlFor="message">How can we help?</label><textarea className="input" id="message" required /></div>
            <button className="button full" type="submit">Send message</button>
            {status && <p className="status" role="status">{status}</p>}
          </form>
          <aside>
            <p className="eyebrow">Service area</p>
            <h2 className="title">Damascus, Maryland</h2>
            <p>Planned delivery within approximately 30 minutes. Exact address eligibility will depend on the configured service zone and site access.</p>
            <hr className="gold-rule" />
            <p className="placeholder-note">Business email, phone number, hours, and final service-area details are awaiting owner confirmation.</p>
          </aside>
        </div>
      </section>
    </PageFrame>
  );
}
