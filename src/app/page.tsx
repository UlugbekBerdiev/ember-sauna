import Link from "next/link";
import { Footer, Header, PhotoPlaceholder } from "@/components/site-shell";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-bg"><PhotoPlaceholder className="hero-photo" label="mobile sauna at a lakeside campsite" /></div>
          <div className="container hero-content">
            <p className="eyebrow">Mobile sauna experience</p>
            <h1 className="display">Fire within.<br />Peace around.</h1>
            <p className="lead">Bringing the ancient ritual of heat and steam to modern life, wherever you unwind.</p>
            <div className="cta-row">
              <Link className="button" href="/book">Book now</Link>
              <Link className="button button-outline" href="/sauna">Explore the sauna</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">How it works</p>
              <h2 className="title">Your retreat, delivered.</h2>
            </div>
            <div className="steps-grid">
              {[["01", "Choose your dates", "Select one or more available days, then choose a check-in time and a check-out time."], ["02", "We deliver", "We bring and set up the sauna at an approved location."], ["03", "Heat & unwind", "A one-day rental checks out the next day. A longer rental checks out on the last selected day."]].map(([number, title, text]) => (
                <article className="step" key={number}><span className="number">{number}</span><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-dark">
          <div className="container split">
            <PhotoPlaceholder label="warm sauna interior" />
            <div>
              <p className="eyebrow">The Ember experience</p>
              <h2 className="title">Real heat. Anywhere you go.</h2>
              <p className="lead">A private, wood-fired ritual built for backyard escapes, events, retreats, and days by the water.</p>
              <Link className="link-arrow" href="/sauna">Discover the sauna →</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <p className="eyebrow">Placeholder rates</p>
            <h2 className="title">Make a day of it.</h2>
            <div className="price-grid">
              <div className="price-block"><p>Monday–Thursday</p><p className="price">$350</p><p>per day</p></div>
              <div className="price-block"><p>Friday</p><p className="price">$400</p><p>per day</p></div>
              <div className="price-block"><p>Saturday–Sunday</p><p className="price">$450</p><p>per day</p></div>
            </div>
            <p className="placeholder-note">Rates are approved local placeholders for this implementation phase and must remain configurable before launch.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
