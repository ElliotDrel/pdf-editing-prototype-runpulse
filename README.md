# PDF Editing Prototype

A Next.js prototype for reviewing extracted PDF fields, editing values, and generating a filled PDF through Pulse Form Fill.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

`PULSE_API_KEY` is required for live Pulse calls.

For local UI testing without live API calls:

```bash
PULSE_MOCK_MODE=1
NEXT_PUBLIC_PULSE_MOCK_MODE=1
```

## Scripts

```bash
npm run dev
npm run test
npm run build
```
