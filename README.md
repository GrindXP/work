# Tailscale Work Dashboard

Next.js app to view active Tailscale devices via API.

## Features
- `/api/devices` - Returns active Tailscale devices with IPs (server-side API)
- Web UI to view device list
- Auto-fetches on load

## Local Development

1. Set environment variable:
```bash
export TAILSCALE_API_KEY="tskey-api-xxxxxxxx"
```

2. Run dev server:
```bash
npm run dev
```

3. Open http://localhost:3000

## Deploy to Vercel

1. Push to GitHub:
```bash
git push -u origin main
```

2. Connect repo to [Vercel](https://vercel.com)

3. Add environment variable in Vercel Dashboard:
   - Name: `TAILSCALE_API_KEY`
   - Value: Your Tailscale API key (from https://login.tailscale.com/admin/settings/keys)

4. Deploy!

## API Endpoint

- `GET /api/devices` - Returns active devices with Tailscale IPs

---

This is a [Next.js](https://nextjs.org) project.

## Getting Started

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
