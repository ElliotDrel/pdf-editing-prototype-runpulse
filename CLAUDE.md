# pdf-editing-prototype-runpulse

Single-page Next.js app deployed on Vercel. A public prototype by maintainer. Purpose: share a prototype that demonstrates bias toward action and shows users the human-in-the-loop UI layer that sits on top of Pulse Form Fill.

## Read first, in order

1. `docs/BRIEF.md` · why this exists, who it's for, what good looks like
2. `docs/BUILD.md` · stack, file structure, MVP scope, design tokens, components
3. `docs/PULSE_API.md` · Pulse API surface, request shapes, gotchas, what to verify before coding
4. `docs/TASKS.md` · ordered task list with definition of done

If something in these docs contradicts something elsewhere: BRIEF.md > BUILD.md > TASKS.md > PULSE_API.md. Strategy beats implementation. Ask the maintainer before deviating.

## Reference artifact

`reference/V2_pulse_pitch.html` is a self-contained HTML mockup of the same page concept that the maintainer built first. Treat it as the source of truth for:

- Layout (header → interactive demo → memo → footer)
- Aesthetic (dark warm bg, Instrument Serif headings, DM Sans body, JetBrains Mono accents, single signal-green accent)
- Memo copy (port the prose to React components, do not rewrite)
- Interaction model (two-way sync between PDF view and review panel, confidence badges, approve button unlocks after low-confidence review)
- Animation choices (staggered rise on mount, scan-line across PDF on load, pulsing indicator dot)

The Vercel app rebuilds this in Next.js + Tailwind, replaces the fake `/form-fill` call with a real Pulse API call, and ships at a custom domain.

## Working agreements

the maintainer's style preferences. Apply to all generated content (UI copy, comments, README updates, error messages):

- Short, direct, punchy. No filler.
- No em dashes anywhere. Use period, comma, or middle dot (`·`).
- Peer-level tone. the audience is technical, not a stranger to be deferred to.
- Concrete over abstract. Numbers over adjectives.
- Bias toward action over deliberation.

Tech preferences:

- TypeScript strict mode.
- Tailwind for styling (no CSS-in-JS, no styled-components, no UI libraries).
- Server components by default. Client components only where state or effects are required (`<Demo />` and its children).
- API routes for any external service calls. Never expose `PULSE_API_KEY` client-side.
- No analytics, no tracking, no cookie banner. This is a prototype, not a product.

## Success criteria

The deliverable is ONE URL the maintainer sends to the user. The URL must:

1. Load in under 1 second on a phone over LTE.
2. Render the headline and start of the interactive demo above the fold on a 390px-wide viewport.
3. Have correct OG tags so link preview previews look clean.
4. When a user hits "Approve & generate filled PDF," the downloaded file must be a real artifact from Pulse's `/form/fill` API, not a fake.
5. Survive being shared. No per-session state, no localStorage, deterministic across users and visits.

Optional but recommended: custom domain (e.g., `example.com` or similar) so the URL itself signals craft.

## Out of scope for v1

- User PDF upload. Pre-bake one sample document.
- Multi-page support. One page is enough.
- Editing graphics, images, signatures. Text fields only.
- Auth, accounts, persistence.
- Analytics.
- Service worker / offline.

## State tracking

Create a `STATE.md` at the project root once work begins. Update it at the end of each working session with completed work, open blockers, and next steps. Format:

```
## YYYY-MM-DD HH:MM
Shipped:
- ...
Blocked on:
- ...
Next up:
- ...
```
