This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 404 Tracking + Email Summary

This project includes an automatic broken-link report flow:

- Every rendered `404` page sends a tracking event to `/api/track-404`.
- Events are stored in Prisma model `BrokenLinkHit`.
- Vercel Cron calls `/api/cron/404-summary`:
  - Daily: last 24 hours.
  - Weekly: last 7 days.
- The route sends an email with top broken paths and top referrers.

## Outbound External Link Tracking

External links clicked by users are tracked through `/out`:

- A client-side interceptor rewrites external clicks to `/out?to=...&from=...`.
- `/out` checks the destination URL (`HEAD`, fallback `GET`) and stores:
  - `statusCode`
  - `isError` (true for 4xx/5xx or request failures)
  - `targetUrl`, `finalUrl`, `sourcePath`
- Then the user is redirected to the destination URL.

Cron summaries:

- `GET /api/cron/external-link-summary?period=daily`
- `GET /api/cron/external-link-summary?period=weekly`

Both send an email to `BROKEN_LINK_REPORT_TO` with top failing external URLs.

### Required environment variables

- `BROKEN_LINK_REPORT_TO`: destination email(s), comma-separated if needed.
- `BROKEN_LINK_CRON_SECRET`: shared secret for manual cron runs (optional for Vercel Cron, required for manual requests).
- Existing SMTP vars are reused:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `CONTACT_FROM_EMAIL` (optional; fallback to `SMTP_USER`)

### Manual trigger

Run daily report manually:

`GET /api/cron/404-summary?period=daily&secret=YOUR_BROKEN_LINK_CRON_SECRET`

Run weekly report manually:

`GET /api/cron/404-summary?period=weekly&secret=YOUR_BROKEN_LINK_CRON_SECRET`

Run external links daily report manually:

`GET /api/cron/external-link-summary?period=daily&secret=YOUR_BROKEN_LINK_CRON_SECRET`

Run external links weekly report manually:

`GET /api/cron/external-link-summary?period=weekly&secret=YOUR_BROKEN_LINK_CRON_SECRET`

## Getting Started

### Turno rodado 2027

`/horarios` includes an annual rota section under the 2027 monthly PDFs, even
when no monthly 2027 files have been published. Assets are in
`public/horarios/2027`: the approved PDF, six individual ICS files.

Run `python3 scripts/generate-turno-2027.py` to regenerate the ICS files
(Python 3.9+ with Europe/Madrid timezone data). The script verifies the weekly
offset, holiday staffing, the March 25 exception and daylight-saving changes.
The approved PDF is maintained separately; any future rota edits must also be
reflected in the PDF before publishing.

`POST /api/horarios/2027/mail` sends the selected group as an attachment using
the existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and optional
`CONTACT_FROM_EMAIL` configuration. It accepts only a single destination,
checks the request origin and limits requests per IP in the existing in-memory
rate limiter (per server instance). If reCAPTCHA is configured, use both
`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY`; the action is
`turno_2027_mail`. No mailing-list or database record is created for recipients.
Without SMTP, downloads remain available and the form reports unavailability.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
