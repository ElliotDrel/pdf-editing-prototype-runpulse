# pulse-test

A one-shot test harness that exercises Pulse's `/extract`, `/form/detect`, and `/form/fill` endpoints against the same sample PDF and produces a side-by-side comparison page so you can pick the right data source for the edit UI.

The point isn't to pick the cheapest option or the prettiest output. It's to answer one question:

> **Which API response gives the cleanest input for building an editable React surface?**

The edit UX is the product. Everything else is secondary.

## What it tests

| Option | Endpoint(s) | Cost / page | What you'd build the edit UI from |
|---|---|---|---|
| **A** | `/extract` with HTML + word-level bboxes | 1 credit | The HTML output, made editable inline |
| **B** | `/form/detect` | 1 credit | Cell array (bbox + type + text), overlaid on a PDF render |
| **C** | `/form/fill` with NL instructions only | 3 credits | (output only — not an edit source) |
| **D** | `/form/detect` + `/form/fill` with overrides | 4 credits | Same as B for editing; D proves Pulse respects per-cell overrides |

Total credit cost to run this once: ~12 credits.

## Setup

1. Drop `sample_prior_auth.pdf` into this folder. (Or any PDF you want to test against, but the comparison report assumes it's a form-shaped document.)
2. Copy `.env.example` to `.env` and paste your Pulse API key:
   ```
   PULSE_API_KEY=<your-api-key>
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Run

```bash
npm run test
```

You'll see four test blocks run in sequence, each printing a status line. Total wall-clock time: ~30-90 seconds depending on Pulse's queue.

## Output

Everything writes to `./test-results/`:

```
test-results/
├── index.html              # OPEN THIS FIRST — comparison report
├── A-extract.json          # raw /extract response
├── A-extract.md            # the markdown output extracted standalone
├── A-extract.html          # the HTML output wrapped in a viewer
├── B-detect.json           # raw /form/detect response
├── B-detect-overlay.html   # cell bboxes visualized over a Letter page
├── C-fill-nl.json          # raw /form/fill response (NL instructions only)
├── C-fill-nl.pdf           # the filled PDF
├── D-fill-override.json    # raw /form/fill response (with form_fields override)
└── D-fill-override.pdf     # the filled PDF with overrides applied
```

## How to evaluate

Open `test-results/index.html` and walk through each card. For each option, the question is whether the data lets you build a clean edit UI.

### Option A · /extract HTML
- Open `A-extract.html`. Does it visually resemble the source form? If yes, you can render this HTML in an iframe inside React and make values editable inline (e.g., wrap text nodes in `contenteditable` spans or replace with `<input>` elements).
- Open `A-extract.json` and look at `bounding_boxes.markdown_with_ids`. If each chunk of text has a stable ID, you can wire up a side panel that scrolls to the corresponding region when a user clicks.
- Look at `extensions.altOutputs.wlbb.words` — every word has its own bbox and confidence score. If the HTML output isn't form-shaped enough, you could build a positional renderer from this instead.

### Option B · /form/detect
- Open `B-detect-overlay.html`. Each colored box is one detected cell. Are they in the right places? Is the cell **type** correct (text vs checkbox vs signature)? Are checkboxes split into their per-option `checkbox_details`?
- This is the cleanest possible input for the V2-style React UI: pre-segmented cells with positions and types. You'd render a PNG of the source PDF as the background, then overlay one `<input>` per cell at its bbox.

### Option C · /form/fill (NL only)
- Open `C-fill-nl.pdf`. Did Pulse correctly route values to cells from just a natural-language string? If yes, our app could send `instructions = buildNlFromFields(editedFields)` on approve and let Pulse handle the placement.
- Look for: did it check the Routine box (not Urgent or STAT)? Did the NPI land in the NPI field, not the phone field? Did the long clinical text go into the right place?

### Option D · /form/fill (with overrides)
- Open `D-fill-override.pdf`. The test pre-edited one text cell to `OVERRIDE_TEST_VALUE`. Is it visible in the output PDF in the cell we edited?
- If yes, our approve flow can send per-cell edits as `form_fields` overrides, which is more deterministic than NL.
- If no, we have to send NL instructions (Option C model) on approve.

## What to do with the results

The architecture call breaks into two orthogonal decisions:

1. **Edit data source**: A or B. Pick whichever gives the cleanest input for rendering editable inputs.
2. **Output PDF source**: C or D, or skip Pulse entirely (regenerate from edited HTML).

Both A+C, A+D, B+C, B+D, and A+regenerate are viable architectures. The test results tell you which combination is least painful to build.

If both A and B come back rough (low-quality HTML and miss-detected cells), the answer might be "neither — fall back to a hand-coded mockup like V2 and call it a sketch, not a real integration."

## Troubleshooting

**`401 Unauthorized`**: bad API key. Double-check `.env`.

**`429 Too Many Requests`**: hit a rate limit. Wait a minute and retry.

**`/form/fill` returns `pdf_url` but the download 401s**: the script handles this by re-fetching with the API key, but if you see this in logs, the API key is missing or the URL was malformed.

**Test D errors with "form_id not found"**: rare; usually means /form/detect didn't return a `form_id`. Check `B-detect.json` to confirm.

**Tests hang or time out**: Pulse's async mode might be triggered for larger PDFs. The sample form is one page so this shouldn't happen, but if it does, the script will eventually time out — add `async: false` to the body or just retry.
