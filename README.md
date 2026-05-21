# PDF Editing Prototype

A Next.js prototype for reviewing extracted PDF fields, editing values, and generating a filled PDF via the [Pulse Form Fill API](https://runpulse.com).

Upload a PDF form, review the fields Pulse extracts, make edits in the browser, and download a completed copy — all without touching the original file.

## Features

- **PDF field extraction** — sends a form to Pulse and surfaces every detected field
- **Inline field editor** — review and correct extracted values before filling
- **Form fill** — submits edited values back to Pulse and returns a filled PDF
- **Mock mode** — run the full UI flow locally without a live API key
- **Baked fixtures** — pre-extracted lab requisition and prior authorization samples included

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, server components)
- [Tailwind CSS](https://tailwindcss.com)
- [pdf-lib](https://pdf-lib.js.org) for client-side PDF rendering
- [Vitest](https://vitest.dev) for unit tests

## Setup

```bash
npm install
cp .env.example .env.local
# add your PULSE_API_KEY to .env.local
npm run dev
```

Open `http://localhost:3000`.

## Mock mode

Run the full UI without a live Pulse API key:

```bash
PULSE_MOCK_MODE=1
NEXT_PUBLIC_PULSE_MOCK_MODE=1
```

Set these in `.env.local` or inline when running `npm run dev`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (runs Biome + knip first) |
| `npm run test` | Run unit tests |

## License

MIT — see [LICENSE](./LICENSE).
