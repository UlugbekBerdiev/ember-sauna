# Ember Sauna Co.

Phase-one responsive public site and booking-flow foundation built with Next.js, TypeScript, and Tailwind CSS.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Admin development

The admin area uses PostgreSQL and Prisma. Copy `.env.example` to `.env` and provide:

- `DATABASE_URL` for the local PostgreSQL database
- `SESSION_SECRET`, a unique random value of at least 32 characters
- `ADMIN_SETUP_TOKEN`, a separate setup code of at least 32 characters
- optionally `ADMIN_USERNAME` and `ADMIN_PASSWORD` for seed-time admin creation
- optionally `ADMIN_EMAIL`

Never commit `.env` or share its values. For local-only development, choose your own throwaway password of at least 12 characters. No default password is included in this repository.

Prepare the database and fake sample bookings:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

When `ADMIN_USERNAME` and `ADMIN_PASSWORD` are omitted, visit `http://localhost:3000/admin/setup` once and enter `ADMIN_SETUP_TOKEN` to choose the owner credentials. The setup route returns 404 when the setup token is not configured or after an admin exists. Sign in at `/admin/login` with the configured username and password.

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
- Protected admin dashboard, booking operations, status audit trail, and first-run owner setup

Rates and photography are clearly labeled local placeholders. The checkout does not create a PaymentIntent, accept cards, or simulate payment success.

## Stripe follow-up

Production payment support still requires Stripe account configuration, environment variables, a server-side PaymentIntent endpoint, idempotent booking/price snapshot creation, webhook signature verification, and Payment Element mounting. Live availability, delivery zones, taxes, deposits, legal agreements, and final policies also remain intentionally unimplemented until approved.
