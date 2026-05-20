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

## Global Directives

- **Clarify before acting:** Before starting any task, exhaust all available context and tools (prior messages, provided files, permitted browsing, and accessible tools) to gather relevant information. Then keep asking focused clarifying questions (1-5 at a time), IF the intent, inputs, constraints, output format, audience/tone, or success criteria are unclear, or if you cannot complete this request successfully (accurately, completely, and to the required standard).
- **Source factual data live:** When factual data is needed — or when you encounter an unfamiliar or partially-familiar product, tool, framework, concept, or architecture — always retrieve it from live sources using available tools (web_search, web_fetch, bash_tool). Never recall factual data from training memory and present it as sourced. If you cite a source, you must have fetched it this session and include the real URL. A source name without a same-session URL is a fabricated citation.
- When searching for code patterns or structures (not just text), prefer ast-grep over Grep. Use /ast-grep skill for structural queries.
- If you have trouble reading PDFs, break them one per page, and then use the read tool to read each page individually.
- **Subagent model defaults:** When spawning subagents, use this priority: (1) If the subagent's definition specifies a model, use that. (2) If the user explicitly requests a model, use that. (3) Otherwise, default to one tier below the current orchestrator model — Opus defaults to Sonnet, Sonnet defaults to Haiku, Haiku stays Haiku.
- **Skills:** If you think there is even a 1% chance a skill might apply, you ABSOLUTELY MUST invoke the skill.
- Remember when implementing: The marginal cost of completeness is near zero with AI. Do the whole thing. Do it right. Do it with tests. Do it with documentation. Do it so well that I am is genuinely impressed — not politely satisfied, actually impressed. Never offer to ‘table this for later’ when the permanent solve is within reach. Never leave a dangling thread when tying it off takes five more minutes. Never present a workaround when the real fix exists. The standard isn’t ‘good enough’ — it’s ‘holy shit, that’s done.’ Search before building. Test before shipping. Ship the complete thing. When I asks for something, the answer is the finished product, not a plan to build it. Time is not an excuse. Fatigue is not an excuse. Complexity is not an excuse. Boil the ocean.
- User Info:
	- User Name: maintainer
	- User Preferred Name: the maintainer
	- User Email: maintainer@example.com
---

## JS/TS Project Defaults

When doing substantive work in any project with a `package.json` (skip read-only/single-line/Q&A), set up the following as pre-authorized defaults. Don't ask. Skip silently if already configured. Never overwrite existing configs (`biome.json`, `knip.json`, `.eslintrc*`, `prettier.config.*`) — ask first.

- **Biome** (linter + formatter, use `init` for defaults)
- **knip** (dead code / unused exports, zero-config)
- **`noUncheckedIndexedAccess: true`** in every `tsconfig.json`
- **Supabase type generation** (if `@supabase/supabase-js` is a dep): add a `gen-types` npm script using `supabase gen types typescript`
- **`@next/bundle-analyzer`** (if `next` is a dep): wire into `next.config` + add an `analyze` npm script



<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->