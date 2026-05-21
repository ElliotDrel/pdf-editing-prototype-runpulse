# PDF Editing Prototype

This is a public Next.js prototype for reviewing extracted PDF fields, editing values, and generating a filled PDF through Pulse Form Fill.

## Project Notes

- Keep API keys server-side only. Never expose `PULSE_API_KEY` to client components.
- Use mock mode for UI work that does not need live Pulse calls.
- Keep sample data synthetic. Do not commit customer PDFs, live API responses, local env files, images, or generated test output.
- Public-facing files should avoid personal outreach context, private planning notes, and one-off session state.

## Development

- TypeScript strict mode.
- Tailwind for styling.
- Server components by default. Use client components only where state or effects are required.
- API routes own external service calls.
- Run `npm run test` and `npm run build` before publishing.

## Local Environment

Copy `.env.example` to `.env.local` for local live-mode testing. Keep `.env.local` ignored.

Use these for UI-only local testing:

```bash
PULSE_MOCK_MODE=1
NEXT_PUBLIC_PULSE_MOCK_MODE=1
```
