# Ember Sauna Co.

Phase-one responsive public site and booking-flow foundation built with Next.js, TypeScript, and Tailwind CSS.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Current scope

- Public Home, Sauna, Pricing, FAQ, and Contact pages
- Responsive booking calendar with per-day prices and multi-day discounts
- Session-persisted date, customer, and delivery details
- Branded checkout shell with an explicit Stripe Payment Element mount point

Rates and photography are clearly labeled local placeholders. The checkout does not create a PaymentIntent, accept cards, or simulate payment success.

## Stripe follow-up

Production payment support still requires Stripe account configuration, environment variables, a server-side PaymentIntent endpoint, idempotent booking/price snapshot creation, webhook signature verification, and Payment Element mounting. Live availability, delivery zones, taxes, deposits, legal agreements, and final policies also remain intentionally unimplemented until approved.
