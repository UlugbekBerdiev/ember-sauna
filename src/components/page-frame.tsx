import { Footer, Header } from "@/components/site-shell";

export function PageFrame({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>
        <header className="page-hero">
          <div className="container">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display">{title}</h1>
            <p className="lead">{intro}</p>
          </div>
        </header>
        {children}
      </main>
      <Footer />
    </>
  );
}
