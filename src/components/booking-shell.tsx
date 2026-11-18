import { Logo } from "@/components/site-shell";

const steps = [["1", "Dates"], ["2", "Details"], ["3", "Payment"]];

export function BookingShell({ activeStep, children }: { activeStep: number; children: React.ReactNode }) {
  return (
    <>
      <header className="booking-header">
        <div className="container">
          <Logo />
          <nav className="progress" aria-label="Booking progress">
            {steps.map(([number, name], index) => <span className={index + 1 === activeStep ? "active" : ""} aria-current={index + 1 === activeStep ? "step" : undefined} key={name}>{number} {name}</span>)}
          </nav>
        </div>
      </header>
      <main className="booking-main">{children}</main>
    </>
  );
}
