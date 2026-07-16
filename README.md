# Waitlist — Luxury Streetwear

A minimal, niche waitlist page to reserve priority access for limited streetwear drops.

## About

This repository powers the waitlist for a luxury streetwear brand — designed to capture interest, build scarcity, and grant early access to drops and exclusive releases.

## How it works

- Join: visitors submit their email and optional handle.
- Confirm: they receive a confirmation and are added to the queue.
- Access: priority invites are sent to the top of the list before public launches.

## Why join

- Early access to limited drops
- Exclusive restock alerts and event invites
- Curated drops for a tight community

## For developers

This repo is intended as a lightweight waitlist site. Check package.json or the project scripts for local start instructions. If you need help wiring a specific backend (email provider, CRM or analytics), open an issue describing the integration.

### Local development

```bash
npm install
npm run dev
```

Navigate to `http://localhost:5173` (or the port shown in terminal).

### Environment variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment

#### Vercel (Recommended)

This project is configured for Vercel deployment:

1. Push your branch to GitHub
2. Connect your repo to Vercel at https://vercel.com
3. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel will automatically detect the Vite setup and build accordingly

The project includes:
- `vercel.json` — Vercel configuration (build command, output directory, regions)
- `.vercelignore` — Files to exclude from deployment

No additional setup needed — just connect your GitHub repo to Vercel.

## Contributing

Small PRs welcomed: fixes to copy, styles, or accessibility improvements.

## License

Private

## Contact

Owner: Nervont

---
