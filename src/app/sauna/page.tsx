import Link from "next/link";
import { PageFrame } from "@/components/page-frame";
import { PhotoPlaceholder } from "@/components/site-shell";

export const metadata = { title: "The Sauna" };

export default function SaunaPage() {
  return (
    <PageFrame eyebrow="The experience" title="The Sauna" intro="A private mobile ritual designed to bring authentic heat into the open air.">
      <section className="section">
        <div className="container split">
          <PhotoPlaceholder label="black mobile sauna exterior" />
          <div>
            <p className="eyebrow">Built around the ritual</p>
            <h2 className="title">Heat. Reset. Reconnect.</h2>
            <p>Warm wood, deep heat, and a simple setup create a calm retreat wherever the day takes you.</p>
            <p className="placeholder-note">Final capacity, dimensions, heater details, and included equipment are awaiting owner confirmation. We have intentionally not invented them.</p>
          </div>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container feature-grid">
          {[["Natural", "An outdoor experience grounded in natural surroundings."], ["Authentic heat", "A focused sauna ritual without distracting extras."], ["Anywhere you go", "A trailer-based setup delivered to an approved location."], ["Relax & reset", "Private time to slow down, warm up, and reconnect."]].map(([title, text]) => <article className="feature" key={title}><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="section"><div className="container"><h2 className="title">Bring the heat to you.</h2><Link className="button" href="/book">Book this experience</Link></div></section>
    </PageFrame>
  );
}
