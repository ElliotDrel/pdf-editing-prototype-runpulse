/**
 * Pulse API option comparison test harness.
 *
 * Tests four approaches to powering a PDF edit UI:
 *   A. /extract with markdown + HTML + word-level bboxes  (1 credit/page)
 *   B. /form/detect                                       (1 credit/page)
 *   C. /form/fill with natural-language instructions only (3 credits/page)
 *   D. /form/detect + /form/fill with form_fields override (4 credits/page)
 *
 * Saves every response and binary artifact to ./test-results/, then writes
 * an HTML report (test-results/index.html) for side-by-side evaluation.
 *
 * Usage:
 *   1. Put your Pulse API key in .env as PULSE_API_KEY=...
 *   2. Drop sample_prior_auth.pdf next to this file
 *   3. npm install
 *   4. npm run test
 *
 * Cost: ~12 credits = ~$0.18-$0.24 depending on plan tier.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH = resolve(__dirname, "sample_prior_auth.pdf");
const OUT_DIR = resolve(__dirname, "test-results");
const API_KEY = process.env.PULSE_API_KEY;
const BASE_URL = process.env.PULSE_BASE_URL ?? "https://api.runpulse.com";

if (!API_KEY) {
  console.error("PULSE_API_KEY missing. Put it in .env or export it.");
  process.exit(1);
}
if (!existsSync(PDF_PATH)) {
  console.error(`PDF not found at ${PDF_PATH}.`);
  console.error("Drop sample_prior_auth.pdf next to this script and retry.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

// ---------- shared natural-language fill instructions ----------
const INSTRUCTIONS = `Fill out this prior authorization form with the following information.
Patient name: Margaret O. Chen.
Date of birth: 03/14/1962.
Member ID: BCBS-7745-2298.
Group number: GRP-44219.
Patient phone: (415) 555-0188.
Patient address: 482 Filbert St, San Francisco, CA 94133.
Primary diagnosis ICD-10: E11.65 (Type 2 diabetes with hypoglycemia).
Requested service: CPT 70553, MRI brain with and without contrast.
Service date: 06/02/2026.
Units/frequency: 1.
Place of service: Outpatient Hospital.
Urgency: check the Routine box, leave Urgent and STAT unchecked.
Prescribing provider: Patel, R.
NPI: 1487338921.
Tax ID: 94-1234567.
Provider phone: (415) 555-0212.
Provider fax: (415) 555-0213.
Specialty: Neurology.
Clinical justification: Patient presents with progressive headaches, intermittent blurred vision, and unilateral paresthesia for six weeks. Failed conservative management with oral analgesics. MRI indicated to rule out intracranial pathology.`;

// ---------- helpers ----------
function logStep(label: string) {
  console.log(`\n=== ${label} ===`);
}

async function saveJson(filename: string, data: unknown) {
  const path = resolve(OUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`  saved ${filename}`);
}

async function saveText(filename: string, text: string) {
  const path = resolve(OUT_DIR, filename);
  writeFileSync(path, text, "utf8");
  console.log(`  saved ${filename}`);
}

async function saveBinary(filename: string, bytes: Uint8Array) {
  const path = resolve(OUT_DIR, filename);
  writeFileSync(path, bytes);
  console.log(`  saved ${filename} (${(bytes.byteLength / 1024).toFixed(1)} KB)`);
}

function pdfBlob(): Blob {
  const buf = readFileSync(PDF_PATH);
  return new Blob([buf], { type: "application/pdf" });
}

async function postMultipart(path: string, fields: Record<string, string | Blob>): Promise<Response> {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v instanceof Blob) {
      fd.append(k, v, "sample.pdf");
    } else {
      fd.append(k, v);
    }
  }
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "x-api-key": API_KEY! },
    body: fd,
  });
}

async function fetchPdfBytes(pdfUrl: string): Promise<Uint8Array> {
  const res = await fetch(pdfUrl, { headers: { "x-api-key": API_KEY! } });
  if (!res.ok) {
    throw new Error(`pdf_url fetch failed: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

// ---------- tests ----------
type TestResult = {
  name: string;
  status: "ok" | "error";
  durationMs: number;
  notes: string[];
  artifacts: string[];
  rawResponseFile?: string;
  error?: string;
};

const results: TestResult[] = [];

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const t0 = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - t0 };
}

// --- A. /extract with markdown + HTML + word-level bboxes ---
async function testExtract(): Promise<TestResult> {
  const out: TestResult = {
    name: "A. /extract (markdown + HTML + WLBB)",
    status: "ok",
    durationMs: 0,
    notes: [],
    artifacts: [],
  };
  try {
    logStep(out.name);
    const { value: res, ms } = await timed(async () =>
      postMultipart("/extract", {
        file: pdfBlob(),
        extensions: JSON.stringify({
          alt_outputs: { return_html: true, wlbb: true },
        }),
      })
    );
    out.durationMs = ms;
    if (!res.ok) {
      const body = await res.text();
      out.status = "error";
      out.error = `${res.status}: ${body.slice(0, 500)}`;
      return out;
    }
    const data = await res.json() as any;
    await saveJson("A-extract.json", data);
    out.rawResponseFile = "A-extract.json";
    out.artifacts.push("A-extract.json");

    // Save individual pieces for direct inspection
    if (data.markdown) {
      await saveText("A-extract.md", data.markdown);
      out.artifacts.push("A-extract.md");
      out.notes.push(`markdown length: ${data.markdown.length} chars`);
    }
    const html = data?.extensions?.altOutputs?.html
              ?? data?.extensions?.alt_outputs?.html
              ?? data?.html;
    if (html) {
      // Wrap in a minimal viewer document so it renders standalone
      const viewer = `<!doctype html><meta charset="utf-8"><title>extract HTML output</title>
<style>body{font-family:system-ui;margin:0;padding:24px;background:#f4f0e6;color:#1a1814}</style>
${html}`;
      await saveText("A-extract.html", viewer);
      out.artifacts.push("A-extract.html");
      out.notes.push(`HTML length: ${html.length} chars`);
    } else {
      out.notes.push("⚠ no HTML output returned. Check extensions config.");
    }
    if (data.bounding_boxes) {
      const bb = data.bounding_boxes;
      out.notes.push(
        `bounding_boxes: Text=${bb.Text?.length ?? 0}, Title=${bb.Title?.length ?? 0}, Tables=${bb.Tables?.length ?? 0}`
      );
    }
    const wlbb = data?.extensions?.altOutputs?.wlbb
              ?? data?.extensions?.alt_outputs?.wlbb;
    if (wlbb?.words) {
      out.notes.push(`word-level bboxes: ${wlbb.words.length} words`);
    }
    if (data.extraction_id) out.notes.push(`extraction_id: ${data.extraction_id}`);
    if (data.plan_info) out.notes.push(`credits used: pages=${data.plan_info.pages_used}`);
    return out;
  } catch (e: any) {
    out.status = "error";
    out.error = e?.message ?? String(e);
    return out;
  }
}

// --- B. /form/detect ---
async function testDetect(): Promise<{ result: TestResult; form_id?: string; form_fields?: any[] }> {
  const out: TestResult = {
    name: "B. /form/detect",
    status: "ok",
    durationMs: 0,
    notes: [],
    artifacts: [],
  };
  try {
    logStep(out.name);
    const { value: res, ms } = await timed(async () => postMultipart("/form/detect", { file: pdfBlob() }));
    out.durationMs = ms;
    if (!res.ok) {
      const body = await res.text();
      out.status = "error";
      out.error = `${res.status}: ${body.slice(0, 500)}`;
      return { result: out };
    }
    const data = await res.json() as any;
    await saveJson("B-detect.json", data);
    out.rawResponseFile = "B-detect.json";
    out.artifacts.push("B-detect.json");

    const cells = data.form_fields ?? [];
    out.notes.push(`form_id: ${data.form_id}`);
    out.notes.push(`detected cells: ${cells.length}`);
    out.notes.push(`page_count: ${data.page_count}`);

    const byType: Record<string, number> = {};
    for (const c of cells) byType[c.type] = (byType[c.type] ?? 0) + 1;
    out.notes.push(`cell types: ${JSON.stringify(byType)}`);

    // Render a quick overlay HTML showing where each cell sits on a normalized page.
    const overlay = renderCellOverlay(cells);
    await saveText("B-detect-overlay.html", overlay);
    out.artifacts.push("B-detect-overlay.html");

    return { result: out, form_id: data.form_id, form_fields: cells };
  } catch (e: any) {
    out.status = "error";
    out.error = e?.message ?? String(e);
    return { result: out };
  }
}

// --- C. /form/fill with NL instructions only ---
async function testFillNlOnly(): Promise<TestResult> {
  const out: TestResult = {
    name: "C. /form/fill (NL instructions only)",
    status: "ok",
    durationMs: 0,
    notes: [],
    artifacts: [],
  };
  try {
    logStep(out.name);
    const { value: res, ms } = await timed(async () =>
      postMultipart("/form/fill", { file: pdfBlob(), instructions: INSTRUCTIONS })
    );
    out.durationMs = ms;
    if (!res.ok) {
      const body = await res.text();
      out.status = "error";
      out.error = `${res.status}: ${body.slice(0, 500)}`;
      return out;
    }
    const data = await res.json() as any;
    await saveJson("C-fill-nl.json", data);
    out.rawResponseFile = "C-fill-nl.json";
    out.artifacts.push("C-fill-nl.json");

    out.notes.push(`form_id: ${data.form_id}`);
    out.notes.push(`fields_filled: ${data.fields_filled}`);
    out.notes.push(`credits_used: ${data.credits_used}`);

    if (data.pdf_url) {
      try {
        const bytes = await fetchPdfBytes(data.pdf_url);
        await saveBinary("C-fill-nl.pdf", bytes);
        out.artifacts.push("C-fill-nl.pdf");
      } catch (e: any) {
        out.notes.push(`⚠ failed to download pdf_url: ${e.message}`);
      }
    } else {
      out.notes.push("⚠ no pdf_url in response");
    }
    return out;
  } catch (e: any) {
    out.status = "error";
    out.error = e?.message ?? String(e);
    return out;
  }
}

// --- D. /form/fill with form_id + edited form_fields override ---
async function testFillWithOverride(form_id: string, form_fields: any[]): Promise<TestResult> {
  const out: TestResult = {
    name: "D. /form/fill (form_id + edited form_fields)",
    status: "ok",
    durationMs: 0,
    notes: [],
    artifacts: [],
  };
  try {
    logStep(out.name);
    // Make a tiny intentional edit to one cell so we can see it land.
    const edited = form_fields.map((c) => ({ ...c }));
    if (edited.length > 0) {
      const firstText = edited.find((c) => c.type === "text");
      if (firstText) firstText.text = "OVERRIDE_TEST_VALUE";
    }
    out.notes.push(`overriding ${edited.length} cells (1 text cell pre-edited to OVERRIDE_TEST_VALUE)`);

    const { value: res, ms } = await timed(async () =>
      postMultipart("/form/fill", {
        form_id,
        instructions: INSTRUCTIONS,
        form_fields: JSON.stringify(edited),
      })
    );
    out.durationMs = ms;
    if (!res.ok) {
      const body = await res.text();
      out.status = "error";
      out.error = `${res.status}: ${body.slice(0, 500)}`;
      return out;
    }
    const data = await res.json() as any;
    await saveJson("D-fill-override.json", data);
    out.rawResponseFile = "D-fill-override.json";
    out.artifacts.push("D-fill-override.json");

    out.notes.push(`fields_filled: ${data.fields_filled}`);
    out.notes.push(`credits_used: ${data.credits_used}`);

    if (data.pdf_url) {
      const bytes = await fetchPdfBytes(data.pdf_url);
      await saveBinary("D-fill-override.pdf", bytes);
      out.artifacts.push("D-fill-override.pdf");
    }
    return out;
  } catch (e: any) {
    out.status = "error";
    out.error = e?.message ?? String(e);
    return out;
  }
}

// ---------- helpers for visualization ----------
function renderCellOverlay(cells: any[]): string {
  // Render each cell as a positioned box on a normalized "paper" page.
  const W = 612, H = 792; // US Letter at 72dpi for reference
  const boxes = cells.map((c, i) => {
    const bb = c.bounding_box || [0, 0, 0, 0];
    const x = bb[0] * W, y = bb[1] * H;
    const w = (bb[2] - bb[0]) * W;
    const h = (bb[3] - bb[1]) * H;
    const color = c.type === "checkbox" ? "#F5B547" : c.type === "signature" ? "#FF7A6B" : "#7BFF8F";
    const label = (c.text || "").slice(0, 40).replace(/</g, "&lt;");
    return `
      <div class="cell ${c.type}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-color:${color}">
        <span class="idx">${i}</span>
        <span class="label">${label}</span>
      </div>`;
  }).join("");
  return `<!doctype html><meta charset="utf-8"><title>detect overlay</title>
<style>
  body { font-family: system-ui; margin: 0; padding: 24px; background: #1e1c1a; color: #ede7da; }
  h1 { font-weight: 300; margin: 0 0 16px; }
  .page { position: relative; width: ${W}px; height: ${H}px; background: #f4f0e6; margin: 0 auto; border: 1px solid #444; }
  .cell { position: absolute; border: 1.5px solid; box-sizing: border-box; font-size: 9px; color: #222; padding: 1px 3px; overflow: hidden; }
  .cell.checkbox { background: rgba(245, 181, 71, 0.15); }
  .cell.text { background: rgba(123, 255, 143, 0.10); }
  .cell.signature { background: rgba(255, 122, 107, 0.15); }
  .idx { font-weight: 700; background: #000; color: #fff; padding: 0 3px; border-radius: 2px; margin-right: 3px; }
  .legend { color: #9a9486; font-size: 12px; margin-bottom: 16px; }
  .legend span { display: inline-block; margin-right: 16px; }
  .legend i { display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px; border: 1.5px solid; }
</style>
<h1>/form/detect cells (overlay on normalized Letter page)</h1>
<p class="legend">
  <span><i style="border-color:#7BFF8F; background:rgba(123,255,143,0.10)"></i>text</span>
  <span><i style="border-color:#F5B547; background:rgba(245,181,71,0.15)"></i>checkbox</span>
  <span><i style="border-color:#FF7A6B; background:rgba(255,122,107,0.15)"></i>signature</span>
  <span>Total cells: ${cells.length}</span>
</p>
<div class="page">${boxes}</div>`;
}

// ---------- report ----------
function renderReport(results: TestResult[]): string {
  const card = (r: TestResult) => `
  <article class="card ${r.status}">
    <h2>${r.name}</h2>
    <div class="meta">${r.status.toUpperCase()} · ${r.durationMs}ms</div>
    ${r.error ? `<pre class="err">${r.error.replace(/</g, "&lt;")}</pre>` : ""}
    <ul>${r.notes.map((n) => `<li>${n}</li>`).join("")}</ul>
    ${r.artifacts.length ? `
      <div class="art">
        <strong>Artifacts:</strong>
        <ul>${r.artifacts.map((a) => `<li><a href="${a}" target="_blank">${a}</a></li>`).join("")}</ul>
      </div>
    ` : ""}
  </article>`;

  return `<!doctype html><meta charset="utf-8"><title>Pulse API options comparison</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 1080px; margin: 0 auto; padding: 32px 24px; background: #0F0E0C; color: #EDE7DA; line-height: 1.55; }
  h1 { font-family: 'Times New Roman', serif; font-weight: 300; font-size: 36px; margin: 0 0 8px; }
  .sub { color: #9A9486; margin: 0 0 32px; }
  .card { background: #171614; border: 1px solid #2A2724; border-radius: 10px; padding: 20px 22px; margin: 0 0 16px; }
  .card.error { border-color: #FF7A6B; }
  .card h2 { margin: 0 0 4px; font-size: 18px; font-weight: 500; }
  .meta { font-family: ui-monospace, monospace; font-size: 11px; color: #65605A; margin-bottom: 12px; }
  .card.error .meta { color: #FF7A6B; }
  ul { padding-left: 18px; margin: 8px 0; }
  li { color: #ede7da; }
  .err { color: #FF7A6B; background: #1e1c1a; padding: 8px; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 12px; white-space: pre-wrap; }
  .art { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #2A2724; font-size: 13px; }
  .art a { color: #7BFF8F; }
  .eval { background: #171614; border: 1px solid #2A2724; border-radius: 10px; padding: 20px 22px; margin-top: 32px; }
  .eval h2 { font-family: 'Times New Roman', serif; font-weight: 300; font-size: 24px; margin: 0 0 12px; }
  .eval li { margin: 6px 0; }
  code { font-family: ui-monospace, monospace; font-size: 12px; background: #1e1c1a; padding: 1px 5px; border-radius: 3px; }
</style>
<h1>Pulse API option comparison</h1>
<p class="sub">Four ways to power the edit UI. Pick whichever gives the cleanest data for an editable React surface.</p>

${results.map(card).join("")}

<div class="eval">
  <h2>How to evaluate</h2>
  <p>The question we're answering: <strong>which option gives the cleanest input for building an edit UI?</strong> Not "which PDF output looks best" — the EDIT experience is the product.</p>
  <ul>
    <li><strong>A. /extract HTML</strong> — open <code>A-extract.html</code> in a browser. Does it look like the form? Are the fields obvious as values vs labels? Can you imagine making each value editable inline? Look at <code>A-extract.json</code> for word-level bboxes and confidence per word.</li>
    <li><strong>B. /form/detect</strong> — open <code>B-detect-overlay.html</code>. Each box is one detected cell. Are the boxes positioned correctly over the form? Are cell types (text vs checkbox vs signature) right? This is the data you'd render React inputs against.</li>
    <li><strong>C. /form/fill (NL only)</strong> — open <code>C-fill-nl.pdf</code>. Did Pulse place the values in the right boxes? This is the user's final downloadable artifact.</li>
    <li><strong>D. /form/fill (overrides)</strong> — open <code>D-fill-override.pdf</code>. Look for "OVERRIDE_TEST_VALUE" in one of the text cells. If present, Pulse respects per-cell edits, which means our review UI can ship per-cell corrections, not just NL instructions.</li>
  </ul>
  <p>The architecture call is then: pick the option with the cleanest edit data (A or B), and use C or D as the output renderer. They're orthogonal.</p>
</div>`;
}

// ---------- run ----------
(async () => {
  console.log(`Running Pulse API comparison tests against ${BASE_URL}`);
  console.log(`Output directory: ${OUT_DIR}\n`);

  const aRes = await testExtract();
  results.push(aRes);

  const bRes = await testDetect();
  results.push(bRes.result);

  const cRes = await testFillNlOnly();
  results.push(cRes);

  if (bRes.form_id && bRes.form_fields) {
    const dRes = await testFillWithOverride(bRes.form_id, bRes.form_fields);
    results.push(dRes);
  } else {
    results.push({
      name: "D. /form/fill (form_id + edited form_fields)",
      status: "error",
      durationMs: 0,
      notes: [],
      artifacts: [],
      error: "Skipped: /form/detect did not return a form_id and form_fields.",
    });
  }

  await saveText("index.html", renderReport(results));

  console.log("\n=== summary ===");
  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : "✗";
    console.log(`${icon} ${r.name} (${r.durationMs}ms)`);
    if (r.error) console.log(`    ${r.error}`);
  }
  console.log(`\nOpen test-results/index.html in a browser to evaluate.`);
})();
